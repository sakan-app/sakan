import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Loader2, ShieldAlert, UserRound } from "lucide-react";
import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { avatarUrlQuery, myProfileQuery } from "@/lib/profile-queries";
import {
  PRESENCE_DOT,
  THEME_GRADIENT,
  avatarBorderClass,
  coverUrlQuery,
  profileStrength,
} from "@/lib/profile/appearance";
import { useFeatureStrings } from "@/i18n/feature";
import { profileStudioStrings } from "@/lib/profile/strings";
import { countryFlag, countryLabel } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "ملفي الشخصي | سَكَن" },
      { name: "description", content: "استعرض وحدّث بيانات ملفك الشخصي على منصة سَكَن." },
      { property: "og:title", content: "ملفي الشخصي | سَكَن" },
      { property: "og:description", content: "استعرض وحدّث بيانات ملفك الشخصي على منصة سَكَن." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyProfilePage,
});

function MyProfilePage() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? "";
  const profileQ = useQuery({ ...myProfileQuery(userId), enabled: Boolean(userId) });
  const profile = profileQ.data;
  const avatarQ = useQuery(avatarUrlQuery(profile?.avatar_url));
  const coverQ = useQuery(coverUrlQuery(profile?.cover_url));
  const studio = useFeatureStrings(profileStudioStrings);
  const strength = profile ? profileStrength(profile) : null;

  useEffect(() => {
    if (profile && !profile.onboarding_complete) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, navigate]);

  const notProvided = t.member.notProvided;

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-3xl pt-4">
        {profileQ.isPending ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
          </div>
        ) : !profile ? (
          <p className="py-20 text-center text-sm text-cream/60">{t.common.errorText}</p>
        ) : (
          <div
            className="glass-card overflow-hidden p-0"
            style={{ ["--sakan-accent" as string]: profile.accent_color }}
          >
            <div className="relative h-32 w-full sm:h-40" style={{ background: THEME_GRADIENT[profile.profile_theme] }}>
              {coverQ.data && <img src={coverQ.data} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="p-6 sm:p-8">
            <div className="-mt-16 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className={`relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-navy ${avatarBorderClass(profile.avatar_border)}`}>
                {avatarQ.data ? (
                  <img
                    src={avatarQ.data}
                    alt={profile.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center">
                    <UserRound className="h-10 w-10 text-gold/50" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-start">
                <h1 className="flex items-center justify-center gap-2 text-2xl font-black text-cream sm:justify-start">
                  {profile.display_name}
                  {profile.is_verified ? (
                    <BadgeCheck className="h-5 w-5 text-sky-400" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-gold/70" />
                  )}
                </h1>
                <p className="mt-1 text-sm text-cream/65">
                  {countryFlag(profile.country_code)} {profile.city ?? notProvided}،{" "}
                  {countryLabel(t, profile.country_code) || notProvided}
                </p>
                <p className="mt-1 text-xs text-gold">
                  {profile.is_verified ? t.profile.verified : t.profile.unverified}
                </p>
                <p className="mt-1 inline-flex items-center gap-2 text-xs text-cream/70">
                  <span className={`h-2 w-2 rounded-full ${PRESENCE_DOT[profile.presence_status]}`} aria-hidden />
                  {studio.statuses[profile.presence_status]}
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.min(100, profile.completeness)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-cream/50">
                  {t.onboarding.completeness}: {profile.completeness}% · {studio.strength}: {strength?.score ?? 0}%
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-gold/15 bg-navy/40 p-4">
              <h2 className="mb-2 text-sm font-bold text-gold">{t.member.aboutMe}</h2>
              <p className="text-sm leading-7 text-cream/75">{profile.bio ?? notProvided}</p>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Info label={t.member.occupation} value={profile.occupation ?? notProvided} />
              <Info label={t.member.education} value={profile.education ?? notProvided} />
              <Info
                label={t.member.maritalStatus}
                value={profile.marital_status ? t.enums.marital[profile.marital_status] : notProvided}
              />
              <Info
                label={t.member.religiosity}
                value={profile.religiosity ? t.enums.religiosity[profile.religiosity] : notProvided}
              />
              <Info
                label={t.member.languages}
                value={profile.spoken_languages.length ? profile.spoken_languages.join("، ") : notProvided}
              />
              <Info
                label={t.onboarding.heightCm}
                value={profile.height_cm ? String(profile.height_cm) : notProvided}
              />
            </dl>

            {profile.interests.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-bold text-gold">{t.member.interests}</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gold/30 px-3 py-1 text-xs text-cream/75"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/profile/edit"
                className="btn-gold flex-1 py-3 text-center text-sm font-bold"
              >
                {t.profile.editTitle}
              </Link>
              <Link to="/profile/appearance" className="btn-outline-gold px-5 py-3 text-center text-sm font-semibold">
                {studio.open}
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  void navigate({ to: "/auth", replace: true });
                }}
                className="btn-outline-gold px-5 py-3 text-sm font-semibold"
              >
                {t.profile.signOut}
              </button>
            </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-cream/50">{label}</dt>
      <dd className="truncate text-sm font-semibold text-cream">{value}</dd>
    </div>
  );
}