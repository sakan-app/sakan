import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ImagePlus, Loader2, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useFeatureStrings } from "@/i18n/feature";
import { profileStudioStrings } from "@/lib/profile/strings";
import { avatarUrlQuery, myProfileQuery, updateMyProfile } from "@/lib/profile-queries";
import {
  ACCENT_PRESETS,
  AVATAR_BORDERS,
  PRESENCE_DOT,
  PRESENCE_STATUSES,
  PROFILE_THEMES,
  THEME_GRADIENT,
  avatarBorderClass,
  coverUrlQuery,
  profileStrength,
  uploadCover,
  validateCover,
  type AvatarBorder,
  type PresenceStatus,
  type ProfileTheme,
} from "@/lib/profile/appearance";
import { haptic } from "@/lib/notifications/shared";

export const Route = createFileRoute("/_authenticated/profile/appearance")({
  head: () => ({
    meta: [
      { title: "استوديو الملف الشخصي | سَكَن" },
      { name: "description", content: "خصّص غلاف ملفك وألوانه وسِمته وحالة حضورك على منصة سَكَن." },
      { property: "og:title", content: "استوديو الملف الشخصي | سَكَن" },
      { property: "og:description", content: "خصّص غلاف ملفك وألوانه وسِمته وحالة حضورك على منصة سَكَن." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppearanceStudio,
});

function AppearanceStudio() {
  const s = useFeatureStrings(profileStudioStrings);
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const profileQ = useQuery({ ...myProfileQuery(userId), enabled: Boolean(userId) });
  const profile = profileQ.data;

  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [accent, setAccent] = useState("#D4AF37");
  const [theme, setTheme] = useState<ProfileTheme>("navy");
  const [glass, setGlass] = useState(60);
  const [border, setBorder] = useState<AvatarBorder>("none");
  const [status, setStatus] = useState<PresenceStatus>("online");
  const [hideLastSeen, setHideLastSeen] = useState(false);
  const [hideTyping, setHideTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setCoverPath(profile.cover_url);
    setAccent(profile.accent_color);
    setTheme(profile.profile_theme);
    setGlass(profile.glass_intensity);
    setBorder(profile.avatar_border);
    setStatus(profile.presence_status);
    setHideLastSeen(profile.hide_last_seen);
    setHideTyping(profile.hide_typing);
  }, [profile]);

  const avatarQ = useQuery(avatarUrlQuery(profile?.avatar_url));
  const coverQ = useQuery(coverUrlQuery(coverPath));
  const strength = useMemo(() => (profile ? profileStrength(profile) : null), [profile]);

  const save = useMutation({
    mutationFn: () =>
      updateMyProfile(userId, {
        cover_url: coverPath,
        accent_color: accent,
        profile_theme: theme,
        glass_intensity: glass,
        avatar_border: border,
        presence_status: status,
        hide_last_seen: hideLastSeen,
        hide_typing: hideTyping,
      }),
    onSuccess: () => {
      haptic([10, 20]);
      toast.success(s.saved);
      void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const onPickCover = async (file: File) => {
    const invalid = validateCover(file);
    if (invalid) {
      toast.error(invalid === "type" ? s.coverErrorType : s.coverErrorSize);
      return;
    }
    setUploading(true);
    try {
      const path = await uploadCover(userId, file);
      setCoverPath(path);
      haptic();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  if (profileQ.isPending) {
    return (
      <div className="flex justify-center py-24" role="status" aria-live="polite">
        <Loader2 className="h-7 w-7 animate-spin text-gold-deep" aria-hidden />
      </div>
    );
  }

  return (
    <div className="w-full" style={{ ["--sakan-accent" as string]: accent }}>
      <main className="mx-auto w-full max-w-4xl px-5 py-8 lg:px-8">
        <Link to="/profile" className="inline-flex items-center gap-2 text-xs text-cream/60 hover:text-cream">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          {s.title}
        </Link>
        <h1 className="mt-3 text-2xl font-black text-cream">{s.title}</h1>
        <p className="mt-1 text-sm text-cream/60">{s.subtitle}</p>

        {/* Live preview */}
        <section className="mt-6" aria-label={s.preview}>
          <div
            className="overflow-hidden rounded-3xl border border-white/10"
            style={{ background: THEME_GRADIENT[theme] }}
          >
            <div className="relative h-36 w-full sm:h-44">
              {coverQ.data ? (
                <img src={coverQ.data} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full" style={{ background: THEME_GRADIENT[theme] }} />
              )}
              <div
                className="absolute inset-0"
                style={{
                  backdropFilter: `blur(${Math.round(glass / 8)}px)`,
                  backgroundColor: `color-mix(in oklab, var(--color-navy) ${glass / 2}%, transparent)`,
                }}
              />
            </div>
            <div className="flex items-end gap-4 px-5 pb-5 -mt-10">
              <div className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-navy ${avatarBorderClass(border)}`}>
                {avatarQ.data ? (
                  <img src={avatarQ.data} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center">
                    <UserRound className="h-8 w-8 text-gold/50" aria-hidden />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p className="truncate text-lg font-black text-cream">{profile?.display_name}</p>
                <p className="mt-1 inline-flex items-center gap-2 text-xs text-cream/70">
                  <span className={`h-2 w-2 rounded-full ${PRESENCE_DOT[status]}`} aria-hidden />
                  {s.statuses[status]}
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1.5 text-[11px] font-bold text-navy"
                style={{ backgroundColor: accent }}
              >
                {s.preview}
              </span>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Cover */}
          <Card title={s.cover} hint={s.coverHint}>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onPickCover(file);
                  e.target.value = "";
                }}
              />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-gold inline-flex items-center gap-2 px-4 py-2 text-xs">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
                {s.coverUpload}
              </button>
              {coverPath && (
                <button type="button" onClick={() => setCoverPath(null)} className="btn-outline-gold inline-flex items-center gap-2 px-4 py-2 text-xs">
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {s.coverRemove}
                </button>
              )}
            </div>
          </Card>

          {/* Accent */}
          <Card title={s.accent} hint={s.accentHint}>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccent(color)}
                  aria-label={color}
                  aria-pressed={accent === color}
                  className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                    accent === color ? "border-cream scale-110" : "border-white/20"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {accent === color && <Check className="h-4 w-4 text-navy" aria-hidden />}
                </button>
              ))}
              <label className="ms-2 inline-flex items-center gap-2 text-xs text-cream/60">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value.toUpperCase())}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-white/20 bg-transparent"
                  aria-label={s.accent}
                />
              </label>
            </div>
          </Card>

          {/* Theme */}
          <Card title={s.theme}>
            <div className="grid grid-cols-3 gap-2">
              {PROFILE_THEMES.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  aria-pressed={theme === key}
                  className={`rounded-2xl border p-2 text-[11px] font-semibold text-cream transition ${
                    theme === key ? "border-gold-deep" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <span className="mb-2 block h-10 rounded-xl" style={{ background: THEME_GRADIENT[key] }} />
                  {s.themes[key]}
                </button>
              ))}
            </div>
          </Card>

          {/* Glass + border */}
          <Card title={s.glass} hint={s.glassHint}>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={glass}
              onChange={(e) => setGlass(Number(e.target.value))}
              className="w-full accent-gold-deep"
              aria-label={s.glass}
              aria-valuetext={`${glass}%`}
            />
            <p className="mt-1 text-[11px] text-cream/50">{glass}%</p>

            <h3 className="mt-5 text-xs font-bold text-gold">{s.border}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATAR_BORDERS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBorder(key)}
                  aria-pressed={border === key}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                    border === key ? "bg-gold-deep text-navy" : "glass-card border-white/10 text-cream/70"
                  }`}
                >
                  {s.borders[key]}
                </button>
              ))}
            </div>
          </Card>

          {/* Presence */}
          <Card title={s.presence} hint={s.presenceHint}>
            <div className="flex flex-wrap gap-2">
              {PRESENCE_STATUSES.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  aria-pressed={status === key}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                    status === key ? "bg-gold-deep text-navy" : "glass-card border-white/10 text-cream/70"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${PRESENCE_DOT[key]}`} aria-hidden />
                  {s.statuses[key]}
                </button>
              ))}
            </div>
            <Toggle
              label={s.hideLastSeen}
              hint={s.hideLastSeenHint}
              checked={hideLastSeen}
              onChange={setHideLastSeen}
            />
            <Toggle label={s.hideTyping} hint={s.hideTypingHint} checked={hideTyping} onChange={setHideTyping} />
          </Card>

          {/* Strength */}
          <Card title={s.strength} hint={s.strengthHint}>
            <div className="h-2 w-full overflow-hidden rounded-full bg-cream/10">
              <div
                className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${strength?.score ?? 0}%`, backgroundColor: accent }}
              />
            </div>
            <p className="mt-1 text-[11px] text-cream/50">{strength?.score ?? 0}%</p>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {strength?.segments.map((seg) => (
                <li key={seg.key} className="flex items-center gap-2 text-xs">
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-full ${seg.done ? "bg-emerald-400/20 text-emerald-300" : "bg-white/10 text-cream/40"}`}
                    aria-hidden
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className={seg.done ? "text-cream/80" : "text-cream/50"}>{s.strengthItems[seg.key]}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="sticky bottom-4 mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="btn-gold inline-flex items-center gap-2 px-6 py-3 text-sm font-bold shadow-lg"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {save.isPending ? s.saving : s.save}
          </button>
        </div>
      </main>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="glass-card rounded-3xl border-white/10 p-5">
      <h2 className="text-sm font-bold text-gold">{title}</h2>
      {hint && <p className="mt-1 mb-3 text-[11px] text-cream/50">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="mt-4 flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => {
          haptic(8);
          onChange(!checked);
        }}
        className={`mt-0.5 h-6 w-11 shrink-0 rounded-full p-0.5 transition ${checked ? "bg-gold-deep" : "bg-white/15"}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-cream transition-transform ${checked ? "translate-x-5 rtl:-translate-x-5" : ""}`}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-cream">{label}</span>
        <span className="block text-[11px] text-cream/50">{hint}</span>
      </span>
    </label>
  );
}
