import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type ReactNode } from "react";

/**
 * Windowed table body for admin lists that can render hundreds of rows.
 * Only the visible slice is mounted; spacer rows preserve scroll height so
 * native table semantics (and screen-reader row navigation) stay intact.
 */
export function VirtualTableShell<T>({
  head,
  rows,
  rowKey,
  renderRow,
  estimateRowHeight = 56,
  maxHeight = 620,
  minWidth = 720,
}: {
  head: ReactNode;
  rows: T[];
  rowKey: (row: T, index: number) => string;
  renderRow: (row: T, index: number) => ReactNode;
  estimateRowHeight?: number;
  maxHeight?: number;
  minWidth?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 8,
  });

  const items = virtualizer.getVirtualItems();
  const paddingTop = items.length > 0 ? items[0]!.start : 0;
  const paddingBottom =
    items.length > 0 ? virtualizer.getTotalSize() - items[items.length - 1]!.end : 0;

  return (
    <div ref={scrollRef} className="overflow-auto" style={{ maxHeight }} tabIndex={0}>
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead className="sticky top-0 z-10 bg-navy-deep/85 text-[11px] uppercase tracking-wide text-cream/45 backdrop-blur">
          {head}
        </thead>
        <tbody className="divide-y divide-cream/8">
          {paddingTop > 0 ? (
            <tr aria-hidden="true">
              <td style={{ height: paddingTop }} />
            </tr>
          ) : null}
          {items.map((item) => {
            const row = rows[item.index]!;
            return (
              <tr
                key={rowKey(row, item.index)}
                ref={virtualizer.measureElement}
                data-index={item.index}
                className="align-top hover:bg-cream/4"
              >
                {renderRow(row, item.index)}
              </tr>
            );
          })}
          {paddingBottom > 0 ? (
            <tr aria-hidden="true">
              <td style={{ height: paddingBottom }} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}