import { usePresence } from "@/hooks/usePresence";
import { useNotificationsRealtime } from "@/hooks/useNotifications";
import { useSocialRealtime } from "@/lib/social/realtime";
import { useAccountRealtime } from "@/lib/account/realtime";

/**
 * Mounts the app-wide realtime subscriptions once: online presence + last-seen
 * heartbeat, notification stream, the social graph (likes / matches /
 * favorites) and account state (subscription, payments, verification, featured
 * banner queue). All hooks no-op while signed out.
 */
export function RealtimeBridge() {
  usePresence();
  useNotificationsRealtime();
  useSocialRealtime();
  useAccountRealtime();
  return null;
}