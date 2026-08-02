export type FeaturedAdStatus =
  | "pending_payment"
  | "pending_review"
  | "active"
  | "expired"
  | "rejected";

export type FeaturedAd = {
  id: string;
  imagePath: string;
  imageUrl: string | null;
  headline: string | null;
  subtitle: string | null;
  targetUrl: string | null;
  status: FeaturedAdStatus;
  amountCents: number;
  currency: string;
  startsAt: string | null;
  endsAt: string | null;
  impressions: number;
  clicks: number;
  reviewNote: string | null;
  createdAt: string;
};

export type AdPlacement = {
  slotKey: string;
  label: string;
  enabled: boolean;
  network: string | null;
  unitId: string | null;
  minHeight: number;
};

/** Price of one featured banner slot: €0.99. */
export const FEATURED_AD_PRICE_CENTS = 99;
export const FEATURED_AD_CURRENCY = "EUR";
/** Each creative travels across the banner over three minutes. */
export const FEATURED_AD_TRAVEL_MS = 3 * 60 * 1000;
/** A purchased slot runs for 30 days. */
export const FEATURED_AD_RUN_DAYS = 30;