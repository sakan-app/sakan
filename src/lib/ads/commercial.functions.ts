/**
 * Commercial (non-member) advertising RPC surface.
 *
 * Authorization rules enforced here:
 *  - every management call re-verifies staff server-side (`assertStaff`);
 *  - the public reader returns display-only columns and never the advertiser
 *    email, payment references or business metrics;
 *  - an advertisement can only become public when `paid_at` is set, which is
 *    written by the verified Stripe webhook or by an explicit staff action for
 *    an offline invoice.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";

const durationSchema = z.enum(["daily", "weekly", "monthly"]);

const adInput = z.object({
  id: z.string().uuid().optional(),
  slotKey: z.string().min(2).max(60),
  advertiserName: z.string().min(2).max(120),
  advertiserEmail: z.string().email().max(200).nullish(),
  headline: z.string().max(160).nullish(),
  imagePath: z.string().max(400).nullish(),
  imageUrl: z.string().url().max(600).nullish(),
  targetUrl: z.string().url().max(600).nullish(),
  durationKey: durationSchema,
  startsAt: z.string().datetime().nullish(),
});

/** Staff: full advertisement list, including advertiser contact + metrics. */
export const listCommercialAdsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("@/lib/admin/admin.server");
    await assertStaff(context.supabase, context.userId);
    const { listCommercialAds } = await import("./commercial.server");
    return listCommercialAds();
  });

/** Staff: create or update a draft. Never makes an advertisement public. */
export const saveCommercialAdAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(adInput)
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/admin/admin.server");
    await assertStaff(context.supabase, context.userId);
    const { saveCommercialAd } = await import("./commercial.server");
    return saveCommercialAd(
      {
        ...(data.id ? { id: data.id } : {}),
        slotKey: data.slotKey,
        advertiserName: data.advertiserName,
        advertiserEmail: data.advertiserEmail ?? null,
        headline: data.headline ?? null,
        imagePath: data.imagePath ?? null,
        imageUrl: data.imageUrl ?? null,
        targetUrl: data.targetUrl ?? null,
        durationKey: data.durationKey,
        startsAt: data.startsAt ?? null,
      },
      context.userId,
    );
  });

/**
 * Staff: activate / pause / stop an advertisement.
 *
 * `activate` is refused unless the payment was already confirmed, so a staff
 * toggle can never publish an unpaid banner.
 */
export const setCommercialAdStatusAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      adId: z.string().uuid(),
      status: z.enum(["active", "paused", "expired", "rejected"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/admin/admin.server");
    await assertStaff(context.supabase, context.userId);
    const { setCommercialAdStatus } = await import("./commercial.server");
    const result = await setCommercialAdStatus(data.adId, data.status);
    const { logAdminAction } = await import("@/lib/admin/ops.server");
    await logAdminAction({
      adminId: context.userId,
      action: `commercial_ad.${data.status}`,
      targetTable: "commercial_ads",
      targetId: data.adId,
      details: { status: data.status },
    });
    return result;
  });

/**
 * Staff: record an offline / bank-transfer payment and publish.
 *
 * Reserved for invoices settled outside Stripe; the action is written to the
 * admin action log with the staff account that confirmed it.
 */
export const confirmCommercialAdOfflinePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ adId: z.string().uuid(), reference: z.string().min(3).max(120) }))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { publishCommercialAd } = await import("./commercial.server");
    await publishCommercialAd(data.adId, "manual", data.reference);
    const { logAdminAction } = await import("@/lib/admin/ops.server");
    await logAdminAction({
      adminId: context.userId,
      action: "commercial_ad.offline_payment",
      targetTable: "commercial_ads",
      targetId: data.adId,
      details: { reference: data.reference },
    });
    return { ok: true as const };
  });

/**
 * Staff: open a Stripe Checkout session for the advertiser.
 *
 * Returning a checkout URL does not activate anything — only the verified
 * `checkout.session.completed` webhook marks the advertisement as paid.
 */
export const startCommercialAdCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ adId: z.string().uuid(), returnUrl: z.string().url().max(500) }))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/admin/admin.server");
    await assertStaff(context.supabase, context.userId);
    const { startCommercialCheckout } = await import("./commercial.server");
    return startCommercialCheckout({ adId: data.adId, returnUrl: data.returnUrl });
  });

export type PublicCommercialAd = {
  id: string;
  slotKey: string;
  advertiserName: string;
  headline: string | null;
  targetUrl: string | null;
  imageUrl: string | null;
  width: number;
  height: number;
};

/** Public: the banner currently on air for a slot (display fields only). */
export const getActiveCommercialAd = createServerFn({ method: "POST" })
  .validator(z.object({ slotKey: z.string().min(2).max(60) }))
  .handler(async ({ data }): Promise<PublicCommercialAd | null> => {
    const { activeCommercialAd } = await import("./commercial.server");
    const { HEADER_BANNER_HEIGHT, HEADER_BANNER_WIDTH } = await import("./commercial");
    const ad = await activeCommercialAd(data.slotKey);
    if (!ad) return null;
    return {
      id: ad.id,
      slotKey: ad.slot_key,
      advertiserName: ad.advertiser_name,
      headline: ad.headline,
      targetUrl: ad.target_url,
      imageUrl: ad.display_url,
      width: HEADER_BANNER_WIDTH,
      height: HEADER_BANNER_HEIGHT,
    };
  });

/** Public: impression / click counters for a running banner. */
export const trackCommercialAdEvent = createServerFn({ method: "POST" })
  .validator(
    z.object({ adId: z.string().uuid(), metric: z.enum(["impressions", "clicks"]) }),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    try {
      await enforceRateLimit(`commercial_ad:${data.adId}:${data.metric}`, 120, 60_000);
    } catch {
      return { ok: true };
    }
    const { bumpCommercialMetric } = await import("./commercial.server");
    await bumpCommercialMetric(data.adId, data.metric);
    return { ok: true };
  });

/**
 * Staff: draft banner copy with a real AI provider.
 *
 * Requires OPENAI_API_KEY or ANTHROPIC_API_KEY on the server. Without
 * credentials the call reports `not_configured` instead of inventing copy.
 */
export const suggestCommercialAdCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      advertiserName: z.string().min(2).max(120),
      brief: z.string().min(3).max(1000),
      language: z.enum(["ar", "en", "de", "fr"]).default("en"),
      provider: z.enum(["openai", "anthropic"]).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("@/lib/admin/admin.server");
    await assertStaff(context.supabase, context.userId);
    await enforceRateLimit(`ad_copy:${context.userId}`, 20, 60 * 60_000);
    const { generateAdCopy } = await import("@/lib/ai/ad-providers.server");
    return generateAdCopy(data);
  });

/** Staff: which AI advertising providers actually hold credentials. */
export const commercialAdAiStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertStaff } = await import("@/lib/admin/admin.server");
    await assertStaff(context.supabase, context.userId);
    const { adProviderStatus } = await import("@/lib/ai/ad-providers.server");
    return adProviderStatus();
  });
