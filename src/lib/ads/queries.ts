import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { validateImageFile } from "@/lib/validation";

import type { AdPlacement, FeaturedAd, FeaturedAdStatus } from "./types";
import { FEATURED_AD_CURRENCY, FEATURED_AD_PRICE_CENTS } from "./types";

type Row = {
  id: string;
  image_path: string;
  headline: string | null;
  subtitle: string | null;
  target_url: string | null;
  status: FeaturedAdStatus;
  amount_cents: number;
  currency: string;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
  review_note: string | null;
  created_at: string;
};

const SELECT =
  "id, image_path, headline, subtitle, target_url, status, amount_cents, currency, starts_at, ends_at, impressions, clicks, review_note, created_at";

async function withSignedUrls(rows: Row[]): Promise<FeaturedAd[]> {
  if (rows.length === 0) return [];
  const { data: signed } = await supabase.storage
    .from("featured")
    .createSignedUrls(
      rows.map((r) => r.image_path),
      60 * 60,
    );
  const urls = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));
  return rows.map((r) => ({
    id: r.id,
    imagePath: r.image_path,
    imageUrl: urls.get(r.image_path) ?? null,
    headline: r.headline,
    subtitle: r.subtitle,
    targetUrl: r.target_url,
    status: r.status,
    amountCents: r.amount_cents,
    currency: r.currency,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    impressions: r.impressions,
    clicks: r.clicks,
    reviewNote: r.review_note,
    createdAt: r.created_at,
  }));
}

/** Creatives currently running in the top rotating banner. */
export const featuredAdsQuery = queryOptions({
  queryKey: ["featured-ads", "active"],
  queryFn: async (): Promise<FeaturedAd[]> => {
    const { data, error } = await supabase
      .from("featured_ads")
      .select(SELECT)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    const rows = ((data ?? []) as Row[]).filter(
      (r) => !r.ends_at || new Date(r.ends_at).getTime() > Date.now(),
    );
    return withSignedUrls(rows);
  },
  staleTime: 5 * 60 * 1000,
});

export const myFeaturedAdsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["featured-ads", "mine", userId],
    queryFn: async (): Promise<FeaturedAd[]> => {
      const { data, error } = await supabase
        .from("featured_ads")
        .select(SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return withSignedUrls((data ?? []) as Row[]);
    },
    staleTime: 30 * 1000,
  });

export const adPlacementsQuery = queryOptions({
  queryKey: ["ad-placements"],
  queryFn: async (): Promise<AdPlacement[]> => {
    const { data, error } = await supabase
      .from("ad_placements")
      .select("slot_key, label, enabled, network, unit_id, min_height");
    if (error) throw error;
    return (data ?? []).map((r) => ({
      slotKey: r.slot_key,
      label: r.label,
      enabled: r.enabled,
      network: r.network,
      unitId: r.unit_id,
      minHeight: r.min_height,
    }));
  },
  staleTime: 10 * 60 * 1000,
});

export async function uploadFeaturedCreative(userId: string, file: File) {
  const invalid = validateImageFile(file);
  if (invalid) throw new Error(invalid);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/featured-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("featured")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function createFeaturedAdDraft(args: {
  userId: string;
  imagePath: string;
  headline: string;
  subtitle: string;
  targetUrl: string | null;
}) {
  const { data, error } = await supabase
    .from("featured_ads")
    .insert({
      user_id: args.userId,
      image_path: args.imagePath,
      headline: args.headline || null,
      subtitle: args.subtitle || null,
      target_url: args.targetUrl,
      status: "pending_payment",
      amount_cents: FEATURED_AD_PRICE_CENTS,
      currency: FEATURED_AD_CURRENCY,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}