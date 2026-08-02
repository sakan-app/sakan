import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type VerificationStatus = Database["public"]["Enums"]["verification_status"];
type ReportStatus = Database["public"]["Enums"]["report_status"];
type ModerationVerdict = Database["public"]["Enums"]["moderation_verdict"];

type CallerClient = SupabaseClient<Database>;

export class AdminForbiddenError extends Error {
  constructor(message = "forbidden") {
    super(message);
    this.name = "AdminForbiddenError";
  }
}

/** Asserts the caller is staff (admin or moderator) using their own RLS-bound client. */
export async function assertStaff(supabase: CallerClient, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("is_staff", { _user_id: userId });
  if (error || !data) throw new AdminForbiddenError();
}

/** Asserts the caller holds the admin role specifically (for role management, etc). */
export async function assertAdmin(supabase: CallerClient, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new AdminForbiddenError();
}

async function logAction(params: {
  adminId: string;
  action: string;
  targetTable?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await supabaseAdmin.from("admin_actions").insert({
    admin_id: params.adminId,
    action: params.action,
    target_table: params.targetTable ?? null,
    target_id: params.targetId ?? null,
    details: params.details ?? {},
  });
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardStats() {
  const now = new Date();
  const since14 = daysAgoIso(14);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const [
    usersTotal,
    usersNew7d,
    usersActive24h,
    subsRows,
    paymentsThisMonth,
    reportsOpen,
    verificationsPending,
    messages7d,
    signupsSeries,
    revenueSeries,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", daysAgoIso(7)),
    supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("last_seen_at", daysAgoIso(1)),
    supabaseAdmin
      .from("subscriptions")
      .select("plan_code, status")
      .in("status", ["trialing", "active", "past_due"]),
    supabaseAdmin
      .from("payments")
      .select("amount_cents")
      .eq("status", "succeeded")
      .gte("paid_at", monthStart),
    supabaseAdmin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabaseAdmin
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", daysAgoIso(7)),
    supabaseAdmin.from("profiles").select("created_at").gte("created_at", since14),
    supabaseAdmin
      .from("payments")
      .select("amount_cents, paid_at")
      .eq("status", "succeeded")
      .gte("paid_at", since14),
  ]);

  const subscriptionsByPlan: Record<string, number> = {};
  for (const row of subsRows.data ?? []) {
    subscriptionsByPlan[row.plan_code] = (subscriptionsByPlan[row.plan_code] ?? 0) + 1;
  }

  const revenueThisMonthCents = (paymentsThisMonth.data ?? []).reduce(
    (sum, r) => sum + r.amount_cents,
    0,
  );

  const buckets = new Map<string, { signups: number; revenueCents: number }>();
  for (let i = 13; i >= 0; i -= 1) {
    buckets.set(dateKey(daysAgoIso(i)), { signups: 0, revenueCents: 0 });
  }
  for (const row of signupsSeries.data ?? []) {
    const key = dateKey(row.created_at);
    const bucket = buckets.get(key);
    if (bucket) bucket.signups += 1;
  }
  for (const row of revenueSeries.data ?? []) {
    if (!row.paid_at) continue;
    const key = dateKey(row.paid_at);
    const bucket = buckets.get(key);
    if (bucket) bucket.revenueCents += row.amount_cents;
  }

  const timeseries = Array.from(buckets.entries()).map(([date, v]) => ({
    date,
    signups: v.signups,
    revenueCents: v.revenueCents,
  }));

  return {
    usersTotal: usersTotal.count ?? 0,
    usersNew7d: usersNew7d.count ?? 0,
    usersActive24h: usersActive24h.count ?? 0,
    subscriptionsByPlan,
    revenueThisMonthCents,
    reportsOpen: reportsOpen.count ?? 0,
    verificationsPending: verificationsPending.count ?? 0,
    messages7d: messages7d.count ?? 0,
    timeseries,
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type UserListFilter = {
  search?: string;
  status?: "active" | "suspended" | "all";
  verified?: "verified" | "unverified" | "all";
  page: number;
  pageSize: number;
};

export async function listUsers(filter: UserListFilter) {
  const page = Math.max(1, filter.page);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("profiles")
    .select("id, display_name, city, country_code, is_active, is_verified, is_hidden, created_at, last_seen_at", {
      count: "exact",
    });

  if (filter.search) {
    query = query.ilike("display_name", `%${filter.search}%`);
  }
  if (filter.status === "active") query = query.eq("is_active", true);
  if (filter.status === "suspended") query = query.eq("is_active", false);
  if (filter.verified === "verified") query = query.eq("is_verified", true);
  if (filter.verified === "unverified") query = query.eq("is_verified", false);

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((r) => r.id);
  const { data: roleRows } = ids.length
    ? await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids)
    : { data: [] as { user_id: string; role: AppRole }[] };

  const rolesByUser = new Map<string, AppRole[]>();
  for (const r of roleRows ?? []) {
    const list = rolesByUser.get(r.user_id) ?? [];
    list.push(r.role);
    rolesByUser.set(r.user_id, list);
  }

  return {
    rows: (data ?? []).map((row) => ({
      ...row,
      roles: rolesByUser.get(row.id) ?? [],
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getUserDetail(targetId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", targetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) throw new Error("user_not_found");

  const [{ data: roles }, { data: subscription }, { data: payments }, { data: reportsFiled }, { data: reportsAgainst }, authUser] =
    await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", targetId),
      supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", targetId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("payments")
        .select("*")
        .eq("user_id", targetId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("reporter_id", targetId),
      supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("reported_id", targetId),
      supabaseAdmin.auth.admin.getUserById(targetId).catch(() => null),
    ]);

  return {
    profile,
    roles: (roles ?? []).map((r) => r.role),
    subscription: subscription ?? null,
    payments: payments ?? [],
    reportsFiledCount: (reportsFiled as unknown as { count: number | null })?.count ?? 0,
    reportsAgainstCount: (reportsAgainst as unknown as { count: number | null })?.count ?? 0,
    email: authUser?.data?.user?.email ?? null,
  };
}

export async function setUserStatus(params: {
  adminId: string;
  targetId: string;
  action: "suspend" | "unsuspend" | "ban";
  reason?: string;
}) {
  const isActive = params.action === "unsuspend";
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: isActive, is_hidden: !isActive })
    .eq("id", params.targetId);
  if (error) throw new Error(error.message);

  if (params.action === "ban") {
    await supabaseAdmin.auth.admin.updateUserById(params.targetId, { ban_duration: "876000h" }).catch(() => null);
  } else if (params.action === "unsuspend") {
    await supabaseAdmin.auth.admin.updateUserById(params.targetId, { ban_duration: "none" }).catch(() => null);
  }

  await logAction({
    adminId: params.adminId,
    action: `user.${params.action}`,
    targetTable: "profiles",
    targetId: params.targetId,
    details: { reason: params.reason ?? null },
  });
  return { ok: true };
}

export async function changeUserRole(params: {
  adminId: string;
  targetId: string;
  role: AppRole;
  grant: boolean;
}) {
  if (params.grant) {
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: params.targetId, role: params.role }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", params.targetId)
      .eq("role", params.role);
    if (error) throw new Error(error.message);
  }

  await logAction({
    adminId: params.adminId,
    action: params.grant ? "role.grant" : "role.revoke",
    targetTable: "user_roles",
    targetId: params.targetId,
    details: { role: params.role },
  });
  return { ok: true };
}

export async function bulkChangeUserRole(params: {
  adminId: string;
  targetIds: string[];
  role: AppRole;
  grant: boolean;
}) {
  for (const targetId of params.targetIds) {
    await changeUserRole({ adminId: params.adminId, targetId, role: params.role, grant: params.grant });
  }
  return { ok: true, count: params.targetIds.length };
}

// ---------------------------------------------------------------------------
// Verification queue
// ---------------------------------------------------------------------------

export async function listVerifications(params: { status: VerificationStatus | "all"; page: number; pageSize: number }) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("verification_requests")
    .select("*, profiles!verification_requests_user_id_fkey(display_name, avatar_url)", { count: "exact" });
  if (params.status !== "all") query = query.eq("status", params.status);
  query = query.order("created_at", { ascending: true }).range(from, to);

  const { data, error, count } = await query;
  if (error) {
    // fallback without join if FK relation name differs
    let fallback = supabaseAdmin.from("verification_requests").select("*", { count: "exact" });
    if (params.status !== "all") fallback = fallback.eq("status", params.status);
    const { data: d2, error: e2, count: c2 } = await fallback
      .order("created_at", { ascending: true })
      .range(from, to);
    if (e2) throw new Error(e2.message);
    return { rows: d2 ?? [], total: c2 ?? 0, page, pageSize };
  }
  return { rows: data ?? [], total: count ?? 0, page, pageSize };
}

export async function reviewVerification(params: {
  adminId: string;
  id: string;
  decision: "approved" | "rejected";
  notes?: string;
}) {
  const { data: row, error } = await supabaseAdmin
    .from("verification_requests")
    .update({
      status: params.decision,
      reviewer_id: params.adminId,
      reviewer_notes: params.notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("user_id")
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (params.decision === "approved" && row?.user_id) {
    await supabaseAdmin.from("profiles").update({ is_verified: true }).eq("id", row.user_id);
  }

  await logAction({
    adminId: params.adminId,
    action: `verification.${params.decision}`,
    targetTable: "verification_requests",
    targetId: params.id,
    details: { notes: params.notes ?? null },
  });
  return { ok: true };
}

export async function bulkReviewVerifications(params: {
  adminId: string;
  ids: string[];
  decision: "approved" | "rejected";
}) {
  for (const id of params.ids) {
    await reviewVerification({ adminId: params.adminId, id, decision: params.decision });
  }
  return { ok: true, count: params.ids.length };
}

// ---------------------------------------------------------------------------
// Reports & moderation flags
// ---------------------------------------------------------------------------

export async function listReports(params: { status: ReportStatus | "all"; page: number; pageSize: number }) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin.from("reports").select("*", { count: "exact" });
  if (params.status !== "all") query = query.eq("status", params.status);
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0, page, pageSize };
}

export async function resolveReport(params: {
  adminId: string;
  id: string;
  action: "resolved" | "dismissed";
  notes?: string;
}) {
  const { error } = await supabaseAdmin
    .from("reports")
    .update({
      status: params.action,
      reviewer_id: params.adminId,
      reviewer_notes: params.notes ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", params.id);
  if (error) throw new Error(error.message);

  await logAction({
    adminId: params.adminId,
    action: `report.${params.action}`,
    targetTable: "reports",
    targetId: params.id,
    details: { notes: params.notes ?? null },
  });
  return { ok: true };
}

export async function bulkResolveReports(params: {
  adminId: string;
  ids: string[];
  action: "resolved" | "dismissed";
}) {
  for (const id of params.ids) {
    await resolveReport({ adminId: params.adminId, id, action: params.action });
  }
  return { ok: true, count: params.ids.length };
}

export async function listModerationFlags(params: { verdict: ModerationVerdict | "all"; page: number; pageSize: number }) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin.from("moderation_flags").select("*", { count: "exact" });
  if (params.verdict !== "all") query = query.eq("verdict", params.verdict);
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0, page, pageSize };
}

export async function resolveModerationFlag(params: {
  adminId: string;
  id: string;
  verdict: "approved" | "rejected";
}) {
  const { error } = await supabaseAdmin
    .from("moderation_flags")
    .update({ verdict: params.verdict })
    .eq("id", params.id);
  if (error) throw new Error(error.message);

  await logAction({
    adminId: params.adminId,
    action: `moderation_flag.${params.verdict}`,
    targetTable: "moderation_flags",
    targetId: params.id,
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Subscriptions & payments
// ---------------------------------------------------------------------------

export async function listSubscriptions(params: {
  status?: string;
  planCode?: string;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin.from("subscriptions").select("*", { count: "exact" });
  if (params.status && params.status !== "all") query = query.eq("status", params.status as never);
  if (params.planCode && params.planCode !== "all") query = query.eq("plan_code", params.planCode);
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0, page, pageSize };
}

export async function listPayments(params: { status?: string; page: number; pageSize: number }) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin.from("payments").select("*", { count: "exact" });
  if (params.status && params.status !== "all") query = query.eq("status", params.status as never);
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0, page, pageSize };
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export async function listAuditLog(params: {
  action?: string;
  adminId?: string;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin.from("admin_actions").select("*", { count: "exact" });
  if (params.action) query = query.ilike("action", `%${params.action}%`);
  if (params.adminId) query = query.eq("admin_id", params.adminId);
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0, page, pageSize };
}
