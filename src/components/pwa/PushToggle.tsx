import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";

import { useFeatureStrings } from "@/i18n/feature";
import { pwaStrings } from "@/components/pwa/pwa.strings";
import {
  disablePush,
  enablePush,
  pushSupported,
  readPushState,
  type PushState,
} from "@/lib/push/push-browser";
import { sendTestPush } from "@/lib/push/push.functions";
import { APP_VERSION } from "@/lib/pwa/register";

/** Settings row that manages the Web Push subscription for this device. */
export function PushToggle() {
  const t = useFeatureStrings(pwaStrings);
  const [state, setState] = useState<PushState>("prompt");
  const [busy, setBusy] = useState(false);

  // Resolved after mount so the server and client markup stay identical.
  useEffect(() => {
    void readPushState().then(setState);
  }, []);

  const enabled = state === "subscribed";
  const disabled = busy || state === "denied" || state === "unsupported";

  async function toggle() {
    if (disabled) return;
    setBusy(true);
    try {
      setState(enabled ? await disablePush() : await enablePush());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`${t.pushUnsupported} (${message})`);
      setState(await readPushState());
    } finally {
      setBusy(false);
    }
  }

  const hint = !pushSupported()
    ? t.pushUnsupported
    : state === "denied"
      ? t.pushBlocked
      : enabled
        ? t.pushEnabled
        : "";

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-disabled={disabled}
        onClick={toggle}
        className="relative flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-white/5 disabled:opacity-60"
        disabled={disabled}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-white/8 text-gold">
          <BellRing className="h-[17px] w-[17px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-cream">{t.pushTitle}</span>
          {hint && <span className="block text-[11px] text-cream/50">{hint}</span>}
        </span>
        <span
          aria-hidden
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-gold/80" : "bg-white/15"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              enabled ? "start-[1.375rem]" : "start-0.5"
            }`}
          />
        </span>
      </button>
      {enabled && (
        <button
          type="button"
          onClick={() => {
            void sendTestPush().catch(() => toast.error(t.pushUnsupported));
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-start text-xs font-semibold text-gold transition-colors hover:bg-white/5"
        >
          {t.pushTest}
        </button>
      )}
    </>
  );
}

/** Build indicator so support can identify the running version. */
export function VersionIndicator() {
  const t = useFeatureStrings(pwaStrings);
  return (
    <p className="mt-6 pb-4 text-center text-[11px] text-cream/35">
      {t.version} {APP_VERSION}
    </p>
  );
}