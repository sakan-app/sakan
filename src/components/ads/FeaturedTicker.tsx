import { memo, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { useFeatureStrings } from "@/i18n/feature";
import { adsStrings } from "@/lib/ads/strings";
import { getFeaturedQueue, trackAdEvent } from "@/lib/ads/ads.functions";

type QueueEntry = Awaited<ReturnType<typeof getFeaturedQueue>>[number];

/**
 * Paid featured strip (0.99 € slot).
 *
 * All paid creatives travel across the strip as portrait photo cards.
 * Tapping a photo freezes the travel and opens that member profile at once;
 * tapping outside releases the freeze and the travel resumes.
 */
export const FeaturedTicker = memo(function FeaturedTicker() {
  const s = useFeatureStrings(adsStrings);
  const fetchQueue = useServerFn(getFeaturedQueue);
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!paused) return;
    const release = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-featured-ticker]")) return;
      setPaused(false);
    };
    document.addEventListener("pointerdown", release);
    return () => document.removeEventListener("pointerdown", release);
  }, [paused]);

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

  useEffect(() => {
    const current = queue.find((ad) => ad.isCurrent) ?? queue[0];
    if (!current) return;
    void trackAdEvent({ data: { adId: current.id, metric: "impressions" } }).catch(() => {});
  }, [queue]);

  if (queue.length === 0) return null;

  const open = (ad: QueueEntry) => {
    setPaused(true);
    void trackAdEvent({ data: { adId: ad.id, metric: "clicks" } }).catch(() => {});
    if (ad.userId) {
      void navigate({ to: "/member/$id", params: { id: ad.userId } });
    } else if (ad.targetUrl) {
      window.open(ad.targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Duplicated once so the marquee loops seamlessly.
  const cards = [...queue, ...queue];

  return (
    <section
      aria-label={s.tickerLabel}
      data-featured-ticker=""
      className="relative overflow-hidden border-y border-gold/15 bg-navy/60 py-3 backdrop-blur-xl"
    >
      <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {s.tickerLabel}
      </div>

      <div className="overflow-hidden px-3">
        <div
          data-paused={paused ? "true" : "false"}
          className="featured-strip-track"
        >
          {cards.map((ad, index) => (
            <button
              key={`${ad.id}-${index}`}
              type="button"
              onPointerDown={() => setPaused(true)}
              onClick={() => open(ad)}
              aria-label={ad.headline ?? s.viewProfile}
              className="group relative h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-gold/25 bg-navy-deep"
            >
              <img
                src={ad.imageUrl!}
                alt={ad.headline ?? s.sponsored}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              {ad.headline ? (
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-navy-deep/95 to-transparent px-1.5 pb-1 pt-3 text-[10px] font-bold text-cream">
                  {ad.headline}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
});
