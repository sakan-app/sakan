/**
 * Commercial (non-member) header advertising.
 *
 * A commercial ad is only ever public once a real payment was confirmed:
 * `status = 'active'` + `paid_at` are written by the verified Stripe webhook
 * (or by an explicit staff action for offline/manual invoices). Expiry is
 * decided by the server/database timestamps, never by a browser timer.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { stripeIsLive, stripeKey, stripeRequest } from "@/lib/billing/stripe.server";

import { commercialAdRate, type CommercialAdDuration } from "./commercial";

const SELECT =
  "id, slot_key, advertiser_name, advertiser_email, headline, image_path, image_url, target_url, duration_key, amount_cents, currency, status, provider, provider_ref, paid_at, starts_at, ends_at, impressions, clicks, created_at";

type Row = {
  id: string;
  slot_key: string;
  advertiser_name: string;
  advertiser_email: string | null;
  headline: string | null;
  image_path: string | null;
  image_url: string | null;
  target_url: string | null;
  duration_key: string;
  amount_cents: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_ref: string | null;
  paid_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
};

export type CommercialAd = Omit<Row, "image_path" | "image_url"> & {
  image_path: string | null;
  image_url: string | null;
  /** Ready-to-render URL (signed when the creative lives in storage). */
  display_url: string | null;
};

async function withImageUrls(rows: Row[]): Promise<CommercialAd[]> {
  const paths = rows.map((r) => r.image_path).filter((p): p is string => Boolean(p));
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabaseAdmin.storage
      .from("featured")
      .createSignedUrls(paths, 60 * 60);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  return rows.map((r) => ({
    ...r,
    display_url: (r.image_path ? (urls.get(r.image_path) ?? null) : null) ?? r.image_url,
  }));
}

/** Moves finished commercial campaigns out of the rotation (server-side truth). */
export async function sweepExpiredCommercialAds() {
  await supabaseAdmin
    .from("commercial_ads")
    .update({ status: "expired" })
    .eq("status", "active")
    .not("ends_at", "is", null)
    .lt("ends_at", new Date().toISOString());
}

