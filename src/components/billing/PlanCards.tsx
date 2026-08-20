import { Link } from "@tanstack/react-router";
import { Check, Crown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureStrings } from "@/i18n/feature";
import { useI18n } from "@/lib/i18n";
import { useStartCheckout } from "@/lib/billing/queries";
import { billingStrings } from "@/lib/billing/strings";
import { planDisplayName } from "@/lib/billing/plan-display";
import { formatPrice, type BillingInterval } from "@/lib/billing/types";

export function PlanCards() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const s = useFeatureStrings(billingStrings);
  const { plans, entitlements, subscription, isLoading } = useSubscription();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const checkout = useStartCheckout(user?.id ?? "");
  const [pending, setPending] = useState<string | null>(null);

  const onChoose = (code: "premium" | "premium_plus") => {
    setPending(code);
    checkout.mutate(
      { planCode: code, interval },
      {
        onSuccess: (result) => {
          if (result.status === "active") toast.success(s.statuses["active"] ?? "Active");
        },
        onError: () => toast.error(s.error),
        onSettled: () => setPending(null),
      },
    );
  };

  return (
    <div>
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-gold/40 bg-white p-1">
        {(["monthly", "annual"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setInterval(value)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              interval === value ? "bg-navy text-cream" : "text-navy/70 hover:text-navy"
            }`}
          >
            {value === "monthly" ? s.monthly : s.annual}
          </button>
        ))}
      </div>
      {interval === "annual" ? (
        <p className="mt-2 text-center text-xs font-bold text-gold-deep">{s.annualHint}</p>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const price =
              interval === "annual" ? plan.priceAnnualCents : plan.priceMonthlyCents;
            const isCurrent = entitlements.planCode === plan.code;
            const isFree = plan.tier === 0;
            const isBusy = pending === plan.code;
            const label =
              isCurrent && !isFree
                ? s.renew
                : plan.tier > entitlements.tier
                  ? s.upgrade
                  : plan.tier < entitlements.tier
                    ? s.downgrade
                    : s.choosePlan;

            return (
              <div
                key={plan.code}
                className={`relative flex flex-col rounded-2xl border p-7 shadow-[var(--shadow-card)] ${
                  plan.tier === 1
                    ? "border-gold bg-navy text-cream"
                    : "border-gold/30 bg-white text-navy"
                }`}
              >
                {plan.tier === 1 ? (
                  <span className="absolute -top-3 start-7 rounded-full bg-gold px-3 py-1 text-[11px] font-black text-navy">
                    {s.mostPopular}
                  </span>
                ) : null}
                {isCurrent ? (
                  <span className="absolute -top-3 end-7 rounded-full border border-gold bg-cream px-3 py-1 text-[11px] font-black text-navy">
                    {s.currentPlan}
                  </span>
                ) : null}

                <div className="flex items-center gap-2">
                  {plan.tier > 0 ? <Crown className="h-5 w-5 text-gold" aria-hidden="true" /> : null}
                  <h2 className="text-xl font-black">
                    {planDisplayName(plan.code, interval, locale, plan.name[locale])}
                  </h2>
                </div>
                <p className={`mt-1 text-sm ${plan.tier === 1 ? "text-cream/70" : "text-muted-foreground"}`}>
                  {plan.tagline[locale]}
                </p>

                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-black">
                    {price === 0 ? s.free : formatPrice(price, plan.currency, locale)}
                  </span>
                  {price > 0 ? (
                    <span className={`text-sm ${plan.tier === 1 ? "text-cream/70" : "text-muted-foreground"}`}>
                      {interval === "annual" ? s.perYear : s.perMonth}
                    </span>
                  ) : null}
                </p>

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {plan.features[locale].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  {isFree ? (
                    <span
                      className={`block rounded-lg border border-gold/40 px-5 py-3 text-center text-sm font-bold ${
                        plan.tier === 1 ? "text-cream" : "text-navy"
                      }`}
                    >
                      {isCurrent ? s.currentPlan : s.free}
                    </span>
                  ) : !user ? (
                    <Link to="/auth" className="btn-gold block w-full px-5 py-3 text-center text-sm">
                      {s.signInToSubscribe}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onChoose(plan.code as "premium" | "premium_plus")}
                      disabled={isBusy}
                      className="btn-gold flex w-full items-center justify-center gap-2 px-5 py-3 text-sm disabled:opacity-60"
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {isBusy ? s.processing : label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {user && subscription ? (
        <p className="mt-6 text-center text-sm">
          <Link to="/billing" className="font-bold text-gold-deep underline-offset-4 hover:underline">
            {s.billingTitle}
          </Link>
        </p>
      ) : null}

      <p className="mt-8 text-center text-xs text-muted-foreground">{s.testMode}</p>
    </div>
  );
}