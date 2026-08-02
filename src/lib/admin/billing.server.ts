/**
 * Phase 5 — admin billing operations (subscriptions, payments, revenue).
 * Provider-agnostic: nothing here assumes Stripe; `provider` is a free-form column.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

import { logAdminAction } from "./ops.server";

export type BillingOverview = {
  mrrCents: number;
  arrCents: number;
  revenueThisMonthCents: number;
  revenueAllTimeCents: number;
  refundedCents: number;
  subscriptionsActive: number;
  subscriptionsTrialing: number;
  subscriptionsPastDue: number;
  subscriptionsExpired: number;
  subscriptionsCanceled: number;
  byPlan: { plan_code: string; count: number; mrrCents: number }[];
  revenue12m: { month: string; cents: number }[];
};

function monthKey(value: string): string {
  return value.slice(0, 7);
}

export async function getBillingOverview(): Promise<BillingOverview> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const yearAgo = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1)).toISOString();

  const [subsRes, plansRes, paymentsRes] = await Promise.all([
    supabaseAdmin.from("subscriptions").select("plan_code, status, billing_interval"),
    supabaseAdmin.from("plans").select("code, price_monthly_cents, price_annual_cents"),
    supabaseAdmin.from("payments").select("amount_cents, status, paid_at, created_at, refunded_at").gte("created_at", yearAgo),
  ]);

  const priceOf = new Map((plansRes.data ?? []).map((p) => [p.code, p]));
  const counts: Record<string, number> = {};
  const byPlan = new Map<string, { count: number; mrrCents: number }>();
  let mrrCents = 0;

  for (const sub of subsRes.data ?? []) {
    counts[sub.status] = (counts[sub.status] ?? 0) + 1;
    if (sub.status !== "active" && sub.status !== "trialing") continue;
    const plan = priceOf.get(sub.plan_code);
    const monthly =
      sub.billing_interval === "annual"
        ? Math.round((plan?.price_annual_cents ?? 0) / 12)
        : (plan?.price_monthly_cents ?? 0);
    mrrCents += monthly;
    const entry = byPlan.get(sub.plan_code) ?? { count: 0, mrrCents: 0 };
    entry.count += 1;
    entry.mrrCents += monthly;
    byPlan.set(sub.plan_code, entry);
  }

  const payments = paymentsRes.data ?? [];
  const succeeded = payments.filter((p) => p.status === "succeeded");
  const monthBuckets = new Map<string, number>();
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    monthBuckets.set(d.toISOString().slice(0, 7), 0);
  }
  for (const p of succeeded) {
    const key = monthKey(p.paid_at ?? p.created_at);
    if (monthBuckets.has(key)) monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + p.amount_cents);
  }

  const allTime = await supabaseAdmin.from("payments").select("amount_cents, status").eq("status", "succeeded");

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    revenueThisMonthCents: succeeded
      .filter((p) => (p.paid_at ?? p.created_at) >= monthStart)
      .reduce((s, p) => s + p.amount_cents, 0),
    revenueAllTimeCents: (allTime.data ?? []).reduce((s, p) => s + p.amount_cents, 0),
    refundedCents: payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount_cents, 0),
    subscriptionsActive: counts["active"] ?? 0,
    subscriptionsTrialing: counts["trialing"] ?? 0,
    subscriptionsPastDue: counts["past_due"] ?? 0,
    subscriptionsExpired: counts["expired"] ?? 0,
    subscriptionsCanceled: counts["canceled"] ?? 0,
    byPlan: Array.from(byPlan.entries())
      .map(([plan_code, v]) => ({ plan_code, ...v }))
      .sort((a, b) => b.mrrCents - a.mrrCents),
    revenue12m: Array.from(monthBuckets.entries()).map(([month, cents]) => ({ month, cents })),
  };
}

export type SubscriptionStatusFilter = "all" | "active" | "trialing" | "past_due" | "canceled" | "expired";

async function namesFor(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabaseAdmin.from("profiles").select("id, display_name").in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p.display_name]));
}

export async function listSubscriptions(params: {
  status: SubscriptionStatusFilter;
  planCode?: string | undefined;
  search?: string | undefined;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;

  let userIds: string[] | null = null;
  if (params.search) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("display_name", `%${params.search}%`)
      .limit(200);
    userIds = (data ?? []).map((r) => r.id);
    if (userIds.length === 0) return { rows: [], total: 0, page, pageSize };
  }

  let query = supabaseAdmin.from("subscriptions").select("*", { count: "exact" });
  if (params.status !== "all") query = query.eq("status", params.status);
  if (params.planCode) query = query.eq("plan_code", params.planCode);
  if (userIds) query = query.in("user_id", userIds);

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const names = await namesFor((data ?? []).map((r) => r.user_id));
  return {
    rows: (data ?? []).map((row) => ({ ...row, userName: names.get(row.user_id) ?? row.user_id.slice(0, 8) })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function listPayments(params: {
  status: "all" | "pending" | "succeeded" | "failed" | "refunded";
  provider?: string | undefined;
  search?: string | undefined;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(200, Math.max(1, params.pageSize));
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin.from("payments").select("*", { count: "exact" });
  if (params.status !== "all") query = query.eq("status", params.status);
  if (params.provider) query = query.eq("provider", params.provider);
  if (params.search) query = query.or(`invoice_number.ilike.%${params.search}%,provider_ref.ilike.%${params.search}%`);

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  const names = await namesFor((data ?? []).map((r) => r.user_id));
  return {
    rows: (data ?? []).map((row) => ({ ...row, userName: names.get(row.user_id) ?? row.user_id.slice(0, 8) })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function listPlans() {
  const { data } = await supabaseAdmin.from("plans").select("*").order("sort_order", { ascending: true });
  return data ?? [];
}

export type SubscriptionAction = "set_status" | "change_plan" | "extend_period" | "set_grace" | "cancel_at_period_end";

export async function runSubscriptionAction(params: {
  adminId: string;
  subscriptionId: string;
  action: SubscriptionAction;
  status?: "active" | "trialing" | "past_due" | "canceled" | "expired" | undefined;
  planCode?: string | undefined;
  days?: number | undefined;
  reason: string;
}) {
  const { data: before, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("id", params.subscriptionId)
    .maybeSingle();
  if (error || !before) throw new Error("subscription not found");

  type SubPatch = Partial<Database["public"]["Tables"]["subscriptions"]["Update"]>;
  const patch: SubPatch = {};
  if (params.action === "set_status" && params.status) {
    patch.status = params.status;
    if (params.status === "canceled") patch.canceled_at = new Date().toISOString();
  }
  if (params.action === "change_plan" && params.planCode) {
    patch.previous_plan_code = before.plan_code;
    patch.plan_code = params.planCode;
  }
  if (params.action === "extend_period") {
    const base = before.current_period_end ? new Date(before.current_period_end) : new Date();
    base.setUTCDate(base.getUTCDate() + (params.days ?? 30));
    patch.current_period_end = base.toISOString();
    patch.status = "active";
  }
  if (params.action === "set_grace") {
    const until = new Date();
    until.setUTCDate(until.getUTCDate() + (params.days ?? 7));
    patch.grace_until = until.toISOString();
  }
  if (params.action === "cancel_at_period_end") {
    patch.cancel_at_period_end = !before.cancel_at_period_end;
  }
  if (Object.keys(patch).length === 0) throw new Error("nothing to update");

  const { error: upErr } = await supabaseAdmin.from("subscriptions").update(patch).eq("id", params.subscriptionId);
  if (upErr) throw new Error(upErr.message);

  await logAdminAction({
    adminId: params.adminId,
    action: `subscription.${params.action}`,
    targetTable: "subscriptions",
    targetId: params.subscriptionId,
    details: { before: { ...before }, after: patch as Record<string, unknown>, reason: params.reason },
  });
  return { ok: true };
}

export async function markPaymentRefunded(params: { adminId: string; paymentId: string; reason: string }) {
  const { data: before } = await supabaseAdmin.from("payments").select("*").eq("id", params.paymentId).maybeSingle();
  if (!before) throw new Error("payment not found");
  const { error } = await supabaseAdmin
    .from("payments")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", params.paymentId);
  if (error) throw new Error(error.message);
  await logAdminAction({
    adminId: params.adminId,
    action: "payment.refund",
    targetTable: "payments",
    targetId: params.paymentId,
    details: { amount_cents: before.amount_cents, provider: before.provider, reason: params.reason },
  });
  return { ok: true };
}

export async function exportPaymentsCsv(params: { status: "all" | "pending" | "succeeded" | "failed" | "refunded" }) {
  const { rows } = await listPayments({ status: params.status, page: 1, pageSize: 200 });
  const header = ["invoice_number", "user", "amount", "currency", "status", "provider", "paid_at", "created_at"];
  const lines = rows.map((r) =>
    [
      r.invoice_number ?? r.id,
      r.userName,
      (r.amount_cents / 100).toFixed(2),
      r.currency,
      r.status,
      r.provider ?? "",
      r.paid_at ?? "",
      r.created_at,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
