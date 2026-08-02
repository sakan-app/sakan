import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Loader2, ShieldAlert, UserRound } from "lucide-react";
import { useEffect } from "react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { avatarUrlQuery, myProfileQuery } from "@/lib/profile-queries";
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

  useEffect(() => {
    if (profile && !profile.onboarding_complete) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, navigate]);

  const notProvided = t.member.notProvided;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        {profileQ.isPending ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
          </div>
        ) : !profile ? (
          <p className="py-20 text-center text-sm text-muted-foreground">{t.common.errorText}</p>
        ) : (
          <div className="panel-navy p-6 sm:p-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border border-gold/40 bg-navy">
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
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-cream/10">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.min(100, profile.completeness)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-cream/50">
                  {t.onboarding.completeness}: {profile.completeness}%
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
        )}
      </main>
      <Footer />
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