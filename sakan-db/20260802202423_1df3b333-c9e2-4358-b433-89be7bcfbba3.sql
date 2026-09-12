CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS message_reactions_message_idx ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS message_reactions_conversation_idx ON public.message_reactions(conversation_id);

CREATE POLICY "participants read reactions"
ON public.message_reactions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = message_reactions.conversation_id
    AND (c.user_low = auth.uid() OR c.user_high = auth.uid())
));

CREATE POLICY "participants add own reaction"
ON public.message_reactions FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = message_reactions.conversation_id
      AND (c.user_low = auth.uid() OR c.user_high = auth.uid())
  )
);

CREATE POLICY "users update own reaction"
ON public.message_reactions FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users delete own reaction"
ON public.message_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;