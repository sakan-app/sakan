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
      const session = await stripeRequest<{ id: string; url: string }>(
        "/checkout/sessions",
        {
          mode: "subscription",
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
  };
}

export function getPaymentProvider(): PaymentProvider {
  return stripeProvider() ?? manualProvider;
}