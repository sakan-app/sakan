/**
 * Commercial (non-member) advertising configuration.
 *
 * Durations and prices are data, not UI literals, so the admin surface, the
 * future AI advertiser flow and any Stripe checkout all read the same source.
 */
export type CommercialAdDuration = "daily" | "weekly" | "monthly";

export type CommercialAdRate = {
  key: CommercialAdDuration;
  days: number;
  priceCents: number;
  currency: "EUR";
  /** Stripe Price ID env var; unset until real credentials are provided. */
  stripePriceEnv: string;
};

export const COMMERCIAL_AD_RATES: CommercialAdRate[] = [
  { key: "daily", days: 1, priceCents: 499, currency: "EUR", stripePriceEnv: "STRIPE_PRICE_AD_DAILY" },
  { key: "weekly", days: 7, priceCents: 1999, currency: "EUR", stripePriceEnv: "STRIPE_PRICE_AD_WEEKLY" },
  { key: "monthly", days: 30, priceCents: 5999, currency: "EUR", stripePriceEnv: "STRIPE_PRICE_AD_MONTHLY" },
];

/** Reference size of the commercial header banner. */
export const HEADER_BANNER_SLOT = "header_banner";
export const HEADER_BANNER_WIDTH = 728;
export const HEADER_BANNER_HEIGHT = 90;

export function commercialAdRate(key: CommercialAdDuration): CommercialAdRate | undefined {
  return COMMERCIAL_AD_RATES.find((r) => r.key === key);
}