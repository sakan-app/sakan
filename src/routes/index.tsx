import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  Brain,
  Globe2,
  Heart,
  Lock,
  MapPin,
  Radio,
  ShieldCheck,
  Star,
  User,
  Users,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MemberCard } from "@/components/MemberCard";
import { countries, members, type Gender } from "@/data/members";
import hero from "@/assets/hero-couple.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سَكَن | منصة تجمع القلوب لتبني بيتاً واحداً" },
      {
        name: "description",
        content:
          "ابحث عن شريك حياتك عبر منصة سَكَن: تعارف جاد وموثّق للزواج المستقر في أوروبا والعالم العربي.",
      },
      { property: "og:title", content: "سَكَن | منصة تجمع القلوب لتبني بيتاً واحداً" },
      {
        property: "og:description",
        content: "بحث ذكي، حسابات موثقة، وخصوصية كاملة — ابدأ رحلتك الآن.",
      },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Lock, title: "بيئة آمنة وموثوقة", text: "حماية صارمة وقوانين أوروبية تضمن خصوصيتك (GDPR)." },
  { icon: BadgeCheck, title: "حسابات حقيقية 100%", text: "نظام تحقق صارم من الهوية والصور لمنع الحسابات الوهمية." },
  { icon: Brain, title: "ذكاء اصطناعي للمطابقة", text: "خوارزميات دقيقة تقترح من شريك حياتك بناءً على توافق الشخصيات." },
  { icon: Globe2, title: "تواصل بلا حدود", text: "ترجمة فورية لرسائلك داخل الشات لكسر حاجز اللغات الأربع." },
];

const stories = [
  { names: "كريم و ألينا", country: "ألمانيا", flag: "🇩🇪", text: "أكثر من منصة تعارف، إنها بداية لحياة جديدة مليئة بالحب." },
  { names: "دانيال ونور", country: "النمسا", flag: "🇦🇹", text: "التقينا هنا وبدأت حكايتنا الجميلة. الحمد لله الذي جمعنا عبر سَكَن." },
  { names: "أحمد وسفيتلانا", country: "ألمانيا", flag: "🇩🇪", text: "منصة رائعة جمعتنا ووجدنا معاً بيتاً على توافق حقيقي. شكراً سَكَن!" },
];

