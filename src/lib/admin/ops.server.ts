/**
 * Phase 5 — admin dashboard server operations.
 * Server-only: every export runs behind a staff assertion in `admin.functions.ts`.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database, Json } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

function iso(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
}
function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}
function startOfTodayIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
function dayKey(value: string): string {
  return value.slice(0, 10);
}

export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetTable?: string | undefined;
  targetId?: string | undefined;
  details?: Record<string, unknown> | undefined;
}): Promise<void> {
  await supabaseAdmin.from("admin_actions").insert({
    admin_id: params.adminId,
    action: params.action,
    target_table: params.targetTable ?? null,
    target_id: params.targetId ?? null,
    details: (params.details ?? {}) as Json,
  });
}

async function countOf(build: () => PromiseLike<{ count: number | null }>): Promise<number> {
  const { count } = await build();
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Live dashboard
// ---------------------------------------------------------------------------

export type LiveStats = {
  usersTotal: number;
  usersActive24h: number;
  usersNewToday: number;
  usersVerified: number;
  verificationsPending: number;
  reportsOpen: number;
  conversationsActive: number;
  messagesToday: number;
  premiumActive: number;
  revenueThisMonthCents: number;
  registrations14d: { date: string; count: number }[];
  onlineNow: number;
  usersNewWeek: number;
  usersNewMonth: number;
  matchesToday: number;
  notificationsToday: number;
  subscriptionsActive: number;
  subscriptionsExpired: number;
  mrrCents: number;
  arrCents: number;
};

export async function getLiveStats(): Promise<LiveStats> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const [
    usersTotal,
    usersActive24h,
    usersNewToday,
    usersVerified,
    verificationsPending,
    reportsOpen,
    conversationsActive,
    messagesToday,
    premiumActive,
    onlineNow,
    payments,
    signups,
    usersNewWeek,
    usersNewMonth,
    matchesToday,
    notificationsToday,
    subscriptionsExpired,
    billing,
  ] = await Promise.all([
    countOf(() => supabaseAdmin.from("profiles").select("id", { count: "exact", head: true })),
    countOf(() => supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("last_seen_at", iso(1))),
    countOf(() => supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startOfTodayIso())),
    countOf(() => supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("is_verified", true)),
    countOf(() => supabaseAdmin.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending")),
    countOf(() => supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open")),
    countOf(() => supabaseAdmin.from("conversations").select("id", { count: "exact", head: true }).gte("last_message_at", iso(7))),
    countOf(() => supabaseAdmin.from("messages").select("id", { count: "exact", head: true }).gte("created_at", startOfTodayIso())),
    countOf(() =>
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    ),
    countOf(() => supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("last_seen_at", minutesAgoIso(5))),
    supabaseAdmin.from("payments").select("amount_cents").eq("status", "succeeded").gte("paid_at", monthStart),
    supabaseAdmin.from("profiles").select("created_at").gte("created_at", iso(13)),
    countOf(() => supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", iso(7))),
    countOf(() => supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", iso(30))),
    countOf(() => supabaseAdmin.from("matches").select("id", { count: "exact", head: true }).gte("created_at", startOfTodayIso())),
    countOf(() =>
      supabaseAdmin.from("notifications").select("id", { count: "exact", head: true }).gte("created_at", startOfTodayIso()),
    ),
    countOf(() => supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "expired")),
    import("./billing.server").then((m) => m.getBillingOverview()),
  ]);

  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i -= 1) buckets.set(dayKey(iso(i)), 0);
  for (const row of signups.data ?? []) {
    const key = dayKey(row.created_at);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return {
    usersTotal,
    usersActive24h,
    usersNewToday,
    usersVerified,
    verificationsPending,
    reportsOpen,
    conversationsActive,
    messagesToday,
    premiumActive,
    revenueThisMonthCents: (payments.data ?? []).reduce((sum, r) => sum + r.amount_cents, 0),
    registrations14d: Array.from(buckets.entries()).map(([date, count]) => ({ date, count })),
    onlineNow,
    usersNewWeek,
    usersNewMonth,
    matchesToday,
    notificationsToday,
    subscriptionsActive: billing.subscriptionsActive,
    subscriptionsExpired,
    mrrCents: billing.mrrCents,
    arrCents: billing.arrCents,
  };
}

// ---------------------------------------------------------------------------
// Users table
// ---------------------------------------------------------------------------

export type AdminUserRow = {
  id: string;
  display_name: string;
  email: string | null;
  city: string | null;
  country_code: string | null;
  birth_date: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_hidden: boolean;
  completeness: number | null;
  created_at: string;
  last_seen_at: string;
  roles: AppRole[];
  plan_code: string | null;
  subscription_status: string | null;
};

export type UsersQuery = {
  search?: string | undefined;
  status: "all" | "active" | "suspended" | "shadow_banned";
  verified: "all" | "verified" | "unverified";
  role: "all" | AppRole;
  country?: string | undefined;
  sort: "created_at" | "last_seen_at" | "display_name" | "completeness";
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
};

export async function listUsersAdvanced(params: UsersQuery) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;

  let roleFilteredIds: string[] | null = null;
  if (params.role !== "all") {
    const { data } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", params.role);
    roleFilteredIds = (data ?? []).map((r) => r.user_id);
    if (roleFilteredIds.length === 0) return { rows: [] as AdminUserRow[], total: 0, page, pageSize };
  }

  let query = supabaseAdmin
    .from("profiles")
    .select(
      "id, display_name, city, country_code, birth_date, is_active, is_verified, is_hidden, completeness, created_at, last_seen_at",
      { count: "exact" },
    );

  if (params.search) query = query.or(`display_name.ilike.%${params.search}%,city.ilike.%${params.search}%`);
  if (params.status === "active") query = query.eq("is_active", true).eq("is_hidden", false);
  if (params.status === "suspended") query = query.eq("is_active", false);
  if (params.status === "shadow_banned") query = query.eq("is_hidden", true).eq("is_active", true);
  if (params.verified === "verified") query = query.eq("is_verified", true);
  if (params.verified === "unverified") query = query.eq("is_verified", false);
  if (params.country) query = query.eq("country_code", params.country);
  if (roleFilteredIds) query = query.in("id", roleFilteredIds);

  const { data, error, count } = await query
    .order(params.sort, { ascending: params.direction === "asc" })
    .range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((r) => r.id);
  const [rolesRes, subsRes, emails] = await Promise.all([
    ids.length ? supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids) : Promise.resolve({ data: [] }),
    ids.length
      ? supabaseAdmin.from("subscriptions").select("user_id, plan_code, status").in("user_id", ids)
      : Promise.resolve({ data: [] }),
    Promise.all(
      ids.map(async (id) => {
        const res = await supabaseAdmin.auth.admin.getUserById(id).catch(() => null);
        return [id, res?.data?.user?.email ?? null] as const;
      }),
    ),
  ]);

  const rolesByUser = new Map<string, AppRole[]>();
  for (const row of (rolesRes.data ?? []) as { user_id: string; role: AppRole }[]) {
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), row.role]);
  }
  const subByUser = new Map<string, { plan_code: string; status: string }>();
  for (const row of (subsRes.data ?? []) as { user_id: string; plan_code: string; status: string }[]) {
    subByUser.set(row.user_id, { plan_code: row.plan_code, status: row.status });
  }
  const emailByUser = new Map(emails);

  const rows: AdminUserRow[] = (data ?? []).map((row) => ({
    ...row,
    email: emailByUser.get(row.id) ?? null,
    roles: rolesByUser.get(row.id) ?? [],
    plan_code: subByUser.get(row.id)?.plan_code ?? null,
    subscription_status: subByUser.get(row.id)?.status ?? null,
  }));

  return { rows, total: count ?? 0, page, pageSize };
}

export type UserAction =
  | "suspend"
  | "unsuspend"
  | "shadow_ban"
  | "unshadow_ban"
  | "verify"
  | "unverify"
  | "reset_password"
  | "force_logout"
  | "delete";

export async function runUserAction(params: {
  adminId: string;
  targetId: string;
  action: UserAction;
  reason?: string | undefined;
}) {
  const { targetId, action } = params;

  switch (action) {
    case "suspend": {
      const { error } = await supabaseAdmin.from("profiles").update({ is_active: false, is_hidden: true }).eq("id", targetId);
      if (error) throw new Error(error.message);
      await supabaseAdmin.auth.admin.updateUserById(targetId, { ban_duration: "876000h" }).catch(() => null);
      break;
    }
    case "unsuspend": {
      const { error } = await supabaseAdmin.from("profiles").update({ is_active: true, is_hidden: false }).eq("id", targetId);
      if (error) throw new Error(error.message);
      await supabaseAdmin.auth.admin.updateUserById(targetId, { ban_duration: "none" }).catch(() => null);
      break;
    }
    case "shadow_ban": {
      const { error } = await supabaseAdmin.from("profiles").update({ is_hidden: true }).eq("id", targetId);
      if (error) throw new Error(error.message);
      break;
    }
    case "unshadow_ban": {
      const { error } = await supabaseAdmin.from("profiles").update({ is_hidden: false }).eq("id", targetId);
      if (error) throw new Error(error.message);
      break;
    }
    case "verify":
    case "unverify": {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_verified: action === "verify" })
        .eq("id", targetId);
      if (error) throw new Error(error.message);
      break;
    }
    case "reset_password": {
      const user = await supabaseAdmin.auth.admin.getUserById(targetId);
      const email = user.data?.user?.email;
      if (!email) throw new Error("user_has_no_email");
      await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email });
      break;
    }
    case "force_logout": {
      await supabaseAdmin.auth.admin.signOut(targetId, "global").catch(() => null);
      break;
    }
    case "delete": {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId);
      if (error) throw new Error(error.message);
      break;
    }
  }

  await logAdminAction({
    adminId: params.adminId,
    action: `user.${action}`,
    targetTable: "profiles",
    targetId,
    details: { reason: params.reason ?? null },
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// User detail
// ---------------------------------------------------------------------------

async function signPath(bucket: string, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 30);
  return data?.signedUrl ?? null;
}

export async function getUserDetailFull(targetId: string) {
  const { data: profile, error } = await supabaseAdmin.from("profiles").select("*").eq("id", targetId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) throw new Error("user_not_found");

  const [
    rolesRes,
    subRes,
    paymentsRes,
    photosRes,
    verificationsRes,
    reportsAgainstRes,
    reportsFiledRes,
    notesRes,
    actionsRes,
    activityRes,
    authUser,
    messagesCount,
    likesGiven,
    likesReceived,
    favoritesCount,
    matchesLow,
    matchesHigh,
  ] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", targetId),
    supabaseAdmin.from("subscriptions").select("*").eq("user_id", targetId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("payments").select("*").eq("user_id", targetId).order("created_at", { ascending: false }).limit(20),
    supabaseAdmin.from("photos").select("*").eq("user_id", targetId).order("position", { ascending: true }),
    supabaseAdmin.from("verification_requests").select("*").eq("user_id", targetId).order("created_at", { ascending: false }),
    supabaseAdmin.from("reports").select("*").eq("reported_id", targetId).order("created_at", { ascending: false }).limit(20),
    supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("reporter_id", targetId),
    supabaseAdmin.from("admin_notes").select("*").eq("user_id", targetId).order("created_at", { ascending: false }),
    supabaseAdmin.from("admin_actions").select("*").eq("target_id", targetId).order("created_at", { ascending: false }).limit(30),
    supabaseAdmin.from("activity_logs").select("*").eq("user_id", targetId).order("created_at", { ascending: false }).limit(30),
    supabaseAdmin.auth.admin.getUserById(targetId).catch(() => null),
    countOf(() => supabaseAdmin.from("messages").select("id", { count: "exact", head: true }).eq("sender_id", targetId)),
    countOf(() => supabaseAdmin.from("likes").select("id", { count: "exact", head: true }).eq("liker_id", targetId)),
    countOf(() => supabaseAdmin.from("likes").select("id", { count: "exact", head: true }).eq("liked_id", targetId)),
    countOf(() => supabaseAdmin.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", targetId)),
    countOf(() => supabaseAdmin.from("matches").select("id", { count: "exact", head: true }).eq("user_low", targetId)),
    countOf(() => supabaseAdmin.from("matches").select("id", { count: "exact", head: true }).eq("user_high", targetId)),
  ]);

  const gallery = await Promise.all(
    (photosRes.data ?? []).map(async (photo) => ({
      id: photo.id,
      kind: photo.kind,
      is_approved: photo.is_approved,
      url: await signPath(photo.kind === "avatar" ? "avatars" : photo.kind === "verification" ? "verification" : "gallery", photo.storage_path),
    })),
  );

  const avatarUrl = profile.avatar_url ? await signPath("avatars", profile.avatar_url) : null;
  const authRecord = authUser?.data?.user ?? null;

  return {
    profile,
    avatarUrl,
    email: authRecord?.email ?? null,
    auth: authRecord
      ? {
          created_at: authRecord.created_at,
          last_sign_in_at: authRecord.last_sign_in_at ?? null,
          email_confirmed_at: authRecord.email_confirmed_at ?? null,
          providers: (authRecord.app_metadata?.["providers"] as string[] | undefined) ?? [],
          banned: Boolean((authRecord as unknown as { banned_until?: string }).banned_until),
        }
      : null,
    roles: (rolesRes.data ?? []).map((r) => r.role),
    subscription: subRes.data ?? null,
    payments: paymentsRes.data ?? [],
    gallery,
    verifications: verificationsRes.data ?? [],
    reportsAgainst: reportsAgainstRes.data ?? [],
    reportsFiledCount: reportsFiledRes.count ?? 0,
    notes: notesRes.data ?? [],
    adminActions: actionsRes.data ?? [],
    activity: activityRes.data ?? [],
    stats: {
      messages: messagesCount,
      likesGiven,
      likesReceived,
      favorites: favoritesCount,
      matches: matchesLow + matchesHigh,
    },
  };
}

export async function addAdminNote(params: { adminId: string; targetId: string; note: string }) {
  const { error } = await supabaseAdmin
    .from("admin_notes")
    .insert({ user_id: params.targetId, author_id: params.adminId, note: params.note });
  if (error) throw new Error(error.message);
  await logAdminAction({ adminId: params.adminId, action: "user.note_added", targetTable: "admin_notes", targetId: params.targetId });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Verification center
// ---------------------------------------------------------------------------

export async function listVerificationQueue(params: {
  status: "pending" | "approved" | "rejected" | "expired" | "all";
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin.from("verification_requests").select("*", { count: "exact" });
  if (params.status !== "all") query = query.eq("status", params.status);
  const { data, error, count } = await query.order("created_at", { ascending: true }).range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((r) => r.user_id);
  const { data: profiles } = ids.length
    ? await supabaseAdmin.from("profiles").select("id, display_name, country_code, is_verified").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows = await Promise.all(
    (data ?? []).map(async (row) => ({
      ...row,
      profile: byId.get(row.user_id) ?? null,
      documentUrl: await signPath("documents", row.document_path),
      selfieUrl: await signPath("documents", row.selfie_path),
    })),
  );

  return { rows, total: count ?? 0, page, pageSize };
}

export async function decideVerification(params: {
  adminId: string;
  id: string;
  decision: "approved" | "rejected" | "expired" | "more_info";
  notes?: string | undefined;
}) {
  const status = params.decision === "more_info" ? "pending" : params.decision;
  const { data: row, error } = await supabaseAdmin
    .from("verification_requests")
    .update({
      status,
      reviewer_id: params.adminId,
      reviewer_notes: params.notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("user_id")
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (row?.user_id) {
    if (params.decision === "approved") {
      await supabaseAdmin.from("profiles").update({ is_verified: true }).eq("id", row.user_id);
    } else if (params.decision === "rejected" || params.decision === "expired") {
      await supabaseAdmin.from("profiles").update({ is_verified: false }).eq("id", row.user_id);
    }
    await supabaseAdmin.from("notifications").insert({
      user_id: row.user_id,
      type: "verification",
      title:
        params.decision === "approved"
          ? "Verification approved"
          : params.decision === "more_info"
            ? "More information required"
            : "Verification update",
      body: params.notes ?? null,
      data: { decision: params.decision } as Json,
    });
  }

  await logAdminAction({
    adminId: params.adminId,
    action: `verification.${params.decision}`,
    targetTable: "verification_requests",
    targetId: params.id,
    details: { notes: params.notes ?? null },
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reports center
// ---------------------------------------------------------------------------

export async function listReportsFull(params: {
  status: "open" | "reviewing" | "resolved" | "dismissed" | "all";
  reason?: string | undefined;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin.from("reports").select("*", { count: "exact" });
  if (params.status !== "all") query = query.eq("status", params.status);
  if (params.reason && params.reason !== "all") query = query.eq("reason", params.reason);
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const ids = Array.from(new Set((data ?? []).flatMap((r) => [r.reporter_id, r.reported_id]).filter(Boolean))) as string[];
  const { data: profiles } = ids.length
    ? await supabaseAdmin.from("profiles").select("id, display_name, country_code, is_active").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return {
    rows: (data ?? []).map((row) => ({
      ...row,
      reporter: row.reporter_id ? (byId.get(row.reporter_id) ?? null) : null,
      reported: row.reported_id ? (byId.get(row.reported_id) ?? null) : null,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function actOnReport(params: {
  adminId: string;
  id: string;
  action: "resolve" | "dismiss" | "warn" | "suspend" | "ban";
  notes?: string | undefined;
}) {
  const { data: report, error } = await supabaseAdmin.from("reports").select("*").eq("id", params.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!report) throw new Error("report_not_found");

  const status = params.action === "dismiss" ? "dismissed" : "resolved";
  await supabaseAdmin
    .from("reports")
    .update({
      status,
      reviewer_id: params.adminId,
      reviewer_notes: params.notes ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (report.reported_id) {
    if (params.action === "warn") {
      await supabaseAdmin.from("notifications").insert({
        user_id: report.reported_id,
        type: "system",
        title: "Warning from the SAKAN moderation team",
        body: params.notes ?? "Your account was reported. Please review our community guidelines.",
        data: { report_id: params.id } as Json,
      });
    }
    if (params.action === "suspend") {
      await runUserAction({ adminId: params.adminId, targetId: report.reported_id, action: "suspend", reason: params.notes });
    }
    if (params.action === "ban") {
      await supabaseAdmin.from("profiles").update({ is_active: false, is_hidden: true }).eq("id", report.reported_id);
      await supabaseAdmin.auth.admin.updateUserById(report.reported_id, { ban_duration: "876000h" }).catch(() => null);
    }
  }

  await logAdminAction({
    adminId: params.adminId,
    action: `report.${params.action}`,
    targetTable: "reports",
    targetId: params.id,
    details: { notes: params.notes ?? null, reported_id: report.reported_id },
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

export async function listMatches(params: { active: "all" | "active" | "inactive"; page: number; pageSize: number }) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin.from("matches").select("*", { count: "exact" });
  if (params.active === "active") query = query.eq("is_active", true);
  if (params.active === "inactive") query = query.eq("is_active", false);
  const { data, error, count } = await query.order("matched_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const ids = Array.from(new Set((data ?? []).flatMap((r) => [r.user_low, r.user_high])));
  const { data: profiles } = ids.length
    ? await supabaseAdmin.from("profiles").select("id, display_name, country_code, avatar_url").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return {
    rows: (data ?? []).map((row) => ({
      ...row,
      user_a: row.user_low,
      user_b: row.user_high,
      created_at: row.matched_at,
      messageCount: 0,
      profileA: byId.get(row.user_low) ?? null,
      profileB: byId.get(row.user_high) ?? null,
      low: byId.get(row.user_low) ?? null,
      high: byId.get(row.user_high) ?? null,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

// ---------------------------------------------------------------------------
// Conversations (read-only moderation)
// ---------------------------------------------------------------------------

export async function listConversations(params: { search?: string | undefined; page: number; pageSize: number }) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;

  let matchIds: string[] | null = null;
  if (params.search) {
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id").ilike("display_name", `%${params.search}%`).limit(200);
    matchIds = (profiles ?? []).map((p) => p.id);
    if (matchIds.length === 0) return { rows: [], total: 0, page, pageSize };
  }

  let query = supabaseAdmin.from("conversations").select("*", { count: "exact" });
  if (matchIds) query = query.or(`user_low.in.(${matchIds.join(",")}),user_high.in.(${matchIds.join(",")})`);
  const { data, error, count } = await query
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const ids = Array.from(new Set((data ?? []).flatMap((r) => [r.user_low, r.user_high])));
  const [{ data: profiles }, counts] = await Promise.all([
    ids.length ? supabaseAdmin.from("profiles").select("id, display_name, country_code").in("id", ids) : Promise.resolve({ data: [] }),
    Promise.all(
      (data ?? []).map(async (row) => {
        const { count: n } = await supabaseAdmin
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", row.id);
        return [row.id, n ?? 0] as const;
      }),
    ),
  ]);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const countById = new Map(counts);

  return {
    rows: (data ?? []).map((row) => ({
      ...row,
      participantA: byId.get(row.user_low) ?? null,
      participantB: byId.get(row.user_high) ?? null,
      is_blocked: false,
      lastMessage: null as string | null,
      low: byId.get(row.user_low) ?? null,
      high: byId.get(row.user_high) ?? null,
      messageCount: countById.get(row.id) ?? 0,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getConversationMessages(params: { conversationId: string; search?: string | undefined }) {
  let query = supabaseAdmin.from("messages").select("*").eq("conversation_id", params.conversationId);
  if (params.search) query = query.ilike("body", `%${params.search}%`);
  const { data, error } = await query.order("created_at", { ascending: true }).limit(500);
  if (error) throw new Error(error.message);

  const senderIds = Array.from(new Set((data ?? []).map((m) => m.sender_id)));
  const { data: profiles } = senderIds.length
    ? await supabaseAdmin.from("profiles").select("id, display_name").in("id", senderIds)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return Promise.all(
    (data ?? []).map(async (m) => ({
      ...m,
      senderName: nameById.get(m.sender_id) ?? null,
      attachment_url: m.attachment_path ? await signPath("chat-media", m.attachment_path) : null,
    })),
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function listNotifications(params: {
  filter: "all" | "unread" | "read" | "system" | "verification" | "match" | "message" | "like";
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin.from("notifications").select("*", { count: "exact" });
  if (params.filter === "unread") query = query.is("read_at", null);
  else if (params.filter === "read") query = query.not("read_at", "is", null);
  else if (params.filter !== "all") query = query.eq("type", params.filter);

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await supabaseAdmin.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return {
    rows: (data ?? []).map((r) => ({
      ...r,
      recipientName: nameById.get(r.user_id) ?? null,
      is_read: r.read_at !== null,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function broadcastNotification(params: {
  adminId: string;
  audience: "all" | "country" | "premium" | "moderators" | "user";
  countryCode?: string | undefined;
  userId?: string | undefined;
  title: string;
  body: string;
}) {
  let recipients: string[] = [];

  if (params.audience === "user") {
    if (!params.userId) throw new Error("user_required");
    recipients = [params.userId];
  } else if (params.audience === "moderators") {
    const { data } = await supabaseAdmin.from("user_roles").select("user_id").in("role", ["moderator", "admin", "super_admin"]);
    recipients = Array.from(new Set((data ?? []).map((r) => r.user_id)));
  } else if (params.audience === "premium") {
    const { data } = await supabaseAdmin.from("subscriptions").select("user_id").in("status", ["active", "trialing"]);
    recipients = Array.from(new Set((data ?? []).map((r) => r.user_id)));
  } else {
    let query = supabaseAdmin.from("profiles").select("id").eq("is_active", true);
    if (params.audience === "country") {
      if (!params.countryCode) throw new Error("country_required");
      query = query.eq("country_code", params.countryCode);
    }
    const { data } = await query.limit(5000);
    recipients = (data ?? []).map((r) => r.id);
  }

  for (let i = 0; i < recipients.length; i += 500) {
    const chunk = recipients.slice(i, i + 500).map((userId) => ({
      user_id: userId,
      type: "system" as const,
      title: params.title,
      body: params.body,
      data: { broadcast: true } as Json,
    }));
    if (chunk.length) await supabaseAdmin.from("notifications").insert(chunk);
  }

  await logAdminAction({
    adminId: params.adminId,
    action: "notification.broadcast",
    targetTable: "notifications",
    details: { audience: params.audience, recipients: recipients.length, title: params.title },
  });
  return { ok: true, recipients: recipients.length };
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export type AnalyticsRange = 7 | 30 | 90;

export async function getAnalytics(range: AnalyticsRange) {
  const since = iso(range - 1);

  const [profiles, messages, matches, reports, subscriptions, verifications] = await Promise.all([
    supabaseAdmin.from("profiles").select("created_at, country_code, preferred_language, is_verified, last_seen_at"),
    supabaseAdmin.from("messages").select("created_at").gte("created_at", since),
    supabaseAdmin.from("matches").select("matched_at").gte("matched_at", since),
    supabaseAdmin.from("reports").select("created_at, reason, status").gte("created_at", since),
    supabaseAdmin.from("subscriptions").select("plan_code, status"),
    supabaseAdmin.from("verification_requests").select("status"),
  ]);

  const days: string[] = [];
  for (let i = range - 1; i >= 0; i -= 1) days.push(dayKey(iso(i)));
  const zero = () => new Map(days.map((d) => [d, 0]));

  const signups = zero();
  const countries = new Map<string, number>();
  const languages = new Map<string, number>();
  let verifiedCount = 0;
  let activeCount = 0;
  const activeSince = iso(30);

  for (const p of profiles.data ?? []) {
    const key = dayKey(p.created_at);
    if (signups.has(key)) signups.set(key, (signups.get(key) ?? 0) + 1);
    const country = p.country_code ?? "??";
    countries.set(country, (countries.get(country) ?? 0) + 1);
    const language = p.preferred_language ?? "ar";
    languages.set(language, (languages.get(language) ?? 0) + 1);
    if (p.is_verified) verifiedCount += 1;
    if (p.last_seen_at >= activeSince) activeCount += 1;
  }

  const messagesPerDay = zero();
  for (const m of messages.data ?? []) {
    const key = dayKey(m.created_at);
    if (messagesPerDay.has(key)) messagesPerDay.set(key, (messagesPerDay.get(key) ?? 0) + 1);
  }
  const matchesPerDay = zero();
  for (const m of matches.data ?? []) {
    const key = dayKey(m.matched_at);
    if (matchesPerDay.has(key)) matchesPerDay.set(key, (matchesPerDay.get(key) ?? 0) + 1);
  }
  const reportsPerDay = zero();
  const reportReasons = new Map<string, number>();
  for (const r of reports.data ?? []) {
    const key = dayKey(r.created_at);
    if (reportsPerDay.has(key)) reportsPerDay.set(key, (reportsPerDay.get(key) ?? 0) + 1);
    reportReasons.set(r.reason, (reportReasons.get(r.reason) ?? 0) + 1);
  }

  const plans = new Map<string, number>();
  for (const s of subscriptions.data ?? []) {
    if (s.status !== "active" && s.status !== "trialing") continue;
    plans.set(s.plan_code, (plans.get(s.plan_code) ?? 0) + 1);
  }

  const verificationStatus = new Map<string, number>();
  for (const v of verifications.data ?? []) {
    verificationStatus.set(v.status, (verificationStatus.get(v.status) ?? 0) + 1);
  }

  const totalUsers = (profiles.data ?? []).length;
  const toSeries = (map: Map<string, number>) => days.map((date) => ({ date, value: map.get(date) ?? 0 }));
  const toPairs = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  let cumulative = 0;
  const growth = days.map((date) => {
    cumulative += signups.get(date) ?? 0;
    return { date, value: cumulative };
  });

  return {
    totalUsers,
    verifiedRate: totalUsers ? Math.round((verifiedCount / totalUsers) * 100) : 0,
    retention30: totalUsers ? Math.round((activeCount / totalUsers) * 100) : 0,
    signups: toSeries(signups),
    growth,
    messagesPerDay: toSeries(messagesPerDay),
    matchesPerDay: toSeries(matchesPerDay),
    reportsPerDay: toSeries(reportsPerDay),
    countries: toPairs(countries).slice(0, 12),
    languages: toPairs(languages),
    plans: toPairs(plans),
    reportReasons: toPairs(reportReasons),
    verificationStatus: toPairs(verificationStatus),
  };
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export async function listActivity(params: {
  search?: string | undefined;
  source: "admin" | "system";
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;

  if (params.source === "system") {
    let query = supabaseAdmin.from("activity_logs").select("*", { count: "exact" });
    if (params.search) query = query.ilike("event", `%${params.search}%`);
    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    return {
      rows: (data ?? []).map((r) => ({
        id: r.id,
        actor_id: r.user_id,
        actorName: null as string | null,
        action: r.event,
        target_table: null as string | null,
        target_id: null as string | null,
        details: r.context,
        level: r.level as string | null,
        created_at: r.created_at,
      })),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  let query = supabaseAdmin.from("admin_actions").select("*", { count: "exact" });
  if (params.search) query = query.ilike("action", `%${params.search}%`);
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const ids = Array.from(new Set((data ?? []).map((r) => r.admin_id).filter(Boolean))) as string[];
  const { data: profiles } = ids.length ? await supabaseAdmin.from("profiles").select("id, display_name").in("id", ids) : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return {
    rows: (data ?? []).map((r) => ({
      id: r.id,
      actor_id: r.admin_id,
      actorName: r.admin_id ? (byId.get(r.admin_id) ?? null) : null,
      action: r.action,
      target_table: r.target_table,
      target_id: r.target_id,
      details: r.details,
      level: null as string | null,
      created_at: r.created_at,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

export async function getPlatformSettings() {
  const { data, error } = await supabaseAdmin.from("platform_settings").select("*").eq("id", true).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export type PlatformSettingsPatch = {
  support_email?: string | undefined;
  maintenance_mode?: boolean | undefined;
  default_language?: Database["public"]["Enums"]["language_code"] | undefined;
  registration_enabled?: boolean | undefined;
  verification_required?: boolean | undefined;
  max_gallery_photos?: number | undefined;
  max_image_mb?: number | undefined;
  allowed_image_types?: string[] | undefined;
  inactivity_archive_days?: number | null | undefined;
  notify_defaults?: Record<string, boolean> | undefined;
};

export async function updatePlatformSettings(params: { adminId: string; patch: PlatformSettingsPatch }) {
  const patch = Object.fromEntries(Object.entries(params.patch).filter(([, v]) => v !== undefined));
  const { error } = await supabaseAdmin
    .from("platform_settings")
    .update({ ...patch, updated_by: params.adminId } as never)
    .eq("id", true);
  if (error) throw new Error(error.message);
  await logAdminAction({ adminId: params.adminId, action: "settings.update", targetTable: "platform_settings", details: patch });
  return { ok: true };
}
