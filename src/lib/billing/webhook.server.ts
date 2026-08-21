/**
 * Stripe event handlers.
 *
 * Every handler resolves the SAKAN member from the *correct* Stripe object:
 * only Checkout Sessions and Subscriptions carry our metadata. Invoices and
 * Charges do not, so they are resolved through the parent subscription or the
 * customer mapping in `billing_customers`.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

import {
  activateSubscription,
  applyRefund,
  markPaymentFailed,
} from "./billing.server";
import { linkCustomer, userIdForCustomer, userIdForSubscriptionRef } from "./customers.server";
import { stripeRequest } from "./stripe.server";

type Obj = Record<string, unknown>;

const str = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

/** Stripe returns either an id string or an expanded object. */
const idOf = (v: unknown): string | null =>
  typeof v === "string" ? v : str((v as Obj | null)?.["id"]);

type Resolved = {
  userId: string;
  planCode: string;
  interval: "monthly" | "annual";
  subscriptionRef: string | null;
  customerId: string | null;
  periodEndIso: string | null;
};

function readPlanMeta(meta: Obj | undefined | null) {
  const m = (meta ?? {}) as Record<string, string>;
  return {
    userId: str(m["user_id"]),
    planCode: m["plan_code"] ?? "premium",
    interval: m["interval"] === "annual" ? ("annual" as const) : ("monthly" as const),
  };
}

/**
 * Loads the Stripe subscription and derives member + plan from ITS metadata
 * (the only place subscription metadata lives), falling back to our own
 * database mappings when metadata is absent.
 */
export async function resolveFromSubscription(
  subscriptionRef: string | null,
  customerId: string | null,
): Promise<Resolved | null> {
  let periodEndIso: string | null = null;
  let meta: Obj | null = null;
  let cust = customerId;

  if (subscriptionRef) {
    try {
      const sub = await stripeRequest<Obj>(`/subscriptions/${subscriptionRef}`, undefined, "GET");
      meta = (sub["metadata"] ?? {}) as Obj;
      cust = idOf(sub["customer"]) ?? cust;
      const end = Number(sub["current_period_end"]);
      if (Number.isFinite(end) && end > 0) periodEndIso = new Date(end * 1000).toISOString();
    } catch (error) {
      console.error("[stripe] subscription fetch", subscriptionRef, error);
    }
  }

  const fromMeta = readPlanMeta(meta);
  const userId =
    fromMeta.userId ??
    (await userIdForSubscriptionRef(subscriptionRef)) ??
    (await userIdForCustomer(cust));
  if (!userId) return null;

  let planCode = fromMeta.planCode;
  let interval = fromMeta.interval;
  if (!fromMeta.userId) {
    // Metadata missing → trust the last known local subscription.
    const { data: local } = await supabaseAdmin
      .from("subscriptions")
      .select("plan_code, billing_interval")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (local) {
      planCode = local.plan_code;
      interval = local.billing_interval === "annual" ? "annual" : "monthly";
    }
  }

  if (cust) await linkCustomer(userId, cust);
  return { userId, planCode, interval, subscriptionRef, customerId: cust, periodEndIso };
}

/** checkout.session.completed — metadata lives on the session itself. */
export async function handleCheckoutCompleted(session: Obj) {
  const meta = (session["metadata"] ?? {}) as Record<string, string>;
  const customerId = idOf(session["customer"]);
  const subscriptionRef = idOf(session["subscription"]);

  if (meta["kind"] === "featured_ad" && meta["ad_id"]) {
    const { publishFeaturedAd } = await import("@/lib/ads/ads.server");
    await publishFeaturedAd(
      meta["ad_id"]!,
      "stripe",
      idOf(session["payment_intent"]) ?? String(session["id"] ?? ""),
    );
    return;
  }
  // Commercial header banner: this verified event is the ONLY path that may
  // mark a commercial advertisement as paid and publish it. A browser
  // reporting "checkout succeeded" never reaches this code.
  if (meta["kind"] === "commercial_ad" && meta["ad_id"]) {
    if (session["payment_status"] !== "paid") {
      console.warn("[stripe] commercial ad session not paid", session["id"]);
      return;
    }
    const { publishCommercialAd } = await import("@/lib/ads/commercial.server");
    await publishCommercialAd(
      meta["ad_id"]!,
      "stripe",
      idOf(session["payment_intent"]) ?? String(session["id"] ?? ""),
    );
    return;
  }
  if (meta["kind"] !== "subscription") return;
  if (session["payment_status"] === "unpaid") return;

  const userId = str(meta["user_id"]) ?? str(session["client_reference_id"]);
  if (!userId) throw new Error("checkout_missing_user");
  if (customerId) await linkCustomer(userId, customerId);

  const resolved = subscriptionRef
    ? await resolveFromSubscription(subscriptionRef, customerId)
    : null;

  await activateSubscription({
    userId,
    planCode: meta["plan_code"] ?? resolved?.planCode ?? "premium",
    interval: meta["interval"] === "annual" ? "annual" : (resolved?.interval ?? "monthly"),
    provider: "stripe",
    providerRef: subscriptionRef ?? String(session["id"] ?? ""),
    customerId,
    periodEndIso: resolved?.periodEndIso ?? null,
    // The session id is unique per purchase → replay-safe.
    idempotencyRef: String(session["id"] ?? ""),
  });
}

