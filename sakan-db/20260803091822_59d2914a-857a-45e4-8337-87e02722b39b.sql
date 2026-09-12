
CREATE SEQUENCE IF NOT EXISTS public.featured_ads_queue_seq;
GRANT USAGE, SELECT ON SEQUENCE public.featured_ads_queue_seq TO service_role;

ALTER TABLE public.featured_ads
  ADD COLUMN IF NOT EXISTS queue_position BIGINT,
  ADD COLUMN IF NOT EXISTS display_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS extra_loops INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loops_total INTEGER NOT NULL DEFAULT 5;

CREATE INDEX IF NOT EXISTS featured_ads_queue_idx
  ON public.featured_ads (status, queue_position);

UPDATE public.featured_ads
SET queue_position = nextval('public.featured_ads_queue_seq')
WHERE queue_position IS NULL AND status IN ('active', 'pending_review');
