import { createFileRoute, Link } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";
import { useFeatureStrings } from "@/i18n/feature";
import { pwaStrings } from "@/components/pwa/pwa.strings";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/offline")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لا يوجد اتصال بالإنترنت | سَكَن" },
      { name: "description", content: "يبدو أنك غير متصل حالياً. تحقق من الاتصال وحاول مرة أخرى." },
      { property: "og:title", content: "لا يوجد اتصال بالإنترنت | سَكَن" },
      { property: "og:description", content: "يبدو أنك غير متصل حالياً. تحقق من الاتصال وحاول مرة أخرى." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OfflinePage,
  errorComponent: RouteErrorBoundary,
});

function OfflinePage() {
  const t = useFeatureStrings(pwaStrings);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-navy-deep px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-navy">
        <WifiOff className="h-9 w-9 text-gold" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-cream">{t.offlineTitle}</h1>
        <p className="mt-2 max-w-sm text-sm text-cream/70">{t.offlineBody}</p>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="btn-gold px-6 py-2.5 text-sm font-semibold"
      >
        {t.offlineRetry}
      </button>
      <Link to="/" className="text-xs text-gold/80 hover:text-gold">
        سَكَن | SAKAN
      </Link>
    </div>
  );
}
