import type { Locale } from "@/i18n";

export type PlanCode = "free" | "premium" | "premium_plus";
export type BillingInterval = "monthly" | "annual";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";

/** Numeric limits use -1 for "unlimited". */
export type PlanLimits = {
  likes_per_day: number;
  conversations: number;
  advanced_filters: boolean;
  see_who_liked: boolean;
  ai_matching: boolean;
  ai_translation: boolean;
  boost_per_month: number;
  incognito: boolean;
  priority_support: boolean;
  featured_banner?: boolean;
  voice_calls?: boolean;
  video_calls?: boolean;
  priority_search?: boolean;
  priority_matching?: boolean;
  premium_badge?: boolean;
  exclusive_features?: boolean;
};

export const FREE_LIMITS: PlanLimits = {
  likes_per_day: -1,
  conversations: -1,
  advanced_filters: false,
  see_who_liked: false,
  ai_matching: false,
  ai_translation: false,
  boost_per_month: 0,
  incognito: false,
  priority_support: false,
  featured_banner: false,
  voice_calls: false,
  video_calls: false,
  priority_search: false,
  priority_matching: false,
  premium_badge: false,
  exclusive_features: false,
};

export type Plan = {
  code: PlanCode;
  tier: number;
  currency: string;
  priceMonthlyCents: number;
  priceAnnualCents: number;
  name: Record<Locale, string>;
  tagline: Record<Locale, string>;
  features: Record<Locale, string[]>;
  limits: PlanLimits;
  sortOrder: number;
};

export type Subscription = {
  id: string;
  planCode: PlanCode;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  provider: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  graceUntil: string | null;
  trialEnd: string | null;
  previousPlanCode: string | null;
};

export type Invoice = {
  id: string;
  invoiceNumber: string | null;
  amountCents: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  description: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  failureReason: string | null;
  createdAt: string;
};

export type BillingEvent = {
  id: string;
  type: string;
  planCode: string | null;
  fromPlanCode: string | null;
  amountCents: number | null;
  currency: string;
  createdAt: string;
};

export type Entitlements = PlanLimits & {
  planCode: PlanCode;
  tier: number;
  isPremium: boolean;
  isPremiumPlus: boolean;
};

export function entitlementsFor(planCode: PlanCode, tier: number, limits: PlanLimits): Entitlements {
  return {
    ...limits,
    planCode,
    tier,
    isPremium: tier >= 1,
    isPremiumPlus: tier >= 2,
  };
}

export const FREE_ENTITLEMENTS: Entitlements = entitlementsFor("free", 0, FREE_LIMITS);

export function formatPrice(cents: number, currency: string, locale: Locale): string {
  const tag = locale === "ar" ? "ar-EG" : locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}