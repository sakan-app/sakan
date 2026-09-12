-- 1. Profile fields needed by the member profile UI
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS spoken_languages text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_interests_len CHECK (cardinality(interests) <= 12),
  ADD CONSTRAINT profiles_spoken_languages_len CHECK (cardinality(spoken_languages) <= 8);

-- 2. Public (signed-out) showcase reads
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.photos TO anon;

CREATE POLICY "profiles_select_public_showcase" ON public.profiles
  FOR SELECT TO anon
  USING (is_active AND NOT is_hidden AND onboarding_complete);

CREATE POLICY "photos_select_public_showcase" ON public.photos
  FOR SELECT TO anon
  USING (
    kind <> 'verification'::public.photo_kind
    AND is_approved
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = photos.user_id
        AND p.is_active AND NOT p.is_hidden AND p.onboarding_complete
    )
  );

CREATE POLICY "storage_public_showcase_imagery" ON storage.objects
  FOR SELECT TO anon
  USING (
    bucket_id IN ('avatars','gallery')
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.is_active AND NOT p.is_hidden AND p.onboarding_complete
    )
  );