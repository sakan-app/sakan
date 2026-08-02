import { useQuery } from "@tanstack/react-query";
import { UserRound, X } from "lucide-react";
import { useState } from "react";

import { conversationsQuery } from "@/lib/chat/queries";
import type { ChatStrings } from "@/lib/chat/strings";

type Props = {
  userId: string;
  strings: ChatStrings;
  excludeConversationId: string;
  onPick: (conversationId: string) => void;
  onClose: () => void;
};

export function ForwardSheet({ userId, strings, excludeConversationId, onPick, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const conversationsQ = useQuery(conversationsQuery(userId));
  const items = (conversationsQ.data ?? []).filter((c) => c.id !== excludeConversationId);

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-deep/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fade-up relative flex max-h-[70vh] w-full max-w-md flex-col rounded-t-3xl border border-gold/20 bg-navy-deep p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[var(--shadow-card)] sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-cream">{strings.forwardTitle}</h2>
          <button
            type="button"
            aria-label={strings.cancel}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-cream/70 hover:bg-cream/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {conversationsQ.isPending && (
            <div className="space-y-2 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-glass h-12 rounded-xl" />
              ))}
            </div>
          )}
          {!conversationsQ.isPending && items.length === 0 && (
            <p className="py-6 text-center text-xs text-cream/55">{strings.emptyTitle}</p>
          )}
          {items.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                onPick(c.id);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-start transition-colors hover:bg-gold/10 disabled:opacity-50"
            >
              {c.otherAvatarUrl ? (
                <img src={c.otherAvatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-gold/60">
                  <UserRound className="h-4 w-4" />
                </span>
              )}
              <span className="truncate text-sm text-cream">{c.otherName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}