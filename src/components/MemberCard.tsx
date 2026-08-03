import { Link } from "@tanstack/react-router";
import { BadgeCheck, UserRound } from "lucide-react";
import type { MemberView } from "@/lib/members";
import { useI18n } from "@/lib/i18n";
import { countryFlag, countryLabel } from "@/lib/countries";
import { LikeButton } from "@/components/social/LikeButton";
import { FavoriteButton } from "@/components/social/FavoriteButton";
import { PresenceIndicator, resolvePresence } from "@/components/presence/PresenceIndicator";
import { useIsAway } from "@/hooks/usePresence";

export function MemberCard({ member }: { member: MemberView }) {
  const { t } = useI18n();
  const away = useIsAway(member.id);
  const presence = resolvePresence(member.presenceStatus, member.online, away);

  return (
    <Link
      to="/member/$id"
      params={{ id: member.id }}
      className="group block w-full overflow-hidden rounded-xl border border-gold/25 bg-navy shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {member.profilePhoto ? (
          <img
            src={member.profilePhoto}
            alt={`${t.member.photoAlt} ${member.name}`}
            loading="lazy"
            width={480}
            height={600}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-navy">
            <UserRound className="h-10 w-10 text-gold/40" />
          </span>
        )}
        {member.isVerified && (
          <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-navy-deep/80">
            <BadgeCheck className="h-5 w-5 text-sky-400" />
          </span>
        )}
        <PresenceIndicator
          state={presence}
          hideOffline
          className="absolute start-2 top-2 rounded-full ring-2 ring-navy-deep"
        />
        <div className="absolute bottom-2 end-2 flex gap-1.5">
          <FavoriteButton targetId={member.id} />
          <LikeButton targetId={member.id} />
        </div>
      </div>
      <div className="bg-navy-deep px-2 py-2 text-center">
        <p className="text-sm font-bold text-cream">
          {member.name} {member.age != null && <span className="text-gold">{member.age}</span>}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-cream/60">
          {countryFlag(member.countryCode)} {member.city}
          {member.city && member.countryCode ? "، " : ""}
          {countryLabel(t, member.countryCode)}
        </p>
      </div>
    </Link>
  );
}