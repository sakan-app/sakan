/**
 * App badge (Badging API).
 *
 * Shows the unread notification count on the installed app icon (Android /
 * Windows / macOS docks). Every call is best-effort: the API is unsupported on
 * iOS Safari and inside non-installed browser tabs, and a rejection there must
 * never surface as an app error.
 */

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/** True when this browser can paint a badge on the app icon. */
export function badgeSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return typeof (navigator as BadgeNavigator).setAppBadge === "function";
}

/** Sets the badge to `count`, or clears it when the count is zero. */
export async function setAppBadge(count: number): Promise<void> {
  if (!badgeSupported()) return;
  const badgeNavigator = navigator as BadgeNavigator;
  try {
    if (count > 0) await badgeNavigator.setAppBadge?.(count);
    else await badgeNavigator.clearAppBadge?.();
  } catch {
    /* unsupported or denied — badges are decorative */
  }
}

/** Removes the badge (used on sign-out and when everything is read). */
export async function clearAppBadge(): Promise<void> {
  await setAppBadge(0);
}
