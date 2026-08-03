/**
 * The single service-worker registrar.
 *
 * Nothing else in the app may call `serviceWorker.register`. The worker is
 * only allowed in a published production build: dev, the Lovable editor
 * preview, any iframe and `?sw=off` unregister it instead, so a stale cache
 * can never strand a preview.
 */
import { registerSW } from "virtual:pwa-register";

export const SW_URL = "/sw.js";
export const OUTBOX_SYNC_TAG = "sakan-outbox-sync";
export const CONTENT_REFRESH_TAG = "sakan-content-refresh";
/** Surfaced in Settings so support can tell which build a member is running. */
export const APP_VERSION: string = import.meta.env["VITE_APP_VERSION"] ?? "1.0.0";

export type PwaEvent = "sakan:update-ready" | "sakan:offline-ready";

function isPreviewHost(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

/** True when a service worker must not be installed in this context. */
export function serviceWorkerAllowed(): boolean {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (window.self !== window.top) return false;
  if (isPreviewHost(window.location.hostname)) return false;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return false;
  return true;
}

/** Removes any previously installed app worker and its caches. */
export async function unregisterAppWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => new URL(registration.scope).origin === window.location.origin)
      .map((registration) => registration.unregister()),
  );
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.allSettled(
      keys
        .filter((key) => key.startsWith("sakan-") || key.startsWith("workbox-"))
        .map((key) => caches.delete(key)),
    );
  }
}

/** Background Sync + Periodic Background Sync, both optional by design. */
export async function registerSyncTags(registration: ServiceWorkerRegistration): Promise<void> {
  const withSync = registration as ServiceWorkerRegistration & {
    sync?: { register: (tag: string) => Promise<void> };
    periodicSync?: {
      register: (tag: string, options: { minInterval: number }) => Promise<void>;
      getTags?: () => Promise<string[]>;
    };
  };

  // One-off replay when connectivity returns.
  try {
    await withSync.sync?.register(OUTBOX_SYNC_TAG);
  } catch {
    /* Safari/Firefox: the online listener replays instead */
  }

  // Periodic refresh requires an installed app plus a granted permission.
  try {
    if (!withSync.periodicSync) return;
    const status = await navigator.permissions
      .query({ name: "periodic-background-sync" as PermissionName })
      .catch(() => null);
    if (status && status.state !== "granted") return;
    const tags = (await withSync.periodicSync.getTags?.()) ?? [];
    if (!tags.includes(CONTENT_REFRESH_TAG)) {
      await withSync.periodicSync.register(CONTENT_REFRESH_TAG, {
        minInterval: 12 * 60 * 60 * 1000,
      });
    }
    if (!tags.includes(OUTBOX_SYNC_TAG)) {
      await withSync.periodicSync.register(OUTBOX_SYNC_TAG, {
        minInterval: 6 * 60 * 60 * 1000,
      });
    }
  } catch {
    /* unsupported — graceful no-op */
  }
}

let started = false;

/**
 * Registers (or removes) the worker. Returns a cleanup function.
 * Safe to call more than once; only the first call does work.
 */
export function startServiceWorker(): () => void {
  if (typeof window === "undefined") return () => undefined;

  if (!serviceWorkerAllowed()) {
    void unregisterAppWorker();
    return () => undefined;
  }
  if (started) return () => undefined;
  started = true;

  // `autoUpdate`: the new worker takes control on its own, then the app shows
  // a reload banner because the open page is still running the old bundle.
  let hadController = Boolean(navigator.serviceWorker.controller);
  const onControllerChange = () => {
    if (!hadController) {
      hadController = true;
      return; // first install — nothing to reload
    }
    window.dispatchEvent(new CustomEvent("sakan:update-ready"));
  };
  navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

  let updateTimer = 0;
  registerSW({
    immediate: true,
    onRegisteredSW: (_url, registration) => {
      if (!registration) return;
      void registerSyncTags(registration);
      // Hourly update check for long-lived installed sessions.
      updateTimer = window.setInterval(
        () => {
          void registration.update().catch(() => undefined);
        },
        60 * 60 * 1000,
      );
    },
    onOfflineReady: () => {
      window.dispatchEvent(new CustomEvent("sakan:offline-ready"));
    },
    onRegisterError: () => undefined,
  });

  return () => {
    window.clearInterval(updateTimer);
    navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  };
}

/** Applies a waiting update by reloading the page. */
export function applyUpdate(): void {
  window.location.reload();
}