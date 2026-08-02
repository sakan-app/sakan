import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  CreditCard,
  Globe,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import logo from "@/assets/sakan-logo.png.asset.json";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { shellStrings, type ShellStrings } from "@/components/app/shell.strings";
import { useAuth } from "@/hooks/useAuth";
import { useFeatureStrings } from "@/i18n/feature";
import { localeFlags, localeNames, localeOrder } from "@/i18n";
import { useI18n } from "@/lib/i18n";
import { conversationsQuery } from "@/lib/chat/queries";
import { avatarUrlQuery, myProfileQuery } from "@/lib/profile-queries";

type TabKey = keyof Pick<
  ShellStrings,
  "home" | "discover" | "messages" | "matches" | "favorites" | "profile"
>;

type NavEntry = { to: string; icon: typeof Home; key: TabKey | keyof ShellStrings };

const TABS: Array<{ to: string; icon: typeof Home; key: TabKey }> = [
  { to: "/home", icon: Home, key: "home" },
  { to: "/discover", icon: Compass, key: "discover" },
  { to: "/messages", icon: MessageCircle, key: "messages" },
  { to: "/matches", icon: Sparkles, key: "matches" },
  { to: "/profile", icon: UserRound, key: "profile" },
];

const SIDEBAR_SECONDARY: NavEntry[] = [
  { to: "/favorites", icon: Heart, key: "favorites" },
  { to: "/billing", icon: CreditCard, key: "billing" },
  { to: "/settings", icon: Settings, key: "settings" },
];

function useActivePath() {
  return useRouterState({ select: (s) => s.location.pathname });
}

function isActivePath(pathname: string, to: string) {
  if (to === "/home") return pathname === "/home";
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** Immersive routes hide the tab bar so the screen behaves like a native push view. */
function isImmersive(pathname: string) {
  return /^\/messages\/[^/]+$/.test(pathname) || pathname.startsWith("/onboarding");
}

function useUnreadMessages() {
  const { user } = useAuth();
  const q = useQuery({ ...conversationsQuery(user?.id ?? ""), enabled: Boolean(user?.id) });
  return (q.data ?? []).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
}

/* ------------------------------------------------------------------ avatar */

function useMe() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const profileQ = useQuery({ ...myProfileQuery(userId), enabled: Boolean(userId) });
  const avatarQ = useQuery(avatarUrlQuery(profileQ.data?.avatar_url));
  return { profile: profileQ.data, avatarUrl: avatarQ.data ?? null };
}

function Avatar({
  url,
  name,
  size = 36,
}: {
  url: string | null;
  name?: string | undefined;
  size?: number;
}) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/10"
      style={{ width: size, height: size }}
    >
      {url ? (
        <img src={url} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <UserRound className="h-1/2 w-1/2 text-gold/70" />
      )}
    </span>
  );
}

/* ----------------------------------------------------------------- sidebar */

function Sidebar() {
  const s = useFeatureStrings(shellStrings);
  const pathname = useActivePath();
  const unread = useUnreadMessages();
  const { profile, avatarUrl } = useMe();

  return (
    <aside className="fixed inset-y-4 start-4 z-40 hidden w-[15.5rem] flex-col overflow-hidden rounded-[26px] glass lg:flex">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <img src={logo.url} alt="" className="h-9 w-9 object-contain" aria-hidden />
        <span className="text-base font-bold text-cream">
          سكن <span className="latin text-[11px] text-gold">SAKAN</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label={s.menu}>
        {TABS.map((item) => (
          <SidebarLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={s[item.key]}
            active={isActivePath(pathname, item.to)}
            badge={item.key === "messages" ? unread : 0}
          />
        ))}
        <div className="my-3 h-px bg-white/10" />
        {SIDEBAR_SECONDARY.map((item) => (
          <SidebarLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={s[item.key] as string}
            active={isActivePath(pathname, item.to)}
          />
        ))}
      </nav>

      <Link
        to="/profile"
        className="m-3 flex items-center gap-3 rounded-2xl px-3 py-2.5 glass-tile"
      >
        <Avatar url={avatarUrl} name={profile?.display_name} size={34} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-cream">
            {profile?.display_name ?? "—"}
          </span>
          <span className="block truncate text-[11px] text-cream/50">{s.profile}</span>
        </span>
      </Link>
    </aside>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
  active,
  badge = 0,
}: {
  to: string;
  icon: typeof Home;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors ${
        active ? "text-gold" : "text-cream/70 hover:text-cream"
      }`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="absolute inset-0 rounded-2xl border border-[color-mix(in_oklab,var(--gold)_30%,transparent)] bg-[color-mix(in_oklab,var(--gold)_14%,transparent)]"
          aria-hidden
        />
      )}
      <Icon className="relative h-[18px] w-[18px]" />
      <span className="relative flex-1 font-semibold">{label}</span>
      {badge > 0 && (
        <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-navy-deep">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

/* ----------------------------------------------------------------- toolbar */

function LanguageMenu() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={localeNames[locale]}
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full text-cream/80 transition hover:bg-white/10 hover:text-cream tap-scale"
      >
        <Globe className="h-[18px] w-[18px]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute end-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl glass p-1"
          >
            {localeOrder.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-xs transition hover:bg-white/10 ${
                  code === locale ? "text-gold" : "text-cream/85"
                }`}
              >
                <span aria-hidden>{localeFlags[code]}</span>
                <span className="flex-1">{localeNames[code]}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Toolbar() {
  const s = useFeatureStrings(shellStrings);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { profile, avatarUrl } = useMe();

  return (
    <header className="sticky top-0 z-30 -mx-1 mb-4 hidden items-center gap-3 rounded-b-[26px] px-1 py-3 lg:flex">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          void navigate({ to: "/discover", search: { q: query || undefined } });
        }}
        className="relative flex-1"
      >
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-cream/45" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={s.searchPlaceholder}
          aria-label={s.search}
          className="glass-field h-11 ps-9"
        />
      </form>
      <div className="flex items-center gap-1.5 rounded-full glass px-2 py-1.5">
        <LanguageMenu />
        <NotificationBell />
        <Link
          to="/messages"
          aria-label={s.messages}
          className="grid h-9 w-9 place-items-center rounded-full text-cream/80 transition hover:bg-white/10 hover:text-cream"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
        </Link>
        <Link to="/settings" aria-label={s.settings} className="ms-0.5">
          <Avatar url={avatarUrl} name={profile?.display_name} size={32} />
        </Link>
      </div>
    </header>
  );
}

