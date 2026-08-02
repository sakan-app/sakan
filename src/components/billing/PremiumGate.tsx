import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import type { ReactNode } from "react";

import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureStrings } from "@/i18n/feature";
import { billingStrings } from "@/lib/billing/strings";
import type { Entitlements } from "@/lib/billing/types";

type Props = {
  /** Entitlement flag that must be true, e.g. "advanced_filters". */
  require: keyof Pick<
    Entitlements,
    | "advanced_filters"
    | "see_who_liked"
    | "ai_matching"
    | "ai_translation"
    | "incognito"
    | "priority_support"
  >;
  children: ReactNode;
  /** Render nothing instead of the upsell card. */
  silent?: boolean;
};

export function PremiumGate({ require: flag, children, silent = false }: Props) {
  const { entitlements, isLoading } = useSubscription();
  const s = useFeatureStrings(billingStrings);

  if (isLoading) return null;
  if (entitlements[flag]) return <>{children}</>;
  if (silent) return null;

  return (
    <div className="rounded-xl border border-gold/40 bg-white/70 p-6 text-center shadow-[var(--shadow-card)]">
      <Crown className="mx-auto h-6 w-6 text-gold-deep" aria-hidden="true" />
      <h3 className="mt-2 text-base font-bold text-navy">{s.premiumOnly}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{s.premiumOnlyText}</p>
      <Link to="/pricing" className="btn-gold mt-4 inline-flex px-5 py-2 text-sm">
        {s.seePlans}
      </Link>
    </div>
  );
}