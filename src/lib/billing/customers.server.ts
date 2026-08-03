/**
 * Stripe customer ↔ SAKAN member mapping.
 *
 * Every webhook that does not carry our own metadata (invoices, charges,
 * refunds) can still be resolved back to a member through this table, and the
 * billing portal needs a stable customer id per member.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { stripeRequest } from "./stripe.server";

export async function getCustomerId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("billing_customers")
    .select("customer_id")
    .eq("user_id", userId)
    .eq("provider", "stripe")
    .maybeSingle();
  return data?.customer_id ?? null;
}

/** Idempotently stores the mapping (safe under concurrent webhooks). */
export async function linkCustomer(userId: string, customerId: string): Promise<void> {
  if (!customerId.startsWith("cus_")) return;
  await supabaseAdmin
    .from("billing_customers")
    .upsert(
      { user_id: userId, provider: "stripe", customer_id: customerId },
      { onConflict: "user_id,provider" },
    );
}

/** Returns an existing Stripe customer for the member, creating one if needed. */
export async function ensureStripeCustomer(userId: string): Promise<string> {
  const existing = await getCustomerId(userId);
  if (existing) return existing;

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const customer = await stripeRequest<{ id: string }>("/customers", {
    email: authUser?.user?.email ?? undefined,
    name: profile?.display_name ?? undefined,
    metadata: { user_id: userId },
  });
  await linkCustomer(userId, customer.id);
  return customer.id;
}

/** Reverse lookup used by webhooks that only carry a Stripe customer id. */
export async function userIdForCustomer(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const { data } = await supabaseAdmin
    .from("billing_customers")
    .select("user_id")
    .eq("provider", "stripe")
    .eq("customer_id", customerId)
    .maybeSingle();
  if (data?.user_id) return data.user_id;

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("provider_customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return sub?.user_id ?? null;
}

/** Reverse lookup by Stripe subscription id (`sub_…`). */
export async function userIdForSubscriptionRef(ref: string | null): Promise<string | null> {
  if (!ref) return null;
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("provider_ref", ref)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.user_id ?? null;
}
