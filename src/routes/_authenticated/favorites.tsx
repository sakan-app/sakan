import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Loader2 } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MemberCard } from "@/components/MemberCard";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureStrings } from "@/i18n/feature";
import { socialStrings } from "@/lib/social/strings";
import { favoritesQuery, useToggleFavorite } from "@/lib/social/queries";
import { useSocialRealtime } from "@/lib/social/realtime";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({
    meta: [
      { title: "المفضلة | سَكَن" },
      { name: "description", content: "الأعضاء الذين أضفتهم إلى المفضلة على منصة سَكَن." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user } = useAuth();
  const s = useFeatureStrings(socialStrings);
  const userId = user?.id ?? "";
  useSocialRealtime();
  const favoritesQ = useQuery(favoritesQuery(userId));
  const toggle = useToggleFavorite(userId);
  const entries = favoritesQ.data ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-cream pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Header />
      <main className="mx-auto w-full max-w-[1360px] flex-1 px-6 py-10 lg:px-8">
        <h1 className="text-2xl font-black text-navy">{s.favorites.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{s.favorites.subtitle}</p>

        <div className="mt-8">
          {favoritesQ.isPending ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
            </div>
          ) : favoritesQ.isError ? (
            <div className="mx-auto max-w-md rounded-xl border border-gold/30 bg-white p-10 text-center shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-navy">{s.errorTitle}</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{s.errorText}</p>
              <button onClick={() => void favoritesQ.refetch()} className="btn-gold mt-6 px-6 py-2.5 text-sm">
                {s.retry}
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="mx-auto max-w-md rounded-xl border border-gold/30 bg-white p-10 text-center shadow-[var(--shadow-card)]">
              <Bookmark className="mx-auto h-12 w-12 text-gold-deep" />
              <h2 className="mt-4 text-lg font-bold text-navy">{s.favorites.empty}</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{s.favorites.emptyText}</p>
              <Link to="/search" className="btn-gold mt-6 inline-block px-6 py-2.5 text-sm">
                {s.favorites.title}
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {entries.map(({ member }) => (
                <div key={member.id} className="relative">
                  <MemberCard member={member} />
                  <button
                    type="button"
                    onClick={() => toggle.mutate({ targetId: member.id, favorited: true })}
                    className="btn-outline-gold mt-2 w-full py-1.5 text-xs"
                  >
                    {s.favorites.remove}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
