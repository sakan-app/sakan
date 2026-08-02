/** Phase 5 — admin dashboard RPC surface. Every call re-verifies staff server-side. */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const appRole = z.enum(["user", "moderator", "admin", "super_admin"]);
const paging = { page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(20) };

export const getAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: staff }, { data: roles }] = await Promise.all([
      context.supabase.rpc("is_staff", { _user_id: context.userId }),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    const list = (roles ?? []).map((r) => r.role as string);
    return {
      isStaff: Boolean(staff),
      roles: list,
      isAdmin: list.includes("admin") || list.includes("super_admin"),
      isSuperAdmin: list.includes("super_admin"),
    };
  });

export const getLiveStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("./admin.server");
    const { getLiveStats: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run();
  });

export const listUsersAdvanced = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      search: z.string().max(200).optional(),
      status: z.enum(["all", "active", "suspended", "shadow_banned"]).default("all"),
      verified: z.enum(["all", "verified", "unverified"]).default("all"),
      role: z.union([z.literal("all"), appRole]).default("all"),
      country: z.string().max(2).optional(),
      sort: z.enum(["created_at", "last_seen_at", "display_name", "completeness"]).default("created_at"),
      direction: z.enum(["asc", "desc"]).default("desc"),
      ...paging,
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { listUsersAdvanced: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const runUserAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      targetId: z.string().uuid(),
      action: z.enum([
        "suspend",
        "unsuspend",
        "shadow_ban",
        "unshadow_ban",
        "verify",
        "unverify",
        "reset_password",
        "force_logout",
        "delete",
      ]),
      reason: z.string().max(500).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff, assertAdmin } = await import("./admin.server");
    const { runUserAction: run } = await import("./ops.server");
    if (data.action === "delete") await assertAdmin(context.supabase, context.userId);
    else await assertStaff(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const getUserDetailFull = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ targetId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { getUserDetailFull: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run(data.targetId);
  });

export const addAdminNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ targetId: z.string().uuid(), note: z.string().min(1).max(2000) }))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { addAdminNote: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const listVerificationQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ status: z.enum(["pending", "approved", "rejected", "expired", "all"]).default("pending"), ...paging }))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { listVerificationQueue: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const decideVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      id: z.string().uuid(),
      decision: z.enum(["approved", "rejected", "expired", "more_info"]),
      notes: z.string().max(1000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { decideVerification: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const listReportsFull = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      status: z.enum(["open", "reviewing", "resolved", "dismissed", "all"]).default("open"),
      reason: z.string().max(60).optional(),
      ...paging,
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { listReportsFull: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const actOnReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      id: z.string().uuid(),
      action: z.enum(["resolve", "dismiss", "warn", "suspend", "ban"]),
      notes: z.string().max(1000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { actOnReport: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const listMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ active: z.enum(["all", "active", "inactive"]).default("all"), ...paging }))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { listMatches: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ search: z.string().max(200).optional(), ...paging }))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { listConversations: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const getConversationMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ conversationId: z.string().uuid(), search: z.string().max(200).optional() }))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { getConversationMessages: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const listAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      filter: z.enum(["all", "unread", "read", "system", "verification", "match", "message", "like"]).default("all"),
      ...paging,
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { listNotifications: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const broadcastNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      audience: z.enum(["all", "country", "premium", "moderators", "user"]),
      countryCode: z.string().max(2).optional(),
      userId: z.string().uuid().optional(),
      title: z.string().min(1).max(120),
      body: z.string().min(1).max(1000),
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { broadcastNotification: run } = await import("./ops.server");
    await assertAdmin(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ range: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30) }))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { getAnalytics: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run(data.range);
  });

export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ search: z.string().max(200).optional(), source: z.enum(["admin", "system"]).default("admin"), ...paging }))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { listActivity: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const getPlatformSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("./admin.server");
    const { getPlatformSettings: run } = await import("./ops.server");
    await assertStaff(context.supabase, context.userId);
    return run();
  });

export const updatePlatformSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      support_email: z.string().email().max(200).optional(),
      maintenance_mode: z.boolean().optional(),
      default_language: z.enum(["ar", "en", "de", "ru"]).optional(),
      registration_enabled: z.boolean().optional(),
      verification_required: z.boolean().optional(),
      max_gallery_photos: z.number().int().min(1).max(50).optional(),
      max_image_mb: z.number().int().min(1).max(25).optional(),
      allowed_image_types: z.array(z.string().max(60)).max(10).optional(),
      notify_defaults: z.record(z.string(), z.boolean()).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
    if (!ok) throw new Error("forbidden");
    const { updatePlatformSettings: run } = await import("./ops.server");
    return run({ adminId: context.userId, patch: data });
  });

export const changeUserRoleV2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ targetId: z.string().uuid(), role: appRole, grant: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    if (data.role === "super_admin") {
      const { data: ok } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
      if (!ok) throw new Error("forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logAdminAction } = await import("./ops.server");
    if (data.grant) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: data.targetId, role: data.role }, { onConflict: "user_id,role" });
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.targetId).eq("role", data.role);
    }
    await logAdminAction({
      adminId: context.userId,
      action: data.grant ? "role.grant" : "role.revoke",
      targetTable: "user_roles",
      targetId: data.targetId,
      details: { role: data.role },
    });
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Billing — subscriptions & payments (provider-agnostic)
// ---------------------------------------------------------------------------

export const getBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("./admin.server");
    const { getBillingOverview: run } = await import("./billing.server");
    await assertStaff(context.supabase, context.userId);
    return run();
  });

export const listSubscriptionsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      status: z.enum(["all", "active", "trialing", "past_due", "canceled", "expired"]).default("all"),
      planCode: z.string().max(60).optional(),
      search: z.string().max(200).optional(),
      ...paging,
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { listSubscriptions } = await import("./billing.server");
    await assertStaff(context.supabase, context.userId);
    return listSubscriptions(data);
  });

export const listPlansAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("./admin.server");
    const { listPlans } = await import("./billing.server");
    await assertStaff(context.supabase, context.userId);
    return listPlans();
  });

export const runSubscriptionAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      subscriptionId: z.string().uuid(),
      action: z.enum(["set_status", "change_plan", "extend_period", "set_grace", "cancel_at_period_end"]),
      status: z.enum(["active", "trialing", "past_due", "canceled", "expired"]).optional(),
      planCode: z.string().max(60).optional(),
      days: z.number().int().min(1).max(365).optional(),
      reason: z.string().min(1).max(500),
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { runSubscriptionAction: run } = await import("./billing.server");
    await assertAdmin(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const listPaymentsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      status: z.enum(["all", "pending", "succeeded", "failed", "refunded"]).default("all"),
      provider: z.string().max(60).optional(),
      search: z.string().max(200).optional(),
      ...paging,
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { listPayments } = await import("./billing.server");
    await assertStaff(context.supabase, context.userId);
    return listPayments(data);
  });

export const markPaymentRefunded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ paymentId: z.string().uuid(), reason: z.string().min(1).max(500) }))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    const { markPaymentRefunded: run } = await import("./billing.server");
    await assertAdmin(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const exportPaymentsCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ status: z.enum(["all", "pending", "succeeded", "failed", "refunded"]).default("all") }))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./admin.server");
    const { exportPaymentsCsv: run } = await import("./billing.server");
    await assertStaff(context.supabase, context.userId);
    return { csv: await run(data) };
  });
