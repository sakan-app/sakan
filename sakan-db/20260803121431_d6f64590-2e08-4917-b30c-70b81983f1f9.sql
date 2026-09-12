CREATE TABLE IF NOT EXISTS public.billing_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  customer_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, customer_id),
  UNIQUE (user_id, provider)
);

GRANT SELECT ON public.billing_customers TO authenticated;
GRANT ALL ON public.billing_customers TO service_role;

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their billing customer"
  ON public.billing_customers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_billing_customers_updated_at ON public.billing_customers;
CREATE TRIGGER update_billing_customers_updated_at
  BEFORE UPDATE ON public.billing_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider_customer_id text;

CREATE INDEX IF NOT EXISTS subscriptions_provider_ref_idx
  ON public.subscriptions (provider_ref);
CREATE INDEX IF NOT EXISTS subscriptions_provider_customer_idx
  ON public.subscriptions (provider_customer_id);

-- Full lifecycle sweep: lapsed -> past_due (grace), grace elapsed -> expired.
CREATE OR REPLACE FUNCTION public.sweep_billing_lifecycle(_grace_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  graced integer := 0;
  ended integer := 0;
BEGIN
  WITH lapsed AS (
    UPDATE public.subscriptions s
       SET status = 'past_due',
           grace_until = now() + make_interval(days => _grace_days)
     WHERE s.status IN ('trialing','active')
       AND s.cancel_at_period_end = false
       AND s.current_period_end IS NOT NULL
       AND s.current_period_end < now()
    RETURNING s.id, s.user_id, s.plan_code
  ), logged AS (
    INSERT INTO public.billing_events (user_id, subscription_id, type, plan_code)
    SELECT user_id, id, 'grace_started', plan_code FROM lapsed
    RETURNING 1
  )
  SELECT count(*) INTO graced FROM lapsed;

  WITH closed AS (
    UPDATE public.subscriptions s
       SET status = 'canceled',
           canceled_at = COALESCE(s.canceled_at, now())
     WHERE (
             (s.status = 'past_due' AND s.grace_until IS NOT NULL AND s.grace_until < now())
             OR (s.cancel_at_period_end = true
                 AND s.status IN ('trialing','active')
                 AND s.current_period_end IS NOT NULL
                 AND s.current_period_end < now())
           )
    RETURNING s.id, s.user_id, s.plan_code
  ), logged2 AS (
    INSERT INTO public.billing_events (user_id, subscription_id, type, plan_code)
    SELECT user_id, id, 'expired', plan_code FROM closed
    RETURNING 1
  )
  SELECT count(*) INTO ended FROM closed;

  RETURN jsonb_build_object('graced', graced, 'expired', ended);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sweep_billing_lifecycle(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sweep_billing_lifecycle(integer) TO service_role;

-- Hourly automatic scheduling.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('sakan-billing-sweep');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'sakan-billing-sweep',
  '7 * * * *',
  $$SELECT public.sweep_billing_lifecycle(7);$$
);