/* --------------------------------------------------------------- mobile UI */

function MobileBar() {
  const s = useFeatureStrings(shellStrings);
  const { profile, avatarUrl } = useMe();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 glass-bar app-safe-top lg:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <Link to="/home" className="flex items-center gap-2">
          <img src={logo.url} alt="" className="h-8 w-8 object-contain" aria-hidden />
          <span className="text-sm font-bold text-cream">سكن</span>
        </Link>
        <div className="flex-1" />
        <LanguageMenu />
        <NotificationBell />
        <Link to="/settings" aria-label={s.settings}>
          <Avatar url={avatarUrl} name={profile?.display_name} size={30} />
        </Link>
      </div>
    </header>
  );
}

function TabBar() {
  const s = useFeatureStrings(shellStrings);
  const pathname = useActivePath();
  const unread = useUnreadMessages();

  return (
    <nav
      aria-label={s.menu}
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] lg:hidden"
    >
      <div className="mx-auto flex max-w-[520px] items-center justify-around rounded-[26px] glass-bar border border-white/12 px-1.5 py-1.5 shadow-[var(--shadow-float)]">
        {TABS.map((item) => {
          const active = isActivePath(pathname, item.to);
          const Icon = item.icon;
          const badge = item.key === "messages" ? unread : 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-[20px] px-2 tap-scale"
            >
              {active && (
                <motion.span
                  layoutId="tab-active"
                  transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  className="absolute inset-0 rounded-[20px] border border-[color-mix(in_oklab,var(--gold)_32%,transparent)] bg-[color-mix(in_oklab,var(--gold)_16%,transparent)]"
                  aria-hidden
                />
              )}
              <span className="relative">
                <Icon
                  className={`h-[20px] w-[20px] transition-colors ${
                    active ? "text-gold" : "text-cream/60"
                  }`}
                />
                {badge > 0 && (
                  <span className="absolute -end-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-navy-deep">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span
                className={`relative text-[10px] transition-colors ${
                  active ? "font-bold text-gold" : "text-cream/55"
                }`}
              >
                {s[item.key]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------- shell */

export function AppShell() {
  const pathname = useActivePath();
  const immersive = isImmersive(pathname);

  return (
    <div className="app-canvas">
      <Sidebar />
      <div className="lg:ps-[16.75rem] lg:pe-4">
        <MobileBar />
        <Toolbar />
        <main
          className={`mx-auto w-full max-w-[1180px] px-3 sm:px-5 lg:px-0 ${
            immersive ? "pb-0" : "pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:pb-8"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {!immersive && <TabBar />}
    </div>
  );
}

/* ------------------------------------------------------- screen primitives */

export function Screen({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="pt-4 lg:pt-1">
      {title && (
        <div className="mb-4 flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <h1 className="truncate text-[26px] font-black leading-tight text-cream sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-cream/55">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass-card ${className}`}>{children}</div>;
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-[22px] bg-white/5" />
      ))}
    </div>
  );
}