import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { mySubscriptionQuery, plansQuery, resolveEntitlements } from "@/lib/billing/queries";
import { FREE_ENTITLEMENTS, type Entitlements, type Plan, type Subscription } from "@/lib/billing/types";

export type SubscriptionState = {
  plans: Plan[];
  plan: Plan | undefined;
  subscription: Subscription | null;
  entitlements: Entitlements;
  isLoading: boolean;
};

/** Single source of truth for "what is this member allowed to do". */
export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const plansQ = useQuery(plansQuery());
  const subQ = useQuery(mySubscriptionQuery(userId));

  const subscription = subQ.data ?? null;
  const entitlements = userId
    ? resolveEntitlements(plansQ.data, subscription)
    : FREE_ENTITLEMENTS;

  return {
    plans: plansQ.data ?? [],
    plan: plansQ.data?.find((p) => p.code === entitlements.planCode),
    subscription,
    entitlements,
    isLoading: plansQ.isPending || (Boolean(userId) && subQ.isPending),
  };
}