import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, CreditCard, Repeat, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
  ActionButton,
  AdminInput,
  AdminPageHeader,
  AdminSelect,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  Panel,
  Pill,
  StatCard,
  TableShell,
  Td,
  Th,
} from "@/components/admin/ui";
import {
  getBillingOverview,
  listPlansAdmin,
  listSubscriptionsAdmin,
  runSubscriptionAction,
} from "@/lib/admin/ops.functions";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions · SAKAN Admin" },
      { name: "description", content: "Subscriptions management for SAKAN administrators." },
      { property: "og:title", content: "Subscriptions · SAKAN Admin" },
      { property: "og:description", content: "Subscriptions management for SAKAN administrators." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSubscriptions,
  errorComponent: RouteErrorBoundary,
});

const STATUSES = ["all", "active", "trialing", "past_due", "canceled", "expired"] as const;
type StatusFilter = (typeof STATUSES)[number];

const money = (cents: number, currency = "USD") => `${(cents / 100).toFixed(2)} ${currency}`;

function toneFor(status: string) {
  if (status === "active" || status === "trialing") return "success" as const;
  if (status === "past_due") return "warning" as const;
  if (status === "expired" || status === "canceled") return "danger" as const;
  return "neutral" as const;
}

function AdminSubscriptions() {
  const overviewFn = useServerFn(getBillingOverview);
  const listFn = useServerFn(listSubscriptionsAdmin);
  const plansFn = useServerFn(listPlansAdmin);
  const actFn = useServerFn(runSubscriptionAction);
  const queryClient = useQueryClient();
  const [, confirm, , confirmNode] = useConfirm();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [planCode, setPlanCode] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const overview = useQuery({ queryKey: ["admin", "billing", "overview"], queryFn: () => overviewFn(), staleTime: 30_000 });
  const plans = useQuery({ queryKey: ["admin", "billing", "plans"], queryFn: () => plansFn(), staleTime: 300_000 });
  const subs = useQuery({
    queryKey: ["admin", "subscriptions", status, planCode, search, page],
    queryFn: () =>
      listFn({
        data: { status, planCode: planCode || undefined, search: search || undefined, page, pageSize: 25 },
      }),
    placeholderData: keepPreviousData,
  });

  const act = useMutation({
    mutationFn: (input: Parameters<typeof actFn>[0]["data"]) => actFn({ data: input }),
    onSuccess: () => {
      toast.success("Subscription updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "billing", "overview"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Subscriptions"
        subtitle="Plans, renewals, grace periods and recurring revenue — provider independent."
        actions={
          <Link to="/admin/payments" className="chip-glass px-3 py-1.5 text-xs font-semibold">
            Payments →
          </Link>
        }
      />

      {overview.isLoading ? <LoadingState /> : null}
      {overview.isError ? <ErrorState message="Could not load revenue." onRetry={() => void overview.refetch()} /> : null}
      {overview.data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="MRR" value={money(overview.data.mrrCents)} icon={Repeat} tone="gold" />
          <StatCard label="ARR" value={money(overview.data.arrCents)} icon={TrendingUp} tone="gold" />
          <StatCard label="Revenue this month" value={money(overview.data.revenueThisMonthCents)} icon={Wallet} />
          <StatCard label="Active" value={overview.data.subscriptionsActive} icon={CreditCard} />
          <StatCard label="Past due" value={overview.data.subscriptionsPastDue} icon={CalendarClock} tone={overview.data.subscriptionsPastDue > 0 ? "danger" : "default"} />
          <StatCard label="Expired" value={overview.data.subscriptionsExpired} icon={CalendarClock} />
        </div>
      ) : null}

      {overview.data && overview.data.byPlan.length > 0 ? (
        <Panel className="space-y-3">
          <h2 className="text-sm font-semibold text-cream">Recurring revenue by plan</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.data.byPlan.map((row) => (
              <div key={row.plan_code} className="rounded-xl border border-cream/10 bg-cream/4 p-4">
                <p className="text-xs uppercase tracking-wide text-cream/50">{row.plan_code}</p>
                <p className="mt-1 text-lg font-bold text-cream">{money(row.mrrCents)}<span className="text-xs font-normal text-cream/50"> /mo</span></p>
                <p className="text-xs text-cream/55">{row.count} subscribers</p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={cn("chip-glass px-3 py-1.5 text-xs font-semibold capitalize", status === value && "chip-glass-active")}
            >
              {value.replace("_", " ")}
            </button>
          ))}
          <AdminSelect
            value={planCode}
            onChange={(event) => {
              setPlanCode(event.target.value);
              setPage(1);
            }}
            className="ms-auto max-w-[180px]"
          >
            <option value="">All plans</option>
            {(plans.data ?? []).map((plan) => (
              <option key={plan.code} value={plan.code}>
                {plan.code}
              </option>
            ))}
          </AdminSelect>
          <AdminInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search member…"
            className="max-w-xs"
          />
        </div>

        {subs.isLoading ? <LoadingState /> : null}
        {subs.isError ? <ErrorState message="Could not load subscriptions." onRetry={() => void subs.refetch()} /> : null}

        {subs.data ? (
          subs.data.rows.length === 0 ? (
            <EmptyState label="No subscriptions match these filters." />
          ) : (
            <>
              <TableShell
                head={
                  <tr>
                    <Th>Member</Th>
                    <Th>Plan</Th>
                    <Th>Status</Th>
                    <Th>Interval</Th>
                    <Th>Renews</Th>
                    <Th>Grace</Th>
                    <Th>Provider</Th>
                    <Th className="text-end">Manage</Th>
                  </tr>
                }
              >
                {subs.data.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-cream/4">
                    <Td>
                      <Link to="/admin/user/$id" params={{ id: row.user_id }} className="font-semibold text-cream hover:text-gold">
                        {row.userName}
                      </Link>
                    </Td>
                    <Td className="text-xs uppercase tracking-wide text-cream/70">{row.plan_code}</Td>
                    <Td>
                      <Pill tone={toneFor(row.status)}>{row.status}</Pill>
                      {row.cancel_at_period_end ? <span className="ms-2 text-[11px] text-cream/50">cancels at period end</span> : null}
                    </Td>
                    <Td className="text-xs">{row.billing_interval}</Td>
                    <Td className="text-xs tabular-nums">{row.current_period_end?.slice(0, 10) ?? "—"}</Td>
                    <Td className="text-xs tabular-nums">{row.grace_until?.slice(0, 10) ?? "—"}</Td>
                    <Td className="text-xs text-cream/55">{row.provider ?? "manual"}</Td>
                    <Td>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <ActionButton
                          onClick={() =>
                            confirm({
                              title: "Extend billing period",
                              description: `Add 30 days to ${row.userName}'s ${row.plan_code} subscription and mark it active.`,
                              confirmLabel: "Extend 30 days",
                              requireReason: true,
                              onConfirm: (reason) =>
                                act.mutateAsync({ subscriptionId: row.id, action: "extend_period", days: 30, reason }),
                            })
                          }
                        >
                          +30d
                        </ActionButton>
                        <ActionButton
                          onClick={() =>
                            confirm({
                              title: "Grant grace period",
                              description: "Keeps premium access for 7 more days while payment is resolved.",
                              confirmLabel: "Grant 7 days",
                              requireReason: true,
                              onConfirm: (reason) =>
                                act.mutateAsync({ subscriptionId: row.id, action: "set_grace", days: 7, reason }),
                            })
                          }
                        >
                          Grace
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          onClick={() =>
                            confirm({
                              title: "Cancel subscription",
                              description: `Immediately mark ${row.userName}'s subscription as canceled.`,
                              confirmLabel: "Cancel subscription",
                              destructive: true,
                              requireReason: true,
                              onConfirm: (reason) =>
                                act.mutateAsync({ subscriptionId: row.id, action: "set_status", status: "canceled", reason }),
                            })
                          }
                        >
                          Cancel
                        </ActionButton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </TableShell>
              <Pagination page={subs.data.page} pageSize={subs.data.pageSize} total={subs.data.total} onPage={setPage} />
            </>
          )
        ) : null}
      </Panel>
      {confirmNode}
    </div>
  );
}
