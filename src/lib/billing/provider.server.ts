/**
 * Payment provider adapter.
 *
 * The whole subscription layer (plans, entitlements, upgrades, invoices,
 * grace periods) is provider-agnostic. Swapping in a real PSP means adding
 * one adapter below and returning it from `getPaymentProvider()` — nothing
 * else in the app changes.
 */

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
 * Stripe slot. Add the adapter here when a Stripe key is available:
 * create a Checkout Session, return { kind: "redirect", url, providerRef },
 * and confirm it from the webhook route with `activateSubscription()`.
 */
function stripeProvider(): PaymentProvider | null {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return null;
  return null;
}

export function getPaymentProvider(): PaymentProvider {
  return stripeProvider() ?? manualProvider;
}