import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  UserRound,
  Users,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "@tanstack/react-router";
import { useFeatureStrings } from "@/i18n/feature";
import { billingStrings } from "@/lib/billing/strings";
import { plansQuery } from "@/lib/billing/queries";
import { formatPrice } from "@/lib/billing/types";
import { FeaturedTicker } from "@/components/ads/FeaturedTicker";
import { AdSlot } from "@/components/ads/AdSlot";
import { MemberCard } from "@/components/MemberCard";
import { activeMembersQuery, type Gender } from "@/lib/members";
import { useI18n } from "@/lib/i18n";
import { COUNTRY_CODES, countryFlag } from "@/lib/countries";
import hero from "@/assets/hero-couple.jpg";
import { RouteErrorBoundary } from "@/components/RouteError";

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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "سَكَن | SAKAN",
              url: "https://www.sakanapp.net",
              logo: "https://www.sakanapp.net/icons/icon-512.png",
              description:
                "منصة دولية للتعارف الجاد والزواج المستقر في أوروبا والعالم العربي.",
            },
            {
              "@type": "WebSite",
              name: "سَكَن | SAKAN",
              url: "https://www.sakanapp.net",
              inLanguage: ["ar", "en", "de", "fr"],
              potentialAction: {
                "@type": "SearchAction",
                target: "https://www.sakanapp.net/search?country={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
  errorComponent: RouteErrorBoundary,
});

const featureIcons = [Lock, BadgeCheck, Brain, Globe2];
const storyFlags = ["🇩🇪", "🇦🇹", "🇩🇪"];

