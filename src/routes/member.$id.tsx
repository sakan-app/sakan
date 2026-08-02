import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  GraduationCap,
  Heart,
  Languages,
  MapPin,
  MessageCircle,
  Moon,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { members } from "@/data/members";

export const Route = createFileRoute("/member/$id")({
  loader: ({ params }) => {
    const member = members.find((m) => m.id === params.id);
    if (!member) throw notFound();
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
    ],
  }),
  component: MemberProfile,
});

function MemberProfile() {
  const member = Route.useLoaderData();
  const gallery = [member.profilePhoto, ...member.additionalPhotos];
  const [active, setActive] = useState(0);

  const info = [
    { icon: Briefcase, label: "المهنة", value: member.job },
    { icon: GraduationCap, label: "التعليم", value: member.education },
    { icon: Users, label: "الحالة الاجتماعية", value: member.maritalStatus },
    { icon: Moon, label: "الالتزام الديني", value: member.religiousLevel },
    { icon: Languages, label: "اللغات", value: member.languages.join("، ") },
    { icon: MapPin, label: "الإقامة", value: `${member.cityAr}، ${member.countryAr}` },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="bg-navy-deep pb-16 pt-8">
        <div className="mx-auto max-w-[1100px] px-6 lg:px-8">
          <Link to="/search" search={{ iAm: "male", lookingFor: member.gender, minAge: 18, maxAge: 60, country: "all" }} className="text-xs text-cream/60 hover:text-gold">
            ← العودة إلى نتائج البحث
          </Link>

          <div className="mt-5 grid gap-8 lg:grid-cols-[380px_1fr]">
            {/* Gallery */}
            <div>
              <div className="relative overflow-hidden rounded-2xl border border-gold/30 shadow-[var(--shadow-card)]">
                <img
                  src={gallery[active]}
                  alt={`صورة ${member.name}`}
                  width={480}
                  height={600}
                  className="aspect-[4/5] w-full object-cover"
                />
                {member.isVerified && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-navy-deep/85 px-2.5 py-1 text-[11px] font-semibold text-cream">
                    <BadgeCheck className="h-4 w-4 text-sky-400" /> موثّق
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
                    aria-label={`عرض الصورة ${i + 1}`}
                  >
                    <img
                      src={photo}
                      alt={`صورة إضافية ${i + 1} لـ ${member.name}`}
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
                    <span className="truncate">{member.name}، {member.age}</span>
                    {member.isVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-sky-400" />}
                  </h1>
                  <p className="mt-1 flex items-center gap-2 text-sm text-cream/65">
                    <MapPin className="h-4 w-4 text-gold" />
                    {member.countryFlag} {member.cityAr}، {member.countryAr}
                  </p>
                </div>
                {member.online && (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/40 px-3 py-1 text-[11px] text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> نشط الآن
                  </span>
                )}
              </div>

              <div className="mt-5 rounded-lg border border-gold/15 bg-navy/40 p-4">
                <h2 className="mb-2 text-sm font-bold text-gold">نبذة عني</h2>
                <p className="text-sm leading-7 text-cream/75">{member.bio}</p>
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
                <h2 className="mb-3 text-sm font-bold text-gold">الاهتمامات</h2>
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
                <button className="btn-gold flex flex-1 items-center justify-center gap-2 py-3 text-sm">
                  <MessageCircle className="h-4 w-4" /> ابدأ المحادثة
                </button>
                <button className="btn-outline-gold flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold">
                  <Heart className="h-4 w-4" /> إضافة للمفضلة
                </button>
              </div>

              <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-cream/45">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" /> تم التحقق من الهوية والصور يدوياً
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}