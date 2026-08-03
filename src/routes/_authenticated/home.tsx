import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Compass, Heart, MessageCircle, Sparkles, TrendingUp } from "lucide-react";

import { GlassCard, Screen } from "@/components/app/AppShell";
import { shellStrings } from "@/components/app/shell.strings";
import { MemberCard } from "@/components/MemberCard";
import { AiRecommendations } from "@/components/search/AiRecommendations";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureStrings } from "@/i18n/feature";
import { activeMembersQuery } from "@/lib/members";
import { myProfileQuery } from "@/lib/profile-queries";
import { favoritesQuery, likedMeQuery, matchesQuery } from "@/lib/social/queries";
import { socialStrings } from "@/lib/social/strings";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "الرئيسية | سَكَن" },
      { name: "description", content: "لوحتك الشخصية على سَكَن: توافقات، أعضاء نشطون وتوصيات ذكية." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HomeFeed,
  errorComponent: RouteErrorBoundary,
});

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "greetingMorning" as const;
  if (h < 18) return "greetingAfternoon" as const;
  return "greetingEvening" as const;
}

function StatTile({
  icon: Icon,
  value,
  label,
  to,
}: {
  icon: typeof Heart;
  value: number | string;
  label: string;
  to: string;
}) {
  return (
    <Link to={to} className="glass-tile flex flex-col gap-2 p-4 tap-scale">
      <Icon className="h-5 w-5 text-gold" />
      <span className="text-2xl font-black leading-none text-cream">{value}</span>
      <span className="text-[11px] text-cream/55">{label}</span>
    </Link>
  );
}

function HomeFeed() {
  const { user } = useAuth();
  const s = useFeatureStrings(shellStrings);
  const soc = useFeatureStrings(socialStrings);
  const userId = user?.id ?? "";

  const profileQ = useQuery({ ...myProfileQuery(userId), enabled: Boolean(userId) });
  const activeQ = useQuery(activeMembersQuery(12));
  const matchesQ = useQuery(matchesQuery(userId, "recent", {}));
  const favoritesQ = useQuery(favoritesQuery(userId));
  const likedMeQ = useQuery(likedMeQuery(userId));

  const profile = profileQ.data;
  const completeness = profile?.completeness ?? 0;

  return (
    <Screen>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard className="p-5 sm:p-7">
          <p className="text-xs uppercase tracking-widest text-gold/80">{s[greetingKey()]}</p>
          <h1 className="mt-1 text-2xl font-black text-cream sm:text-3xl">
            {profile?.display_name ?? "—"}
          </h1>

          {completeness < 100 && (
            <Link to="/profile/edit" className="mt-4 block">
              <div className="flex items-center justify-between text-[11px] text-cream/60">
                <span>{s.editProfile}</span>
                <span className="latin text-gold">{completeness}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-[var(--gradient-gold)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
            </Link>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              icon={Sparkles}
              value={matchesQ.data?.length ?? 0}
              label={s.matches}
              to="/matches"
            />
            <StatTile
              icon={Heart}
              value={likedMeQ.data?.length ?? 0}
              label={soc.like}
              to="/matches"
            />
            <StatTile
              icon={TrendingUp}
              value={favoritesQ.data?.length ?? 0}
              label={s.favorites}
              to="/favorites"
            />
            <StatTile icon={MessageCircle} value="—" label={s.messages} to="/messages" />
          </div>
        </GlassCard>
      </motion.div>

      <div className="mt-5">
        <AiRecommendations />
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-cream">{soc.matches.title}</h2>
          <Link to="/discover" className="flex items-center gap-1 text-xs font-semibold text-gold">
            <Compass className="h-3.5 w-3.5" />
            {s.discover}
          </Link>
        </div>

        {activeQ.isPending ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-[22px] bg-white/5" />
            ))}
          </div>
        ) : activeQ.isError ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-sm text-cream/70">{soc.errorText}</p>
            <button
              type="button"
              onClick={() => void activeQ.refetch()}
              className="mt-4 inline-flex items-center rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-navy-deep"
            >
              {soc.retry}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(activeQ.data ?? []).map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(i * 0.04, 0.32) }}
              >
                <MemberCard member={member} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </Screen>
  );
}