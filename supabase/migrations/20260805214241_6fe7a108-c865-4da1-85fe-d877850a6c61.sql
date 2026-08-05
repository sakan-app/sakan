-- 1. Restrict platform_settings reads to staff
DROP POLICY IF EXISTS "settings readable by signed in users" ON public.platform_settings;
CREATE POLICY "settings readable by staff"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
REVOKE ALL ON public.platform_settings FROM anon;
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

-- 2. call_sessions: read-only for clients, all writes via trusted server code
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public.call_sessions FROM authenticated;
REVOKE ALL ON public.call_sessions FROM anon;
GRANT SELECT ON public.call_sessions TO authenticated;
GRANT ALL ON public.call_sessions TO service_role;

-- 3. Revoke EXECUTE on unused SECURITY DEFINER billing helpers
REVOKE EXECUTE ON FUNCTION public.current_subscription(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.has_premium(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.user_plan(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.user_plan_tier(uuid) FROM authenticated, anon, public;