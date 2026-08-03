import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Loader2 } from "lucide-react";

import { MemberCard } from "@/components/MemberCard";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureStrings } from "@/i18n/feature";
import { socialStrings } from "@/lib/social/strings";
import { favoritesQuery, useToggleFavorite } from "@/lib/social/queries";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({
    meta: [
      { title: "المفضلة | سَكَن" },
      { name: "description", content: "الأعضاء الذين أضفتهم إلى المفضلة على منصة سَكَن." },
    ],
  }),
  component: FavoritesPage,
  errorComponent: RouteErrorBoundary,
});

function FavoritesPage() {
  const { user } = useAuth();
  const s = useFeatureStrings(socialStrings);
  const userId = user?.id ?? "";
  const favoritesQ = useQuery(favoritesQuery(userId));
  const toggle = useToggleFavorite(userId);
  const entries = favoritesQ.data ?? [];

  return (
    <div className="w-full">
      <main className="w-full pt-4">
        <h1 className="text-2xl font-black text-cream">{s.favorites.title}</h1>
        <p className="mt-1 text-sm text-cream/60">{s.favorites.subtitle}</p>

        <div className="mt-8">
          {favoritesQ.isPending ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
            </div>
          ) : favoritesQ.isError ? (
            <div className="mx-auto max-w-md glass-card p-10 text-center ">
              <h2 className="text-lg font-bold text-cream">{s.errorTitle}</h2>
              <p className="mt-2 text-xs leading-6 text-cream/60">{s.errorText}</p>
              <button onClick={() => void favoritesQ.refetch()} className="btn-gold mt-6 px-6 py-2.5 text-sm">
                {s.retry}
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="mx-auto max-w-md glass-card p-10 text-center ">
              <Bookmark className="mx-auto h-12 w-12 text-gold-deep" />
              <h2 className="mt-4 text-lg font-bold text-cream">{s.favorites.empty}</h2>
              <p className="mt-2 text-xs leading-6 text-cream/60">{s.favorites.emptyText}</p>
              <Link to="/discover" className="btn-gold mt-6 inline-block px-6 py-2.5 text-sm">
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
    </div>
  );
}
