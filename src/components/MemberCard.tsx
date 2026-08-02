import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import type { Member } from "@/data/members";

export function MemberCard({ member }: { member: Member }) {
  return (
    <Link
      to="/member/$id"
      params={{ id: member.id }}
      className="group block w-full overflow-hidden rounded-xl border border-gold/25 bg-navy shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={member.profilePhoto}
          alt={`صورة ${member.name}`}
          loading="lazy"
          width={480}
          height={600}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {member.isVerified && (
          <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-navy-deep/80">
            <BadgeCheck className="h-5 w-5 text-sky-400" />
          </span>
        )}
        {member.online && (
          <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-navy-deep" />
        )}
      </div>
      <div className="bg-navy-deep px-2 py-2 text-center">
        <p className="text-sm font-bold text-cream">
          {member.name} <span className="text-gold">{member.age}</span>
        </p>
        <p className="mt-0.5 truncate text-[11px] text-cream/60">
          {member.countryFlag} {member.cityAr}، {member.countryAr}
        </p>
      </div>
    </Link>
  );
}