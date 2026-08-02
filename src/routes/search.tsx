import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, SearchX, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MemberCard } from "@/components/MemberCard";
import { searchMembersQuery, type Gender } from "@/lib/members";
import { useI18n } from "@/lib/i18n";
import { countryLabel } from "@/lib/countries";

type Search = {
  iAm: Gender;
  lookingFor: Gender;
  minAge: number;
  maxAge: number;
  country: string;
};

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    iAm: s["iAm"] === "female" ? "female" : "male",
    lookingFor: s["lookingFor"] === "male" ? "male" : "female",
    minAge: Number(s["minAge"]) || 18,
    maxAge: Number(s["maxAge"]) || 60,
    country: typeof s["country"] === "string" ? s["country"] : "all",
  }),
  head: () => ({
    meta: [
      { title: "نتائج البحث | سَكَن" },
      { name: "description", content: "أعضاء نشطون بالقرب منك حسب معايير بحثك على منصة سَكَن." },
      { property: "og:title", content: "نتائج البحث | سَكَن" },
      { property: "og:description", content: "تصفح الأعضاء الموثقين المطابقين لمعايير بحثك." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const criteria = Route.useSearch();
  const { t } = useI18n();
  const membersQ = useQuery(
    searchMembersQuery({
      lookingFor: criteria.lookingFor,
      minAge: criteria.minAge,
      maxAge: criteria.maxAge,
      country: criteria.country,
    }),
  );
  const results = membersQ.data ?? [];
  const country =
    criteria.country === "all" ? t.search.allCountries : countryLabel(t, criteria.country);

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <section className="bg-navy-deep py-8">
        <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
          <h1 className="flex items-center justify-center gap-2 text-center text-2xl font-black text-cream">
            <MapPin className="h-6 w-6 text-gold" /> {t.search.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-gold">
              <SlidersHorizontal className="h-4 w-4" /> {t.search.criteria}
            </span>
            {[
              `${t.search.lookingForChip}: ${
                criteria.lookingFor === "female" ? t.enums.gender.female : t.enums.gender.male
              }`,
              `${t.search.ageChip}: ${criteria.minAge} - ${criteria.maxAge}`,
              `${t.search.residenceChip}: ${country}`,
            ].map((chip) => (
              <span key={chip} className="rounded-full border border-gold/30 px-3 py-1 text-cream/75">
                {chip}
              </span>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-cream/60">
            {t.search.foundPre} <span className="font-bold text-gold">{results.length}</span>{" "}
            {t.search.foundPost}
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
          {membersQ.isPending ? (
            <div className="flex justify-center py-16 text-navy/70">
              <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
            </div>
          ) : membersQ.isError ? (
            <div className="mx-auto max-w-md rounded-xl border border-gold/30 bg-white p-10 text-center shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-navy">{t.common.errorTitle}</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{t.common.errorText}</p>
              <button
                onClick={() => void membersQ.refetch()}
                className="btn-gold mt-6 px-6 py-2.5 text-sm"
              >
                {t.common.retry}
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="mx-auto max-w-md rounded-xl border border-gold/30 bg-white p-10 text-center shadow-[var(--shadow-card)]">
              <SearchX className="mx-auto h-12 w-12 text-gold-deep" />
              <h2 className="mt-4 text-lg font-bold text-navy">{t.search.emptyTitle}</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{t.search.emptyText}</p>
              <Link to="/" className="btn-gold mt-6 inline-block px-6 py-2.5 text-sm">
                {t.search.editCriteria}
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile: horizontal carousel */}
              <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-2 sm:hidden">
                {results.map((m) => (
                  <div key={m.id} className="w-[150px] shrink-0">
                    <MemberCard member={m} />
                  </div>
                ))}
              </div>
              {/* Desktop grid */}
              <div className="hidden gap-5 sm:grid sm:grid-cols-3 lg:grid-cols-4">
                {results.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}