import { useEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

import { MemberCard } from "@/components/MemberCard";
import type { MemberView } from "@/lib/members";

/** Below this count a plain CSS grid is cheaper than virtualizing. */
const VIRTUALIZE_FROM = 24;
const ROW_ESTIMATE = 320;
const GAP = 20;

function useColumns() {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setCols(w >= 1024 ? 4 : w >= 640 ? 3 : 2);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return cols;
}

/**
 * Member grid that windows its rows once the result set gets long, keeping
 * scrolling smooth on large search results. Falls back to a normal grid for
 * short lists so the visual layout never changes.
 */
export function VirtualMemberGrid({ members, className = "" }: { members: MemberView[]; className?: string }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const cols = useColumns();
  const shouldVirtualize = members.length >= VIRTUALIZE_FROM;
  const rowCount = Math.ceil(members.length / cols);

  useEffect(() => {
    if (!parentRef.current) return;
    setOffset(parentRef.current.getBoundingClientRect().top + window.scrollY);
  }, [members.length, cols]);

  const virtualizer = useWindowVirtualizer({
    count: shouldVirtualize ? rowCount : 0,
    estimateSize: () => ROW_ESTIMATE + GAP,
    overscan: 3,
    scrollMargin: offset,
  });

  if (!shouldVirtualize) {
    return (
      <div className={`grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 ${className}`}>
        {members.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>
    );
  }

  return (
    <div ref={parentRef} className={className}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const start = row.index * cols;
          const slice = members.slice(start, start + cols);
          return (
            <div
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={row.index}
              className="absolute inset-x-0 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4"
              style={{ transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)` }}
            >
              {slice.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