function Index() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const bs = useFeatureStrings(billingStrings);
  const plans = useQuery(plansQuery());
  const [iAm, setIAm] = useState<Gender>("male");
  const [lookingFor, setLookingFor] = useState<Gender>("female");
  const [minAge, setMinAge] = useState(25);
  const [maxAge, setMaxAge] = useState(35);
  const [country, setCountry] = useState("all");

  const membersQ = useQuery(activeMembersQuery(12));
  const allMembers = membersQ.data ?? [];
  const live = allMembers.filter((m) => m.online).slice(0, 5);
  const nearby = allMembers.slice(0, 8);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search", search: { iAm, lookingFor, minAge, maxAge, country, sort: "recent" as const, page: 1 } });
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
      <FeaturedTicker />

      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-deep">
        {/* Ambient light */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 start-1/4 h-[520px] w-[520px] rounded-full bg-gold/10 blur-[140px]"
        />
        <div className="relative grid lg:grid-cols-[420px_minmax(0,1fr)_1.1fr]">
          {/* SEARCH PANEL */}
          <div className="order-2 w-full px-4 pb-8 lg:order-none lg:self-center lg:px-6 lg:pb-0">
            <form onSubmit={submit} className="glass-card fade-up rounded-3xl p-5">
              <div className="mb-4 text-center text-xs text-gold/70">{t.home.searchBadge}</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-cream/80">{t.home.iAm}</label>
                  <div className="flex gap-2">
                    <button type="button" className={genderBtn(iAm === "male")} onClick={() => setIAm("male")}>
                      <User className="h-4 w-4" /> {t.home.male}
                    </button>
                    <button type="button" className={genderBtn(iAm === "female")} onClick={() => setIAm("female")}>
                      <User className="h-4 w-4" /> {t.home.female}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-cream/80">{t.home.lookingFor}</label>
                  <div className="flex gap-2">
                    <button type="button" className={genderBtn(lookingFor === "male")} onClick={() => setLookingFor("male")}>
                      <User className="h-4 w-4" /> {t.home.male}
                    </button>
                    <button type="button" className={genderBtn(lookingFor === "female")} onClick={() => setLookingFor("female")}>
                      <User className="h-4 w-4" /> {t.home.female}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-cream/80">{t.home.ageFrom}</label>
                  <select className="field-navy" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))}>
                    {Array.from({ length: 43 }, (_, i) => 18 + i).map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-cream/80">{t.home.ageTo}</label>
                  <select className="field-navy" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))}>
                    {Array.from({ length: 43 }, (_, i) => 18 + i).map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold text-cream/80">{t.home.residence}</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
                  <select className="field-navy" value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="all">{t.home.chooseCountry}</option>
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>{t.countries[code]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-gold mt-5 w-full py-3 text-base">
                {t.home.submit}
              </button>
              <p className="mt-3 flex items-center justify-center gap-2 text-[11px] text-cream/50">
                <Lock className="h-3 w-3 text-gold" /> {t.home.safeNote}
              </p>
            </form>
          </div>

          <div className="order-1 flex flex-col justify-center gap-8 px-6 py-10 lg:order-none lg:px-8">
            <div>
              <h1 className="text-3xl font-black leading-tight text-cream sm:text-4xl lg:text-5xl">
                {t.home.heroTitle1}
                <br />
                <span className="gold-text">{t.home.heroTitle2}</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-8 text-cream/70 lg:text-base">
                {t.home.heroSubtitle}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6">
                {[
                  { icon: Users, value: "125K+", label: t.home.statMembers },
                  { icon: Heart, value: "8K+", label: t.home.statStories },
                  { icon: Globe2, value: "45+", label: t.home.statCountries },
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

          <div className="relative order-first min-h-[280px] lg:order-none lg:min-h-[560px]">
            <img
              src={hero}
              alt={t.home.heroTitle1}
              width={1200}
              height={900}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-navy-deep/20 to-navy-deep" />
          </div>
        </div>
      </section>

      {/* LIVE STRIP */}
      <section className="mx-auto mt-6 max-w-[1360px] px-4 lg:px-8">
        <div className="panel-navy flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-gold">
            <Radio className="h-5 w-5" />
            <span className="latin text-xs font-bold">LIVE</span>
            <span className="text-[11px] text-cream/60">{t.home.liveNow}</span>
          </div>
          <p className="text-sm font-bold text-cream">
            {t.home.liveTitle} <span className="text-gold">{t.home.liveBadge}</span>
          </p>
          <div className="no-scrollbar flex gap-4 overflow-x-auto">
            {live.map((m) => (
              <div key={m.id} className="flex shrink-0 items-center gap-2">
                <div className="relative">
                  {m.profilePhoto ? (
                    <img
                      src={m.profilePhoto}
                      alt={m.name}
                      loading="lazy"
                      className="h-11 w-11 rounded-full border border-gold/40 object-cover"
                    />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-navy">
                      <UserRound className="h-5 w-5 text-gold/50" />
                    </span>
                  )}
                  <BadgeCheck className="absolute -bottom-1 -start-1 h-4 w-4 text-sky-400" />
                </div>
                <div className="text-[11px] leading-4">
                  <p className="font-semibold text-cream">{m.name}، {m.age}</p>
                  <p className="text-cream/55">{countryFlag(m.countryCode)} {m.city}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-gold">
            <Users className="h-5 w-5" />
            <div className="text-[11px]">
              <p className="font-bold latin">{live.length}</p>
              <p className="text-cream/55">{t.home.liveCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SAKAN */}
      <section className="bg-cream py-14">
        <AdSlot slot="home_below_hero" className="mb-10 px-4" />
        <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-black text-navy">
            <span className="text-gold">✦</span> {t.home.whyTitle} <span className="text-gold">✦</span>
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.features.map((f, i) => {
              const Icon = featureIcons[i] ?? Lock;
              return (
                <div key={f.title} className="text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-gold/40 bg-white shadow-[var(--shadow-card)]">
                    <Icon className="h-7 w-7 text-gold-deep" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-navy">{f.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-muted-foreground">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* NEARBY MEMBERS */}
      <section className="bg-cream pb-14">
        <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
          <h2 className="mb-8 flex items-center justify-center gap-2 text-center text-xl font-black text-navy">
            <MapPin className="h-5 w-5 text-gold" /> {t.home.nearbyTitle}
          </h2>
          {membersQ.isPending ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] animate-pulse rounded-xl border border-gold/20 bg-navy/10"
                />
              ))}
            </div>
          ) : nearby.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">{t.home.noMembers}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {nearby.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate({ to: "/search", search: { iAm, lookingFor, minAge: 18, maxAge: 60, country: "all", sort: "recent" as const, page: 1 } })}
              className="btn-outline-gold border-gold-deep/50 px-8 py-2.5 text-sm font-semibold text-gold-deep"
            >
              {t.home.viewMore}
            </button>
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <section className="bg-cream pb-16">
        <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
          <h2 className="mb-8 flex items-center justify-center gap-2 text-center text-xl font-black text-navy">
            <Heart className="h-5 w-5 text-gold" /> {t.home.storiesTitle}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {t.home.stories.map((s, i) => (
              <article
                key={s.names}
                className="rounded-xl border border-gold/25 bg-white p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy">{s.names}</h3>
                  <span className="text-xs text-muted-foreground">{storyFlags[i]} {s.country}</span>
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
            <ShieldCheck className="h-4 w-4 text-gold-deep" /> {t.home.verifiedNote}
          </p>
        </div>
      </section>

      {/* PLANS PREVIEW */}
      <section className="bg-navy-deep py-16">
        <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
          <h2 className="text-center text-2xl font-black text-cream">{bs.pricingTitle}</h2>
          <p className="mt-2 text-center text-sm text-cream/60">{bs.pricingSubtitle}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {(plans.data ?? []).map((plan) => (
              <article
                key={plan.code}
                className={`glass-card fade-up rounded-3xl p-6 ${
                  plan.code === "premium" ? "ring-1 ring-gold/40" : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-black text-cream">{plan.name[locale]}</h3>
                  {plan.code === "premium" ? (
                    <span className="chip-glass px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                      {bs.mostPopular}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-cream/60">{plan.tagline[locale]}</p>
                <p className="mt-4 text-3xl font-black text-gold">
                  {plan.priceMonthlyCents === 0
                    ? bs.free
                    : formatPrice(plan.priceMonthlyCents, plan.currency, locale)}
                  {plan.priceMonthlyCents > 0 ? (
                    <span className="text-xs font-semibold text-cream/50"> {bs.perMonth}</span>
                  ) : null}
                </p>
                <ul className="mt-4 grid gap-2 text-xs text-cream/75">
                  {plan.features[locale].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/pricing" className="btn-gold inline-flex px-8 py-2.5 text-sm">
              {bs.seePlans}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
