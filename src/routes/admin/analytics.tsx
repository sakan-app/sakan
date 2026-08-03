import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminPageHeader, ErrorState, LoadingState, Panel, StatCard } from "@/components/admin/ui";
import { getAnalytics } from "@/lib/admin/ops.functions";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/analytics")({ component: AdminAnalytics, errorComponent: RouteErrorBoundary });

const PALETTE = ["#D4AF37", "#6EA8FE", "#5CD6A8", "#F08C8C", "#B79CED", "#F5C36E", "#7FD1DE", "#E68FC3"];
const TOOLTIP = {
  background: "rgba(13,27,61,0.95)",
  border: "1px solid rgba(212,175,55,0.3)",
  borderRadius: 12,
  color: "#F7F3EA",
  fontSize: 12,
} as const;
const AXIS = { fill: "rgba(255,255,255,0.45)", fontSize: 11 } as const;


function AdminAnalytics() {
  const fn = useServerFn(getAnalytics);
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const analytics = useQuery({
    queryKey: ["admin", "analytics", range],
    queryFn: () => fn({ data: { range } }),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics"
        subtitle="Every chart is computed live from the production database."
        actions={
          <div className="flex gap-2">
            {([7, 30, 90] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={cn("chip-glass px-3 py-1.5 text-xs font-semibold", range === value && "chip-glass-active")}
              >
                {value}d
              </button>
            ))}
          </div>
        }
      />

      {analytics.isLoading ? <LoadingState /> : null}
      {analytics.isError ? <ErrorState message="Could not load analytics." onRetry={() => void analytics.refetch()} /> : null}

      {analytics.data ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total users" value={analytics.data.totalUsers} />
            <StatCard label="Verification rate" value={`${analytics.data.verifiedRate}%`} tone="gold" />
            <StatCard label="30-day retention" value={`${analytics.data.retention30}%`} />
            <StatCard
              label="Reports in range"
              value={analytics.data.reportsPerDay.reduce((sum, d) => sum + d.value, 0)}
              tone="danger"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartPanel title="Cumulative user growth">
              <LineChart data={analytics.data.growth}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={TOOLTIP} />
                <Line type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartPanel>

            <ChartPanel title="Daily signups">
              <BarChart data={analytics.data.signups}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="value" fill="#6EA8FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartPanel>

            <ChartPanel title="Messages per day">
              <BarChart data={analytics.data.messagesPerDay}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="value" fill="#5CD6A8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartPanel>

            <ChartPanel title="Matches per day">
              <LineChart data={analytics.data.matchesPerDay}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP} />
                <Line type="monotone" dataKey="value" stroke="#B79CED" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartPanel>

            <ChartPanel title="Reports trend">
              <BarChart data={analytics.data.reportsPerDay}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={28} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="value" fill="#F08C8C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartPanel>

            <ChartPanel title="Top countries">
              <BarChart data={analytics.data.countries} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={44} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartPanel>

            <DonutPanel title="Language distribution" data={analytics.data.languages} />
            <DonutPanel title="Subscription distribution" data={analytics.data.plans} />
            <DonutPanel title="Verification pipeline" data={analytics.data.verificationStatus} />
            <DonutPanel title="Report reasons" data={analytics.data.reportReasons} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Panel>
      <h2 className="text-sm font-semibold text-cream">{title}</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function DonutPanel({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <Panel>
        <h2 className="text-sm font-semibold text-cream">{title}</h2>
        <p className="py-16 text-center text-sm text-cream/45">No data yet.</p>
      </Panel>
    );
  }
  return (
    <Panel>
      <h2 className="text-sm font-semibold text-cream">{title}</h2>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-52 w-full sm:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-full space-y-1.5 sm:w-1/2">
          {data.map((entry, index) => (
            <li key={entry.name} className="flex items-center justify-between gap-2 text-xs text-cream/70">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[index % PALETTE.length] }} />
                {entry.name}
              </span>
              <span className="font-semibold tabular-nums text-cream">{entry.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
