import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { getPaymentProvider, type CheckoutRequest } from "./provider.server";

export const GRACE_DAYS = 7;

type Interval = "monthly" | "annual";

export function periodEnd(from: Date, interval: Interval): Date {
  const d = new Date(from);
  if (interval === "annual") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

export async function loadPlan(code: string) {
  const { data, error } = await supabaseAdmin
    .from("plans")
    .select("code, tier, currency, price_monthly_cents, price_annual_cents, name")
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("plan_not_found");
  return data;
}

export async function liveSubscription(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["trialing", "active", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function logEvent(row: {
  user_id: string;
  subscription_id?: string | null;
  payment_id?: string | null;
  type:
    | "checkout"
    | "activated"
    | "upgraded"
    | "downgraded"
    | "canceled"
    | "resumed"
    | "renewed"
    | "payment_succeeded"
    | "payment_failed"
    | "grace_started"
    | "expired"
    | "refunded";
  plan_code?: string | null;
  from_plan_code?: string | null;
  amount_cents?: number | null;
  currency?: string;
  detail?: Record<string, unknown>;
}) {
  await supabaseAdmin.from("billing_events").insert(row);
}

export async function recordPayment(args: {
  userId: string;
  subscriptionId: string;
  amountCents: number;
  currency: string;
  provider: string;
  providerRef: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  succeeded: boolean;
  failureReason?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: args.userId,
      subscription_id: args.subscriptionId,
      amount_cents: args.amountCents,
      currency: args.currency,
      status: args.succeeded ? "succeeded" : "failed",
      provider: args.provider,
      provider_ref: args.providerRef,
      description: args.description,
      period_start: args.periodStart,
      period_end: args.periodEnd,
      paid_at: args.succeeded ? new Date().toISOString() : null,
      failure_reason: args.failureReason ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await logEvent({
    user_id: args.userId,
    subscription_id: args.subscriptionId,
    payment_id: data.id,
    type: args.succeeded ? "payment_succeeded" : "payment_failed",
    amount_cents: args.amountCents,
    currency: args.currency,
  });
  return data.id;
}

/**
 * Creates or replaces the member's live subscription and writes the matching
 * invoice + history entry. Handles first purchase, upgrade, downgrade and
 * manual renewal in one place.
 */
export async function activateSubscription(args: {
  userId: string;
  planCode: string;
  interval: Interval;
  provider: string;
  providerRef: string;
}) {
  const plan = await loadPlan(args.planCode);
  if (plan.tier === 0) throw new Error("cannot_purchase_free_plan");

  const amountCents =
    args.interval === "annual" ? plan.price_annual_cents : plan.price_monthly_cents;
  const existing = await liveSubscription(args.userId);
  const now = new Date();
  const end = periodEnd(now, args.interval);

  let subscriptionId: string;
  let eventType: "activated" | "upgraded" | "downgraded" | "renewed" = "activated";

  if (existing && existing.plan_code === args.planCode) {
    // Same plan → renew: extend from the later of now / current period end.
    const base =
      existing.current_period_end && new Date(existing.current_period_end) > now
        ? new Date(existing.current_period_end)
        : now;
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "active",
        billing_interval: args.interval,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd(base, args.interval).toISOString(),
        cancel_at_period_end: false,
        canceled_at: null,
        grace_until: null,
        provider: args.provider,
        provider_ref: args.providerRef,
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    subscriptionId = existing.id;
    eventType = "renewed";
  } else {
    if (existing) {
      const prevPlan = await loadPlan(existing.plan_code);
      eventType = plan.tier > prevPlan.tier ? "upgraded" : "downgraded";
      const { error: closeError } = await supabaseAdmin
        .from("subscriptions")
        .update({ status: "canceled", canceled_at: now.toISOString() })
        .eq("id", existing.id);
      if (closeError) throw new Error(closeError.message);
    }

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: args.userId,
        plan_code: args.planCode,
        status: "active",
        billing_interval: args.interval,
        provider: args.provider,
        provider_ref: args.providerRef,
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        cancel_at_period_end: false,
        previous_plan_code: existing?.plan_code ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    subscriptionId = data.id;
  }

  const { data: fresh } = await supabaseAdmin
    .from("subscriptions")
    .select("current_period_start, current_period_end")
    .eq("id", subscriptionId)
    .single();

  await recordPayment({
    userId: args.userId,
    subscriptionId,
    amountCents,
    currency: plan.currency,
    provider: args.provider,
    providerRef: args.providerRef,
    description: `${args.planCode} · ${args.interval}`,
    periodStart: fresh?.current_period_start ?? now.toISOString(),
    periodEnd: fresh?.current_period_end ?? end.toISOString(),
    succeeded: true,
  });

  await logEvent({
    user_id: args.userId,
    subscription_id: subscriptionId,
    type: eventType,
    plan_code: args.planCode,
    from_plan_code: existing?.plan_code ?? null,
    amount_cents: amountCents,
    currency: plan.currency,
  });

  return { subscriptionId, eventType };
}

export async function startCheckout(args: {
  userId: string;
  planCode: string;
  interval: Interval;
  returnUrl: string;
}) {
  const plan = await loadPlan(args.planCode);
  if (plan.tier === 0) throw new Error("cannot_purchase_free_plan");
  const amountCents =
    args.interval === "annual" ? plan.price_annual_cents : plan.price_monthly_cents;

  const provider = getPaymentProvider();
  const req: CheckoutRequest = {
    userId: args.userId,
    planCode: args.planCode,
    interval: args.interval,
    amountCents,
    currency: plan.currency,
    description: `${args.planCode} · ${args.interval}`,
    returnUrl: args.returnUrl,
  };

  await logEvent({
    user_id: args.userId,
    type: "checkout",
    plan_code: args.planCode,
    amount_cents: amountCents,
    currency: plan.currency,
    detail: { provider: provider.id, interval: args.interval },
  });

  const result = await provider.createCheckout(req);
  if (result.kind === "redirect") {
    return { status: "redirect" as const, url: result.url };
  }

  await activateSubscription({
    userId: args.userId,
    planCode: args.planCode,
    interval: args.interval,
    provider: provider.id,
    providerRef: result.providerRef,
  });
  return { status: "active" as const, testMode: !provider.live };
}

export async function cancelAtPeriodEnd(userId: string) {
  const sub = await liveSubscription(userId);
  if (!sub) throw new Error("no_active_subscription");
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({ cancel_at_period_end: true, canceled_at: new Date().toISOString() })
    .eq("id", sub.id);
  if (error) throw new Error(error.message);
  await getPaymentProvider().cancel(sub.provider_ref);
  await logEvent({
    user_id: userId,
    subscription_id: sub.id,
    type: "canceled",
    plan_code: sub.plan_code,
  });
  return { effectiveAt: sub.current_period_end };
}

export async function resumeSubscription(userId: string) {
  const sub = await liveSubscription(userId);
  if (!sub) throw new Error("no_active_subscription");
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({ cancel_at_period_end: false, canceled_at: null })
    .eq("id", sub.id);
  if (error) throw new Error(error.message);
  await logEvent({
    user_id: userId,
    subscription_id: sub.id,
    type: "resumed",
    plan_code: sub.plan_code,
  });
  return { planCode: sub.plan_code };
}

/** Moves lapsed subscriptions into past_due → grace → expired. */
export async function sweepExpiries() {
  const nowIso = new Date().toISOString();
  const grace = new Date(Date.now() + GRACE_DAYS * 86_400_000).toISOString();

  const { data: lapsed } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, plan_code, cancel_at_period_end")
    .in("status", ["trialing", "active"])
    .lt("current_period_end", nowIso);

  for (const s of lapsed ?? []) {
    if (s.cancel_at_period_end) continue;
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "past_due", grace_until: grace })
      .eq("id", s.id);
    await logEvent({
      user_id: s.user_id,
      subscription_id: s.id,
      type: "grace_started",
      plan_code: s.plan_code,
    });
  }

  await supabaseAdmin.rpc("expire_due_subscriptions");
}