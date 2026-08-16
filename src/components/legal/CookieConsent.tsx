import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useFeatureStrings } from "@/i18n/feature";
import {
  COOKIE_CONSENT_KEY,
  consentStrings,
  type CookieConsentValue,
} from "@/lib/consent/strings";

/**
 * GDPR cookie banner.
 *
 * Essential functionality keeps working without any choice; only the stored
 * "all" value unlocks non-essential tracking (see `optionalCookiesAllowed`).
 */
export function CookieConsent() {
  const s = useFeatureStrings(consentStrings);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(COOKIE_CONSENT_KEY)) setVisible(true);
    } catch {
      /* storage blocked — stay silent, essential features still work */
    }
  }, []);

  const decide = (value: CookieConsentValue) => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={s.cookieTitle}
      className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-4"
    >
      <div className="mx-auto flex max-w-[900px] flex-col gap-3 rounded-2xl border border-gold/30 bg-navy-deep/95 p-4 text-cream shadow-[var(--shadow-card)] backdrop-blur-xl sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gold">{s.cookieTitle}</p>
          <p className="mt-1 text-xs leading-6 text-cream/70">
            {s.cookieText}{" "}
            <Link to="/privacy" className="font-semibold text-gold underline-offset-4 hover:underline">
              {s.cookiePrivacyLink}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("essential")}
            className="rounded-xl border border-cream/25 px-4 py-2 text-xs font-bold text-cream/80 hover:border-cream/50"
          >
            {s.cookieEssentialOnly}
          </button>
          <button type="button" onClick={() => decide("all")} className="btn-gold px-4 py-2 text-xs">
            {s.cookieAcceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}