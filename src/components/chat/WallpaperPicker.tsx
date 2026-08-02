import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Crown, Loader2, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureStrings } from "@/i18n/feature";
import { moderateImage } from "@/lib/ai/moderation.functions";
import { useI18n } from "@/lib/i18n";
import {
  resetConversationWallpaper,
  saveWallpaper,
  uploadCustomWallpaper,
} from "@/lib/chat/wallpaper-queries";
import { wallpaperStrings } from "@/lib/chat/wallpaper-strings";
import {
  BUILTIN_WALLPAPERS,
  DEFAULT_SETTINGS,
  WALLPAPER_CATEGORIES,
  ensureReadable,
  findWallpaper,
  t4,
  type WallpaperSettings,
} from "@/lib/chat/wallpapers";
import { ChatWallpaper } from "@/components/chat/ChatWallpaper";

type Props = {
  /** null → editing the global default from settings. */
  conversationId: string | null;
  current: WallpaperSettings;
  onClose: () => void;
};

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[11px] font-semibold text-cream/70">
        {label}
        <span className="tabular-nums text-cream/50">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-cream/15 accent-gold"
      />
    </label>
  );
}

export function WallpaperPicker({ conversationId, current, onClose }: Props) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const s = useFeatureStrings(wallpaperStrings);
  const queryClient = useQueryClient();
  const { entitlements } = useSubscription();
  const isPremium = entitlements.planCode !== "free";
  const runModeration = useServerFn(moderateImage);

  const [draft, setDraft] = useState<WallpaperSettings>(current);
  const [category, setCategory] = useState<string>("all");
  const [scopeGlobal, setScopeGlobal] = useState(conversationId === null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const list = useMemo(
    () => (category === "all" ? BUILTIN_WALLPAPERS : BUILTIN_WALLPAPERS.filter((w) => w.category === category)),
    [category],
  );

  function pick(id: string, premium: boolean, recommendedBlur: number) {
    if (premium && !isPremium) {
      toast.error(s.premiumLocked);
      return;
    }
    setDraft((d) =>
      ensureReadable({ ...d, wallpaperId: id, wallpaperType: "builtin", blur: recommendedBlur }),
    );
  }

  async function handleUpload(file: File) {
    if (!user?.id) return;
    if (!isPremium) {
      toast.error(s.premiumLocked);
      return;
    }
    setUploading(true);
    try {
      const path = await uploadCustomWallpaper(user.id, file);
      const verdict = await runModeration({ data: { storagePath: path, bucket: "wallpapers" } }).catch(
        () => null,
      );
      if (verdict && verdict.verdict === "rejected") {
        toast.error(s.moderationRejected);
        return;
      }
      setDraft((d) =>
        ensureReadable({ ...d, wallpaperType: "custom", customImage: path, wallpaperId: "custom" }),
      );
    } catch (error) {
      const code = error instanceof Error ? error.message : "failed";
      toast.error(code === "type" ? s.uploadTypeError : code === "size" ? s.uploadSizeError : s.uploadFailed);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!user?.id) return;
    setSaving(true);
    try {
      await saveWallpaper(queryClient, {
        userId: user.id,
        conversationId: scopeGlobal ? null : conversationId,
        settings: draft,
      });
      toast.success(s.saved);
      onClose();
    } catch {
      toast.error(s.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!user?.id) return;
    try {
      if (conversationId && !scopeGlobal) {
        await resetConversationWallpaper(queryClient, { userId: user.id, conversationId });
      } else {
        await saveWallpaper(queryClient, {
          userId: user.id,
          conversationId: null,
          settings: DEFAULT_SETTINGS,
        });
      }
      toast.success(s.resetDone);
      onClose();
    } catch {
      toast.error(s.saveFailed);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={s.title}>
      <button type="button" aria-label={s.close} onClick={onClose} className="absolute inset-0 bg-navy-deep/70 backdrop-blur-sm" />
      <div className="fade-up relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-gold/20 bg-navy-deep/95 shadow-[var(--shadow-card)] sm:rounded-3xl">
        <div className="flex items-start gap-3 border-b border-gold/15 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-cream">{s.title}</h2>
            <p className="mt-0.5 text-xs text-cream/60">{s.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={s.close}
            className="tap-scale grid h-9 w-9 place-items-center rounded-full text-gold hover:bg-gold/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Live preview */}
          <div className="relative h-36 overflow-hidden rounded-2xl border border-gold/15">
            <ChatWallpaper settings={draft} />
            <div className="relative flex h-full flex-col justify-end gap-2 p-3">
              <span className="w-fit max-w-[80%] rounded-2xl rounded-es-md bg-navy-soft/90 px-3 py-2 text-xs text-cream shadow-sm">
                {s.previewIncoming}
              </span>
              <span className="ms-auto w-fit max-w-[80%] rounded-2xl rounded-ee-md bg-gold px-3 py-2 text-xs font-semibold text-navy-deep shadow-sm">
                {s.previewOutgoing}
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-cream/50">{s.readabilityNote}</p>

          {/* Categories */}
          <div className="mt-4 -mx-1 flex gap-1.5 overflow-x-auto pb-1">
            {[{ id: "all", label: s.builtIn }, ...WALLPAPER_CATEGORIES.map((c) => ({ id: c.id, label: t4(c.label, locale) }))].map(
              (c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  aria-pressed={category === c.id}
                  className={`tap-scale shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    category === c.id
                      ? "border-gold bg-gold text-navy-deep"
                      : "border-gold/25 text-cream/70 hover:bg-gold/10"
                  }`}
                >
                  {c.label}
                </button>
              ),
            )}
          </div>

          {/* Gallery */}
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {list.map((w) => {
              const active = draft.wallpaperType === "builtin" && draft.wallpaperId === w.id;
              const locked = w.premium && !isPremium;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => pick(w.id, w.premium, w.recommendedBlur)}
                  title={t4(w.name, locale)}
                  aria-label={t4(w.name, locale)}
                  aria-pressed={active}
                  className={`tap-scale relative aspect-[3/4] overflow-hidden rounded-xl border transition ${
                    active ? "border-gold ring-2 ring-gold/40" : "border-white/10 hover:border-gold/40"
                  }`}
                >
                  <span className="absolute inset-0" style={{ background: w.image, backgroundSize: "cover" }} />
                  {locked && (
                    <span className="absolute inset-0 grid place-items-center bg-navy-deep/55">
                      <Crown className="h-4 w-4 text-gold" aria-label={s.premiumBadge} />
                    </span>
                  )}
                  {active && (
                    <span className="absolute top-1 end-1 grid h-5 w-5 place-items-center rounded-full bg-gold text-navy-deep">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-navy-deep/70 px-1.5 py-1 text-[9px] font-semibold text-cream">
                    {t4(w.name, locale)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom upload */}
          <div className="mt-5 rounded-2xl border border-gold/15 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-cream">
                  {s.custom}
                  <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold">
                    {s.premiumBadge}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-cream/55">{s.uploadHint}</p>
              </div>
              <div className="flex items-center gap-2">
                {draft.wallpaperType === "custom" && (
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, wallpaperType: "builtin", wallpaperId: "default" }))}
                    className="rounded-full border border-gold/25 px-3 py-1.5 text-[11px] font-semibold text-cream/70 hover:bg-gold/10"
                  >
                    {s.removeCustom}
                  </button>
                )}
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="btn-outline-gold flex items-center gap-1.5 px-3 py-1.5 text-[11px] disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? s.uploading : s.upload}
                </button>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleUpload(file);
              }}
            />
          </div>

          {/* Effects */}
          <div className="mt-5">
            <h3 className="text-xs font-bold text-cream">{s.effects}</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Slider label={s.opacity} value={draft.opacity} min={0} max={100} onChange={(n) => setDraft((d) => ({ ...d, opacity: n }))} />
              <Slider label={s.blur} value={draft.blur} min={0} max={40} onChange={(n) => setDraft((d) => ({ ...d, blur: n }))} />
              <Slider label={s.brightness} value={draft.brightness} min={30} max={130} onChange={(n) => setDraft((d) => ({ ...d, brightness: n }))} />
              <Slider label={s.overlay} value={draft.overlay} min={0} max={90} onChange={(n) => setDraft((d) => ({ ...d, overlay: n }))} />
            </div>
          </div>

          {/* Scope */}
          {conversationId && (
            <div className="mt-5">
              <h3 className="text-xs font-bold text-cream">{s.scopeLabel}</h3>
              <div className="mt-2 flex gap-2">
                {[
                  { global: false, label: s.scopeConversation },
                  { global: true, label: s.scopeGlobal },
                ].map((option) => (
                  <button
                    key={String(option.global)}
                    type="button"
                    onClick={() => setScopeGlobal(option.global)}
                    aria-pressed={scopeGlobal === option.global}
                    className={`tap-scale rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                      scopeGlobal === option.global
                        ? "border-gold bg-gold text-navy-deep"
                        : "border-gold/25 text-cream/70 hover:bg-gold/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gold/15 px-5 py-3">
          <button
            type="button"
            onClick={() => void handleReset()}
            className="text-[11px] font-semibold text-cream/60 underline-offset-4 hover:text-cream hover:underline"
          >
            {s.reset}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="btn-gold flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? s.saving : s.save}
          </button>
        </div>
      </div>
    </div>
  );
}

export { findWallpaper };
