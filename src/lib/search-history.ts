import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { SearchParams } from "@/lib/validation";

const RECENT_KEY = "sakan.search.recent";
const MAX_RECENT = 8;

export type RecentSearch = { label: string; params: Partial<SearchParams>; savedAt: number };

export function readRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(entry: RecentSearch): RecentSearch[] {
  if (typeof window === "undefined") return [];
  const existing = readRecentSearches().filter((e) => e.label !== entry.label);
  const next = [entry, ...existing].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  return next;
}

export type SavedSearch = { id: string; label: string; criteria: Partial<SearchParams>; createdAt: string };

export const savedSearchesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["saved-searches", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<SavedSearch[]> => {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("id, label, criteria, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        label: row.label,
        criteria: (row.criteria ?? {}) as Partial<SearchParams>,
        createdAt: row.created_at,
      }));
    },
  });

export function useSaveSearch(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { label: string; criteria: Partial<SearchParams> }) => {
      const { error } = await supabase
        .from("saved_searches")
        .insert({ user_id: userId, label: input.label, criteria: input.criteria as Json });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["saved-searches", userId] }),
  });
}

export function useDeleteSavedSearch(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_searches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["saved-searches", userId] }),
  });
}
