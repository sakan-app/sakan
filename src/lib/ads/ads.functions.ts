import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit.server";

export const createFeaturedCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ adId: z.string().uuid(), returnUrl: z.string().url().max(500) }))
  .handler(async ({ data, context }) => {
    const { startFeaturedCheckout } = await import("./ads.server");
    try {
      await enforceRateLimit(`ad_checkout:${context.userId}`, 5, 60 * 60_000);
      return await startFeaturedCheckout({
        userId: context.userId,
        adId: data.adId,
        returnUrl: data.returnUrl,
      });
    } catch (error) {
      if (error instanceof RateLimitError) throw error;
      throw new Error(error instanceof Error ? error.message : "ad_checkout_failed");
    }
  });

/** Fire-and-forget analytics for the rotating banner. */
export const getFeaturedQueue = createServerFn({ method: "POST" }).handler(async () => {
  const { listFeaturedQueue } = await import("./ads.server");
  return listFeaturedQueue();
});

/** Fire-and-forget analytics for the rotating banner. */
export const trackAdEvent = createServerFn({ method: "POST" })
  .validator(z.object({ adId: z.string().uuid(), metric: z.enum(["impressions", "clicks"]) }))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    // Unauthenticated (fired by the public banner strip); throttle per ad+metric
    // so a single abuser can't spam impressions/clicks.
    try {
      await enforceRateLimit(`ad_track:${data.adId}:${data.metric}`, 120, 60_000);
    } catch {
      return { ok: true };
    }
    const { bumpAdMetric } = await import("./ads.server");
    await bumpAdMetric(data.adId, data.metric);
    return { ok: true };
  });

export const reviewFeaturedAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      adId: z.string().uuid(),
      decision: z.enum(["approve", "reject", "expire"]),
      note: z.string().max(500).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("forbidden");

    if (data.decision === "approve") {
      const { publishFeaturedAd } = await import("./ads.server");
      await publishFeaturedAd(data.adId, "manual", `review_${Date.now()}`);
    } else {
      await supabaseAdmin
        .from("featured_ads")
        .update({
          status: data.decision === "reject" ? "rejected" : "expired",
          review_note: data.note ?? null,
        })
        .eq("id", data.adId);
    }
    return { ok: true };
  });

export const listFeaturedAdsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: staff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!staff) throw new Error("forbidden");
    const { sweepExpiredAds } = await import("./ads.server");
    await sweepExpiredAds();
    const { data, error } = await supabaseAdmin
      .from("featured_ads")
      .select(
        "id, user_id, image_path, headline, subtitle, target_url, status, amount_cents, currency, starts_at, ends_at, impressions, clicks, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });