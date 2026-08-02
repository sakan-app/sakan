import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, SearchX, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MemberCard } from "@/components/MemberCard";
import { PAGE_SIZE, searchMembersQuery } from "@/lib/members";
import { useI18n } from "@/lib/i18n";
import { countryLabel } from "@/lib/countries";
import { searchParamsSchema, type SearchParams } from "@/lib/validation";
import { useAuth } from "@/hooks/useAuth";
import { pushRecentSearch } from "@/lib/search-history";
import { RecentSearchChips } from "@/components/search/RecentSearchChips";
import { SavedSearchBar } from "@/components/search/SavedSearchBar";
import { SearchRefine, useSearchRefine } from "@/components/search/SearchRefine";
import { AiRecommendations } from "@/components/search/AiRecommendations";
import { useFeatureStrings } from "@/i18n/feature";
import { searchStrings } from "@/components/search/strings";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams =>
    searchParamsSchema.parse({
      iAm: s["iAm"],
      lookingFor: s["lookingFor"],
      minAge: s["minAge"],
      maxAge: s["maxAge"],
      country: s["country"],
      sort: s["sort"],
      page: s["page"],
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
  const s2 = useFeatureStrings(searchStrings);
  const { user } = useAuth();
  const navigate = useNavigate({ from: "/search" });
  const membersQ = useQuery({
    ...searchMembersQuery(
      {
        lookingFor: criteria.lookingFor,
        minAge: criteria.minAge,
        maxAge: criteria.maxAge,
        country: criteria.country,
        sort: criteria.sort,
      },
      criteria.page,
    ),
    placeholderData: keepPreviousData,
  });
  const results = membersQ.data?.items ?? [];
  const total = membersQ.data?.total ?? 0;
  const hasMore = criteria.page * PAGE_SIZE < total;
  const country =
    criteria.country === "all" ? t.search.allCountries : countryLabel(t, criteria.country);
  const refine = useSearchRefine(results);
  const refinedResults = refine.query.trim() ? refine.filtered : results;

  useEffect(() => {
    if (membersQ.isSuccess && total > 0) {
      pushRecentSearch({
        label: `${country} · ${criteria.minAge}-${criteria.maxAge}`,
        params: {
          lookingFor: criteria.lookingFor,
          minAge: criteria.minAge,
          maxAge: criteria.maxAge,
          country: criteria.country,
        },
        savedAt: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersQ.isSuccess, total]);

  function applySearchParams(params: Partial<SearchParams>) {
    void navigate({ search: (prev: SearchParams) => ({ ...prev, ...params, page: 1 }) });
  }

  return (
    <div className="min-h-screen bg-cream pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
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
            {t.search.foundPre} <span className="font-bold text-gold">{total}</span>{" "}
            {t.search.foundPost}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs">
            <label htmlFor="sort" className="text-cream/60">
              {t.search.sortLabel}
            </label>
            <select
              id="sort"
              value={criteria.sort}
              onChange={(event) =>
                void navigate({
                  search: (prev: SearchParams) => ({
                    ...prev,
                    sort: event.target.value as SearchParams["sort"],
                    page: 1,
                  }),
                })
              }
              className="rounded-full border border-gold/30 bg-transparent px-3 py-1 text-cream/80 outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <option className="text-navy" value="recent">
                {t.search.sortRecent}
              </option>
              <option className="text-navy" value="newest">
                {t.search.sortNewest}
              </option>
              <option className="text-navy" value="complete">
                {t.search.sortComplete}
              </option>
            </select>
          </div>
        </div>
      </section>

      {user && (
        <section className="pt-8">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-3 px-6 lg:px-8">
            <RecentSearchChips onApply={applySearchParams} />
            <SavedSearchBar currentCriteria={criteria} onApply={applySearchParams} />
          </div>
        </section>
      )}

      <section className="py-10">
        <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
          {user && results.length > 0 && (
            <div className="mb-5">
              <SearchRefine query={refine.query} onChange={refine.setQuery} results={results} />
            </div>
          )}
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
          ) : refinedResults.length === 0 ? (
            <div className="mx-auto max-w-md rounded-xl border border-gold/30 bg-white p-10 text-center shadow-[var(--shadow-card)]">
              <SearchX className="mx-auto h-12 w-12 text-gold-deep" />
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{s2.refine.noMatches}</p>
            </div>
          ) : (
            <>
              {/* Mobile: horizontal carousel */}
              <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-2 sm:hidden">
                {refinedResults.map((m) => (
                  <div key={m.id} className="w-[150px] shrink-0">
                    <MemberCard member={m} />
                  </div>
                ))}
              </div>
              {/* Desktop grid */}
              <div className="hidden gap-5 sm:grid sm:grid-cols-3 lg:grid-cols-4">
                {refinedResults.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() =>
                      void navigate({ search: (prev: SearchParams) => ({ ...prev, page: prev.page + 1 }) })
                    }
                    disabled={membersQ.isFetching}
                    className="btn-outline-gold px-8 py-2.5 text-sm font-semibold disabled:opacity-60"
                  >
                    {membersQ.isFetching ? t.common.loading : t.search.loadMore}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {user && (
        <section className="pb-10">
          <div className="mx-auto max-w-[1360px] px-6 lg:px-8">
            <AiRecommendations />
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}