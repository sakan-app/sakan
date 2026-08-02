import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n";

/** Announces loss of connectivity so failed queries are explainable to the user. */
export function OfflineBanner() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 bg-navy-deep px-4 py-2 text-xs font-semibold text-gold"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      {t.system.offline}
    </div>
  );
}
