import { Facebook, Instagram, Youtube, Twitter, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/sakan-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-navy-deep pt-12 text-cream/80">
      <div className="mx-auto grid max-w-[1360px] gap-10 px-6 pb-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
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
                className="grid h-9 w-9 place-items-center rounded-full border border-gold/30 text-gold"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-gold">روابط مهمة</h3>
          <ul className="space-y-2 text-sm text-cream/70">
            {["عن المنصة", "قصص نجاح", "باقات الاشتراك", "اتصل بنا"].map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-gold">قانوني</h3>
          <ul className="space-y-2 text-sm text-cream/70">
            {["سياسة الخصوصية (GDPR)", "شروط الخدمة", "Impressum", "ملفات تعريف الارتباط (Cookies)"].map(
              (l) => (
                <li key={l}>{l}</li>
              ),
            )}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-gold">تواصل معنا</h3>
          <ul className="space-y-3 text-sm text-cream/70">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" /> info@sakanapp.net
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" /> +49 30 12345678
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" /> برلين، ألمانيا
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gold/10 py-4 text-center text-xs text-cream/50">
        © جميع الحقوق محفوظة لمنصة سَكَن 2026
      </div>
    </footer>
  );
}