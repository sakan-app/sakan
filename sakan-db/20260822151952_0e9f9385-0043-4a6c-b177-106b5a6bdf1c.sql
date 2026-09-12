ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS profiles_archived_at_idx ON public.profiles (archived_at);
UPDATE public.platform_settings SET inactivity_archive_days = COALESCE(inactivity_archive_days, 365) WHERE id = true;