/** invoice.paid — resolve through invoice.subscription, never invoice.metadata. */
export async function handleInvoicePaid(invoice: Obj) {
  const reason = String(invoice["billing_reason"] ?? "");
  // The first cycle is already handled by checkout.session.completed.
  if (reason !== "subscription_cycle" && reason !== "subscription_update") return;

  const subscriptionRef =
    idOf(invoice["subscription"]) ??
    idOf(((invoice["parent"] as Obj)?.["subscription_details"] as Obj)?.["subscription"]);
  const resolved = await resolveFromSubscription(subscriptionRef, idOf(invoice["customer"]));
  if (!resolved) throw new Error("invoice_unresolved");

  const amount = Number(invoice["amount_paid"]);
  await activateSubscription({
    userId: resolved.userId,
    planCode: resolved.planCode,
    interval: resolved.interval,
    provider: "stripe",
    providerRef: subscriptionRef ?? String(invoice["id"] ?? ""),
    customerId: resolved.customerId,
    periodEndIso: resolved.periodEndIso,
    amountCentsOverride: Number.isFinite(amount) && amount > 0 ? amount : null,
    // Invoice id is unique per renewal → no duplicate renewals on retries.
    idempotencyRef: String(invoice["id"] ?? ""),
  });
}

/** invoice.payment_failed — grace period + notification. */
export async function handleInvoiceFailed(invoice: Obj) {
  const subscriptionRef =
    idOf(invoice["subscription"]) ??
    idOf(((invoice["parent"] as Obj)?.["subscription_details"] as Obj)?.["subscription"]);
  const resolved = await resolveFromSubscription(subscriptionRef, idOf(invoice["customer"]));
  if (!resolved) throw new Error("invoice_unresolved");

  await markPaymentFailed({
    userId: resolved.userId,
    amountCents: Number(invoice["amount_due"] ?? 0) || 0,
    currency: String(invoice["currency"] ?? "eur").toUpperCase(),
    providerRef: String(invoice["id"] ?? ""),
    reason: str((invoice["last_finalization_error"] as Obj | null)?.["message"]) ?? "card_declined",
  });
}

/** customer.subscription.updated — mirror cancel flag, plan and period. */
export async function handleSubscriptionUpdated(sub: Obj) {
  const subscriptionRef = str(sub["id"]);
  const customerId = idOf(sub["customer"]);
  const meta = readPlanMeta(sub["metadata"] as Obj);
  const userId =
    meta.userId ??
    (await userIdForSubscriptionRef(subscriptionRef)) ??
    (await userIdForCustomer(customerId));
  if (!userId) return;
  if (customerId) await linkCustomer(userId, customerId);

  const end = Number(sub["current_period_end"]);
  const status = String(sub["status"] ?? "");
  const patch: Database["public"]["Tables"]["subscriptions"]["Update"] = {
    cancel_at_period_end: Boolean(sub["cancel_at_period_end"]),
    provider_ref: subscriptionRef,
    provider_customer_id: customerId,
  };
  if (Number.isFinite(end) && end > 0)
    patch.current_period_end = new Date(end * 1000).toISOString();
  if (status === "past_due" || status === "unpaid") patch.status = "past_due";
  if (status === "active" || status === "trialing") {
    patch.status = status === "trialing" ? "trialing" : "active";
    patch.grace_until = null;
  }
  if (!sub["cancel_at_period_end"]) patch.canceled_at = null;

  await supabaseAdmin
    .from("subscriptions")
    .update(patch)
    .eq("user_id", userId)
    .in("status", ["trialing", "active", "past_due"]);
}

/** customer.subscription.deleted — access ends now. */
export async function handleSubscriptionDeleted(sub: Obj) {
  const subscriptionRef = str(sub["id"]);
  const meta = readPlanMeta(sub["metadata"] as Obj);
  const userId =
    meta.userId ??
    (await userIdForSubscriptionRef(subscriptionRef)) ??
    (await userIdForCustomer(idOf(sub["customer"])));
  if (!userId) return;

  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("status", ["trialing", "active", "past_due"]);
}

/** charge.refunded — charges carry no subscription metadata. */
export async function handleChargeRefunded(charge: Obj) {
  const customerId = idOf(charge["customer"]);
  const invoiceRef = idOf(charge["invoice"]);

  let userId = await userIdForCustomer(customerId);
  if (!userId && invoiceRef) {
    try {
      const invoice = await stripeRequest<Obj>(`/invoices/${invoiceRef}`, undefined, "GET");
      const resolved = await resolveFromSubscription(
        idOf(invoice["subscription"]),
        idOf(invoice["customer"]),
      );
      userId = resolved?.userId ?? null;
    } catch (error) {
      console.error("[stripe] invoice fetch", invoiceRef, error);
    }
  }
  if (!userId) throw new Error("refund_unresolved");

  const amount = Number(charge["amount"] ?? 0) || 0;
  const refunded = Number(charge["amount_refunded"] ?? 0) || 0;
  await applyRefund({
    userId,
    // The payment row was written with the invoice id (renewals) or the
    // checkout session id (first purchase); try the invoice first.
    providerRef: invoiceRef ?? String(charge["payment_intent"] ?? charge["id"] ?? ""),
    amountRefundedCents: refunded,
    fullyRefunded: refunded >= amount && amount > 0,
  });
}