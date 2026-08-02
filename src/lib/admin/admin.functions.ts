import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const appRole = z.enum(["user", "moderator", "admin"]);
const pageInput = { page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(20) };

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff, getDashboardStats: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run();
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      search: z.string().max(200).optional(),
      status: z.enum(["active", "suspended", "all"]).default("all"),
      verified: z.enum(["verified", "unverified", "all"]).default("all"),
      ...pageInput,
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff, listUsers: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const getUserDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ targetId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { assertStaff, getUserDetail: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run(data.targetId);
  });

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      targetId: z.string().uuid(),
      action: z.enum(["suspend", "unsuspend", "ban"]),
      reason: z.string().max(500).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff, setUserStatus: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const changeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ targetId: z.string().uuid(), role: appRole, grant: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { assertAdmin, changeUserRole: run } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const bulkChangeUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ targetIds: z.array(z.string().uuid()).min(1).max(200), role: appRole, grant: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { assertAdmin, bulkChangeUserRole: run } = await import("./admin.server");
    await assertAdmin(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const listVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"), ...pageInput }))
  .handler(async ({ data, context }) => {
    const { assertStaff, listVerifications: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const reviewVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid(), decision: z.enum(["approved", "rejected"]), notes: z.string().max(500).optional() }))
  .handler(async ({ data, context }) => {
    const { assertStaff, reviewVerification: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const bulkReviewVerifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ ids: z.array(z.string().uuid()).min(1).max(200), decision: z.enum(["approved", "rejected"]) }))
  .handler(async ({ data, context }) => {
    const { assertStaff, bulkReviewVerifications: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ status: z.enum(["open", "reviewing", "resolved", "dismissed", "all"]).default("open"), ...pageInput }))
  .handler(async ({ data, context }) => {
    const { assertStaff, listReports: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const resolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid(), action: z.enum(["resolved", "dismissed"]), notes: z.string().max(500).optional() }))
  .handler(async ({ data, context }) => {
    const { assertStaff, resolveReport: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const bulkResolveReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ ids: z.array(z.string().uuid()).min(1).max(200), action: z.enum(["resolved", "dismissed"]) }))
  .handler(async ({ data, context }) => {
    const { assertStaff, bulkResolveReports: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const listModerationFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ verdict: z.enum(["pending", "approved", "flagged", "rejected", "all"]).default("flagged"), ...pageInput }))
  .handler(async ({ data, context }) => {
    const { assertStaff, listModerationFlags: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const resolveModerationFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid(), verdict: z.enum(["approved", "rejected"]) }))
  .handler(async ({ data, context }) => {
    const { assertStaff, resolveModerationFlag: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run({ adminId: context.userId, ...data });
  });

export const listSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ status: z.string().max(30).optional(), planCode: z.string().max(60).optional(), ...pageInput }))
  .handler(async ({ data, context }) => {
    const { assertStaff, listSubscriptions: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ status: z.string().max(30).optional(), ...pageInput }))
  .handler(async ({ data, context }) => {
    const { assertStaff, listPayments: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ action: z.string().max(100).optional(), adminId: z.string().uuid().optional(), ...pageInput }))
  .handler(async ({ data, context }) => {
    const { assertStaff, listAuditLog: run } = await import("./admin.server");
    await assertStaff(context.supabase, context.userId);
    return run(data);
  });
