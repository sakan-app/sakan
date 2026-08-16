import type { Locale } from "@/i18n";
import type { BillingInterval, PlanCode } from "./types";

/**
 * Commercial plan names approved by the client.
 *
 * The same database plan row is marketed under a different name depending on
 * the billing period, so the label lives here instead of in the `plans` table.
 */
export const PLAN_DISPLAY_NAMES: Record<
  PlanCode,
  Record<BillingInterval, Record<Locale, string>>
> = {
  free: {
    monthly: { ar: "المجانية", en: "Free", de: "Kostenlos", fr: "Gratuit" },
    annual: { ar: "المجانية", en: "Free", de: "Kostenlos", fr: "Gratuit" },
  },
  premium: {
    monthly: { ar: "الفضية", en: "Silver", de: "Silber", fr: "Argent" },
    annual: { ar: "البرونزية", en: "Bronze", de: "Bronze", fr: "Bronze" },
  },
  premium_plus: {
    monthly: { ar: "الذهبية", en: "Gold", de: "Gold", fr: "Or" },
    annual: { ar: "الذهبية بلس", en: "Gold Plus", de: "Gold Plus", fr: "Or Plus" },
  },
};

export function planDisplayName(
  code: PlanCode,
  interval: BillingInterval,
  locale: Locale,
  fallback: string,
): string {
  return PLAN_DISPLAY_NAMES[code]?.[interval]?.[locale] ?? fallback;
}