import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { useFeatureStrings } from "@/i18n/feature";
import { pwaStrings } from "@/components/pwa/pwa.strings";
import { applyUpdate } from "@/lib/pwa/register";

/**
 * Shown when the service worker installed a newer build than the one the open
 * page is running. Reloading swaps the page onto the already-active worker.
 */
export function UpdateBanner() {
  const t = useFeatureStrings(pwaStrings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function onUpdate() {
      setReady(true);
    }
    window.addEventListener("sakan:update-ready", onUpdate);
    return () => window.removeEventListener("sakan:update-ready", onUpdate);
  }, []);

  if (!ready) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top))] z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-gold/25 bg-navy/90 px-4 py-3 shadow-xl backdrop-blur-xl"
    >
      <RefreshCw className="h-4 w-4 shrink-0 text-gold" aria-hidden />
      <p className="min-w-0 flex-1 text-xs font-semibold text-cream">{t.updateAvailable}</p>
      <button
        type="button"
        onClick={applyUpdate}
        className="btn-gold shrink-0 px-3 py-1.5 text-xs font-semibold"
      >
        {t.updateReload}
      </button>
    </div>
  );
}