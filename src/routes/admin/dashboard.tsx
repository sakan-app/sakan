import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  BadgeCheck,
  Bell,
  CreditCard,
  Flag,
  MessagesSquare,
  Radio,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AdminPageHeader, ErrorState, LoadingState, Panel, StatCard } from "@/components/admin/ui";
import { getLiveStats } from "@/lib/admin/ops.functions";

export const Route = createFileRoute("/admin/dashboard")({ component: AdminDashboard });

function AdminDashboard() {
  const fn = useServerFn(getLiveStats);
  const stats = useQuery({
    queryKey: ["admin", "live-stats"],
    queryFn: () => fn(),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Live platform health — refreshes automatically every 20 seconds."
        actions={
          <span className="chip-glass flex items-center gap-2 px-3 py-1.5 text-xs font-semibold">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            {stats.data ? `${stats.data.onlineNow} online now` : "connecting…"}
          </span>
        }
      />

      {stats.isLoading ? <LoadingState /> : null}
      {stats.isError ? <ErrorState message="Could not load statistics." onRetry={() => void stats.refetch()} /> : null}

      {stats.data ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <StatCard label="Total users" value={stats.data.usersTotal} icon={Users} />
            <StatCard label="Active (24h)" value={stats.data.usersActive24h} icon={Activity} tone="gold" />
            <StatCard label="New today" value={stats.data.usersNewToday} icon={UserPlus} />
            <StatCard label="Verified users" value={stats.data.usersVerified} icon={ShieldCheck} />
            <StatCard
              label="Pending verifications"
              value={stats.data.verificationsPending}
              icon={BadgeCheck}
              tone={stats.data.verificationsPending > 0 ? "gold" : "default"}
            />
            <StatCard
              label="Open reports"
              value={stats.data.reportsOpen}
              icon={Flag}
              tone={stats.data.reportsOpen > 0 ? "danger" : "default"}
            />
            <StatCard label="Active conversations" value={stats.data.conversationsActive} icon={MessagesSquare} hint="last 7 days" />
            <StatCard label="Messages today" value={stats.data.messagesToday} icon={Bell} />
            <StatCard label="Premium members" value={stats.data.premiumActive} icon={Sparkles} tone="gold" />
            <StatCard
              label="Revenue this month"
              value={`${(stats.data.revenueThisMonthCents / 100).toFixed(2)} USD`}
              icon={CreditCard}
              hint={stats.data.revenueThisMonthCents === 0 ? "no payments recorded yet" : undefined}
            />
            <StatCard label="Online now" value={stats.data.onlineNow} icon={Radio} hint="seen in the last 5 minutes" />
            <StatCard
              label="Registrations (14d)"
              value={stats.data.registrations14d.reduce((sum, d) => sum + d.count, 0)}
              icon={UserPlus}
            />
          </div>

          <Panel>
            <h2 className="text-sm font-semibold text-cream">Daily registrations · last 14 days</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.data.registrations14d}>
                  <defs>
                    <linearGradient id="signups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(13,27,61,0.95)",
                      border: "1px solid rgba(212,175,55,0.3)",
                      borderRadius: 12,
                      color: "#F7F3EA",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#D4AF37" strokeWidth={2} fill="url(#signups)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
