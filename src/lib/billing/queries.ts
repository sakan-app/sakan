import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import {
  cancelSubscription,
  createCheckout,
  resumeSubscription,
} from "./billing.functions";
import {
  FREE_LIMITS,
  entitlementsFor,
  type BillingEvent,
  type Entitlements,
  type Invoice,
  type Plan,
  type PlanCode,
  type PlanLimits,
  type Subscription,
} from "./types";

export const billingKeys = {
  plans: ["billing", "plans"] as const,
  subscription: (userId: string) => ["billing", "subscription", userId] as const,
  invoices: (userId: string) => ["billing", "invoices", userId] as const,
  events: (userId: string) => ["billing", "events", userId] as const,
};

type LocalizedText = Record<string, string>;

function asLocalized(value: unknown): Record<"ar" | "en" | "de" | "ru", string> {
  const v = (value ?? {}) as LocalizedText;
  return { ar: v.ar ?? "", en: v.en ?? "", de: v.de ?? "", ru: v.ru ?? "" };
}

function asLocalizedList(value: unknown): Record<"ar" | "en" | "de" | "ru", string[]> {
  const v = (value ?? {}) as Record<string, string[]>;
  return { ar: v.ar ?? [], en: v.en ?? [], de: v.de ?? [], ru: v.ru ?? [] };
}

export const plansQuery = () =>
  queryOptions({
    queryKey: billingKeys.plans,
    queryFn: async (): Promise<Plan[]> => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_public", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        code: row.code as PlanCode,
        tier: row.tier,
        currency: row.currency,
        priceMonthlyCents: row.price_monthly_cents,
        priceAnnualCents: row.price_annual_cents,
        name: asLocalized(row.name),
        tagline: asLocalized(row.tagline),
        features: asLocalizedList(row.features),
        limits: { ...FREE_LIMITS, ...((row.limits ?? {}) as Partial<PlanLimits>) },
        sortOrder: row.sort_order,
      }));
    },
    staleTime: 10 * 60_000,
  });

export const mySubscriptionQuery = (userId: string) =>
  queryOptions({
    queryKey: billingKeys.subscription(userId),
    queryFn: async (): Promise<Subscription | null> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["trialing", "active", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const graceOrEnd = data.grace_until ?? data.current_period_end;
      if (data.status === "past_due" && graceOrEnd && new Date(graceOrEnd) < new Date()) {
        return null;
      }
      return {
        id: data.id,
        planCode: data.plan_code as PlanCode,
        status: data.status,
        billingInterval: data.billing_interval,
        provider: data.provider,
        currentPeriodStart: data.current_period_start,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        canceledAt: data.canceled_at,
        graceUntil: data.grace_until,
        trialEnd: data.trial_end,
        previousPlanCode: data.previous_plan_code,
      };
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

export const invoicesQuery = (userId: string) =>
  queryOptions({
    queryKey: billingKeys.invoices(userId),
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await supabase
        .from("payments")
        .select(
          "id, invoice_number, amount_cents, currency, status, description, period_start, period_end, paid_at, failure_reason, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        invoiceNumber: r.invoice_number,
        amountCents: r.amount_cents,
        currency: r.currency,
        status: r.status,
        description: r.description,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        paidAt: r.paid_at,
        failureReason: r.failure_reason,
        createdAt: r.created_at,
      }));
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

export const billingHistoryQuery = (userId: string) =>
  queryOptions({
    queryKey: billingKeys.events(userId),
    queryFn: async (): Promise<BillingEvent[]> => {
      const { data, error } = await supabase
        .from("billing_events")
        .select("id, type, plan_code, from_plan_code, amount_cents, currency, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        type: r.type,
        planCode: r.plan_code,
        fromPlanCode: r.from_plan_code,
        amountCents: r.amount_cents,
        currency: r.currency,
        createdAt: r.created_at,
      }));
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

export function resolveEntitlements(
  plans: Plan[] | undefined,
  subscription: Subscription | null | undefined,
): Entitlements {
  const code = (subscription?.planCode ?? "free") as PlanCode;
  const plan = plans?.find((p) => p.code === code);
  return entitlementsFor(code, plan?.tier ?? 0, plan?.limits ?? FREE_LIMITS);
}

function useInvalidateBilling(userId: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: billingKeys.subscription(userId) });
    void qc.invalidateQueries({ queryKey: billingKeys.invoices(userId) });
    void qc.invalidateQueries({ queryKey: billingKeys.events(userId) });
  };
}

export function useStartCheckout(userId: string) {
  const invalidate = useInvalidateBilling(userId);
  return useMutation({
    mutationFn: (vars: { planCode: "premium" | "premium_plus"; interval: "monthly" | "annual" }) =>
      createCheckout({
        data: {
          ...vars,
          returnUrl: `${window.location.origin}/billing`,
        },
      }),
    onSuccess: (result) => {
      if (result.status === "redirect" && "url" in result) {
        window.location.href = result.url;
        return;
      }
      invalidate();
    },
  });
}

export function useCancelSubscription(userId: string) {
  const invalidate = useInvalidateBilling(userId);
  return useMutation({
    mutationFn: () => cancelSubscription({ data: undefined }),
    onSuccess: invalidate,
  });
}

export function useResumeSubscription(userId: string) {
  const invalidate = useInvalidateBilling(userId);
  return useMutation({
    mutationFn: () => resumeSubscription({ data: undefined }),
    onSuccess: invalidate,
  });
}