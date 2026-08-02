import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Loader2, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { localeNames, localeOrder } from "@/i18n";
import { COUNTRY_CODES } from "@/lib/countries";
import {
  deleteGalleryPhoto,
  myGalleryQuery,
  uploadGalleryPhoto,
} from "@/lib/gallery-queries";
import { useI18n } from "@/lib/i18n";
import {
  avatarUrlQuery,
  myProfileQuery,
  updateMyProfile,
  uploadAvatar,
  type ProfileUpdate,
} from "@/lib/profile-queries";
import { profileFormSchema, validateImageFile } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/profile/edit")({
  head: () => ({
    meta: [
      { title: "تعديل ملفي الشخصي | سَكَن" },
      { name: "description", content: "حدّث صورتك ومعرض صورك وبياناتك وتفضيلاتك على منصة سَكَن." },
      { property: "og:title", content: "تعديل ملفي الشخصي | سَكَن" },
      {
        property: "og:description",
        content: "حدّث صورتك ومعرض صورك وبياناتك وتفضيلاتك على منصة سَكَن.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditProfilePage,
});

type FormState = {
  display_name: string;
  birth_date: string;
  gender: "" | "male" | "female";
  looking_for: "" | "male" | "female";
  country_code: string;
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

const splitList = (value: string) =>
  value
    .split(/[،,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

function EditProfilePage() {
  const { t, locale, setLocale } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const profileQ = useQuery({ ...myProfileQuery(userId), enabled: Boolean(userId) });
  const galleryQ = useQuery({ ...myGalleryQuery(userId), enabled: Boolean(userId) });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [hidden, setHidden] = useState(false);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const p = profileQ.data;
    if (!p || hydrated.current) return;
    hydrated.current = true;
    setAvatarPath(p.avatar_url);
    setHidden(p.is_hidden);
    setForm({
      display_name: p.display_name ?? "",
      birth_date: p.birth_date ?? "",
      gender: p.gender ?? "",
      looking_for: p.looking_for ?? "",
      country_code: p.country_code ?? "",
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
  const countries = useMemo(
    () => COUNTRY_CODES.map((code) => ({ code, label: t.countries[code] })),
    [t],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = useMutation({
    mutationFn: (patch: ProfileUpdate) => updateMyProfile(userId, patch),
    onSuccess: () => {
      setNotice(t.profile.saved);
      void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: () => setError(t.common.errorText),
    retry: 1,
  });

  const removePhoto = useMutation({
    mutationFn: ({ id, path }: { id: string; path: string }) => deleteGalleryPhoto(id, path),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["gallery", userId] }),
  });

  async function handleAvatar(file: File) {
    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid === "size" ? t.onboarding.photoTooLarge : t.onboarding.photoType);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const path = await uploadAvatar(userId, file);
      setAvatarPath(path);
      await updateMyProfile(userId, { avatar_url: path });
      void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    } catch {
      setError(t.common.errorText);
    } finally {
      setUploading(false);
    }
  }

  async function handleGallery(file: File) {
    const invalid = validateImageFile(file);
    if (invalid) {
      setError(invalid === "size" ? t.onboarding.photoTooLarge : t.onboarding.photoType);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await uploadGalleryPhoto(userId, file, galleryQ.data?.length ?? 0);
      void queryClient.invalidateQueries({ queryKey: ["gallery", userId] });
    } catch {
      setError(t.common.errorText);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const parsed = profileFormSchema.safeParse({
      display_name: form.display_name,
      birth_date: form.birth_date,
      gender: form.gender || undefined,
      looking_for: form.looking_for || undefined,
      country_code: form.country_code,
      city: form.city || undefined,
      bio: form.bio || undefined,
      occupation: form.occupation || undefined,
      education: form.education || undefined,
      marital_status: form.marital_status || undefined,
      religiosity: form.religiosity || undefined,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      interests: splitList(form.interests),
      spoken_languages: splitList(form.spoken_languages),
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(
        first?.message === "ageError" ? t.onboarding.ageError : t.auth.errors.required,
      );
      return;
    }
    const d = parsed.data;
    save.mutate({
      display_name: d.display_name,
      birth_date: d.birth_date,
      gender: d.gender ?? null,
      looking_for: d.looking_for ?? null,
      country_code: d.country_code ?? null,
      city: d.city ?? null,
      bio: d.bio ?? null,
      occupation: d.occupation ?? null,
      education: d.education ?? null,
      marital_status: d.marital_status ?? null,
      religiosity: d.religiosity ?? null,
      height_cm: d.height_cm ?? null,
      interests: d.interests ?? [],
      spoken_languages: d.spoken_languages ?? [],
      is_hidden: hidden,
    });
  }

  if (profileQ.isPending) {
    return (
      <div className="flex min-h-screen flex-col bg-cream">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-gold-deep" aria-label={t.common.loading} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="panel-navy p-6 sm:p-8">
          <h1 className="text-2xl font-black text-cream">{t.profile.editTitle}</h1>

          {/* Avatar */}
          <section className="mt-6 flex items-center gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-gold/40 bg-navy">
              {avatarQ.data ? (
                <img src={avatarQ.data} alt={form.display_name} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center">
                  <UserRound className="h-9 w-9 text-gold/50" aria-hidden="true" />
                </span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                className="btn-outline-gold inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              >
                <Camera className="h-4 w-4" aria-hidden="true" /> {t.onboarding.changePhoto}
              </button>
              <p className="mt-2 text-[11px] text-cream/50">{t.onboarding.uploadHint}</p>
              <input
                ref={avatarInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label={t.onboarding.uploadPhoto}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleAvatar(file);
                  e.target.value = "";
                }}
              />
            </div>
          </section>

          {/* Gallery */}
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-bold text-gold">{t.profile.galleryTitle}</h2>
            {galleryQ.data && galleryQ.data.length > 0 ? (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {galleryQ.data.map((photo) => (
                  <li key={photo.id} className="relative overflow-hidden rounded-lg border border-gold/20">
                    {photo.url && (
                      <img src={photo.url} alt="" loading="lazy" className="h-28 w-full object-cover" />
                    )}
                    <button
                      type="button"
                      aria-label={t.profile.removePhoto}
                      onClick={() => removePhoto.mutate({ id: photo.id, path: photo.path })}
                      className="absolute end-1 top-1 rounded-full bg-navy-deep/80 p-1.5 text-cream hover:text-gold"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-cream/60">{t.profile.noPhotos}</p>
            )}
            <button
              type="button"
              onClick={() => galleryInput.current?.click()}
              disabled={uploading}
              className="btn-outline-gold mt-3 px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {uploading ? t.common.saving : t.profile.addPhoto}
            </button>
            <input
              ref={galleryInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label={t.profile.addPhoto}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleGallery(file);
                e.target.value = "";
              }}
            />
          </section>

          {/* Personal information */}
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
            <h2 className="text-sm font-bold text-gold">{t.profile.personalInfo}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.onboarding.displayName} id="display_name">
                <input
                  id="display_name"
                  className="field-navy w-full"
                  value={form.display_name}
                  onChange={(e) => set("display_name", e.target.value)}
                  required
                />
              </Field>
              <Field label={t.onboarding.birthDate} id="birth_date">
                <input
                  id="birth_date"
                  type="date"
                  className="field-navy w-full"
                  value={form.birth_date}
                  onChange={(e) => set("birth_date", e.target.value)}
                  required
                />
              </Field>
              <Field label={t.onboarding.gender} id="gender">
                <select
                  id="gender"
                  className="field-navy w-full"
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value as FormState["gender"])}
                >
                  <option value="">—</option>
                  <option value="male">{t.enums.gender.male}</option>
                  <option value="female">{t.enums.gender.female}</option>
                </select>
              </Field>
              <Field label={t.onboarding.lookingFor} id="looking_for">
                <select
                  id="looking_for"
                  className="field-navy w-full"
                  value={form.looking_for}
                  onChange={(e) => set("looking_for", e.target.value as FormState["looking_for"])}
                >
                  <option value="">—</option>
                  <option value="male">{t.enums.gender.male}</option>
                  <option value="female">{t.enums.gender.female}</option>
                </select>
              </Field>
              <Field label={t.onboarding.country} id="country_code">
                <select
                  id="country_code"
                  className="field-navy w-full"
                  value={form.country_code}
                  onChange={(e) => set("country_code", e.target.value)}
                >
                  <option value="">—</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t.onboarding.city} id="city">
                <input
                  id="city"
                  className="field-navy w-full"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </Field>
              <Field label={t.onboarding.occupation} id="occupation">
                <input
                  id="occupation"
                  className="field-navy w-full"
                  value={form.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                />
              </Field>
              <Field label={t.onboarding.education} id="education">
                <input
                  id="education"
                  className="field-navy w-full"
                  value={form.education}
                  onChange={(e) => set("education", e.target.value)}
                />
              </Field>
              <Field label={t.onboarding.maritalStatus} id="marital_status">
                <select
                  id="marital_status"
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
              <Field label={t.onboarding.religiosity} id="religiosity">
                <select
                  id="religiosity"
                  className="field-navy w-full"
                  value={form.religiosity}
                  onChange={(e) => set("religiosity", e.target.value as FormState["religiosity"])}
                >
                  <option value="">—</option>
                  <option value="practicing">{t.enums.religiosity.practicing}</option>
                  <option value="moderate">{t.enums.religiosity.moderate}</option>
                  <option value="cultural">{t.enums.religiosity.cultural}</option>
                  <option value="prefer_not_say">{t.enums.religiosity.prefer_not_say}</option>
                </select>
              </Field>
              <Field label={t.onboarding.heightCm} id="height_cm">
                <input
                  id="height_cm"
                  type="number"
                  min={120}
                  max={230}
                  className="field-navy w-full"
                  value={form.height_cm}
                  onChange={(e) => set("height_cm", e.target.value)}
                />
              </Field>
              <Field label={t.onboarding.spokenLanguages} id="spoken_languages">
                <input
                  id="spoken_languages"
                  className="field-navy w-full"
                  value={form.spoken_languages}
                  onChange={(e) => set("spoken_languages", e.target.value)}
                />
              </Field>
            </div>

            <Field label={t.onboarding.bio} id="bio">
              <textarea
                id="bio"
                rows={4}
                maxLength={1200}
                className="field-navy w-full"
                placeholder={t.onboarding.bioPlaceholder}
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
              />
            </Field>

            <Field label={t.onboarding.interests} id="interests" hint={t.onboarding.interestsHint}>
              <input
                id="interests"
                className="field-navy w-full"
                value={form.interests}
                onChange={(e) => set("interests", e.target.value)}
              />
            </Field>

            {/* Preferences */}
            <h2 className="mt-4 text-sm font-bold text-gold">{t.profile.preferences}</h2>
            <Field label={t.profile.preferredLanguage} id="locale">
              <select
                id="locale"
                className="field-navy w-full"
                value={locale}
                onChange={(e) => setLocale(e.target.value as typeof locale)}
              >
                {localeOrder.map((code) => (
                  <option key={code} value={code}>
                    {localeNames[code]}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-cream/80">
              <input
                type="checkbox"
                checked={hidden}
                onChange={(e) => setHidden(e.target.checked)}
                className="h-4 w-4 accent-[var(--gold)]"
              />
              {t.profile.hideProfile}
            </label>

            {error && (
              <p role="alert" className="text-xs text-red-300">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-xs text-gold">
                {notice}
              </p>
            )}

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={save.isPending}
                className="btn-gold flex-1 py-3 text-sm font-bold disabled:opacity-60"
              >
                {save.isPending ? t.common.saving : t.profile.saveChanges}
              </button>
              <Link to="/profile" className="btn-outline-gold px-5 py-3 text-center text-sm font-semibold">
                {t.profile.backToProfile}
              </Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-cream/70">
        {label}
      </label>
      {children}
      {hint && <span className="text-[11px] text-cream/45">{hint}</span>}
    </div>
  );
}
