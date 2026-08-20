
CREATE TABLE IF NOT EXISTS public.commercial_ads (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null default 'header_banner',
  advertiser_name text not null,
  advertiser_email text,
  headline text,
  image_path text,
  image_url text,
  target_url text,
  duration_key text not null default 'daily',
  amount_cents integer not null default 499,
  currency text not null default 'EUR',
  status text not null default 'draft',
  provider text,
  provider_ref text,
  paid_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  impressions integer not null default 0,
  clicks integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_ads_status_check check (status in ('draft','pending_payment','paid','active','paused','expired','rejected')),
  constraint commercial_ads_duration_check check (duration_key in ('daily','weekly','monthly'))
);

GRANT SELECT ON public.commercial_ads TO anon;
GRANT SELECT ON public.commercial_ads TO authenticated;
GRANT ALL ON public.commercial_ads TO service_role;

ALTER TABLE public.commercial_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commercial_ads_public_running" ON public.commercial_ads;
CREATE POLICY "commercial_ads_public_running" ON public.commercial_ads
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    AND paid_at IS NOT NULL
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

DROP POLICY IF EXISTS "commercial_ads_staff_read" ON public.commercial_ads;
CREATE POLICY "commercial_ads_staff_read" ON public.commercial_ads
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS commercial_ads_running_idx
  ON public.commercial_ads (slot_key, status, ends_at);

DROP TRIGGER IF EXISTS commercial_ads_updated_at ON public.commercial_ads;
CREATE TRIGGER commercial_ads_updated_at
  BEFORE UPDATE ON public.commercial_ads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS inactivity_archive_days integer;
