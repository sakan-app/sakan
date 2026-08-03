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
/** Each creative travels across the banner once every sixty seconds. */
export const FEATURED_AD_TRAVEL_MS = 60 * 1000;
/** A creative repeats its travel five times, then leaves the strip. */
export const FEATURED_AD_LOOPS = 5;
/** A purchased slot runs for 30 days. */
export const FEATURED_AD_RUN_DAYS = 30;

/** One entry of the paid rotation queue, enriched with live timing. */
export type FeaturedQueueEntry = FeaturedAd & {
  queuePosition: number;
  loopsTotal: number;
  /** When the creative entered the strip; null while still waiting. */
  displayStartedAt: string | null;
  pausedAt: string | null;
  /** Loops already completed (0 … loopsTotal). */
  loopsDone: number;
  /** Milliseconds left before the creative leaves the strip. */
  remainingMs: number;
  isCurrent: boolean;
};

/** Total airtime of one creative, in milliseconds. */
export function featuredRuntimeMs(loopsTotal: number) {
  return Math.max(1, loopsTotal) * FEATURED_AD_TRAVEL_MS;
}