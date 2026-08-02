import { useEffect, useSyncExternalStore } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { chatStrings } from "@/lib/chat/strings";
import type { Locale } from "@/i18n";

const onlineIds = new Set<string>();
const listeners = new Set<() => void>();
let channel: ReturnType<typeof supabase.channel> | null = null;
let refCount = 0;

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return onlineIds;
}

/** Joins the global presence channel and heartbeats last_seen while mounted. */
export function usePresence() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    refCount += 1;

    if (!channel) {
      channel = supabase.channel("sakan:presence", { config: { presence: { key: userId } } });
      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel?.presenceState() ?? {};
          onlineIds.clear();
          Object.keys(state).forEach((id) => onlineIds.add(id));
          notify();
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void channel?.track({ online_at: new Date().toISOString() });
          }
        });
    }

    void supabase.rpc("touch_last_seen");
    const heartbeat = setInterval(() => {
      void supabase.rpc("touch_last_seen");
    }, 60_000);

    return () => {
      clearInterval(heartbeat);
      refCount -= 1;
      if (refCount <= 0 && channel) {
        const toRemove = channel;
        channel = null;
        refCount = 0;
        onlineIds.clear();
        void supabase.removeChannel(toRemove);
      }
    };
  }, [userId]);
}

/** True if the user is present in the realtime channel or was seen within 5 minutes. */
export function useIsOnline(userId: string | null | undefined, lastSeenAt?: string | null): boolean {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!userId) return false;
  if (ids.has(userId)) return true;
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000;
}

/** Translated, relative "last seen" label. */
export function formatLastSeen(
  locale: Locale,
  lastSeenAt: string | null | undefined,
  isOnline: boolean,
): string {
  const s = chatStrings[locale];
  if (isOnline) return s.online;
  if (!lastSeenAt) return s.offline;
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return s.lastSeenJustNow;
  if (minutes < 60) return s.lastSeenMinutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return s.lastSeenHoursAgo(hours);
  const days = Math.floor(hours / 24);
  return s.lastSeenDaysAgo(days);
}
