import { useEffect, useState } from "react";

import { useFeatureStrings } from "@/i18n/feature";
import { readRecentSearches, type RecentSearch } from "@/lib/search-history";
import { searchStrings } from "@/components/search/strings";

export function RecentSearchChips({
  onApply,
}: {
  onApply: (params: RecentSearch["params"]) => void;
}) {
  const s = useFeatureStrings(searchStrings);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setMounted(true);
    setItems(readRecentSearches());
  }, []);

  if (!mounted || items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-cream/60">{s.recent.title}:</span>
      {items.map((item) => (
        <button
          key={`${item.label}-${item.savedAt}`}
          type="button"
          onClick={() => onApply(item.params)}
          className="rounded-full border border-gold/30 px-3 py-1 text-cream/80 transition-colors hover:border-gold hover:text-gold"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
