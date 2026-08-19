import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import {
  avatarUrlQuery,
  myProfileQuery,
  updateMyProfile,
  uploadAvatar,
  validateAvatar,
  type ProfileUpdate,
} from "@/lib/profile-queries";
import { COUNTRY_CODES } from "@/lib/countries";
import { countryFormStrings } from "@/lib/forms/country-strings";
import { useFeatureStrings } from "@/i18n/feature";
import { searchStrings } from "@/components/search/strings";
import { supabase } from "@/integrations/supabase/client";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "أكمل ملفك الشخصي | سَكَن" },
      { name: "description", content: "أكمل بياناتك على سَكَن ليعثر عليك شركاء مناسبون." },
      { property: "og:title", content: "أكمل ملفك الشخصي | سَكَن" },
      { property: "og:description", content: "خطوات قصيرة لإكمال ملفك على منصة سَكَن." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingPage,
  errorComponent: RouteErrorBoundary,
});

type FormState = {
  display_name: string;
  birth_date: string;
  gender: "" | "male" | "female";
  looking_for: "" | "male" | "female";
  country_code: string;
  custom_country: string;
  city: string;
  bio: string;
  occupation: string;
  education: string;
  marital_status: "" | "single" | "divorced" | "widowed";
  religiosity: "" | "practicing" | "moderate" | "cultural" | "prefer_not_say";
  height_cm: string;
  interests: string;
  spoken_languages: string;
};

const EMPTY: FormState = {
  display_name: "",
  birth_date: "",
  gender: "",
  looking_for: "",
  country_code: "",
  custom_country: "",
  city: "",
  bio: "",
  occupation: "",
  education: "",
  marital_status: "",
  religiosity: "",
  height_cm: "",
  interests: "",
  spoken_languages: "",
};

function OnboardingPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const profileQ = useQuery({ ...myProfileQuery(userId), enabled: Boolean(userId) });
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const modStrings = useFeatureStrings(searchStrings).moderation;
  const cfs = useFeatureStrings(countryFormStrings);
  const fileRef = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const p = profileQ.data;
    if (!p || hydrated.current) return;
    hydrated.current = true;
    setAvatarPath(p.avatar_url);
    setForm({
      display_name: p.display_name ?? "",
      birth_date: p.birth_date ?? "",
      gender: p.gender ?? "",
      looking_for: p.looking_for ?? "",
      country_code: p.country_code ?? "",
      custom_country: p.custom_country ?? "",
      city: p.city ?? "",
      bio: p.bio ?? "",
      occupation: p.occupation ?? "",
      education: p.education ?? "",
      marital_status: p.marital_status ?? "",
      religiosity: p.religiosity ?? "",
      height_cm: p.height_cm ? String(p.height_cm) : "",
      interests: (p.interests ?? []).join("، "),
      spoken_languages: (p.spoken_languages ?? []).join("، "),
    });
  }, [profileQ.data]);

  const avatarQ = useQuery(avatarUrlQuery(avatarPath));

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = useMutation({
    mutationFn: async (patch: ProfileUpdate) => updateMyProfile(userId, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  const countries = useMemo(
    () => COUNTRY_CODES.map((code) => ({ code, label: t.countries[code] })),
    [t],
  );

  function toList(value: string) {
    return value
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function validateStep1(): string | null {
    if (form.display_name.trim().length < 2) return t.auth.errors.nameShort;
    if (!form.birth_date) return t.auth.errors.required;
    const birth = new Date(form.birth_date);
    const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (age < 18) return t.onboarding.ageError;
    if (!form.gender || !form.looking_for) return t.auth.errors.required;
    if (!form.country_code || !form.city.trim()) return t.auth.errors.required;
    if (form.country_code === "OTHER" && !form.custom_country.trim())
      return t.auth.errors.required;
    return null;
  }

  async function handleNext() {
    setError(null);
    setNotice(null);
    if (step === 1) {
      const invalid = validateStep1();
      if (invalid) return setError(invalid);
      try {
        const { moderateText } = await import("@/lib/ai/moderation.functions");
        const nameResult = await moderateText({
          data: { text: form.display_name.trim(), subject: "name" },
        });
        if (nameResult.verdict === "rejected") {
          setError(modStrings.rejectedText);
          return;
        }
        if (nameResult.verdict === "flagged") setNotice(modStrings.flaggedText);
      } catch {
        /* moderation is best-effort */
      }
      await save.mutateAsync({
        display_name: form.display_name.trim(),
        birth_date: form.birth_date,
        gender: form.gender || null,
        looking_for: form.looking_for || null,
        country_code: form.country_code,
        custom_country:
          form.country_code === "OTHER" ? form.custom_country.trim() || null : null,
        city: form.city.trim(),
        preferred_language: locale,
      });
      setStep(2);
      return;
    }
    if (step === 2) {
      const bio = form.bio.trim();
      if (bio) {
        try {
          const { moderateText } = await import("@/lib/ai/moderation.functions");
          const bioResult = await moderateText({ data: { text: bio, subject: "bio" } });
          if (bioResult.verdict === "rejected") {
            setError(modStrings.rejectedText);
            return;
          }
          if (bioResult.verdict === "flagged") setNotice(modStrings.flaggedText);
        } catch {
          /* moderation is best-effort */
        }
      }
      await save.mutateAsync({
        bio: bio || null,
        occupation: form.occupation.trim() || null,
        education: form.education.trim() || null,
        marital_status: form.marital_status || null,
        religiosity: form.religiosity || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        interests: toList(form.interests),
        spoken_languages: toList(form.spoken_languages),
      });
      setStep(3);
      return;
    }
    await save.mutateAsync({ onboarding_complete: true });
    void navigate({ to: "/search", search: { i_am: undefined } as never, replace: true });
  }

  async function handleFile(file: File) {
    setError(null);
    setNotice(null);
    const problem = validateAvatar(file);
    if (problem) {
      setError(problem === "size" ? t.onboarding.photoTooLarge : t.onboarding.photoType);
      return;
    }
    setUploading(true);
    const previousAvatarPath = avatarPath;
    try {
      const path = await uploadAvatar(userId, file);
      await save.mutateAsync({ avatar_url: path });
      setAvatarPath(path);
      try {
        const { moderateImage } = await import("@/lib/ai/moderation.functions");
        const result = await moderateImage({ data: { storagePath: path, bucket: "avatars" } });
        if (result.verdict === "rejected") {
          await supabase.storage.from("avatars").remove([path]);
          await save.mutateAsync({ avatar_url: previousAvatarPath });
          setAvatarPath(previousAvatarPath);
          setError(modStrings.rejectedImage);
        } else if (result.verdict === "flagged") {
          setNotice(modStrings.flaggedImage);
        }
      } catch {
        /* moderation is best-effort; ignore failures */
      }
    } catch {
      setError(t.common.errorText);
    } finally {
      setUploading(false);
    }
  }

  const stepTitles = [t.onboarding.stepBasics, t.onboarding.stepAbout, t.onboarding.stepPhoto];
  const busy = save.isPending || uploading;

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-2xl pt-4">
        <h1 className="text-center text-2xl font-bold text-cream">{t.onboarding.title}</h1>
        <p className="mt-2 text-center text-sm text-cream/70">{t.onboarding.subtitle}</p>

        <div className="mt-6 flex items-center justify-center gap-2">
          {stepTitles.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step >= i + 1 ? "bg-gold text-navy-deep" : "bg-cream/10 text-cream/50"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`hidden text-xs sm:block ${
                  step >= i + 1 ? "text-gold" : "text-cream/50"
                }`}
              >
                {label}
              </span>
              {i < 2 && <span className="h-px w-6 bg-gold/25" />}
            </div>
          ))}
        </div>

        <div className="glass-card mt-6 p-6 sm:p-8">
          {profileQ.isLoading ? (
            <p className="py-8 text-center text-sm text-cream/70">{t.common.loading}</p>
          ) : (
            <>
              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t.onboarding.displayName} className="sm:col-span-2">
                    <input
                      className="field-navy w-full"
                      value={form.display_name}
                      onChange={(e) => set("display_name", e.target.value)}
                    />
                  </Field>
                  <Field label={t.onboarding.birthDate}>
                    <input
                      type="date"
                      dir="ltr"
                      className="field-navy latin w-full"
                      value={form.birth_date}
                      onChange={(e) => set("birth_date", e.target.value)}
                    />
                  </Field>
                  <Field label={t.onboarding.gender}>
                    <select
                      className="field-navy w-full"
                      value={form.gender}
                      onChange={(e) => set("gender", e.target.value as FormState["gender"])}
                    >
                      <option value="">—</option>
                      <option value="male">{t.enums.gender.male}</option>
                      <option value="female">{t.enums.gender.female}</option>
                    </select>
                  </Field>
                  <Field label={t.onboarding.lookingFor}>
                    <select
                      className="field-navy w-full"
                      value={form.looking_for}
                      onChange={(e) => set("looking_for", e.target.value as FormState["gender"])}
                    >
                      <option value="">—</option>
                      <option value="male">{t.enums.gender.male}</option>
                      <option value="female">{t.enums.gender.female}</option>
                    </select>
                  </Field>
                  <Field label={t.onboarding.country}>
                    <select
                      className="field-navy w-full"
                      value={form.country_code}
                      onChange={(e) => set("country_code", e.target.value)}
                    >
                      <option value="">{t.home.chooseCountry}</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                      <option value="OTHER">{cfs.other}</option>
                    </select>
                    {form.country_code === "OTHER" ? (
                      <input
                        className="field-navy mt-2 w-full"
                        value={form.custom_country}
                        placeholder={cfs.customPlaceholder}
                        maxLength={60}
                        onChange={(e) => set("custom_country", e.target.value)}
                      />
                    ) : null}
                  </Field>
                  <Field label={t.onboarding.city} className="sm:col-span-2">
                    <input
                      className="field-navy w-full"
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t.onboarding.bio} className="sm:col-span-2">
                    <textarea
                      rows={4}
                      className="field-navy w-full resize-none"
                      placeholder={t.onboarding.bioPlaceholder}
                      value={form.bio}
                      onChange={(e) => set("bio", e.target.value)}
                    />
                  </Field>
                  <Field label={t.onboarding.occupation}>
                    <input
                      className="field-navy w-full"
                      value={form.occupation}
                      onChange={(e) => set("occupation", e.target.value)}
                    />
                  </Field>
                  <Field label={t.onboarding.education}>
                    <input
                      className="field-navy w-full"
                      value={form.education}
                      onChange={(e) => set("education", e.target.value)}
                    />
                  </Field>
                  <Field label={t.onboarding.maritalStatus}>
                    <select
                      className="field-navy w-full"
                      value={form.marital_status}
                      onChange={(e) =>
                        set("marital_status", e.target.value as FormState["marital_status"])
                      }
                    >
                      <option value="">—</option>
                      <option value="single">{t.enums.marital.single}</option>
                      <option value="divorced">{t.enums.marital.divorced}</option>
                      <option value="widowed">{t.enums.marital.widowed}</option>
                    </select>
                  </Field>
                  <Field label={t.onboarding.religiosity}>
                    <select
                      className="field-navy w-full"
                      value={form.religiosity}
                      onChange={(e) =>
                        set("religiosity", e.target.value as FormState["religiosity"])
                      }
                    >
                      <option value="">—</option>
                      <option value="practicing">{t.enums.religiosity.practicing}</option>
                      <option value="moderate">{t.enums.religiosity.moderate}</option>
                      <option value="cultural">{t.enums.religiosity.cultural}</option>
                      <option value="prefer_not_say">{t.enums.religiosity.prefer_not_say}</option>
                    </select>
                  </Field>
                  <Field label={t.onboarding.heightCm}>
                    <input
                      type="number"
                      dir="ltr"
                      className="field-navy latin w-full"
                      value={form.height_cm}
                      onChange={(e) => set("height_cm", e.target.value)}
                    />
                  </Field>
                  <Field label={t.onboarding.spokenLanguages}>
                    <input
                      className="field-navy w-full"
                      value={form.spoken_languages}
                      onChange={(e) => set("spoken_languages", e.target.value)}
                    />
                  </Field>
                  <Field
                    label={t.onboarding.interests}
                    hint={t.onboarding.interestsHint}
                    className="sm:col-span-2"
                  >
                    <input
                      className="field-navy w-full"
                      value={form.interests}
                      onChange={(e) => set("interests", e.target.value)}
                    />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-dashed border-gold/50 bg-cream/5">
                    {avatarQ.data ? (
                      <img
                        src={avatarQ.data}
                        alt={t.onboarding.uploadPhoto}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Camera className="h-8 w-8 text-gold/70" />
                      </span>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="btn-outline-gold px-5 py-2 text-xs font-semibold disabled:opacity-60"
                  >
                    {avatarPath ? t.onboarding.changePhoto : t.onboarding.uploadPhoto}
                  </button>
                  <p className="text-xs text-cream/55">{t.onboarding.uploadHint}</p>
                </div>
              )}

              {error && <p className="mt-4 text-center text-xs text-red-300">{error}</p>}
              {notice && <p className="mt-4 text-center text-xs text-gold">{notice}</p>}

              <div className="mt-7 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1 || busy}
                  className="btn-outline-gold px-5 py-2.5 text-xs font-semibold disabled:opacity-40"
                >
                  {t.common.back}
                </button>
                <button
                  type="button"
                  onClick={() => void handleNext()}
                  disabled={busy}
                  className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm font-bold disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {step === 3 ? t.onboarding.finishCta : t.common.next}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-cream/80">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-cream/45">{hint}</span>}
    </label>
  );
}