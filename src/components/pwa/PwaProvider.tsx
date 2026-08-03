import { useEffect, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";

import { flushOutbox, installOfflineWriteInterceptor } from "@/lib/outbox";
import { installAudioUnlock } from "@/lib/audio/engine";
import { startServiceWorker } from "@/lib/pwa/register";
import { setAppBadge } from "@/lib/pwa/badge";
import { logInstallEvent, resubscribePush } from "@/lib/push/push-browser";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredInstallPrompt;
}

export function clearDeferredInstallPrompt(): void {
  deferredInstallPrompt = null;
}

/** True when the app is running as an installed PWA. */
export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Browsers block audio until the first gesture; unlock once so notification
  // sounds and call tones can play later without a user-visible prompt.
  useEffect(() => installAudioUnlock(), []);

  // Capture every write made while offline so it can be replayed later.
  useEffect(() => installOfflineWriteInterceptor(), []);

  // Replay any offline-queued writes when the network or the SW says so.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const flush = () => {
      void flushOutbox().catch(() => undefined);
    };

    function onMessage(event: MessageEvent) {
      if (event.data?.type === "sakan:flush-outbox") flush();
      if (event.data?.type === "sakan:navigate" && typeof event.data.url === "string") {
        // Client-side deep link: keeps the session and avoids a full reload.
        void router.navigate({ to: event.data.url, replace: false }).catch(() => {
          window.location.assign(event.data.url);
        });
      }
      // A push arrived while a tab is open — mirror its badge count locally.
      if (event.data?.type === "sakan:push") {
        const badge = Number(event.data.payload?.badge_count);
        if (Number.isFinite(badge)) void setAppBadge(badge);
      }
      // The browser rotated the push subscription — persist the new one.
      if (event.data?.type === "sakan:push-resubscribe") {
        void resubscribePush(event.data.oldEndpoint ?? null).catch(() => undefined);
      }
    }

    window.addEventListener("online", flush);
    navigator.serviceWorker?.addEventListener("message", onMessage);
    if (navigator.onLine) flush();

    return () => {
      window.removeEventListener("online", flush);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [router]);

  // Single registration point for the Workbox service worker.
  useEffect(() => startServiceWorker(), []);

  // Install prompt capture + install analytics.
  useEffect(() => {
    if (typeof window === "undefined") return;

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      deferredInstallPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new CustomEvent("sakan:install-available"));
      void logInstallEvent("prompt_shown");
    }

    function onAppInstalled() {
      deferredInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("sakan:app-installed"));
      void logInstallEvent("installed");
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  return <>{children}</>;
}
