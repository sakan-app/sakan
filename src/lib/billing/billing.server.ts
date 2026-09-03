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
  detail?: Record<string, string | number | boolean | null>;
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
  customerId?: string | null;
  /** Provider-side period end (Stripe is authoritative when present). */
  periodEndIso?: string | null;
  /** Amount actually charged, when the provider reports it. */
  amountCentsOverride?: number | null;
  /** Skips work if a payment with this provider ref was already recorded. */
  idempotencyRef?: string | null;
}) {
  if (args.idempotencyRef) {
    const { data: seen } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("provider", args.provider)
      .eq("provider_ref", args.idempotencyRef)
      .maybeSingle();
    if (seen) return { subscriptionId: null, eventType: "duplicate" as const };
  }

  const plan = await loadPlan(args.planCode);
  if (plan.tier === 0) throw new Error("cannot_purchase_free_plan");

  const amountCents =
    args.amountCentsOverride ??
    (args.interval === "annual" ? plan.price_annual_cents : plan.price_monthly_cents);
  const existing = await liveSubscription(args.userId);
  const now = new Date();
  const end = args.periodEndIso ? new Date(args.periodEndIso) : periodEnd(now, args.interval);

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
        current_period_end: (args.periodEndIso
          ? new Date(args.periodEndIso)
          : periodEnd(base, args.interval)
        ).toISOString(),
        cancel_at_period_end: false,
        canceled_at: null,
        grace_until: null,
        provider: args.provider,
        provider_ref: args.providerRef,
        provider_customer_id: args.customerId ?? existing.provider_customer_id ?? null,
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
        provider_customer_id: args.customerId ?? null,
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
    providerRef: args.idempotencyRef ?? args.providerRef,
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

  // A rejected/expired Stripe key must not block the purchase flow: fall back
  // to the manual provider exactly like a project with no PSP connected.
  let result: Awaited<ReturnType<typeof provider.createCheckout>>;
  let usedProviderId = provider.id;
  let usedLive = provider.live;
  try {
    result = await provider.createCheckout(req);
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (!code.startsWith("stripe_")) throw err;
    console.error("Stripe checkout unavailable, using manual provider:", code);
    result = { kind: "activate", providerRef: `manual_${args.planCode}_${Date.now()}` };
    usedProviderId = "manual";
    usedLive = false;
  }

  if (result.kind === "redirect") {
    return { status: "redirect" as const, url: result.url };
  }

  await activateSubscription({
    userId: args.userId,
    planCode: args.planCode,
    interval: args.interval,
    provider: usedProviderId,
    providerRef: result.providerRef,
  });
  return { status: "active" as const, testMode: !usedLive };

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
  if (!sub.cancel_at_period_end) return { planCode: sub.plan_code };

  // Provider first: if Stripe refuses (already ended), the local row keeps its
  // canceled state instead of drifting out of sync.
  await getPaymentProvider().resume(sub.provider_ref);

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

/** Hosted provider portal (payment methods, invoices, cancel/resume). */
export async function billingPortalUrl(userId: string, returnUrl: string) {
  try {
    const url = await getPaymentProvider().portal(userId, returnUrl);
    if (!url) return { url: null, unavailable: true as const };
    return { url, unavailable: false as const };
  } catch (error) {
    // Provider not wired up yet (test placeholder keys): degrade gracefully
    // instead of crashing the billing page.
    console.error("billingPortalUrl failed:", (error as Error).message);
    return { url: null, unavailable: true as const };
  }
}

/** Marks a failed charge and opens the grace window. Idempotent. */
export async function markPaymentFailed(args: {
  userId: string;
  amountCents: number;
  currency: string;
  providerRef: string;
  reason?: string | null;
}) {
  const sub = await liveSubscription(args.userId);
  const { data: seen } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("provider", "stripe")
    .eq("provider_ref", args.providerRef)
    .eq("status", "failed")
    .maybeSingle();

  if (!seen) {
    await supabaseAdmin.from("payments").insert({
      user_id: args.userId,
      subscription_id: sub?.id ?? null,
      amount_cents: args.amountCents,
      currency: args.currency,
      status: "failed",
      provider: "stripe",
      provider_ref: args.providerRef,
      description: "renewal_failed",
      failure_reason: args.reason ?? "payment_failed",
    });
    await logEvent({
      user_id: args.userId,
      subscription_id: sub?.id ?? null,
      type: "payment_failed",
      amount_cents: args.amountCents,
      currency: args.currency,
    });
  }

  if (sub && (sub.status === "active" || sub.status === "trialing")) {
    const grace = new Date(Date.now() + GRACE_DAYS * 86_400_000).toISOString();
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "past_due", grace_until: grace })
      .eq("id", sub.id);
    await logEvent({
      user_id: args.userId,
      subscription_id: sub.id,
      type: "grace_started",
      plan_code: sub.plan_code,
    });
    await notifyBilling(args.userId, "payment_failed");
  }
  return { ok: true };
}

/** Refund: reverses the payment record and ends access. Idempotent. */
export async function applyRefund(args: {
  userId: string;
  providerRef: string;
  amountRefundedCents: number;
  fullyRefunded: boolean;
}) {
  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, status, subscription_id")
    .eq("provider", "stripe")
    .eq("provider_ref", args.providerRef)
    .maybeSingle();

  if (payment && payment.status !== "refunded") {
    await supabaseAdmin
      .from("payments")
      .update({ status: "refunded", refunded_at: new Date().toISOString() })
      .eq("id", payment.id);
  } else if (payment) {
    return { ok: true, duplicate: true };
  }

  await logEvent({
    user_id: args.userId,
    subscription_id: payment?.subscription_id ?? null,
    payment_id: payment?.id ?? null,
    type: "refunded",
    amount_cents: args.amountRefundedCents,
  });

  // Partial refunds keep access; a full refund revokes it immediately.
  if (args.fullyRefunded) {
    const sub = await liveSubscription(args.userId);
    if (sub) {
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "canceled",
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
        })
        .eq("id", sub.id);
    }
  }
  await notifyBilling(args.userId, "refunded");
  return { ok: true };
}

/** Best-effort in-app notification; never blocks a webhook. */
async function notifyBilling(userId: string, kind: "payment_failed" | "refunded") {
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type: "premium",
      title:
        kind === "payment_failed" ? "Payment failed" : "Refund processed",
      body:
        kind === "payment_failed"
          ? "We could not charge your payment method. Update it to keep your benefits."
          : "Your payment was refunded and your subscription was closed.",
      data: { link: "/billing", kind },
    });
  } catch (error) {
    console.error("[billing] notify", error);
  }
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