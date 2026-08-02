import { Copy, Forward, Share2, Trash2, X } from "lucide-react";

import type { ChatStrings } from "@/lib/chat/strings";

type Props = {
  count: number;
  strings: ChatStrings;
  canDelete: boolean;
  onCopy: () => void;
  onForward: () => void;
  onShare: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

export function SelectionBar({
  count,
  strings,
  canDelete,
  onCopy,
  onForward,
  onShare,
  onDelete,
  onCancel,
}: Props) {
  return (
    <div className="fade-up flex items-center gap-1 border-b border-gold/20 bg-navy-deep px-3 py-2">
      <button
        type="button"
        aria-label={strings.exitSelection}
        onClick={onCancel}
        className="grid h-9 w-9 place-items-center rounded-full text-cream hover:bg-cream/10"
      >
        <X className="h-5 w-5" />
      </button>
      <span aria-live="polite" className="flex-1 text-sm font-semibold text-cream">
        {strings.selectedCount(count)}
      </span>
      <button
        type="button"
        aria-label={strings.copy}
        onClick={onCopy}
        className="grid h-9 w-9 place-items-center rounded-full text-gold/85 hover:bg-gold/10"
      >
        <Copy className="h-4.5 w-4.5" />
      </button>
      <button
        type="button"
        aria-label={strings.forward}
        onClick={onForward}
        className="grid h-9 w-9 place-items-center rounded-full text-gold/85 hover:bg-gold/10"
      >
        <Forward className="h-4.5 w-4.5 rtl:-scale-x-100" />
      </button>
      <button
        type="button"
        aria-label={strings.share}
        onClick={onShare}
        className="grid h-9 w-9 place-items-center rounded-full text-gold/85 hover:bg-gold/10"
      >
        <Share2 className="h-4.5 w-4.5" />
      </button>
      {canDelete && (
        <button
          type="button"
          aria-label={strings.deleteAction}
          onClick={onDelete}
          className="grid h-9 w-9 place-items-center rounded-full text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
}