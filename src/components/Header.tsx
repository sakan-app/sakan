import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Globe, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/sakan-logo.png.asset.json";
import { useI18n } from "@/lib/i18n";
import { localeFlags, localeNames, localeOrder } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { t, locale, setLocale } = useI18n();
  const { isAuthenticated, signOut } = useAuth();
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
    setOpen(false);
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
          <div ref={langRef} className="relative hidden md:block">
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
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
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
          <button onClick={() => setOpen(!open)} aria-label={t.nav.menu} className="text-gold lg:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gold/15 bg-navy-deep px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-3">
            {nav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="text-sm text-cream/85"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-1 flex flex-wrap gap-2">
              {localeOrder.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                    code === locale
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-gold/25 text-cream/80"
                  }`}
                >
                  {localeFlags[code]} {localeNames[code]}
                </button>
              ))}
            </div>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="text-sm text-cream/85"
                >
                  {t.nav.myProfile}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="btn-outline-gold mt-1 px-4 py-2 text-xs font-semibold"
                >
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="btn-outline-gold mt-1 px-4 py-2 text-center text-xs font-semibold"
              >
                {t.nav.login}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}