import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import { useFeatureStrings } from "@/i18n/feature";
import { adsStrings } from "@/lib/ads/strings";
import { featuredAdsQuery } from "@/lib/ads/queries";
import { FEATURED_AD_TRAVEL_MS } from "@/lib/ads/types";
import { trackAdEvent } from "@/lib/ads/ads.functions";

/**
 * Paid featured banner.
 *
 * One creative at a time drifts across the strip over three minutes, then the
 * next one takes over. Users who prefer reduced motion get a static card that
 * simply swaps on the same schedule.
 */
export function FeaturedTicker() {
  const s = useFeatureStrings(adsStrings);
  const { data } = useQuery(featuredAdsQuery);
  const ads = useMemo(() => (data ?? []).filter((ad) => ad.imageUrl), [data]);
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % ads.length),
      FEATURED_AD_TRAVEL_MS,
    );
    return () => window.clearInterval(timer);
  }, [ads.length]);

  const current = ads[index % Math.max(ads.length, 1)];

  useEffect(() => {
    if (!current) return;
    void trackAdEvent({ data: { adId: current.id, metric: "impressions" } }).catch(() => {});
  }, [current?.id]);

  if (!current) return null;

  const content = (
    <span className="flex items-center gap-3">
      <img
        src={current.imageUrl!}
        alt={current.headline ?? s.sponsored}
        loading="lazy"
        className="h-10 w-10 rounded-full border border-gold/50 object-cover"
      />
      <span className="text-start">
        <span className="block text-sm font-bold text-cream">{current.headline ?? s.sponsored}</span>
        {current.subtitle ? (
          <span className="block text-[11px] text-cream/60">{current.subtitle}</span>
        ) : null}
      </span>
      <span className="chip-glass px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
        {s.sponsored}
      </span>
    </span>
  );

  const inner = current.targetUrl ? (
    <a
      href={current.targetUrl}
      target="_blank"
      rel="nofollow noopener noreferrer sponsored"
      onClick={() => {
        void trackAdEvent({ data: { adId: current.id, metric: "clicks" } }).catch(() => {});
      }}
      className="inline-flex"
    >
      {content}
    </a>
  ) : (
    content
  );

  return (
    <section
      aria-label={s.tickerLabel}
      className="relative overflow-hidden border-y border-gold/15 bg-navy/60 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center gap-1.5 bg-gradient-to-r from-navy-deep via-navy-deep/90 to-transparent px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {s.tickerLabel}
      </div>
      <div className="flex h-16 items-center ps-28">
        {reduced ? (
          <div className="w-full">{inner}</div>
        ) : (
          <div key={current.id} className="featured-track whitespace-nowrap">
            {inner}
          </div>
        )}
      </div>
    </section>
  );
}