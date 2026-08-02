import { ChevronDown, Pin, X } from "lucide-react";
import { useState } from "react";

import type { ChatStrings } from "@/lib/chat/strings";
import type { ChatMessage } from "@/lib/chat/types";

type Props = {
  pinned: ChatMessage[];
  strings: ChatStrings;
  onJump: (messageId: string) => void;
  onUnpin: (message: ChatMessage) => void;
};

function preview(message: ChatMessage, strings: ChatStrings) {
  if (message.kind === "image") return strings.photoMessage;
  if (message.kind === "file") return message.attachment_name ?? strings.fileMessage;
  return message.body;
}

export function PinnedBanner({ pinned, strings, onJump, onUnpin }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (pinned.length === 0) return null;
  const head = pinned[0]!;
  const rest = pinned.slice(1);

  return (
    <div className="pin-enter border-b border-gold/15 bg-navy-deep/95 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-3 py-2">
        <Pin className="h-3.5 w-3.5 shrink-0 text-gold" />
        <button
          type="button"
          onClick={() => onJump(head.id)}
          className="min-w-0 flex-1 text-start"
          aria-label={strings.jumpToMessage}
        >
          <span className="block text-[10px] font-semibold text-gold/80">{strings.pinnedMessages}</span>
          <span className="block truncate text-xs text-cream/80">{preview(head, strings)}</span>
        </button>
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="grid h-7 w-7 place-items-center rounded-full text-cream/70 hover:bg-cream/10"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
        <button
          type="button"
          aria-label={strings.unpin}
          onClick={() => onUnpin(head)}
          className="grid h-7 w-7 place-items-center rounded-full text-cream/60 hover:bg-cream/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && rest.length > 0 && (
        <ul className="max-h-40 overflow-y-auto border-t border-gold/10 px-3 py-1">
          {rest.map((m) => (
            <li key={m.id} className="flex items-center gap-2 py-1.5">
              <button
                type="button"
                onClick={() => onJump(m.id)}
                className="min-w-0 flex-1 truncate text-start text-xs text-cream/75 hover:text-cream"
              >
                {preview(m, strings)}
              </button>
              <button
                type="button"
                aria-label={strings.unpin}
                onClick={() => onUnpin(m)}
                className="grid h-6 w-6 place-items-center rounded-full text-cream/50 hover:bg-cream/10"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}