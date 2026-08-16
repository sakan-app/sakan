/**
 * Stripe Price ID wiring.
 *
 * No IDs are hardcoded: each paid plan/interval reads its Price ID from a
 * server-side environment variable. Until the client supplies real Stripe
 * credentials these resolve to `null` and checkout falls back to the existing
 * manual/test provider. The free plan never goes through Stripe.
 */
import type { BillingInterval, PlanCode } from "./types";

export const STRIPE_PRICE_ENV: Record<
  Exclude<PlanCode, "free">,
  Record<BillingInterval, string>
> = {
  premium: {
    monthly: "STRIPE_PRICE_PREMIUM_MONTHLY", // €9.99 / month
    annual: "STRIPE_PRICE_PREMIUM_ANNUAL", // €49.99 / year
  },
  premium_plus: {
    monthly: "STRIPE_PRICE_PREMIUM_PLUS_MONTHLY", // €19.99 / month
    annual: "STRIPE_PRICE_PREMIUM_PLUS_ANNUAL", // €99.99 / year
  },
};

/** Reads the configured Stripe Price ID, or null when not configured yet. */
export function stripePriceId(planCode: PlanCode, interval: BillingInterval): string | null {
  if (planCode === "free") return null;
  const key = STRIPE_PRICE_ENV[planCode]?.[interval];
  if (!key) return null;
  const value = process.env[key];
  return value && value.startsWith("price_") ? value : null;
}