function Index() {
  const navigate = useNavigate();
  const [iAm, setIAm] = useState<Gender>("male");
  const [lookingFor, setLookingFor] = useState<Gender>("female");
  const [minAge, setMinAge] = useState(25);
  const [maxAge, setMaxAge] = useState(35);
  const [country, setCountry] = useState("all");

  const live = members.filter((m) => m.online).slice(0, 5);
  const nearby = members.slice(0, 8);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { iAm, lookingFor, minAge, maxAge, country } });
  };

  const genderBtn = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
      active
        ? "border-gold bg-gold/15 font-bold text-gold"
        : "border-gold/25 text-cream/70 hover:border-gold/50"
    }`;

  return (
    <div className="min-h-screen bg-navy-deep">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-deep">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[280px] lg:min-h-[560px]">
            <img
              src={hero}
              alt="عروسان يقفان معاً في شارع أوروبي عند الغروب"
              width={1200}
              height={900}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-navy-deep/20 to-navy-deep" />
          </div>

          <div className="flex flex-col justify-center gap-8 px-6 py-10 lg:px-12">
            <div>
              <h1 className="text-3xl font-black leading-tight text-cream sm:text-4xl lg:text-5xl">
                منصة تجمع القلوب
                <br />
                <span className="gold-text">لتبني بيتاً واحداً</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-8 text-cream/70 lg:text-base">
                منصتك الدولية الآمنة للتعارف الجاد والزواج المستقر في أوروبا والعالم العربي.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6">
                {[
                  { icon: Users, value: "125K+", label: "أعضاء موثقون" },
                  { icon: Heart, value: "8K+", label: "قصة نجاح" },
                  { icon: Globe2, value: "45+", label: "دول حول العالم" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <s.icon className="h-5 w-5 text-gold" />
                    <div>
                      <p className="text-lg font-bold text-cream">{s.value}</p>
                      <p className="text-[11px] text-cream/60">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH PANEL */}
        <div className="relative z-10 mx-auto -mt-4 w-full max-w-[1360px] px-4 lg:absolute lg:left-8 lg:top-1/2 lg:mt-0 lg:w-[420px] lg:-translate-y-1/2 lg:px-0">
          <form onSubmit={submit} className="panel-navy p-5">
            <div className="mb-4 text-center text-xs text-gold/70">✦ ابحث عن شريك حياتك ✦</div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-cream/80">أنا</label>
                <div className="flex gap-2">
                  <button type="button" className={genderBtn(iAm === "male")} onClick={() => setIAm("male")}>
                    <User className="h-4 w-4" /> رجل
                  </button>
                  <button type="button" className={genderBtn(iAm === "female")} onClick={() => setIAm("female")}>
                    <User className="h-4 w-4" /> امرأة
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-cream/80">أبحث عن</label>
                <div className="flex gap-2">
                  <button type="button" className={genderBtn(lookingFor === "male")} onClick={() => setLookingFor("male")}>
                    <User className="h-4 w-4" /> رجل
                  </button>
                  <button type="button" className={genderBtn(lookingFor === "female")} onClick={() => setLookingFor("female")}>
                    <User className="h-4 w-4" /> امرأة
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-cream/80">العمر من</label>
                <select className="field-navy" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))}>
                  {Array.from({ length: 43 }, (_, i) => 18 + i).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-cream/80">إلى</label>
                <select className="field-navy" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))}>
                  {Array.from({ length: 43 }, (_, i) => 18 + i).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold text-cream/80">مكان الإقامة</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
                <select className="field-navy" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="all">اختر الدولة</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.ar}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-gold mt-5 w-full py-3 text-base">
              ابدأ رحلتك الآن
            </button>
            <p className="mt-3 flex items-center justify-center gap-2 text-[11px] text-cream/50">
              <Lock className="h-3 w-3 text-gold" /> آمن، خاص وسريع 100%
            </p>
          </form>
        </div>
      </section>

      {/* LIVE STRIP */}
      <section className="mx-auto mt-6 max-w-[1360px] px-4 lg:px-8">
        <div className="panel-navy flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-gold">
            <Radio className="h-5 w-5" />
            <span className="latin text-xs font-bold">LIVE</span>
            <span className="text-[11px] text-cream/60">نشط الآن</span>
          </div>
          <p className="text-sm font-bold text-cream">
            أعضاء موثقون نشطون الآن <span className="text-gold">(ميزة 1 يورو)</span>
          </p>
          <div className="no-scrollbar flex gap-4 overflow-x-auto">
            {live.map((m) => (
              <div key={m.id} className="flex shrink-0 items-center gap-2">
                <div className="relative">
                  <img
                    src={m.profilePhoto}
                    alt={m.name}
                    loading="lazy"
                    className="h-11 w-11 rounded-full border border-gold/40 object-cover"
                  />
                  <BadgeCheck className="absolute -bottom-1 -left-1 h-4 w-4 text-sky-400" />
                </div>
                <div className="text-[11px] leading-4">
                  <p className="font-semibold text-cream">{m.name}، {m.age}</p>
                  <p className="text-cream/55">{m.countryFlag} {m.cityAr}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-gold">
            <Users className="h-5 w-5" />
            <div className="text-[11px]">
              <p className="font-bold">+1253</p>
              <p className="text-cream/55">عضواً نشطاً الآن</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SAKAN */}
      <section className="bg-cream py-14">
        <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-black text-navy">
            <span className="text-gold">✦</span> لماذا سَكَن؟ <span className="text-gold">✦</span>
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold/40 bg-white shadow-[var(--shadow-card)]">
                  <f.icon className="h-7 w-7 text-gold-deep" />
                </div>
                <h3 className="mt-4 text-base font-bold text-navy">{f.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEARBY MEMBERS */}
      <section className="bg-cream pb-14">
        <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
          <h2 className="mb-8 flex items-center justify-center gap-2 text-center text-xl font-black text-navy">
            <MapPin className="h-5 w-5 text-gold" /> أعضاء نشطون بالقرب منك
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {nearby.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate({ to: "/search", search: { iAm, lookingFor, minAge: 18, maxAge: 60, country: "all" } })}
              className="btn-outline-gold border-gold-deep/50 px-8 py-2.5 text-sm font-semibold text-gold-deep"
            >
              عرض المزيد من الأعضاء
            </button>
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <section className="bg-cream pb-16">
        <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
          <h2 className="mb-8 flex items-center justify-center gap-2 text-center text-xl font-black text-navy">
            <Heart className="h-5 w-5 text-gold" /> قصص نجاح
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {stories.map((s) => (
              <article
                key={s.names}
                className="rounded-xl border border-gold/25 bg-white p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy">{s.names}</h3>
                  <span className="text-xs text-muted-foreground">{s.flag} {s.country}</span>
                </div>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">{s.text}</p>
                <div className="mt-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                  ))}
                </div>
              </article>
            ))}
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-gold-deep" /> جميع الحسابات موثقة يدوياً
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
