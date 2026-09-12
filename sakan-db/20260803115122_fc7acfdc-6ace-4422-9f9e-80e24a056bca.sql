CREATE TABLE public.webhook_events (
  id text PRIMARY KEY,
  provider text NOT NULL DEFAULT 'stripe',
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'processed',
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.webhook_events TO service_role;

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view webhook events"
ON public.webhook_events
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

GRANT SELECT ON public.webhook_events TO authenticated;

CREATE TRIGGER webhook_events_set_updated_at
BEFORE UPDATE ON public.webhook_events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_webhook_events_created_at ON public.webhook_events (created_at DESC);