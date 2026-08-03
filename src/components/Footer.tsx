import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Twitter, Mail, Globe, MapPin } from "lucide-react";
import logo from "@/assets/sakan-logo.png.asset.json";
import { COMPANY, COMPANY_ADDRESS_LINES } from "@/lib/company";

const SITE_LINKS = [
  { to: "/about", label: "عن المنصة" },
  { to: "/guide", label: "دليل قانون الزواج" },
  { to: "/pricing", label: "باقات الاشتراك" },
  { to: "/search", label: "ابحث عن شريك" },
] as const;

const LEGAL_LINKS = [
  { to: "/privacy", label: "سياسة الخصوصية (GDPR)" },
  { to: "/terms", label: "شروط الخدمة" },
  { to: "/impressum", label: "Impressum" },
] as const;

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-gold/15 bg-navy-deep pt-14 text-cream/80">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 start-1/3 h-[320px] w-[320px] rounded-full bg-gold/10 blur-[120px]"
      />
      <div className="relative mx-auto grid max-w-[1360px] gap-10 px-6 pb-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo.url} alt="شعار سكن" className="h-12 w-12 object-contain" loading="lazy" />
            <span className="text-lg font-bold text-cream">
              سكن <span className="text-gold/60">|</span>{" "}
              <span className="latin text-sm text-gold">SAKAN</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-7 text-cream/60">
            منصة دولية آمنة للتعارف الجاد والزواج المستقر في أوروبا والعالم العربي.
          </p>
          <div className="mt-5 flex gap-3">
            {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
              <span
                key={i}
                className="tap-scale grid h-9 w-9 place-items-center rounded-full border border-gold/30 text-gold transition-colors hover:border-gold hover:bg-gold/10"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-gold">روابط مهمة</h3>
          <ul className="space-y-2 text-sm text-cream/70">
            {SITE_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-gold">قانوني</h3>
          <ul className="space-y-2 text-sm text-cream/70">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-gold">تواصل معنا</h3>
          <ul className="space-y-3 text-sm text-cream/70">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gold" />
              <a className="latin hover:text-gold" href={`mailto:${COMPANY.infoEmail}`}>
                {COMPANY.infoEmail}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gold" />
              <a className="latin hover:text-gold" href={`mailto:${COMPANY.serviceEmail}`}>
                {COMPANY.serviceEmail}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-gold" />
              <a
                className="latin hover:text-gold"
                href={COMPANY.website}
                rel="noreferrer"
                target="_blank"
              >
                {COMPANY.websiteLabel}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-gold" />
              <address className="latin not-italic leading-6">
                {COMPANY_ADDRESS_LINES.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-gold/10 py-5 text-center text-xs text-cream/50">
        © {COMPANY.year} {COMPANY.brandAr} — {COMPANY.legalName} · {COMPANY.city},{" "}
        {COMPANY.country}
      </div>
    </footer>
  );
}