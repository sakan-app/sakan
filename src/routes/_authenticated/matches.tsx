import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";

import { MemberCard } from "@/components/MemberCard";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { useFeatureStrings } from "@/i18n/feature";
import { socialStrings } from "@/lib/social/strings";
import { matchesQuery, type MatchSort } from "@/lib/social/queries";
import { COUNTRY_CODES, countryLabel } from "@/lib/countries";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({
    meta: [
      { title: "التوافقات | سَكَن" },
      { name: "description", content: "الأعضاء الذين تبادلتم الإعجاب معهم على منصة سَكَن." },
    ],
  }),
  component: MatchesPage,
  errorComponent: RouteErrorBoundary,
});

function MatchesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const s = useFeatureStrings(socialStrings);
  const userId = user?.id ?? "";
  const [sort, setSort] = useState<MatchSort>("recent");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [country, setCountry] = useState<string>("all");


  const filter = useMemo(
    () => ({ ...(verifiedOnly ? { verifiedOnly: true } : {}), ...(country !== "all" ? { country } : {}) }),
    [verifiedOnly, country],
  );
  const matchesQ = useQuery(matchesQuery(userId, sort, filter));
  const entries = matchesQ.data ?? [];

  return (
    <div className="w-full">
      <main className="w-full pt-4">
        <h1 className="text-2xl font-black text-cream">{s.matches.title}</h1>
        <p className="mt-1 text-sm text-cream/60">{s.matches.subtitle}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-cream">
            <span className="font-semibold">{s.matches.sort}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as MatchSort)}
              className="field-navy px-3 py-1.5 text-sm"
            >
              <option value="recent">{s.matches.sortRecent}</option>
              <option value="name">{s.matches.sortName}</option>
              <option value="online">{s.matches.sortOnline}</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-cream">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-4 w-4 accent-gold-deep"
            />
            {s.matches.verifiedOnly}
          </label>

          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="field-navy px-3 py-1.5 text-sm"
          >
            <option value="all">{s.matches.allCountries}</option>
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {countryLabel(t, code)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8">
          {matchesQ.isPending ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
            </div>
          ) : matchesQ.isError ? (
            <div className="mx-auto max-w-md glass-card p-10 text-center ">
              <h2 className="text-lg font-bold text-cream">{s.errorTitle}</h2>
              <p className="mt-2 text-xs leading-6 text-cream/60">{s.errorText}</p>
              <button onClick={() => void matchesQ.refetch()} className="btn-gold mt-6 px-6 py-2.5 text-sm">
                {s.retry}
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="mx-auto max-w-md glass-card p-10 text-center ">
              <Sparkles className="mx-auto h-12 w-12 text-gold-deep" />
              <h2 className="mt-4 text-lg font-bold text-cream">{s.matches.empty}</h2>
              <p className="mt-2 text-xs leading-6 text-cream/60">{s.matches.emptyText}</p>
              <Link to="/discover" className="btn-gold mt-6 inline-block px-6 py-2.5 text-sm">
                {s.matches.title}
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {entries.map(({ member }) => (
                <div key={member.id} className="relative">
                  <MemberCard member={member} />
                  <Link
                    to="/messages"
                    search={{ to: member.id }}
                    className="btn-outline-gold mt-2 flex w-full items-center justify-center gap-1.5 py-1.5 text-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {s.matches.message}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
