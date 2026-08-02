import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "@/lib/social/keys";

/**
 * Subscribes to realtime changes on likes / matches / favorites that involve
 * the current user, invalidating the relevant caches. Batches bursts of
 * events into a single invalidation pass per tick.
 */
export function useSocialRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const pending = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    const flush = () => {
      timer.current = null;
      const scopes = pending.current;
      pending.current = new Set();
      if (scopes.has("likes")) {
        void queryClient.invalidateQueries({ queryKey: socialKeys.likesMine(userId) });
        void queryClient.invalidateQueries({ queryKey: socialKeys.likedMe(userId) });
        void queryClient.invalidateQueries({ queryKey: ["social", "likes", "is"] });
      }
      if (scopes.has("matches")) {
        void queryClient.invalidateQueries({ queryKey: socialKeys.matchesAll(userId) });
      }
      if (scopes.has("favorites")) {
        void queryClient.invalidateQueries({ queryKey: socialKeys.favorites(userId) });
      }
    };

    const schedule = (scope: "likes" | "matches" | "favorites") => {
      pending.current.add(scope);
      if (timer.current) return;
      timer.current = setTimeout(flush, 350);
    };

    const channel = supabase
      .channel(`social-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes", filter: `liker_id=eq.${userId}` },
        () => schedule("likes"),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "likes", filter: `liked_id=eq.${userId}` },
        () => schedule("likes"),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `user_low=eq.${userId}` },
        () => schedule("matches"),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `user_high=eq.${userId}` },
        () => schedule("matches"),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${userId}` },
        () => schedule("favorites"),
      )
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
