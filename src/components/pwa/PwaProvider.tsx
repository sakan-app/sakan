import { useEffect, type ReactNode } from "react";

import { flushOutbox } from "@/lib/outbox";

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

export function PwaProvider({ children }: { children: ReactNode }) {
  // Replay any offline-queued writes when the network or the SW says so.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const flush = () => {
      void flushOutbox().catch(() => undefined);
    };

    function onMessage(event: MessageEvent) {
      if (event.data?.type === "sakan:flush-outbox") flush();
      if (event.data?.type === "sakan:navigate" && typeof event.data.url === "string") {
        window.location.assign(event.data.url);
      }
    }

    window.addEventListener("online", flush);
    navigator.serviceWorker?.addEventListener("message", onMessage);
    if (navigator.onLine) flush();

    return () => {
      window.removeEventListener("online", flush);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const hostname = window.location.hostname;
    const isPreview =
      window.self !== window.top ||
      hostname.startsWith("id-preview--") ||
      hostname.startsWith("preview--") ||
      hostname === "lovableproject.com" ||
      hostname.endsWith(".lovableproject.com") ||
      hostname === "lovableproject-dev.com" ||
      hostname.endsWith(".lovableproject-dev.com") ||
      hostname === "beta.lovable.dev" ||
      hostname.endsWith(".beta.lovable.dev");
    const swDisabled = new URLSearchParams(window.location.search).get("sw") === "off";

    async function removeStaleAppWorker() {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        registrations
          .filter((registration) => new URL(registration.scope).origin === window.location.origin)
          .map((registration) => registration.unregister()),
      );
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.allSettled(
          keys.filter((key) => key.startsWith("sakan-")).map((key) => caches.delete(key)),
        );
      }
    }

    if (!import.meta.env.PROD || isPreview || swDisabled) {
      void removeStaleAppWorker();
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      deferredInstallPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new CustomEvent("sakan:install-available"));
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    function registerSw() {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => undefined)
        .catch(() => {
          // registration failures shouldn't break the app
        });
    }

    if (document.readyState === "complete") {
      registerSw();
    } else {
      window.addEventListener("load", registerSw);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("load", registerSw);
    };
  }, []);

  return <>{children}</>;
}
