import { usePresence } from "@/hooks/usePresence";
import { useNotificationsRealtime } from "@/hooks/useNotifications";
import { useSocialRealtime } from "@/lib/social/realtime";

/**
 * Mounts the app-wide realtime subscriptions once: online presence + last-seen
 * heartbeat, notification stream, and the social graph (likes / matches /
 * favorites). All hooks no-op while signed out.
 */
export function RealtimeBridge() {
  usePresence();
  useNotificationsRealtime();
  useSocialRealtime();
  return null;
}