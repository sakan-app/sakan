-- Trigger-only functions: nobody may call them directly.
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_profile_completeness()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_match_on_mutual_like()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_conversation_on_message()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_verification()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_privileged_columns()      FROM PUBLIC, anon, authenticated;

-- Policy helper functions: signed-in users only.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid)                          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid)          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid)                          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid)          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;