import { queryOptions, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_COLUMNS, toMemberViews, type MemberView, type PublicProfile } from "@/lib/members";
import { socialKeys } from "@/lib/social/keys";

/* ------------------------------- Likes ---------------------------------- */

export const myLikesQuery = (userId: string) =>
  queryOptions({
    queryKey: socialKeys.likesMine(userId),
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase.from("likes").select("liked_id").eq("liker_id", userId);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.liked_id));
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

export const isLikedQuery = (userId: string, targetId: string) =>
  queryOptions({
    queryKey: socialKeys.isLiked(userId, targetId),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("liker_id", userId)
        .eq("liked_id", targetId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    enabled: Boolean(userId) && Boolean(targetId),
    staleTime: 30_000,
  });

export const likedMeQuery = (userId: string) =>
  queryOptions({
    queryKey: socialKeys.likedMe(userId),
    queryFn: async (): Promise<MemberView[]> => {
      const { data, error } = await supabase.from("likes").select("liker_id").eq("liked_id", userId);
      if (error) throw error;
      const ids = (data ?? []).map((r) => r.liker_id);
      return fetchMemberViewsByIds(ids);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

export async function likeMember(likerId: string, likedId: string) {
  const { error } = await supabase
    .from("likes")
    .upsert({ liker_id: likerId, liked_id: likedId }, { onConflict: "liker_id,liked_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function unlikeMember(likerId: string, likedId: string) {
  const { error } = await supabase.from("likes").delete().eq("liker_id", likerId).eq("liked_id", likedId);
  if (error) throw error;
}

function invalidateLikeCaches(queryClient: QueryClient, userId: string, targetId: string) {
  void queryClient.invalidateQueries({ queryKey: socialKeys.isLiked(userId, targetId) });
  void queryClient.invalidateQueries({ queryKey: socialKeys.likesMine(userId) });
  void queryClient.invalidateQueries({ queryKey: socialKeys.likedMe(targetId) });
  void queryClient.invalidateQueries({ queryKey: socialKeys.matchesAll(userId) });
  void queryClient.invalidateQueries({ queryKey: socialKeys.matchesAll(targetId) });
}

/** Optimistic like/unlike toggle. Pass the current liked state to know the intent. */
export function useToggleLike(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetId, liked }: { targetId: string; liked: boolean }) => {
      if (liked) await unlikeMember(userId, targetId);
      else await likeMember(userId, targetId);
      return { targetId, liked: !liked };
    },
    onMutate: async ({ targetId, liked }) => {
      await queryClient.cancelQueries({ queryKey: socialKeys.isLiked(userId, targetId) });
      const prevIsLiked = queryClient.getQueryData<boolean>(socialKeys.isLiked(userId, targetId));
      const prevMine = queryClient.getQueryData<Set<string>>(socialKeys.likesMine(userId));
      queryClient.setQueryData(socialKeys.isLiked(userId, targetId), !liked);
      if (prevMine) {
        const next = new Set(prevMine);
        if (liked) next.delete(targetId);
        else next.add(targetId);
        queryClient.setQueryData(socialKeys.likesMine(userId), next);
      }
      return { prevIsLiked, prevMine };
    },
    onError: (_err, { targetId }, context) => {
      if (context?.prevIsLiked !== undefined) {
        queryClient.setQueryData(socialKeys.isLiked(userId, targetId), context.prevIsLiked);
      }
      if (context?.prevMine) queryClient.setQueryData(socialKeys.likesMine(userId), context.prevMine);
    },
    onSettled: (_data, _err, { targetId }) => invalidateLikeCaches(queryClient, userId, targetId),
  });
}

/* ----------------------------- Favorites --------------------------------- */

export type FavoriteEntry = { member: MemberView; note: string | null; favoritedAt: string };

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: socialKeys.favorites(userId),
    queryFn: async (): Promise<FavoriteEntry[]> => {
      const { data, error } = await supabase
        .from("favorites")
        .select("favorite_id, note, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const members = await fetchMemberViewsByIds(rows.map((r) => r.favorite_id));
      const byId = new Map(members.map((m) => [m.id, m]));
      return rows
        .map((r) => {
          const member = byId.get(r.favorite_id);
          if (!member) return null;
          return { member, note: r.note, favoritedAt: r.created_at };
        })
        .filter((entry): entry is FavoriteEntry => entry !== null);
    },
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

export async function addFavorite(userId: string, favoriteId: string, note?: string) {
  const { data: existing, error: findError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("favorite_id", favoriteId)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return;
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, favorite_id: favoriteId, note: note ?? null });
  if (error) throw error;
}

export async function removeFavorite(userId: string, favoriteId: string) {
  const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("favorite_id", favoriteId);
  if (error) throw error;
}

export function useToggleFavorite(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetId, favorited }: { targetId: string; favorited: boolean }) => {
      if (favorited) await removeFavorite(userId, targetId);
      else await addFavorite(userId, targetId);
      return { targetId, favorited: !favorited };
    },
    onMutate: async ({ targetId, favorited }) => {
      await queryClient.cancelQueries({ queryKey: socialKeys.favorites(userId) });
      const prev = queryClient.getQueryData<FavoriteEntry[]>(socialKeys.favorites(userId));
      if (prev && favorited) {
        queryClient.setQueryData(
          socialKeys.favorites(userId),
          prev.filter((e) => e.member.id !== targetId),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(socialKeys.favorites(userId), context.prev);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: socialKeys.favorites(userId) }),
  });
}

/* ------------------------------- Matches ---------------------------------- */

export type MatchSort = "recent" | "name" | "online";
export type MatchFilter = { verifiedOnly?: boolean; country?: string };
export type MatchEntry = { member: MemberView; matchedAt: string };

export const matchesQuery = (userId: string, sort: MatchSort, filter: MatchFilter) =>
  queryOptions({
    queryKey: socialKeys.matches(userId, sort, filter),
    queryFn: async (): Promise<MatchEntry[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("user_low, user_high, matched_at")
        .eq("is_active", true)
        .or(`user_low.eq.${userId},user_high.eq.${userId}`);
      if (error) throw error;
      const rows = data ?? [];
      const otherIdByMatch = new Map<string, string>();
      for (const row of rows) {
        const other = row.user_low === userId ? row.user_high : row.user_low;
        otherIdByMatch.set(other, row.matched_at);
      }
      const members = await fetchMemberViewsByIds([...otherIdByMatch.keys()]);
      let entries: MatchEntry[] = members.map((member) => ({
        member,
        matchedAt: otherIdByMatch.get(member.id) ?? new Date(0).toISOString(),
      }));

      if (filter.verifiedOnly) entries = entries.filter((e) => e.member.isVerified);
      if (filter.country && filter.country !== "all") {
        entries = entries.filter((e) => e.member.countryCode === filter.country);
      }

      entries.sort((a, b) => {
        if (sort === "name") return a.member.name.localeCompare(b.member.name);
        if (sort === "online") return Number(b.member.online) - Number(a.member.online);
        return new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime();
      });
      return entries;
    },
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

/* ------------------------------- Shared ----------------------------------- */

async function fetchMemberViewsByIds(ids: string[]): Promise<MemberView[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_COLUMNS)
    .in("id", unique)
    .eq("is_active", true)
    .eq("is_hidden", false);
  if (error) throw error;
  return toMemberViews((data ?? []) as PublicProfile[]);
}
