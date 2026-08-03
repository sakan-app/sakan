import { memo, useCallback, useRef, useState } from "react";
import { Archive, ArchiveRestore, Check, Trash2 } from "lucide-react";

import type { NotificationItem } from "@/hooks/useNotifications";
import { NOTIFICATION_ICONS, haptic } from "@/lib/notifications/shared";
import { PresenceIndicator, resolvePresence } from "@/components/presence/PresenceIndicator";
import { useIsAway, useIsOnline } from "@/hooks/usePresence";

type Props = {
  item: NotificationItem;
  timeLabel: string;
  typeLabel: string;
  selected: boolean;
  selectionMode: boolean;
  archived: boolean;
  labels: { delete: string; archive: string; unarchive: string; select: string };
  onOpen: (item: NotificationItem) => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onArchiveToggle: (id: string, archived: boolean) => void;
};

const SWIPE_TRIGGER = 88;

function NotificationRowBase({
  item,
  timeLabel,
  typeLabel,
  selected,
  selectionMode,
  archived,
  labels,
  onOpen,
  onToggleSelect,
  onDelete,
  onArchiveToggle,
}: Props) {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const armed = useRef(false);
  const Icon = NOTIFICATION_ICONS[item.type];
  const actorOnline = useIsOnline(item.actor?.id, item.actor?.lastSeenAt);
  const actorAway = useIsAway(item.actor?.id);
  const actorPresence = resolvePresence(item.actor?.presenceStatus, actorOnline, actorAway);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    startX.current = e.clientX;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    const swipe = Math.max(-140, Math.min(0, document.dir === "rtl" ? -delta : delta));
    setOffset(swipe);
    if (!armed.current && Math.abs(swipe) > SWIPE_TRIGGER) {
      armed.current = true;
      haptic(10);
    } else if (armed.current && Math.abs(swipe) <= SWIPE_TRIGGER) {
      armed.current = false;
    }
  }, []);

  const endSwipe = useCallback(() => {
    if (startX.current === null) return;
    const shouldDelete = armed.current;
    startX.current = null;
    armed.current = false;
    setOffset(0);
    if (shouldDelete) {
      haptic([12, 24]);
      onDelete(item.id);
    }
  }, [item.id, onDelete]);

  return (
    <li className="relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none absolute inset-y-0 end-0 flex w-32 items-center justify-center bg-red-500/20 text-red-200">
        <Trash2 className="h-5 w-5" aria-hidden />
      </div>
      <div
        className={`glass-card relative flex items-start gap-3 rounded-2xl border-white/10 p-4 transition-[transform,background-color] duration-200 motion-reduce:transition-none ${
          item.readAt ? "" : "bg-gold/5"
        } ${selected ? "ring-1 ring-gold-deep" : ""}`}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
      >
        {selectionMode && (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={labels.select}
            onClick={() => onToggleSelect(item.id)}
            className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
              selected ? "border-gold-deep bg-gold-deep text-navy" : "border-white/25 text-transparent"
            }`}
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}

        <button
          type="button"
          onClick={() => (selectionMode ? onToggleSelect(item.id) : onOpen(item))}
          className="flex min-w-0 flex-1 items-start gap-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep/70 rounded-xl"
        >
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy">
            {item.actor?.avatarUrl ? (
              <img src={item.actor.avatarUrl} alt="" loading="lazy" decoding="async" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <Icon className="h-5 w-5 text-gold" aria-hidden />
            )}
            {item.actor && <PresenceIndicator state={actorPresence} overlay hideOffline />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-cream">{item.title}</span>
            <span className="block truncate text-xs text-cream/70">{item.body ?? typeLabel}</span>
            <span className="mt-1 block text-[11px] text-cream/50">{timeLabel}</span>
          </span>
          {!item.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-deep" aria-hidden />}
        </button>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => onArchiveToggle(item.id, !archived)}
            aria-label={archived ? labels.unarchive : labels.archive}
            title={archived ? labels.unarchive : labels.archive}
            className="rounded-full p-2 text-cream/60 transition hover:bg-white/10 hover:text-cream focus-visible:ring-2 focus-visible:ring-gold-deep/70"
          >
            {archived ? <ArchiveRestore className="h-4 w-4" aria-hidden /> : <Archive className="h-4 w-4" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label={labels.delete}
            title={labels.delete}
            className="rounded-full p-2 text-cream/60 transition hover:bg-red-500/15 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-gold-deep/70"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

export const NotificationRow = memo(NotificationRowBase);