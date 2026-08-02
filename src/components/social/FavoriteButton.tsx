import { Bookmark } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { favoritesQuery, useToggleFavorite } from "@/lib/social/queries";
import { useFeatureStrings } from "@/i18n/feature";
import { socialStrings } from "@/lib/social/strings";

export function FavoriteButton({ targetId, className = "" }: { targetId: string; className?: string }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const s = useFeatureStrings(socialStrings);
  const userId = user?.id ?? "";
  const favoritesQ = useQuery({ ...favoritesQuery(userId), enabled: isAuthenticated });
  const toggle = useToggleFavorite(userId);
  const favorited = (favoritesQ.data ?? []).some((f) => f.member.id === targetId);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      void navigate({ to: "/auth" });
      return;
    }
    toggle.mutate({ targetId, favorited });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-pressed={favorited}
      aria-label={favorited ? s.unfavorite : s.favorite}
      title={favorited ? s.unfavorite : s.favorite}
      className={`grid h-8 w-8 place-items-center rounded-full bg-navy-deep/80 backdrop-blur transition hover:bg-navy-deep disabled:opacity-60 ${className}`}
    >
      <Bookmark className={`h-4 w-4 ${favorited ? "fill-gold text-gold" : "text-cream"}`} />
    </button>
  );
}
