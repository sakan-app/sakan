import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  BarChart3,
  Bell,
  BadgeCheck,
  CreditCard,
  Flag,
  Heart,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Receipt,
  Settings2,
  ShieldAlert,
  Users,
} from "lucide-react";

import { LoadingState } from "@/components/admin/ui";
import { getAdminAccess } from "@/lib/admin/ops.functions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "SAKAN Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AdminLayout,
  errorComponent: RouteErrorBoundary,
});

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/verifications", label: "Verification", icon: BadgeCheck },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/matches", label: "Matches", icon: Heart },
  { to: "/admin/conversations", label: "Conversations", icon: MessagesSquare },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/payments", label: "Payments", icon: Receipt },
  { to: "/admin/ads", label: "Featured ads", icon: Megaphone },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/activity", label: "Activity log", icon: Activity },
  { to: "/admin/settings", label: "Settings", icon: Settings2 },
] as const;

function AdminLayout() {
  const access = useAdminAccess();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (access.isLoading) {
    return (
      <div className="min-h-screen bg-navy-deep">
        <LoadingState label="Checking permissions…" />
      </div>
    );
  }

  if (!access.data?.isStaff) return <Forbidden />;

  return (
    <div dir="ltr" className="min-h-screen bg-navy-deep text-cream">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(212,175,55,0.12),transparent_55%)]" />
      <div className="relative mx-auto flex max-w-[1600px] gap-6 px-3 py-4 sm:px-6 lg:py-8">
        <aside className="glass-card sticky top-6 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col rounded-2xl p-4 lg:flex">
          <div className="px-2 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">SAKAN</p>
            <p className="text-lg font-bold">Admin Console</p>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {NAV.map((item) => (
              <NavLink key={item.to} {...item} active={pathname.startsWith(item.to)} />
            ))}
          </nav>
          <div className="mt-3 border-t border-cream/10 px-2 pt-3 text-[11px] text-cream/45">
            <p className="font-semibold text-cream/70">{access.data.roles.join(" · ") || "staff"}</p>
            <Link to="/home" className="mt-1 inline-block text-gold hover:underline">
              ← Back to app
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "chip-glass shrink-0 px-3 py-1.5 text-xs font-semibold",
                  pathname.startsWith(item.to) && "chip-glass-active",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-cream/70 transition hover:bg-cream/8 hover:text-cream",
        active && "bg-gold/12 text-cream shadow-[inset_0_0_0_1px_var(--glass-hairline-gold)]",
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-gold" : "text-cream/50")} />
      {label}
    </Link>
  );
}

function Forbidden() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deep px-4">
      <div className="glass-card max-w-md rounded-2xl p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-red-400" aria-hidden="true" />
        <p className="mt-4 text-4xl font-black text-cream">403</p>
        <h1 className="mt-2 text-xl font-bold text-cream">Administrator access required</h1>
        <p className="mt-3 text-sm text-cream/65">
          Your account does not hold an admin, super admin or moderator role. If you believe this is a mistake, contact a
          platform super admin.
        </p>
        <Link to="/home" className="btn-gold mt-6 inline-block px-5 py-2.5 text-sm font-bold">
          Return to SAKAN
        </Link>
      </div>
    </div>
  );
}

export function useAdminAccess() {
  const fn = useServerFn(getAdminAccess);
  return useQuery({ queryKey: ["admin", "access"], queryFn: () => fn(), staleTime: 60_000 });
}
