ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_for uuid[] NOT NULL DEFAULT '{}'::uuid[];

CREATE INDEX IF NOT EXISTS messages_reply_to_idx ON public.messages (reply_to_id);
CREATE INDEX IF NOT EXISTS messages_pinned_idx ON public.messages (conversation_id, pinned_at DESC) WHERE pinned_at IS NOT NULL;

ALTER TABLE public.messages REPLICA IDENTITY FULL;