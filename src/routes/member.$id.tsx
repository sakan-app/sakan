import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  GraduationCap,
  Heart,
  Languages,
  Loader2,
  MapPin,
  MessageCircle,
  Moon,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { memberQuery, type MemberView } from "@/lib/members";
import { useI18n } from "@/lib/i18n";
import { countryFlag, countryLabel } from "@/lib/countries";
import { useAuth } from "@/hooks/useAuth";
import { startConversation } from "@/lib/chat/queries";
import { chatStrings } from "@/lib/chat/strings";
import { useFeatureStrings } from "@/i18n/feature";
import { favoritesQuery, useToggleFavorite } from "@/lib/social/queries";
import { socialStrings } from "@/lib/social/strings";
import { toast } from "sonner";
import { applyDocumentSeo } from "@/components/LocalizedSeo";
import { memberSeo } from "@/lib/seo";

export const Route = createFileRoute("/member/$id")({
  loader: async ({ params, context }) => {
    const member = await context.queryClient.ensureQueryData(memberQuery(params.id));
    return member;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "عضو"}، ${loaderData?.age ?? ""} | سَكَن` },
      {
        name: "description",
        content: loaderData?.bio ?? "ملف عضو موثق على منصة سَكَن للتعارف الجاد والزواج.",
      },
      { property: "og:title", content: `${loaderData?.name ?? "عضو"} | سَكَن` },
      { property: "og:description", content: loaderData?.bio ?? "ملف عضو موثق على منصة سَكَن." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfilePage",
              mainEntity: {
                "@type": "Person",
                name: loaderData.name,
                description: loaderData.bio ?? undefined,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: loaderData.city ?? undefined,
                  addressCountry: loaderData.countryCode ?? undefined,
                },
              },
            }),
          },
        ]
      : [],
  }),
  component: MemberProfile,
  errorComponent: MemberError,
  notFoundComponent: MemberError,
});

/** Localised title/description for the viewed member, in the active language. */
function MemberSeo({
  name,
  age,
  bio,
}: {
  name: string | null;
  age: number | null;
  bio: string | null;
}) {
  const { locale } = useI18n();
  useEffect(() => {
    applyDocumentSeo(memberSeo(locale, name, age, bio));
  }, [locale, name, age, bio]);
  return null;
}

function MemberError() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-20 text-center">
        <div>
          <h1 className="text-lg font-bold text-navy">{t.common.errorTitle}</h1>
          <p className="mt-2 text-xs text-muted-foreground">{t.common.errorText}</p>
          <Link to="/" className="btn-gold mt-6 inline-block px-6 py-2.5 text-sm">
            {t.nav.home}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function MemberProfile() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const chatS = useFeatureStrings(chatStrings);
  const socialS = useFeatureStrings(socialStrings);
  const navigate = useNavigate();
  const memberQ = useQuery(memberQuery(id));
  const userId = user?.id ?? "";
  const favoritesQ = useQuery({
    ...favoritesQuery(userId),
    enabled: isAuthenticated && Boolean(userId),
  });
  const toggleFavorite = useToggleFavorite(userId);
  const loaderMember = Route.useLoaderData() as MemberView | null | undefined;
  // Fall back to loader data so SSR and the first client render agree.
  const member: MemberView | null | undefined = memberQ.data ?? loaderMember;
  const [active, setActive] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  if (memberQ.isPending && !member) {
    return (
      <div className="flex min-h-screen flex-col bg-cream">
        <Header />
        <main className="flex flex-1 items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!member) return <MemberError />;

  const gallery = [member.profilePhoto, ...member.gallery].filter(
    (url): url is string => Boolean(url),
  );
  const notProvided = t.member.notProvided;
  const maritalLabel = member.maritalStatus
    ? t.enums.marital[member.maritalStatus]
    : notProvided;
  const religiosityLabel = member.religiosity
    ? t.enums.religiosity[member.religiosity]
    : notProvided;
  const location = [member.city, countryLabel(t, member.countryCode)]
    .filter(Boolean)
    .join("، ");

  const info = [
    { icon: Briefcase, label: t.member.occupation, value: member.occupation ?? notProvided },
    { icon: GraduationCap, label: t.member.education, value: member.education ?? notProvided },
    { icon: Users, label: t.member.maritalStatus, value: maritalLabel },
    { icon: Moon, label: t.member.religiosity, value: religiosityLabel },
    {
      icon: Languages,
      label: t.member.languages,
      value: member.languages.length ? member.languages.join("، ") : notProvided,
    },
    { icon: MapPin, label: t.member.residence, value: location || notProvided },
  ];

  function handleStartChat() {
    if (!isAuthenticated) {
      void navigate({ to: "/auth" });
      return;
    }
    setNotice(null);
    const memberId = member!.id;
    void startConversation(memberId)
      .then((conversationId) => navigate({ to: "/messages/$id", params: { id: conversationId } }))
      .catch(() => toast.error(chatS.startChatError));
  }

  function handleToggleFavorite() {
    if (!isAuthenticated) {
      void navigate({ to: "/auth" });
      return;
    }
    toggleFavorite.mutate({ targetId: member!.id, favorited: isFavorited });
  }

  return (
    <div className="min-h-screen bg-cream">
      <MemberSeo name={member.name} age={member.age ?? null} bio={member.bio ?? null} />
      <Header />

      <div className="bg-navy-deep pb-16 pt-8">
        <div className="mx-auto max-w-[1100px] px-6 lg:px-8">
          <Link
            to="/search"
            search={{
              iAm: "male",
              lookingFor: member.gender ?? "female",
              minAge: 18,
              maxAge: 60,
              country: "all",
              sort: "recent" as const,
              page: 1,
            }}
            className="text-xs text-cream/60 hover:text-gold"
          >
            {t.member.back}
          </Link>

          <div className="mt-5 grid gap-8 lg:grid-cols-[380px_1fr]">
            {/* Gallery */}
            <div>
              <div className="relative overflow-hidden rounded-2xl border border-gold/30 shadow-[var(--shadow-card)]">
                {gallery[active] ? (
                  <img
                    src={gallery[active]}
                    alt={`${t.member.photoAlt} ${member.name}`}
                    width={480}
                    height={600}
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <span className="grid aspect-[4/5] w-full place-items-center bg-navy">
                    <UserRound className="h-14 w-14 text-gold/40" />
                  </span>
                )}
                {member.isVerified && (
                  <span className="absolute end-3 top-3 flex items-center gap-1 rounded-full bg-navy-deep/85 px-2.5 py-1 text-[11px] font-semibold text-cream">
                    <BadgeCheck className="h-4 w-4 text-sky-400" /> {t.member.verified}
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {gallery.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`overflow-hidden rounded-lg border ${
                      i === active ? "border-gold" : "border-gold/20"
                    }`}
                    aria-label={`${t.member.photoAlt} ${i + 1}`}
                  >
                    <img
                      src={photo}
                      alt={`${t.member.photoAlt} ${member.name} ${i + 1}`}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="panel-navy p-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <h1 className="flex items-center gap-2 text-2xl font-black text-cream">
                    <span className="truncate">
                      {member.name}
                      {member.age != null ? `، ${member.age}` : ""}
                    </span>
                    {member.isVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-sky-400" />}
                  </h1>
                  <p className="mt-1 flex items-center gap-2 text-sm text-cream/65">
                    <MapPin className="h-4 w-4 text-gold" />
                    {countryFlag(member.countryCode)} {location}
                  </p>
                </div>
                {member.online && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/40 px-3 py-1 text-[11px] text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> {t.member.onlineNow}
                  </span>
                )}
              </div>

              <div className="mt-5 rounded-lg border border-gold/15 bg-navy/40 p-4">
                <h2 className="mb-2 text-sm font-bold text-gold">{t.member.aboutMe}</h2>
                <p className="text-sm leading-7 text-cream/75">{member.bio ?? notProvided}</p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {info.map((item) => (
                  <div key={item.label} className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gold/30 text-gold">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-cream/50">{item.label}</p>
                      <p className="truncate text-sm font-semibold text-cream">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h2 className="mb-3 text-sm font-bold text-gold">{t.member.interests}</h2>
                <div className="flex flex-wrap gap-2">
                  {member.interests.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gold/30 px-3 py-1 text-xs text-cream/75"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleStartChat}
                  className="btn-gold flex flex-1 items-center justify-center gap-2 py-3 text-sm"
                >
                  <MessageCircle className="h-4 w-4" /> {t.member.startChat}
                </button>
                <button
                  onClick={handleStartChat}
                  className="btn-outline-gold flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
                >
                  <Heart className="h-4 w-4" /> {t.member.addFavorite}
                </button>
              </div>

              {notice && <p className="mt-3 text-center text-[11px] text-gold">{notice}</p>}

              <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-cream/45">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" /> {t.member.verifiedNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}