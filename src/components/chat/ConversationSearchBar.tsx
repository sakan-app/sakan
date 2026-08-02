import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { ChatStrings } from "@/lib/chat/strings";

type Props = {
  strings: ChatStrings;
  term: string;
  onTermChange: (term: string) => void;
  resultCount: number;
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
};

export function ConversationSearchBar({
  strings,
  term,
  onTermChange,
  resultCount,
  activeIndex,
  onPrev,
  onNext,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fade-up flex items-center gap-2 border-b border-gold/15 bg-navy-deep px-3 py-2">
      <Search className="h-4 w-4 shrink-0 text-gold/70" />
      <input
        ref={inputRef}
        value={term}
        onChange={(e) => onTermChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) onPrev();
            else onNext();
          }
          if (e.key === "Escape") onClose();
        }}
        placeholder={strings.searchInChat}
        aria-label={strings.searchInChat}
        className="field-navy h-9 flex-1 py-1.5 text-sm"
      />
      <span aria-live="polite" className="shrink-0 text-[11px] tabular-nums text-cream/60">
        {term.trim().length >= 2
          ? resultCount > 0
            ? strings.searchCounter(activeIndex + 1, resultCount)
            : strings.searchNoResults
          : ""}
      </span>
      <button
        type="button"
        aria-label={strings.previousResult}
        disabled={resultCount === 0}
        onClick={onPrev}
        className="grid h-8 w-8 place-items-center rounded-full text-cream/75 hover:bg-cream/10 disabled:opacity-30"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={strings.nextResult}
        disabled={resultCount === 0}
        onClick={onNext}
        className="grid h-8 w-8 place-items-center rounded-full text-cream/75 hover:bg-cream/10 disabled:opacity-30"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={strings.closeSearch}
        onClick={onClose}
        className="grid h-8 w-8 place-items-center rounded-full text-cream/75 hover:bg-cream/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}