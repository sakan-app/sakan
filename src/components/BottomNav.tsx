import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, Search, Sparkles, User } from "lucide-react";
import { useFeatureStrings } from "@/i18n/feature";
import { navStrings } from "@/components/pwa/pwa.strings";

interface NavItem {
  to: string;
  icon: typeof Home;
  labelKey: keyof typeof navStrings.ar;
}

const items: NavItem[] = [
  { to: "/", icon: Home, labelKey: "home" },
  { to: "/search", icon: Search, labelKey: "search" },
  { to: "/favorites", icon: Heart, labelKey: "favorites" },
  { to: "/profile", icon: User, labelKey: "profile" },
];

export function BottomNav() {
  const strings = useFeatureStrings(navStrings);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function isActive(to: string) {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  }

  const [first, second, third, fourth] = items as [NavItem, NavItem, NavItem, NavItem];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/20 bg-navy-deep/80 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={strings.home}
    >
      <div className="relative mx-auto flex max-w-[560px] items-center justify-between px-4 py-2">
        <NavLink item={first} active={isActive(first.to)} label={strings[first.labelKey]} />
        <NavLink item={second} active={isActive(second.to)} label={strings[second.labelKey]} />

        <Link
          to="/profile/edit"
          aria-label={strings.quickPromotion}
          className="relative -mt-8 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-navy-deep bg-gradient-to-br from-gold to-gold-deep shadow-[0_6px_18px_rgba(212,175,55,0.45)] transition-transform active:scale-95"
        >
          <Sparkles className="h-6 w-6 text-navy-deep" />
        </Link>

        <NavLink item={third} active={isActive(third.to)} label={strings[third.labelKey]} />
        <NavLink item={fourth} active={isActive(fourth.to)} label={strings[fourth.labelKey]} />
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
  label,
}: {
  item: NavItem;
  active: boolean;
  label: string;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className="flex w-14 flex-col items-center gap-1 py-1 text-cream/60 transition-colors"
      aria-current={active ? "page" : undefined}
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <Icon
          className={`h-5 w-5 transition-colors duration-200 ${
            active ? "text-gold" : "text-cream/60"
          }`}
        />
        <span
          className={`absolute -bottom-2 h-1 w-1 rounded-full bg-gold transition-all duration-200 ${
            active ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
          aria-hidden
        />
      </span>
      <span
        className={`text-[10px] transition-colors duration-200 ${
          active ? "font-semibold text-gold" : "text-cream/60"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
