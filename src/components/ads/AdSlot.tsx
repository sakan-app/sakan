import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

import { useFeatureStrings } from "@/i18n/feature";
import { adsStrings } from "@/lib/ads/strings";
import { HEADER_BANNER_HEIGHT, HEADER_BANNER_WIDTH } from "@/lib/ads/commercial";
import { getActiveCommercialAd, trackCommercialAdEvent } from "@/lib/ads/commercial.functions";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Public commercial banner slot.
 *
 * Renders the single advertisement the server reports as paid, active and
 * inside its scheduling window for this slot. The server is the only source
 * of truth: an unpaid or expired advertisement is never returned, so it can
 * never be displayed. When nothing is on air the slot renders nothing at all.
 */
export function AdSlot({ slot, className }: { slot: string; className?: string }) {
  const { dir } = useI18n();
  const strings = useFeatureStrings(adsStrings);
  const fetchAd = useServerFn(getActiveCommercialAd);
  const track = useServerFn(trackCommercialAdEvent);
  const [imageFailed, setImageFailed] = useState(false);
  const trackedRef = useRef<string | null>(null);

  const { data: ad } = useQuery({
    queryKey: ["commercial-ad", slot],
    queryFn: () => fetchAd({ data: { slotKey: slot } }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setImageFailed(false);
  }, [ad?.imageUrl]);

  // One impression per creative per mounted slot.
  useEffect(() => {
    if (!ad?.id || trackedRef.current === ad.id) return;
    trackedRef.current = ad.id;
    void track({ data: { adId: ad.id, metric: "impressions" } }).catch(() => undefined);
  }, [ad?.id, track]);

  if (!ad) return null;

  const showImage = Boolean(ad.imageUrl) && !imageFailed;

  const body = (
    <>
      {showImage ? (
        <img
          src={ad.imageUrl ?? ""}
          alt={ad.headline ?? ad.advertiserName}
          width={ad.width || HEADER_BANNER_WIDTH}
          height={ad.height || HEADER_BANNER_HEIGHT}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        // Image-error / image-less fallback: never leave a broken banner.
        <span className="line-clamp-2 px-4 text-center text-sm font-semibold text-cream/85">
          {ad.headline ?? ad.advertiserName}
        </span>
      )}
      <span className="pointer-events-none absolute top-1 text-[9px] uppercase tracking-[0.18em] text-cream/45 end-2">
        {strings.sponsored}
      </span>
    </>
  );

  const shell = cn(
    "glass-card relative mx-auto flex w-full max-w-[728px] items-center justify-center overflow-hidden rounded-2xl",
    className,
  );
  const ratio = { aspectRatio: `${HEADER_BANNER_WIDTH} / ${HEADER_BANNER_HEIGHT}` } as const;

  if (!ad.targetUrl) {
    return (
      <aside dir={dir} aria-label={strings.sponsored} className={shell} style={ratio} data-ad-slot={slot}>
        {body}
      </aside>
    );
  }

  return (
    <aside dir={dir} aria-label={strings.sponsored} className="w-full" data-ad-slot={slot}>
      <a
        href={ad.targetUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => {
          void track({ data: { adId: ad.id, metric: "clicks" } }).catch(() => undefined);
        }}
        className={cn(shell, "transition hover:brightness-110")}
        style={ratio}
      >
        {body}
      </a>
    </aside>
  );
}
