import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

import { GlassCard, Screen } from "@/components/app/AppShell";
import { shellStrings } from "@/components/app/shell.strings";
import { MemberCard } from "@/components/MemberCard";
import { searchStrings } from "@/components/search/strings";
import { useFeatureStrings } from "@/i18n/feature";
import { useI18n } from "@/lib/i18n";
import { COUNTRY_CODES, COUNTRY_FLAGS, countryLabel } from "@/lib/countries";
import { searchMembersQuery, type Gender, type MemberSort } from "@/lib/members";

const discoverSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  g: z.enum(["male", "female"]).optional().catch(undefined),
  c: z.string().optional().catch(undefined),
  sort: z.enum(["recent", "newest", "complete"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/discover")({
  validateSearch: (s: Record<string, unknown>) =>
    discoverSearchSchema.parse({ q: s["q"], g: s["g"], c: s["c"], sort: s["sort"] }),
  head: () => ({
    meta: [
      { title: "اكتشف | سَكَن" },
      { name: "description", content: "اكتشف أعضاء متوافقين معك على منصة سَكَن." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiscoverPage,
});

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`chip-glass tap-scale whitespace-nowrap ${active ? "chip-glass-active" : ""}`}
    >
      {children}
    </button>
  );
}

function DiscoverPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { t } = useI18n();
  const s = useFeatureStrings(shellStrings);
  const ss = useFeatureStrings(searchStrings);

  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [text, setText] = useState(search.q ?? "");

  const gender = search.g as Gender | undefined;
  const sort = (search.sort ?? "recent") as MemberSort;
  const country = search.c;

  const listQ = useQuery({
    ...searchMembersQuery(
      { lookingFor: gender, country: country ?? undefined, sort },
      page,
    ),
    placeholderData: keepPreviousData,
  });

  const members = useMemo(() => {
    const items = listQ.data?.items ?? [];
    const needle = text.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        (m.city ?? "").toLowerCase().includes(needle),
    );
  }, [listQ.data, text]);

  function patch(next: Partial<z.infer<typeof discoverSearchSchema>>) {
    setPage(1);
    void navigate({
      search: (prev: z.infer<typeof discoverSearchSchema>) => ({ ...prev, ...next }),
      replace: true,
    });
  }

  return (
    <Screen title={s.discover} subtitle={t.search.title}>
      <GlassCard className="sticky top-16 z-20 p-3 lg:top-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-cream/45" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={ss.refine.placeholder}
              aria-label={s.search}
              className="glass-field h-11 ps-9"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-label={t.search.sortLabel}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] tap-scale ${
              showFilters ? "chip-glass-active" : "glass-tile"
            }`}
          >
            <SlidersHorizontal className="h-[18px] w-[18px] text-gold" />
          </button>
        </div>

        <motion.div
          initial={false}
          animate={{ height: showFilters ? "auto" : 0, opacity: showFilters ? 1 : 0 }}
          transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="space-y-3 pt-3">
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <Chip active={!gender} onClick={() => patch({ g: undefined })}>
                {t.search.allCountries}
              </Chip>
              <Chip active={gender === "female"} onClick={() => patch({ g: "female" })}>
                {t.enums.gender.female}
              </Chip>
              <Chip active={gender === "male"} onClick={() => patch({ g: "male" })}>
                {t.enums.gender.male}
              </Chip>
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <Chip active={!country} onClick={() => patch({ c: undefined })}>
                🌍
              </Chip>
              {COUNTRY_CODES.map((code) => (
                <Chip key={code} active={country === code} onClick={() => patch({ c: code })}>
                  <span aria-hidden>{COUNTRY_FLAGS[code]}</span>
                  {countryLabel(t, code)}
                </Chip>
              ))}
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {(["recent", "newest", "complete"] as MemberSort[]).map((option) => (
                <Chip key={option} active={sort === option} onClick={() => patch({ sort: option })}>
                  {option === "recent"
                    ? t.search.sortRecent
                    : option === "newest"
                      ? ss.sort.newest
                      : t.search.sortComplete}
                </Chip>
              ))}
            </div>
          </div>
        </motion.div>
      </GlassCard>

      <div className="mt-5">
        {listQ.isPending ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-[22px] bg-white/5" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <p className="text-sm text-cream/70">{t.search.emptyText}</p>
          </GlassCard>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {members.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <MemberCard member={member} />
                </motion.div>
              ))}
            </div>
            {(listQ.data?.total ?? 0) > page * 24 && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-gold flex items-center gap-2 px-7 py-2.5 text-sm"
                >
                  {listQ.isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t.search.loadMore}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}