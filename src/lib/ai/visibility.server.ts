// Server-only guard: AI features use the service-role client, which bypasses
// RLS. Re-apply the same visibility rules the profiles policies enforce so a
// member cannot probe hidden, deactivated or blocking profiles by ID.
export async function assertCandidateVisible(viewerId: string, candidateId: string) {
  if (viewerId === candidateId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: profile }, { data: blocks }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, is_active, is_hidden")
      .eq("id", candidateId)
      .maybeSingle(),
    supabaseAdmin
      .from("blocked_users")
      .select("id")
      .or(
        `and(blocker_id.eq.${viewerId},blocked_id.eq.${candidateId}),and(blocker_id.eq.${candidateId},blocked_id.eq.${viewerId})`,
      )
      .limit(1),
  ]);

  if (!profile || !profile.is_active || profile.is_hidden) throw new Error("not_available");
  if ((blocks ?? []).length > 0) throw new Error("not_available");
}
