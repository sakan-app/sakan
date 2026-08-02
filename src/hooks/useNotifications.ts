import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { notificationKeys } from "@/lib/social/keys";
import { socialStrings } from "@/lib/social/strings";

export type NotificationType = Database["public"]["Enums"]["notification_type"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type NotificationActor = { id: string; name: string; avatarUrl: string | null };

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor | null;
};

const PAGE_SIZE = 20;

async function attachActors(rows: NotificationRow[]): Promise<NotificationItem[]> {
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((id): id is string => Boolean(id)))];
  let actorsById = new Map<string, NotificationActor>();
  if (actorIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", actorIds);
    const paths = (data ?? []).map((p) => p.avatar_url).filter((p): p is string => Boolean(p));
    let urlByPath = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrls(paths, 3600);
      urlByPath = new Map((signed ?? []).filter((s) => s.signedUrl && s.path).map((s) => [s.path as string, s.signedUrl as string]));
    }
    actorsById = new Map(
      (data ?? []).map((p) => [
        p.id,
        { id: p.id, name: p.display_name, avatarUrl: p.avatar_url ? urlByPath.get(p.avatar_url) ?? null : null },
      ]),
    );
  }
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: (row.data ?? {}) as Record<string, unknown>,
    readAt: row.read_at,
    createdAt: row.created_at,
    actor: row.actor_id ? actorsById.get(row.actor_id) ?? null : null,
  }));
}

export const notificationsQuery = (userId: string) =>
  queryOptions({
    queryKey: notificationKeys.list(userId),
    queryFn: async (): Promise<NotificationItem[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      return attachActors(data ?? []);
    },
    enabled: Boolean(userId),
    staleTime: 10_000,
  });

export const unreadCountQuery = (userId: string) =>
  queryOptions({
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: Boolean(userId),
    staleTime: 10_000,
  });

export function useNotificationsList() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useQuery({ ...notificationsQuery(userId), enabled: Boolean(userId) });
}

export function useUnreadCount() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useQuery({ ...unreadCountQuery(userId), enabled: Boolean(userId) });
}

export function useMarkAsRead() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(userId), (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
    },
  });
}

export function useMarkAllAsRead() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null);
      if (error) throw error;
    },
    onMutate: async () => {
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(userId), (prev) =>
        prev?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
    },
  });
}

export function useDeleteNotification() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      const prev = queryClient.getQueryData<NotificationItem[]>(notificationKeys.list(userId));
      queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(userId), (list) =>
        list?.filter((n) => n.id !== id),
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(notificationKeys.list(userId), context.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
    },
  });
}

/** Realtime subscription: prepends new notifications and toasts. Safe when signed out. */
export function useNotificationsRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const strings = socialStrings[locale].notifications;
  const stringsRef = useRef(strings);
  stringsRef.current = strings;

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as NotificationRow;
          void attachActors([row]).then(([item]) => {
            if (!item) return;
            queryClient.setQueryData<NotificationItem[]>(notificationKeys.list(userId), (prev) =>
              prev ? [item, ...prev.filter((n) => n.id !== item.id)] : [item],
            );
            void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
            toast(item.title, { description: item.body ?? stringsRef.current.types[item.type] });
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
          void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });
          void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
        },
      )
      .subscribe();

    return () => void supabase.removeChannel(channel);
  }, [user?.id, queryClient]);
}

