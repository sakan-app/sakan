import { useEffect, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { chatStrings } from "@/lib/chat/strings";
import { myProfileQuery } from "@/lib/profile-queries";
import type { Locale } from "@/i18n";

const onlineIds = new Set<string>();
const awayIds = new Set<string>();
/** Bumped on every presence sync so subscribers re-read the sets. */
let version = 0;
const listeners = new Set<() => void>();
let channel: ReturnType<typeof supabase.channel> | null = null;
let refCount = 0;

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return version;
}

/** Milliseconds of inactivity before we auto-report the user as "away". */
const IDLE_MS = 5 * 60 * 1000;

/** Joins the global presence channel and heartbeats last_seen while mounted. */
export function usePresence() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    refCount += 1;
    // Privacy: members set to "invisible" (or hiding last seen) must never be
    // broadcast on the shared presence channel. We still subscribe so they can
    // see others, but we never track our own presence for them.
    let mayBroadcast = false;
    let cancelled = false;
    const privacyLoaded = supabase
      .from("profiles")
      .select("presence_status, hide_last_seen")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        mayBroadcast =
          !cancelled && Boolean(data) && data?.presence_status !== "invisible" && !data?.hide_last_seen;
      });

    if (!channel) {
      channel = supabase.channel("sakan:presence", { config: { presence: { key: userId } } });
      channel
        .on("presence", { event: "sync" }, () => {
          const state = (channel?.presenceState() ?? {}) as Record<
            string,
            Array<{ status?: string }>
          >;
          onlineIds.clear();
          awayIds.clear();
          Object.entries(state).forEach(([id, metas]) => {
            onlineIds.add(id);
            if (metas.some((meta) => meta.status === "away")) awayIds.add(id);
          });
          notify();
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void privacyLoaded.then(() => {
              if (mayBroadcast) {
                void channel?.track({ online_at: new Date().toISOString(), status: "online" });
              }
            });
          }
        });
    }

    void supabase.rpc("touch_last_seen");
    const heartbeat = setInterval(() => {
      void supabase.rpc("touch_last_seen");
    }, 60_000);

    // Auto away/online: idle for IDLE_MS (or a hidden tab) reports "away",
    // any interaction brings the user straight back to "online".
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let reported: "online" | "away" = "online";
    const report = (status: "online" | "away") => {
      if (reported === status) return;
      reported = status;
      if (mayBroadcast) void channel?.track({ online_at: new Date().toISOString(), status });
      if (status === "online") void supabase.rpc("touch_last_seen");
    };
    const goIdle = () => report("away");
    const activity = () => {
      report("online");
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(goIdle, IDLE_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") goIdle();
      else activity();
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart", "focus"] as const;
    events.forEach((event) => window.addEventListener(event, activity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    activity();

    return () => {
      cancelled = true;
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((event) => window.removeEventListener(event, activity));
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(heartbeat);
      refCount -= 1;
      if (refCount <= 0 && channel) {
        const toRemove = channel;
        channel = null;
        refCount = 0;
        onlineIds.clear();
        awayIds.clear();
        notify();
        void supabase.removeChannel(toRemove);
      }
    };
  }, [userId]);
}

/** True if the user is present in the realtime channel or was seen within 5 minutes. */
export function useIsOnline(userId: string | null | undefined, lastSeenAt?: string | null): boolean {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!userId) return false;
  if (onlineIds.has(userId)) return true;
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

/** True when the member is connected but has been idle (auto "away"). */
export function useIsAway(userId: string | null | undefined): boolean {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!userId) return false;
  return awayIds.has(userId);
}

/**
 * The signed-in member's own chosen presence status. Used to honour
 * "do not disturb" (silence toasts/haptics) across the app.
 */
export function useMyPresenceStatus() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { data } = useQuery({
    ...myProfileQuery(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
  const status = data?.presence_status ?? "online";
  return { status, isDnd: status === "dnd" || status === "busy" };
}
