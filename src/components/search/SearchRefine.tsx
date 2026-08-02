import { useEffect, useMemo, useState } from "react";

import { useFeatureStrings } from "@/i18n/feature";
import { readRecentSearches } from "@/lib/search-history";
import type { MemberView } from "@/lib/members";
import { searchStrings } from "@/components/search/strings";

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function useSearchRefine(results: MemberView[]) {
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 300);

  const filtered = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    if (!needle) return results;
    return results.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) || (m.city ?? "").toLowerCase().includes(needle),
    );
  }, [debounced, results]);

  return { query, setQuery, filtered };
}

export function SearchRefine({
  query,
  onChange,
  results,
}: {
  query: string;
  onChange: (value: string) => void;
  results: MemberView[];
}) {
  const s = useFeatureStrings(searchStrings);

  const suggestions = useMemo(() => {
    const fromResults = results.flatMap((m) => [m.city ?? "", m.countryCode ?? ""]);
    const fromRecent = readRecentSearches().map((r) => r.label);
    const unique = Array.from(new Set([...fromResults, ...fromRecent].filter(Boolean)));
    return unique.slice(0, 10);
  }, [results]);

  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={s.refine.placeholder}
        list="search-refine-suggestions"
        className="field-navy w-full max-w-xs text-xs"
      />
      <datalist id="search-refine-suggestions">
        {suggestions.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  );
}
