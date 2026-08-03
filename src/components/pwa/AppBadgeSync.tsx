import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useNotifications";
import { clearAppBadge, setAppBadge } from "@/lib/pwa/badge";

/**
 * Keeps the installed-app icon badge in sync with the unread notification
 * count. Renders nothing; the count itself comes from the same realtime query
 * the notification bell uses, so the badge updates without extra fetches.
 */
export function AppBadgeSync() {
  const { user } = useAuth();
  const { data: unread } = useUnreadCount();

  useEffect(() => {
    if (!user) {
      void clearAppBadge();
      return;
    }
    void setAppBadge(unread ?? 0);
  }, [user, unread]);

  return null;
}
