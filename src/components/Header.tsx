import { Link } from "@tanstack/react-router";
import { Globe, Menu } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/sakan-logo.png.asset.json";

const nav = [
  { label: "الرئيسية", to: "/" },
  { label: "عن المنصة", to: "/" },
  { label: "قصص نجاح", to: "/" },
  { label: "باقات الاشتراك", to: "/" },
];

export function Header() {
  const [open, setOpen] = useState(false);

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
          <div className="hidden items-center gap-2 rounded-md border border-gold/30 px-3 py-1.5 text-xs text-cream/90 md:flex">
            <Globe className="h-4 w-4 text-gold" />
            العربية
          </div>
          <button className="btn-outline-gold hidden px-4 py-2 text-xs font-semibold sm:block">
            تسجيل الدخول
          </button>
          <button onClick={() => setOpen(!open)} aria-label="القائمة" className="text-gold lg:hidden">
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
            <button className="btn-outline-gold mt-1 px-4 py-2 text-xs font-semibold">
              تسجيل الدخول
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}