/** The single banner currently on air for a slot, or null. */
export async function activeCommercialAd(slotKey: string): Promise<CommercialAd | null> {
  await sweepExpiredCommercialAds();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("commercial_ads")
    .select(SELECT)
    .eq("slot_key", slotKey)
    .eq("status", "active")
    .not("paid_at", "is", null)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order("paid_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [ad] = await withImageUrls([data as Row]);
  return ad ?? null;
}

export async function listCommercialAds(): Promise<CommercialAd[]> {
  await sweepExpiredCommercialAds();
  const { data, error } = await supabaseAdmin
    .from("commercial_ads")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return withImageUrls((data ?? []) as Row[]);
}

export type CommercialAdInput = {
  id?: string | undefined;
  slotKey: string;
  advertiserName: string;
  advertiserEmail?: string | null | undefined;
  headline?: string | null | undefined;
  imagePath?: string | null | undefined;
  imageUrl?: string | null | undefined;
  targetUrl?: string | null | undefined;
  durationKey: CommercialAdDuration;
  startsAt?: string | null | undefined;
};

/** Creates or updates an advertisement draft. Never makes it public. */
export async function saveCommercialAd(input: CommercialAdInput, staffId: string) {
  const rate = commercialAdRate(input.durationKey);
  if (!rate) throw new Error("invalid_duration");

  const patch = {
    slot_key: input.slotKey,
    advertiser_name: input.advertiserName,
    advertiser_email: input.advertiserEmail ?? null,
    headline: input.headline ?? null,
    image_path: input.imagePath ?? null,
    image_url: input.imageUrl ?? null,
    target_url: input.targetUrl ?? null,
    duration_key: input.durationKey,
    amount_cents: rate.priceCents,
    currency: rate.currency,
    starts_at: input.startsAt ?? null,
  };

  if (input.id) {
    const { error } = await supabaseAdmin.from("commercial_ads").update(patch).eq("id", input.id);
    if (error) throw new Error(error.message);
    return { id: input.id };
  }

  const { data, error } = await supabaseAdmin
    .from("commercial_ads")
    .insert({ ...patch, status: "draft", created_by: staffId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
}

/** Pause / resume / stop an advertisement without deleting its history. */
export async function setCommercialAdStatus(adId: string, status: "active" | "paused" | "expired" | "rejected") {
  if (status === "active") {
    const { data } = await supabaseAdmin
      .from("commercial_ads")
      .select("paid_at")
      .eq("id", adId)
      .maybeSingle();
    // Never let a staff toggle bypass payment confirmation.
    if (!data?.paid_at) throw new Error("payment_not_confirmed");
  }
  const { error } = await supabaseAdmin.from("commercial_ads").update({ status }).eq("id", adId);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

/** Publishes a paid advertisement and derives its expiry from the paid period. */
export async function publishCommercialAd(adId: string, provider: string, providerRef: string) {
  const { data, error } = await supabaseAdmin
    .from("commercial_ads")
    .select("id, duration_key, starts_at")
    .eq("id", adId)
    .maybeSingle();
  if (error || !data) throw new Error("ad_not_found");
  const rate = commercialAdRate(data.duration_key as CommercialAdDuration);
  if (!rate) throw new Error("invalid_duration");

  const now = new Date();
  const configuredStart = data.starts_at ? new Date(data.starts_at) : null;
  const start = configuredStart && configuredStart.getTime() > now.getTime() ? configuredStart : now;
  const ends = new Date(start.getTime() + rate.days * 24 * 60 * 60 * 1000);

  const { error: upErr } = await supabaseAdmin
    .from("commercial_ads")
    .update({
      status: "active",
      provider,
      provider_ref: providerRef,
      paid_at: now.toISOString(),
      starts_at: start.toISOString(),
      ends_at: ends.toISOString(),
    })
    .eq("id", adId);
  if (upErr) throw new Error(upErr.message);
}

/**
 * Opens a Stripe Checkout session for a commercial advertisement.
 *
 * Opening checkout never activates the ad — only the verified
 * `checkout.session.completed` webhook does.
 */
export async function startCommercialCheckout(args: { adId: string; returnUrl: string }) {
  const { data: ad, error } = await supabaseAdmin
    .from("commercial_ads")
    .select("id, advertiser_name, headline, duration_key, amount_cents, currency, status")
    .eq("id", args.adId)
    .maybeSingle();
  if (error || !ad) throw new Error("ad_not_found");
  if (ad.status === "active") throw new Error("already_active");

  if (!stripeKey()) {
    await supabaseAdmin
      .from("commercial_ads")
      .update({ status: "pending_payment" })
      .eq("id", ad.id);
    return { status: "unavailable" as const, reason: "stripe_not_configured" as const };
  }

  try {
    const session = await stripeRequest<{ id: string; url: string }>("/checkout/sessions", {
      mode: "payment",
      success_url: `${args.returnUrl}?ad=success`,
      cancel_url: `${args.returnUrl}?ad=canceled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (ad.currency ?? "EUR").toLowerCase(),
            unit_amount: ad.amount_cents,
            product_data: {
              name: `SAKAN header advertisement (${ad.duration_key})`,
              description: ad.headline ?? ad.advertiser_name,
            },
          },
        },
      ],
      metadata: { kind: "commercial_ad", ad_id: ad.id },
    });

    await supabaseAdmin
      .from("commercial_ads")
      .update({ status: "pending_payment", provider: "stripe", provider_ref: session.id })
      .eq("id", ad.id);

    return { status: "redirect" as const, url: session.url, testMode: !stripeIsLive() };
  } catch (err) {
    if (err instanceof Error && err.message === "stripe_not_configured") {
      return { status: "unavailable" as const, reason: "stripe_not_configured" as const };
    }
    throw err;
  }
}

export async function bumpCommercialMetric(adId: string, metric: "impressions" | "clicks") {
  const { data } = await supabaseAdmin
    .from("commercial_ads")
    .select("impressions, clicks")
    .eq("id", adId)
    .maybeSingle();
  if (!data) return;
  const next = (data[metric] ?? 0) + 1;
  await supabaseAdmin
    .from("commercial_ads")
    .update(metric === "impressions" ? { impressions: next } : { clicks: next })
    .eq("id", adId);
}
