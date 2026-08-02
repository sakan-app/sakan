import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, X } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useFeatureStrings } from "@/i18n/feature";
import {
  savedSearchesQuery,
  useDeleteSavedSearch,
  useSaveSearch,
  type SavedSearch,
} from "@/lib/search-history";
import { searchStrings } from "@/components/search/strings";
import type { SearchParams } from "@/lib/validation";

export function SavedSearchBar({
  currentCriteria,
  onApply,
}: {
  currentCriteria: Partial<SearchParams>;
  onApply: (criteria: Partial<SearchParams>) => void;
}) {
  const { user } = useAuth();
  const s = useFeatureStrings(searchStrings);
  const userId = user?.id ?? "";
  const savedQ = useQuery({ ...savedSearchesQuery(userId), enabled: Boolean(userId) });
  const saveMutation = useSaveSearch(userId);
  const deleteMutation = useDeleteSavedSearch(userId);
  const [naming, setNaming] = useState(false);
  const [label, setLabel] = useState("");

  if (!user) return null;

  const items: SavedSearch[] = savedQ.data ?? [];

  function submitSave() {
    const trimmed = label.trim();
    if (!trimmed) return;
    saveMutation.mutate(
      { label: trimmed, criteria: currentCriteria },
      { onSuccess: () => { setNaming(false); setLabel(""); } },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="flex items-center gap-1 text-cream/60">
        <Bookmark className="h-3.5 w-3.5" /> {s.saved.title}:
      </span>
      {items.length === 0 && !naming && <span className="text-cream/40">{s.saved.empty}</span>}
      {items.map((item) => (
        <span
          key={item.id}
          className="flex items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1 text-cream/80"
        >
          <button type="button" onClick={() => onApply(item.criteria)} className="hover:text-gold">
            {item.label}
          </button>
          <button
            type="button"
            aria-label={s.saved.delete}
            onClick={() => deleteMutation.mutate(item.id)}
            className="text-cream/40 hover:text-red-300"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {naming ? (
        <span className="flex items-center gap-1.5">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitSave()}
            placeholder={s.saved.namePrompt}
            className="field-navy h-7 w-32 px-2 py-0 text-xs"
          />
          <button
            type="button"
            onClick={submitSave}
            disabled={saveMutation.isPending}
            className="btn-gold px-2 py-1 text-[11px] disabled:opacity-60"
          >
            {saveMutation.isPending ? s.saved.saving : s.saved.save}
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setNaming(true)}
          className="rounded-full border border-gold/30 px-3 py-1 text-gold transition-colors hover:border-gold"
        >
          + {s.saved.save}
        </button>
      )}
    </div>
  );
}
