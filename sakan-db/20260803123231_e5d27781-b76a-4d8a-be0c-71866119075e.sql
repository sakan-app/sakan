ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS notifications_push_pending_idx
  ON public.notifications (created_at)
  WHERE push_sent_at IS NULL AND read_at IS NULL;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Fan out pending browser notifications once a minute.
SELECT cron.unschedule('sakan-push-dispatch')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sakan-push-dispatch');

SELECT cron.schedule(
  'sakan-push-dispatch',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--984df44d-eadb-44e1-828c-5366b146869c.lovable.app/api/public/push-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-token', 'd4dfa6f2406490a2091104717dd5d3f23f5206184b6f4f20'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);