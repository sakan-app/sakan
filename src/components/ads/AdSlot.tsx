import { useQuery } from "@tanstack/react-query";

import { adPlacementsQuery } from "@/lib/ads/queries";
import { cn } from "@/lib/utils";

/**
 * Reserved advertising space.
 *
 * Each slot is configured in the `ad_placements` table and stays invisible
 * until staff enable it. When enabled the container exposes standard
 * `data-ad-*` attributes so an AI ad agent or ad network script can claim it
 * without any further code change.
 */
export function AdSlot({ slot, className }: { slot: string; className?: string }) {
  const { data } = useQuery(adPlacementsQuery);
  const placement = data?.find((p) => p.slotKey === slot);
  if (!placement?.enabled) return null;

  return (
    <aside
      aria-label={placement.label}
      data-ad-slot={placement.slotKey}
      data-ad-network={placement.network ?? undefined}
      data-ad-unit={placement.unitId ?? undefined}
      style={{ minHeight: placement.minHeight }}
      className={cn(
        "glass-card mx-auto flex w-full max-w-[1360px] items-center justify-center rounded-2xl text-[11px] uppercase tracking-[0.2em] text-cream/35",
        className,
      )}
    >
      {placement.network ? null : "advertisement"}
    </aside>
  );
}