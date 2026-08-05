import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronLeft,
  CreditCard,
  Globe,
  HelpCircle,
  Heart,
  Image as ImageIcon,
  LogOut,
  ShieldCheck,
  UserRound,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { GlassCard, Screen } from "@/components/app/AppShell";
import { PushToggle, VersionIndicator } from "@/components/pwa/PushToggle";
import { shellStrings } from "@/components/app/shell.strings";
import { WallpaperPicker } from "@/components/chat/WallpaperPicker";
import { resolveSettings, wallpapersQuery } from "@/lib/chat/wallpaper-queries";
import { wallpaperStrings } from "@/lib/chat/wallpaper-strings";
import { findWallpaper, t4 } from "@/lib/chat/wallpapers";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureStrings } from "@/i18n/feature";
import { localeFlags, localeNames, localeOrder } from "@/i18n";
import { useI18n } from "@/lib/i18n";
import { RouteErrorBoundary } from "@/components/RouteError";
import {
  SOUND_PREF_EVENT,
  playNotificationSound,
  setSoundsEnabled,
  soundsEnabled,
} from "@/lib/notifications/sounds";

/** Sound-toggle copy for the four supported locales. */
const soundLabels = {
  ar: "أصوات التنبيهات",
  en: "Notification sounds",
  de: "Benachrichtigungstöne",
  fr: "Sons de notification",
} as const;

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات | سَكَن" },
      { name: "description", content: "إدارة حسابك وخصوصيتك ولغتك واشتراكك على سَكَن." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
  errorComponent: RouteErrorBoundary,
});

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 px-4 text-[11px] font-bold uppercase tracking-widest text-cream/45">
        {title}
      </h2>
      <GlassCard className="divide-y divide-white/8">{children}</GlassCard>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  to,
  onClick,
  danger = false,
}: {
  icon: typeof Bell;
  label: string;
  value?: string;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const inner = (
    <>
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${
          danger ? "bg-red-500/15 text-red-300" : "bg-white/8 text-gold"
        }`}
      >
        <Icon className="h-[17px] w-[17px]" />
      </span>
      <span className={`flex-1 text-sm font-semibold ${danger ? "text-red-300" : "text-cream"}`}>
        {label}
      </span>
      {value && <span className="text-xs text-cream/50">{value}</span>}
      {!danger && <ChevronLeft className="h-4 w-4 text-cream/30 rtl:rotate-0 ltr:rotate-180" />}
    </>
  );

  const className =
    "relative flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-white/5";

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

function SettingsPage() {
  const s = useFeatureStrings(shellStrings);
  const ws = useFeatureStrings(wallpaperStrings);
  const { t, locale, setLocale } = useI18n();
  const { signOut, user } = useAuth();
  const { plan } = useSubscription();
  const navigate = useNavigate();
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const [sounds, setSounds] = useState(true);
  // Read the stored preference after mount so SSR and hydration match.
  useEffect(() => setSounds(soundsEnabled()), []);

  function toggleSounds() {
    const next = !sounds;
    setSounds(next);
    setSoundsEnabled(next);
    window.dispatchEvent(new CustomEvent(SOUND_PREF_EVENT, { detail: next }));
    if (next) playNotificationSound("message");
  }
  const wallpapersQ = useQuery(wallpapersQuery(user?.id ?? ""));
  const globalWallpaper = resolveSettings(wallpapersQ.data, null);
  const wallpaperLabel =
    globalWallpaper.wallpaperType === "custom"
      ? ws.custom
      : t4(findWallpaper(globalWallpaper.wallpaperId).name, locale);

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <Screen title={s.settings}>
      <Group title={s.profile}>
        <Row icon={UserRound} label={s.editProfile} to="/profile/edit" />
        <Row icon={Heart} label={s.favorites} to="/favorites" />
        <Row icon={Bell} label={s.notifications} to="/notifications" />
        <button
          type="button"
          role="switch"
          aria-checked={sounds}
          onClick={toggleSounds}
          className="relative flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-white/5"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-white/8 text-gold">
            <Volume2 className="h-[17px] w-[17px]" />
          </span>
          <span className="flex-1 text-sm font-semibold text-cream">
            {soundLabels[locale as keyof typeof soundLabels] ?? soundLabels.en}
          </span>
          <span
            aria-hidden
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              sounds ? "bg-gold/80" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                sounds ? "start-[1.375rem]" : "start-0.5"
              }`}
            />
          </span>
        </button>
        <Row
          icon={ImageIcon}
          label={ws.title}
          value={wallpaperLabel}
          onClick={() => setWallpaperOpen(true)}
        />
        <PushToggle />
      </Group>

      <Group title={s.billing}>
        <Row
          icon={CreditCard}
          label={s.billing}
          value={plan?.name?.[locale] ?? plan?.code ?? ""}
          to="/billing"
        />
        <Row icon={ShieldCheck} label={t.nav.plans} to="/pricing" />
      </Group>

      <section className="mt-5">
        <h2 className="mb-2 px-4 text-[11px] font-bold uppercase tracking-widest text-cream/45">
          {t.nav.language}
        </h2>
        <GlassCard className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {localeOrder.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={code === locale}
                className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm transition tap-scale ${
                  code === locale
                    ? "chip-glass-active font-bold"
                    : "glass-tile text-cream/75"
                }`}
              >
                <span aria-hidden>{localeFlags[code]}</span>
                {localeNames[code]}
              </button>
            ))}
          </div>
        </GlassCard>
      </section>

      <Group title={s.more}>
        <Row icon={Globe} label={s.publicSite} to="/" />
        <Row icon={HelpCircle} label={t.footer.contact} to="/" />
        <Row icon={LogOut} label={s.signOut} onClick={handleSignOut} danger />
      </Group>

      <VersionIndicator />

      {wallpaperOpen && (
        <WallpaperPicker
          conversationId={null}
          current={globalWallpaper}
          onClose={() => setWallpaperOpen(false)}
        />
      )}
    </Screen>
  );
}