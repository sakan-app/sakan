import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { isLikedQuery, useToggleLike } from "@/lib/social/queries";
import { useFeatureStrings } from "@/i18n/feature";
import { socialStrings } from "@/lib/social/strings";

export function LikeButton({ targetId, className = "" }: { targetId: string; className?: string }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const s = useFeatureStrings(socialStrings);
  const userId = user?.id ?? "";
  const likedQ = useQuery({ ...isLikedQuery(userId, targetId), enabled: isAuthenticated });
  const toggle = useToggleLike(userId);
  const liked = likedQ.data ?? false;

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      void navigate({ to: "/auth" });
      return;
    }
    toggle.mutate({ targetId, liked });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-pressed={liked}
      aria-label={liked ? s.unlike : s.like}
      title={liked ? s.unlike : s.like}
      className={`grid h-8 w-8 place-items-center rounded-full bg-navy-deep/80 backdrop-blur transition hover:bg-navy-deep disabled:opacity-60 ${className}`}
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-gold text-gold" : "text-cream"}`} />
    </button>
  );
}
