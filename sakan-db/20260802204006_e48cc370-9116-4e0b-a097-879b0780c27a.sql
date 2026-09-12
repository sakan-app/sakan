DO $$ BEGIN
  CREATE TYPE public.featured_ad_status AS ENUM ('pending_payment','pending_review','active','expired','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.featured_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  headline text,
  subtitle text,
  target_url text,
  status public.featured_ad_status NOT NULL DEFAULT 'pending_payment',
  amount_cents integer NOT NULL DEFAULT 99,
  currency text NOT NULL DEFAULT 'EUR',
  provider text,
  provider_ref text,
  paid_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS featured_ads_active_idx ON public.featured_ads (status, ends_at DESC);
CREATE INDEX IF NOT EXISTS featured_ads_user_idx ON public.featured_ads (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS featured_ads_provider_ref_idx ON public.featured_ads (provider_ref) WHERE provider_ref IS NOT NULL;

GRANT SELECT ON public.featured_ads TO anon;
GRANT SELECT, INSERT, UPDATE ON public.featured_ads TO authenticated;
GRANT ALL ON public.featured_ads TO service_role;

ALTER TABLE public.featured_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "featured_ads_public_read_active" ON public.featured_ads
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "featured_ads_owner_read" ON public.featured_ads
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "featured_ads_owner_insert" ON public.featured_ads
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending_payment');

CREATE POLICY "featured_ads_owner_update_draft" ON public.featured_ads
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('pending_payment','pending_review'))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "featured_ads_staff_read" ON public.featured_ads
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "featured_ads_staff_update" ON public.featured_ads
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER featured_ads_updated_at BEFORE UPDATE ON public.featured_ads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key text NOT NULL UNIQUE,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  network text,
  unit_id text,
  min_height integer NOT NULL DEFAULT 120,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ad_placements TO anon;
GRANT SELECT ON public.ad_placements TO authenticated;
GRANT ALL ON public.ad_placements TO service_role;

ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_placements_public_read" ON public.ad_placements
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ad_placements_staff_write" ON public.ad_placements
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER ad_placements_updated_at BEFORE UPDATE ON public.ad_placements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ad_placements (slot_key, label, min_height) VALUES
  ('home_below_hero', 'Home — below hero', 120),
  ('home_mid', 'Home — mid content', 250),
  ('search_inline', 'Search results — inline', 250),
  ('discover_feed', 'Discover feed', 200),
  ('profile_sidebar', 'Member profile — sidebar', 250)
ON CONFLICT (slot_key) DO NOTHING;

CREATE POLICY "featured_bucket_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'featured');

CREATE POLICY "featured_bucket_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'featured' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "featured_bucket_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'featured' AND (storage.foldername(name))[1] = auth.uid()::text);