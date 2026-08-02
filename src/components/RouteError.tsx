import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { useEffect } from "react";

import { reportLovableError } from "@/lib/lovable-error-reporting";

function isNetworkError(error: Error) {
  const message = `${error?.message ?? ""}`.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("offline")
  );
}

/**
 * Unified route-level error boundary UI. Wire it into every route via
 * `errorComponent` (or the router-wide default) so failures never render a
 * blank screen.
 */
export function RouteErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const offline = isNetworkError(error);

  useEffect(() => {
    reportLovableError(error, { boundary: "route_error_component" });
  }, [error]);

  return (
    <div role="alert" className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/12 text-gold">
          {offline ? (
            <WifiOff className="h-6 w-6" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          )}
        </span>
        <h1 className="mt-4 text-lg font-bold text-foreground">
          {offline ? "لا يوجد اتصال بالإنترنت" : "تعذّر تحميل هذه الصفحة"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {offline
            ? "تحقّق من اتصالك ثم أعد المحاولة. سيتم استئناف عملك تلقائياً عند عودة الشبكة."
            : "حدث خطأ غير متوقّع. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            إعادة المحاولة
          </button>
          <Link
            to="/"
            className="inline-flex items-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Unified route-level pending UI used while loaders and suspense resolve. */
export function RoutePending({ label = "جارٍ التحميل…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground"
    >
      <Loader2 className="h-5 w-5 animate-spin text-gold" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}