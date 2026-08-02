import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/sakan-logo.png.asset.json";
import { useI18n } from "@/lib/i18n";
import { localeFlags, localeNames, localeOrder } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useFeatureStrings } from "@/i18n/feature";

const headerStrings = {
  ar: { messages: "الرسائل" },
  en: { messages: "Messages" },
  de: { messages: "Nachrichten" },
  ru: { messages: "Сообщения" },
};

export function Header() {
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { t, locale, setLocale } = useI18n();
  const { isAuthenticated, signOut } = useAuth();
  const hs = useFeatureStrings(headerStrings);
  const navigate = useNavigate();

  const nav = [
    { label: t.nav.home, to: "/" },
    { label: t.nav.about, to: "/" },
    { label: t.nav.stories, to: "/" },
    { label: t.nav.plans, to: "/" },
  ];

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gold/15 bg-navy-deep/95 backdrop-blur">
      <div className="mx-auto grid max-w-[1360px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo.url} alt="شعار منصة سكن" className="h-11 w-11 object-contain" />
          <span className="hidden text-lg font-bold text-cream sm:block">
            سكن <span className="text-gold/60">|</span>{" "}
            <span className="latin text-sm text-gold">SAKAN</span>
          </span>
        </Link>

        <nav className="hidden items-center justify-center gap-8 lg:flex">
          {nav.map((item, i) => (
            <Link
              key={item.label}
              to={item.to}
              className={`text-sm transition-colors hover:text-gold ${
                i === 0
                  ? "border-b-2 border-gold pb-1 font-semibold text-gold"
                  : "text-cream/80"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-label={t.nav.language}
              aria-expanded={langOpen}
              className="flex items-center gap-2 rounded-md border border-gold/30 px-3 py-1.5 text-xs text-cream/90 transition-colors hover:border-gold/60"
            >
              <Globe className="h-4 w-4 text-gold" />
              {localeNames[locale]}
            </button>
            {langOpen && (
              <div className="absolute end-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border border-gold/25 bg-navy-deep py-1 shadow-xl">
                {localeOrder.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setLocale(code);
                      setLangOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-xs text-cream/85 transition-colors hover:bg-gold/10 hover:text-gold"
                  >
                    <span aria-hidden>{localeFlags[code]}</span>
                    <span className="flex-1">{localeNames[code]}</span>
                    {code === locale && <Check className="h-3.5 w-3.5 text-gold" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/messages" className="text-xs font-semibold text-cream/85 hover:text-gold">
                {hs.messages}
              </Link>
              <Link to="/profile" className="text-xs font-semibold text-cream/85 hover:text-gold">
                {t.nav.myProfile}
              </Link>
              <button
                onClick={handleSignOut}
                className="btn-outline-gold px-4 py-2 text-xs font-semibold"
              >
                {t.nav.logout}
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="btn-outline-gold hidden px-4 py-2 text-xs font-semibold sm:block"
            >
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}