import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { stripeIsLive, stripeKey, stripeRequest } from "@/lib/billing/stripe.server";

import { FEATURED_AD_PRICE_CENTS, FEATURED_AD_RUN_DAYS } from "./types";

/**
 * Creates the payment step for one featured banner slot (€0.99).
 * With Stripe connected the buyer is redirected to a hosted Checkout page and
 * the ad is only published from the signed webhook. Without a key the manual
 * provider publishes it right away so the flow stays testable.
 */
export async function startFeaturedCheckout(args: {
  userId: string;
  adId: string;
  returnUrl: string;
}) {
  const { data: ad, error } = await supabaseAdmin
    .from("featured_ads")
    .select("id, user_id, status, headline, amount_cents, currency")
    .eq("id", args.adId)
    .single();
  if (error || !ad) throw new Error("ad_not_found");
  if (ad.user_id !== args.userId) throw new Error("forbidden");
  if (ad.status === "active") throw new Error("already_active");

  if (!stripeKey()) {
    await publishFeaturedAd(args.adId, "manual", `manual_ad_${Date.now()}`);
    return { status: "active" as const, testMode: true };
  }

  const session = await stripeRequest<{ id: string; url: string }>("/checkout/sessions", {
    mode: "payment",
    success_url: `${args.returnUrl}?ad=success`,
    cancel_url: `${args.returnUrl}?ad=canceled`,
    client_reference_id: args.userId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: (ad.currency ?? "EUR").toLowerCase(),
          unit_amount: ad.amount_cents ?? FEATURED_AD_PRICE_CENTS,
          product_data: {
            name: "SAKAN featured banner",
            description: ad.headline ?? "Rotating featured placement",
          },
        },
      },
    ],
    metadata: { kind: "featured_ad", ad_id: ad.id, user_id: args.userId },
  });

  await supabaseAdmin
    .from("featured_ads")
    .update({ provider: "stripe", provider_ref: session.id })
    .eq("id", ad.id);

  return { status: "redirect" as const, url: session.url, testMode: !stripeIsLive() };
}

/** Marks a paid ad as running for the next 30 days. */
export async function publishFeaturedAd(adId: string, provider: string, providerRef: string) {
  const now = new Date();
  const ends = new Date(now.getTime() + FEATURED_AD_RUN_DAYS * 24 * 60 * 60 * 1000);
  const { error } = await supabaseAdmin
    .from("featured_ads")
    .update({
      status: "active",
      provider,
      provider_ref: providerRef,
      paid_at: now.toISOString(),
      starts_at: now.toISOString(),
      ends_at: ends.toISOString(),
    })
    .eq("id", adId);
  if (error) throw new Error(error.message);
}

/** Moves finished campaigns out of the rotation. */
export async function sweepExpiredAds() {
  await supabaseAdmin
    .from("featured_ads")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("ends_at", new Date().toISOString());
}

export async function bumpAdMetric(adId: string, metric: "impressions" | "clicks") {
  const { data } = await supabaseAdmin
    .from("featured_ads")
    .select("impressions, clicks")
    .eq("id", adId)
    .maybeSingle();
  if (!data) return;
  const next = (data[metric] ?? 0) + 1;
  const patch =
    metric === "impressions" ? { impressions: next } : { clicks: next };
  await supabaseAdmin.from("featured_ads").update(patch).eq("id", adId);
}