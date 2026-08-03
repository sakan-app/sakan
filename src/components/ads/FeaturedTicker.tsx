import { memo, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { useFeatureStrings } from "@/i18n/feature";
import { adsStrings } from "@/lib/ads/strings";
import { getFeaturedQueue, trackAdEvent } from "@/lib/ads/ads.functions";
import { FEATURED_AD_TRAVEL_MS } from "@/lib/ads/types";

type QueueEntry = Awaited<ReturnType<typeof getFeaturedQueue>>[number];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

/**
 * Paid featured banner.
 *
 * The server keeps a real queue: creatives air one at a time in payment order,
 * each travelling the full width in sixty seconds and repeating five times
 * before the next one takes over. The travel is phase-locked to the server's
 * start time, so every visitor sees the same creative at the same position.
 * Hovering pauses the travel and reveals a profile preview.
 */
export const FeaturedTicker = memo(function FeaturedTicker() {
  const s = useFeatureStrings(adsStrings);
  const fetchQueue = useServerFn(getFeaturedQueue);
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const { data } = useQuery({
    queryKey: ["featured-queue"],
    queryFn: () => fetchQueue(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const queue = useMemo(
    () => ((data ?? []) as QueueEntry[]).filter((ad) => ad.imageUrl),
    [data],
  );
  const current = queue.find((ad) => ad.isCurrent) ?? queue[0];
  const upNext = queue.filter((ad) => ad.id !== current?.id).slice(0, 4);

  useEffect(() => {
    if (!current) return;
    void trackAdEvent({ data: { adId: current.id, metric: "impressions" } }).catch(() => {});
  }, [current?.id]);

  if (!current) return null;

  // Phase-lock the CSS travel to the server-side start time.
  const elapsed = current.displayStartedAt
    ? Date.now() - new Date(current.displayStartedAt).getTime()
    : 0;
  const delay = -(((elapsed % FEATURED_AD_TRAVEL_MS) + FEATURED_AD_TRAVEL_MS) % FEATURED_AD_TRAVEL_MS);
  const loopsLeft = Math.max(0, current.loopsTotal - current.loopsDone);

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

  const trackClick = () => {
    void trackAdEvent({ data: { adId: current.id, metric: "clicks" } }).catch(() => {});
  };

  // A paid featured profile always opens the member page instantly; an external
  // target URL is only used as a fallback for non-member creatives.
  const inner = current.userId ? (
    <Link
      to="/member/$id"
      params={{ id: current.userId }}
      onClick={trackClick}
      aria-label={current.headline ?? s.viewProfile}
      className="inline-flex"
    >
      {content}
    </Link>
  ) : current.targetUrl ? (
    <a
      href={current.targetUrl}
      target="_blank"
      rel="nofollow noopener noreferrer sponsored"
      onClick={trackClick}
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      onTouchCancel={() => setHovered(false)}
      className="relative overflow-hidden border-y border-gold/15 bg-navy/60 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center gap-1.5 bg-gradient-to-r from-navy-deep via-navy-deep/90 to-transparent px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {s.tickerLabel}
      </div>

      <div className="flex h-16 items-center ps-28 pe-3">
        {reduced ? (
          <div className="w-full">{inner}</div>
        ) : (
          <div
            key={current.id}
            data-paused={hovered ? "true" : "false"}
            style={{ animationDelay: `${delay}ms` }}
            className="featured-track whitespace-nowrap"
          >
            {inner}
          </div>
        )}

        {upNext.length > 0 && (
          <div
            className="pointer-events-none absolute inset-y-0 end-0 z-10 hidden items-center gap-1.5 bg-gradient-to-l from-navy-deep via-navy-deep/90 to-transparent ps-10 pe-3 sm:flex"
            aria-label={s.queueTitle}
          >
            {upNext.map((ad) => (
              <img
                key={ad.id}
                src={ad.imageUrl!}
                alt=""
                loading="lazy"
                className="h-7 w-7 rounded-full border border-gold/30 object-cover opacity-60"
              />
            ))}
          </div>
        )}
      </div>

      {/* Profile preview while the strip is paused under the pointer. */}
      {hovered && (
        <div className="absolute inset-x-0 top-full z-30 flex justify-center px-4">
          <div className="glass-card fade-up mt-2 flex w-full max-w-md items-center gap-3 rounded-2xl p-3">
            <img
              src={current.imageUrl!}
              alt=""
              className="h-14 w-14 rounded-xl object-cover"
              loading="lazy"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-cream">
                {current.headline ?? s.sponsored}
              </p>
              {current.subtitle ? (
                <p className="truncate text-xs text-cream/60">{current.subtitle}</p>
              ) : null}
              <p className="mt-1 text-[10px] uppercase tracking-wider text-gold">
                {s.onAir} · {s.loopsLeft}: {loopsLeft}
              </p>
            </div>
            {current.targetUrl ? (
              <a
                href={current.targetUrl}
                target="_blank"
                rel="nofollow noopener noreferrer sponsored"
                onClick={() => {
                  void trackAdEvent({ data: { adId: current.id, metric: "clicks" } }).catch(
                    () => {},
                  );
                }}
                className="btn-outline-gold shrink-0 px-3 py-1.5 text-[11px]"
              >
                {s.viewProfile}
              </a>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
});