
-- Notification preferences: per-user, per-type toggle for in-app notifications.
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  like_enabled          boolean NOT NULL DEFAULT true,
  match_enabled         boolean NOT NULL DEFAULT true,
  message_enabled       boolean NOT NULL DEFAULT true,
  profile_view_enabled  boolean NOT NULL DEFAULT true,
  verification_enabled  boolean NOT NULL DEFAULT true,
  system_enabled        boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_preferences_own_select" ON public.notification_preferences;
CREATE POLICY "notification_preferences_own_select" ON public.notification_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_own_insert" ON public.notification_preferences;
CREATE POLICY "notification_preferences_own_insert" ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_own_update" ON public.notification_preferences;
CREATE POLICY "notification_preferences_own_update" ON public.notification_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS notification_preferences_set_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_set_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Profile views: lightweight log used to compute profile statistics.
CREATE TABLE IF NOT EXISTS public.profile_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_views_viewed_idx ON public.profile_views (viewed_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_views_viewer_idx ON public.profile_views (viewer_id, viewed_id, created_at DESC);

GRANT SELECT, INSERT ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_views_own_read" ON public.profile_views;
CREATE POLICY "profile_views_own_read" ON public.profile_views
  FOR SELECT TO authenticated USING (viewed_id = auth.uid() OR viewer_id = auth.uid());

DROP POLICY IF EXISTS "profile_views_insert" ON public.profile_views;
CREATE POLICY "profile_views_insert" ON public.profile_views
  FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid() AND viewer_id <> viewed_id);
