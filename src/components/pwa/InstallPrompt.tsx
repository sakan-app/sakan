import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useFeatureStrings } from "@/i18n/feature";
import { pwaStrings } from "@/components/pwa/pwa.strings";
import { clearDeferredInstallPrompt, getDeferredInstallPrompt } from "@/components/pwa/PwaProvider";

const DISMISS_KEY = "sakan-install-dismissed";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallPrompt() {
  const t = useFeatureStrings(pwaStrings);
  const [visible, setVisible] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(DISMISS_KEY);
    if (dismissed || isStandalone()) return;

    function onInstallAvailable() {
      setVisible(true);
    }

    window.addEventListener("sakan:install-available", onInstallAvailable);

    if (getDeferredInstallPrompt()) {
      setVisible(true);
    } else if (isIos()) {
      const timer = window.setTimeout(() => setVisible(true), 2500);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("sakan:install-available", onInstallAvailable);
      };
    }

    return () => window.removeEventListener("sakan:install-available", onInstallAvailable);
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    setShowIosInstructions(false);
    window.localStorage.setItem(DISMISS_KEY, "1");
  }

  async function handleInstall() {
    const prompt = getDeferredInstallPrompt();
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      clearDeferredInstallPrompt();
      setVisible(false);
      return;
    }
    if (isIos()) {
      setShowIosInstructions(true);
      return;
    }
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md px-4 lg:bottom-4"
      role="dialog"
      aria-label={t.installTitle}
    >
      <div className="panel-navy flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15">
          <Download className="h-5 w-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-cream">{t.installTitle}</p>
          <p className="mt-1 text-xs text-cream/70">
            {showIosInstructions ? t.iosBody : t.installBody}
          </p>
          {!showIosInstructions && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="btn-gold px-4 py-1.5 text-xs font-semibold"
              >
                {t.installAction}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="btn-outline-gold px-4 py-1.5 text-xs font-semibold"
              >
                {t.installDismiss}
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.installDismiss}
          className="shrink-0 text-cream/50 hover:text-cream"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
