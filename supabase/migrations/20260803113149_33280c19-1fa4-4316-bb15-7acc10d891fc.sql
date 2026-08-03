-- 1) Ad placements: anon sees only enabled slots, never internal config jsonb
DROP POLICY IF EXISTS ad_placements_public_read ON public.ad_placements;
CREATE POLICY ad_placements_public_read ON public.ad_placements
  FOR SELECT TO anon, authenticated
  USING (enabled);

REVOKE SELECT ON public.ad_placements FROM anon;
GRANT SELECT (id, slot_key, label, enabled, network, unit_id, min_height, created_at, updated_at)
  ON public.ad_placements TO anon;

-- 2) Featured storage bucket: only creatives attached to a live featured ad
DROP POLICY IF EXISTS featured_bucket_read ON storage.objects;
CREATE POLICY featured_bucket_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'featured'
    AND EXISTS (
      SELECT 1 FROM public.featured_ads fa
      WHERE fa.image_path = storage.objects.name
        AND fa.status = 'active'
        AND (fa.ends_at IS NULL OR fa.ends_at > now())
    )
  );

-- 3) Photos: anonymous visitors only see approved avatars, never full galleries
DROP POLICY IF EXISTS photos_select_public_showcase ON public.photos;
CREATE POLICY photos_select_public_showcase ON public.photos
  FOR SELECT TO anon
  USING (
    kind = 'avatar'
    AND is_approved
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = photos.user_id AND p.is_active AND NOT p.is_hidden AND p.onboarding_complete
    )
  );

DROP POLICY IF EXISTS storage_public_showcase_imagery ON storage.objects;
CREATE POLICY storage_public_showcase_imagery ON storage.objects
  FOR SELECT TO anon
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.is_active AND NOT p.is_hidden AND p.onboarding_complete
    )
  );

-- 4) Profiles: anonymous visitors get showcase columns only (no DOB, bio, job, etc.)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_year smallint
  GENERATED ALWAYS AS (EXTRACT(YEAR FROM birth_date)::smallint) STORED;

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, display_name, birth_year, gender, looking_for, country_code, city,
  is_verified, avatar_url, presence_status, hide_last_seen, last_seen_at,
  created_at, completeness, is_active, is_hidden, onboarding_complete
) ON public.profiles TO anon;

-- 5) SECURITY DEFINER functions: never executable by anonymous callers,
--    trigger/maintenance functions not executable by clients at all.
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig, pg_get_function_result(p.oid) AS ret
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn.sig);
    IF fn.ret = 'trigger' OR fn.sig::text LIKE 'expire_due_subscriptions%' THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn.sig);
    ELSE
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.sig);
    END IF;
  END LOOP;
END $$;