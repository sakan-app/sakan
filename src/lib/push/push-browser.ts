/**
 * Browser-side Web Push helpers: permission flow, subscribe/unsubscribe,
 * rotation handling and install analytics.
 */
import {
  deletePushSubscription,
  getPushConfig,
  savePushSubscription,
} from "@/lib/push/push.functions";
import { recordInstallEvent } from "@/lib/pwa/analytics.functions";

export type PushState = "unsupported" | "denied" | "prompt" | "subscribed";

function base64UrlToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function keyToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  let binary = "";
  new Uint8Array(buffer).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * `navigator.serviceWorker.ready` never settles when no worker ever reaches
 * "activated" — a broken or absent SW build makes it hang forever, which in
 * turn hangs the whole subscribe flow with no error. Bound the wait so the
 * caller gets a real failure instead of an infinite spinner.
 */
async function activeRegistration(timeoutMs = 10_000): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing?.active) return existing;

  // No worker yet (first run, or a registration that never activated): ask for
  // one explicitly instead of waiting forever on `ready`.
  if (!existing) {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
  }

  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
  if (!registration) throw new Error("push_service_worker_unavailable");
  return registration;
}

/** Current state without triggering any permission prompt. */
export async function readPushState(): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) return "subscribed";
  } catch {
    /* ignore */
  }
  return Notification.permission === "granted" ? "prompt" : "prompt";
}

function serialize(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.["p256dh"] ?? keyToBase64Url(subscription.getKey("p256dh")),
    auth: json.keys?.["auth"] ?? keyToBase64Url(subscription.getKey("auth")),
    expirationTime: subscription.expirationTime ?? null,
    userAgent: navigator.userAgent.slice(0, 500),
    locale: document.documentElement.lang || "ar",
  };
}

function sameApplicationServerKey(subscription: PushSubscription, publicKey: string): boolean {
  const current = subscription.options?.applicationServerKey;
  if (!current) return true;
  return keyToBase64Url(current as ArrayBuffer) === publicKey.replace(/=+$/, "");
}

/**
 * Asks for permission (if needed), subscribes with the server VAPID key and
 * stores the device. Returns the resulting state.
 */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return "unsupported";

  const config = await getPushConfig();
  if (!config.configured || !config.publicKey) return "unsupported";

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "prompt";

  const registration = await activeRegistration();
  let existing = await registration.pushManager.getSubscription();
  // A subscription created with a different VAPID key is silently rejected by
  // the push service (403) — drop it and mint a new one.
  if (existing && !sameApplicationServerKey(existing, config.publicKey)) {
    await deletePushSubscription({ data: { endpoint: existing.endpoint } }).catch(() => undefined);
    await existing.unsubscribe().catch(() => undefined);
    existing = null;
  }
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(config.publicKey) as BufferSource,
    }));

  await savePushSubscription({ data: serialize(subscription) });
  return "subscribed";
}

/** Removes the browser subscription and the stored row. */
export async function disablePush(): Promise<PushState> {
  if (!pushSupported()) return "unsupported";
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return "prompt";
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe().catch(() => undefined);
  await deletePushSubscription({ data: { endpoint } }).catch(() => undefined);
  return "prompt";
}

/**
 * Handles `pushsubscriptionchange`: drops the expired endpoint and stores the
 * replacement the browser created.
 */
export async function resubscribePush(oldEndpoint: string | null): Promise<void> {
  if (!pushSupported()) return;
  if (oldEndpoint) {
    await deletePushSubscription({ data: { endpoint: oldEndpoint } }).catch(() => undefined);
  }
  if (Notification.permission !== "granted") return;
  await enablePush().catch(() => undefined);
}

/** Fire-and-forget install funnel analytics. */
export async function logInstallEvent(
  eventType: "prompt_shown" | "accepted" | "dismissed" | "installed",
): Promise<void> {
  try {
    await recordInstallEvent({
      data: {
        eventType,
        platform: navigator.userAgent.slice(0, 60),
        locale: document.documentElement.lang || "ar",
      },
    });
  } catch {
    /* analytics is best-effort */
  }
}