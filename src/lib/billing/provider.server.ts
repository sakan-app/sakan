/**
 * Payment provider adapter.
 *
 * The whole subscription layer (plans, entitlements, upgrades, invoices,
 * grace periods) is provider-agnostic. Swapping in a real PSP means adding
 * one adapter below and returning it from `getPaymentProvider()` — nothing
 * else in the app changes.
 */

import { stripeIsLive, stripeKey, stripeRequest } from "./stripe.server";

export type CheckoutRequest = {
  userId: string;
  planCode: string;
  interval: "monthly" | "annual";
  amountCents: number;
  currency: string;
  description: string;
  returnUrl: string;
};

export type CheckoutResult =
  /** Provider needs the buyer on a hosted page first. */
  | { kind: "redirect"; url: string; providerRef: string }
  /** No external step — the server may activate the subscription right away. */
  | { kind: "activate"; providerRef: string };

export type PaymentProvider = {
  id: string;
  /** True when money actually moves (affects the "test mode" banner in the UI). */
  live: boolean;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
  cancel(providerRef: string | null): Promise<void>;
  /** Turns auto-renew back on at the provider. */
  resume(providerRef: string | null): Promise<void>;
  /** Hosted self-service portal, when the provider offers one. */
  portal(userId: string, returnUrl: string): Promise<string | null>;
};

/**
 * Manual provider — the default while no PSP is connected.
 * Records the intent and activates immediately so the full subscription
 * lifecycle (entitlements, invoices, renewals, cancellation) is exercisable
 * end to end.
 */
const manualProvider: PaymentProvider = {
  id: "manual",
  live: false,
  async createCheckout(req) {
    return { kind: "activate", providerRef: `manual_${req.planCode}_${Date.now()}` };
  },
  async cancel() {
    /* nothing to do */
  },
  async resume() {
    /* nothing to do */
  },
  async portal() {
    return null;
  },
};

/**
 * Stripe adapter — creates a hosted Checkout Session in subscription mode.
 * The purchase is only written to the database once the signed
 * `checkout.session.completed` webhook arrives.
 */
function stripeProvider(): PaymentProvider | null {
  if (!stripeKey()) return null;
  return {
    id: "stripe",
    live: stripeIsLive(),
    async createCheckout(req) {
      const { ensureStripeCustomer } = await import("./customers.server");
      const customer = await ensureStripeCustomer(req.userId);
      const session = await stripeRequest<{ id: string; url: string }>(
        "/checkout/sessions",
        {
          mode: "subscription",
          customer,
          customer_update: { address: "auto", name: "auto" },
          success_url: `${req.returnUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.returnUrl}?checkout=canceled`,
          client_reference_id: req.userId,
          allow_promotion_codes: true,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: req.currency.toLowerCase(),
                unit_amount: req.amountCents,
                recurring: { interval: req.interval === "annual" ? "year" : "month" },
                product_data: { name: `SAKAN ${req.description}` },
              },
            },
          ],
          metadata: {
            kind: "subscription",
            user_id: req.userId,
            plan_code: req.planCode,
            interval: req.interval,
          },
          subscription_data: {
            metadata: {
              kind: "subscription",
              user_id: req.userId,
              plan_code: req.planCode,
              interval: req.interval,
            },
          },
        },
      );
      return { kind: "redirect", url: session.url, providerRef: session.id };
    },
    async cancel(providerRef) {
      if (!providerRef || !providerRef.startsWith("sub_")) return;
      await stripeRequest(`/subscriptions/${providerRef}`, {
        cancel_at_period_end: true,
      });
    },
    async resume(providerRef) {
      if (!providerRef || !providerRef.startsWith("sub_")) return;
      const sub = await stripeRequest<{ status: string }>(
        `/subscriptions/${providerRef}`,
        undefined,
        "GET",
      );
      // A subscription Stripe already ended cannot be resumed — the caller
      // must start a new checkout instead.
      if (sub.status === "canceled" || sub.status === "incomplete_expired") {
        throw new Error("subscription_already_ended");
      }
      await stripeRequest(`/subscriptions/${providerRef}`, { cancel_at_period_end: false });
    },
    async portal(userId, returnUrl) {
      const { ensureStripeCustomer } = await import("./customers.server");
      const customer = await ensureStripeCustomer(userId);
      const session = await stripeRequest<{ url: string }>("/billing_portal/sessions", {
        customer,
        return_url: returnUrl,
      });
      return session.url;
    },
  };
}

export function getPaymentProvider(): PaymentProvider {
  return stripeProvider() ?? manualProvider;
}