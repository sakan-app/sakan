import { useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { useFeatureStrings } from "@/i18n/feature";
import { pwaStrings } from "@/components/pwa/pwa.strings";

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
  const t = useFeatureStrings(pwaStrings);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      deferredInstallPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new CustomEvent("sakan:install-available"));
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    function registerSw() {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                toast(t.updateAvailable, {
                  action: {
                    label: t.updateReload,
                    onClick: () => {
                      installing.postMessage({ type: "SKIP_WAITING" });
                      window.location.reload();
                    },
                  },
                  duration: 15000,
                });
              }
            });
          });
        })
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
  }, [t]);

  return <>{children}</>;
}
