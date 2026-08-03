CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('voice','video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','accepted','rejected','missed','ended','busy','failed')),
  end_reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX call_sessions_callee_status_idx ON public.call_sessions (callee_id, status);
CREATE INDEX call_sessions_caller_status_idx ON public.call_sessions (caller_id, status);
CREATE INDEX call_sessions_conversation_idx ON public.call_sessions (conversation_id, created_at DESC);

GRANT SELECT ON public.call_sessions TO authenticated;
GRANT ALL ON public.call_sessions TO service_role;

ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their calls"
ON public.call_sessions FOR SELECT TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE TRIGGER update_call_sessions_updated_at
BEFORE UPDATE ON public.call_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.call_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;