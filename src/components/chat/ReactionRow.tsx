import type { MessageReaction } from "@/lib/chat/reactions";
import type { ChatStrings } from "@/lib/chat/strings";

type Props = {
  reactions: MessageReaction[];
  userId: string;
  otherName: string;
  youLabel: string;
  strings: ChatStrings;
  onToggle: (emoji: string) => void;
};

/** Compact Telegram-style reaction chips shown under a message bubble. */
export function ReactionRow({ reactions, userId, otherName, youLabel, strings, onToggle }: Props) {
  if (reactions.length === 0) return null;
  const grouped = new Map<string, MessageReaction[]>();
  for (const r of reactions) {
    const list = grouped.get(r.emoji);
    if (list) list.push(r);
    else grouped.set(r.emoji, [r]);
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1" aria-label={strings.reactions}>
      {[...grouped.entries()].map(([emoji, list]) => {
        const mine = list.some((r) => r.user_id === userId);
        const names = list.map((r) => (r.user_id === userId ? youLabel : otherName)).join("، ");
        return (
          <button
            key={emoji}
            type="button"
            title={names}
            aria-label={`${emoji} ${names}`}
            aria-pressed={mine}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(emoji);
            }}
            className={`pin-enter flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none transition-transform active:scale-95 ${
              mine
                ? "border-gold/70 bg-gold/20 text-cream"
                : "border-cream/20 bg-navy-deep/60 text-cream/80"
            }`}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span className="tabular-nums">{list.length}</span>
          </button>
        );
      })}
    </div>
  );
}