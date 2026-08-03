import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { stripeIsLive, stripeKey, stripeRequest } from "@/lib/billing/stripe.server";

import {
  FEATURED_AD_LOOPS,
  FEATURED_AD_PRICE_CENTS,
  FEATURED_AD_RUN_DAYS,
  featuredRuntimeMs,
} from "./types";

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

type QueueRow = {
  id: string;
  user_id: string;
  image_path: string;
  headline: string | null;
  subtitle: string | null;
  target_url: string | null;
  status: string;
  amount_cents: number;
  currency: string;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
  review_note: string | null;
  created_at: string;
  queue_position: number | null;
  display_started_at: string | null;
  paused_at: string | null;
  loops_total: number | null;
  extra_loops: number | null;
};

const QUEUE_SELECT =
  "id, user_id, image_path, headline, subtitle, target_url, status, amount_cents, currency, starts_at, ends_at, impressions, clicks, review_note, created_at, queue_position, display_started_at, paused_at, loops_total, extra_loops";

/**
 * Advances the paid rotation queue.
 *
 * Only one creative is on air at a time. It runs `loops_total` travels of
 * 60 seconds each; once that airtime is spent it retires and the next paid
 * creative (lowest queue position) starts. Timing is derived from
 * `display_started_at`, so every visitor sees the same creative at the same
 * point of its travel without any client-side state.
 */
export async function advanceFeaturedQueue(): Promise<QueueRow[]> {
  await sweepExpiredAds();

  const { data, error } = await supabaseAdmin
    .from("featured_ads")
    .select(QUEUE_SELECT)
    .eq("status", "active")
    .order("queue_position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);

  let rows = (data ?? []) as QueueRow[];
  const now = Date.now();

  // Retire creatives that have spent all of their airtime.
  const finished = rows.filter((r) => {
    if (!r.display_started_at) return false;
    const total = featuredRuntimeMs((r.loops_total ?? FEATURED_AD_LOOPS) + (r.extra_loops ?? 0));
    return now - new Date(r.display_started_at).getTime() >= total;
  });
  if (finished.length > 0) {
    await supabaseAdmin
      .from("featured_ads")
      .update({ status: "expired" })
      .in(
        "id",
        finished.map((r) => r.id),
      );
    const done = new Set(finished.map((r) => r.id));
    rows = rows.filter((r) => !done.has(r.id));
  }

  // Give every newly paid creative a stable place in line.
  const unqueued = rows.filter((r) => r.queue_position === null);
  if (unqueued.length > 0) {
    const { data: last } = await supabaseAdmin
      .from("featured_ads")
      .select("queue_position")
      .not("queue_position", "is", null)
      .order("queue_position", { ascending: false })
      .limit(1)
      .maybeSingle();
    let next = (last?.queue_position ?? 0) + 1;
    for (const row of unqueued) {
      await supabaseAdmin
        .from("featured_ads")
        .update({ queue_position: next })
        .eq("id", row.id);
      row.queue_position = next;
      next += 1;
    }
    rows.sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));
  }

  // Put the first waiting creative on air when the strip is free.
  const onAir = rows.find((r) => r.display_started_at !== null);
  if (!onAir && rows.length > 0) {
    const head = rows[0]!;
    const startedAt = new Date(now).toISOString();
    await supabaseAdmin
      .from("featured_ads")
      .update({ display_started_at: startedAt })
      .eq("id", head.id);
    head.display_started_at = startedAt;
  }

  return rows;
}

/** The rotation queue with signed image URLs and live timing for the strip. */
export async function listFeaturedQueue() {
  const rows = await advanceFeaturedQueue();
  if (rows.length === 0) return [];

  const { data: signed } = await supabaseAdmin.storage
    .from("featured")
    .createSignedUrls(
      rows.map((r) => r.image_path),
      60 * 60,
    );
  const urls = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));
  const now = Date.now();

  return rows.map((r) => {
    const loopsTotal = (r.loops_total ?? FEATURED_AD_LOOPS) + (r.extra_loops ?? 0);
    const total = featuredRuntimeMs(loopsTotal);
    const elapsed = r.display_started_at
      ? Math.max(0, now - new Date(r.display_started_at).getTime())
      : 0;
    return {
      id: r.id,
      userId: r.user_id,
      imagePath: r.image_path,
      imageUrl: urls.get(r.image_path) ?? null,
      headline: r.headline,
      subtitle: r.subtitle,
      targetUrl: r.target_url,
      status: r.status as "active",
      amountCents: r.amount_cents,
      currency: r.currency,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      impressions: r.impressions,
      clicks: r.clicks,
      reviewNote: r.review_note,
      createdAt: r.created_at,
      queuePosition: r.queue_position ?? 0,
      loopsTotal,
      displayStartedAt: r.display_started_at,
      pausedAt: r.paused_at,
      loopsDone: r.display_started_at ? Math.min(loopsTotal, Math.floor(elapsed / 60_000)) : 0,
      remainingMs: r.display_started_at ? Math.max(0, total - elapsed) : total,
      isCurrent: r.display_started_at !== null,
    };
  });
}