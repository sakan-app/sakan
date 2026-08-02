-- ============================================================
-- Chat: Telegram-quality features
-- reactions, edit/delete, pinning, voice/attachment metadata,
-- private chat-media bucket with participant-scoped RLS.
-- ============================================================

-- 1. Attachment metadata + voice kind ---------------------------------------
ALTER TYPE public.message_kind ADD VALUE IF NOT EXISTS 'voice';

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS attachment_width integer,
  ADD COLUMN IF NOT EXISTS attachment_height integer;

-- 2. Message reactions --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji           text NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 8),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS message_reactions_message_idx ON public.message_reactions (message_id);

GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_participant" ON public.message_reactions;
CREATE POLICY "reactions_select_participant" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
        AND public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "reactions_insert_own" ON public.message_reactions;
CREATE POLICY "reactions_insert_own" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
        AND public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "reactions_delete_own" ON public.message_reactions;
CREATE POLICY "reactions_delete_own" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;
END $$;

-- 3. Per-user pinned conversations -------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_pins (
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  pinned_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);

GRANT SELECT, INSERT, DELETE ON public.conversation_pins TO authenticated;
GRANT ALL ON public.conversation_pins TO service_role;
ALTER TABLE public.conversation_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pins_manage_own" ON public.conversation_pins;
CREATE POLICY "pins_manage_own" ON public.conversation_pins
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_conversation_participant(conversation_id, auth.uid())
  );

ALTER TABLE public.conversation_pins REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_pins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_pins;
  END IF;
END $$;

-- 4. Allow senders to soft-edit/delete their own messages (edited_at/deleted_at/body) --
-- messages_update_participant already exists for read/delivered receipts by recipients;
-- senders also need to update their own row for edit/delete. Add a dedicated policy.
DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;
CREATE POLICY "messages_update_sender" ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- 5. Private chat-media bucket -------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: "{conversation_id}/{user_id}/<filename>"
DROP POLICY IF EXISTS "chat_media_participant_insert" ON storage.objects;
CREATE POLICY "chat_media_participant_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );

DROP POLICY IF EXISTS "chat_media_participant_select" ON storage.objects;
CREATE POLICY "chat_media_participant_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );

DROP POLICY IF EXISTS "chat_media_owner_delete" ON storage.objects;
CREATE POLICY "chat_media_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 6. Realtime for messages already enabled; ensure UPDATE events carry old row
ALTER TABLE public.messages REPLICA IDENTITY FULL;
