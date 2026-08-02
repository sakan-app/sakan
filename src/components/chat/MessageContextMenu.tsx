import {
  Copy,
  CornerUpLeft,
  Forward,
  Info,
  Pencil,
  Pin,
  PinOff,
  Share2,
  SquareCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { ChatStrings } from "@/lib/chat/strings";

export type ContextMenuAction =
  | "reply"
  | "copy"
  | "edit"
  | "delete"
  | "forward"
  | "share"
  | "select"
  | "info"
  | "pin"
  | "unpin";

type Props = {
  x: number;
  y: number;
  strings: ChatStrings;
  isOwn: boolean;
  isPinned: boolean;
  canCopy: boolean;
  canEdit: boolean;
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
};

const MENU_WIDTH = 208;

export function MessageContextMenu({
  x,
  y,
  strings,
  isOwn,
  isPinned,
  canCopy,
  canEdit,
  onAction,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.min(Math.max(8, x), window.innerWidth - MENU_WIDTH - 8);
    const top = Math.min(Math.max(8, y), window.innerHeight - rect.height - 8);
    setPos({ left, top });
  }, [x, y]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const items: Array<{ id: ContextMenuAction; label: string; icon: typeof Copy; danger?: boolean }> = [
    { id: "reply", label: strings.reply, icon: CornerUpLeft },
    ...(canCopy ? [{ id: "copy" as const, label: strings.copy, icon: Copy }] : []),
    ...(canEdit ? [{ id: "edit" as const, label: strings.edit, icon: Pencil }] : []),
    { id: "forward", label: strings.forward, icon: Forward },
    { id: "share", label: strings.share, icon: Share2 },
    { id: "select", label: strings.selectAction, icon: SquareCheck },
    { id: "info", label: strings.messageInfo, icon: Info },
    isPinned
      ? { id: "unpin", label: strings.unpin, icon: PinOff }
      : { id: "pin", label: strings.pin, icon: Pin },
    ...(isOwn
      ? [{ id: "delete" as const, label: strings.deleteAction, icon: Trash2, danger: true }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => e.preventDefault()}>
      <div className="absolute inset-0 bg-navy-deep/40 backdrop-blur-[2px]" />
      <div
        ref={ref}
        role="menu"
        aria-label={strings.messageActions}
        style={{ left: pos.left, top: pos.top, width: MENU_WIDTH }}
        onClick={(e) => e.stopPropagation()}
        className="menu-pop absolute overflow-hidden rounded-2xl border border-gold/25 bg-navy-deep/95 py-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            onClick={() => {
              onAction(item.id);
              onClose();
            }}
            className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-start text-sm transition-colors hover:bg-gold/10 ${
              item.danger ? "text-red-400" : "text-cream"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0 opacity-80" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}