import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, ReceiptText, RotateCcw, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
  ActionButton,
  AdminInput,
  AdminPageHeader,
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
import { exportPaymentsCsv, getBillingOverview, listPaymentsAdmin, markPaymentRefunded } from "@/lib/admin/ops.functions";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments · SAKAN Admin" },
      { name: "description", content: "Payments management for SAKAN administrators." },
      { property: "og:title", content: "Payments · SAKAN Admin" },
      { property: "og:description", content: "Payments management for SAKAN administrators." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPayments,
  errorComponent: RouteErrorBoundary,
});

const STATUSES = ["all", "succeeded", "pending", "failed", "refunded"] as const;
type StatusFilter = (typeof STATUSES)[number];

const money = (cents: number, currency = "USD") => `${(cents / 100).toFixed(2)} ${currency}`;

function toneFor(status: string) {
  if (status === "succeeded") return "success" as const;
  if (status === "pending") return "warning" as const;
  if (status === "failed") return "danger" as const;
  return "neutral" as const;
}

function AdminPayments() {
  const listFn = useServerFn(listPaymentsAdmin);
  const overviewFn = useServerFn(getBillingOverview);
  const refundFn = useServerFn(markPaymentRefunded);
  const exportFn = useServerFn(exportPaymentsCsv);
  const queryClient = useQueryClient();
  const [, confirm, , confirmNode] = useConfirm();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const overview = useQuery({ queryKey: ["admin", "billing", "overview"], queryFn: () => overviewFn(), staleTime: 30_000 });
  const payments = useQuery({
    queryKey: ["admin", "payments", status, search, page],
    queryFn: () => listFn({ data: { status, search: search || undefined, page, pageSize: 30 } }),
    placeholderData: keepPreviousData,
  });

  const refund = useMutation({
    mutationFn: (input: { paymentId: string; reason: string }) => refundFn({ data: input }),
    onSuccess: () => {
      toast.success("Marked as refunded");
      void queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "billing", "overview"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function downloadCsv() {
    try {
      const { csv } = await exportFn({ data: { status } });
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `sakan-payments-${status}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Payments"
        subtitle="Invoices, transactions and refunds across every payment provider."
        actions={
          <div className="flex gap-2">
            <Link to="/admin/subscriptions" className="chip-glass px-3 py-1.5 text-xs font-semibold">
              Subscriptions →
            </Link>
            <ActionButton tone="gold" onClick={() => void downloadCsv()}>
              <Download className="me-1 inline h-3.5 w-3.5" />
              Export CSV
            </ActionButton>
          </div>
        }
      />

      {overview.data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Revenue this month" value={money(overview.data.revenueThisMonthCents)} icon={Wallet} tone="gold" />
          <StatCard label="Revenue all time" value={money(overview.data.revenueAllTimeCents)} icon={ReceiptText} />
          <StatCard label="Refunded (12m)" value={money(overview.data.refundedCents)} icon={RotateCcw} />
          <StatCard label="MRR" value={money(overview.data.mrrCents)} icon={Wallet} />
        </div>
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
              {value}
            </button>
          ))}
          <AdminInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search invoice or reference…"
            className="ms-auto max-w-xs"
          />
        </div>

        {payments.isLoading ? <LoadingState /> : null}
        {payments.isError ? <ErrorState message="Could not load payments." onRetry={() => void payments.refetch()} /> : null}

        {payments.data ? (
          payments.data.rows.length === 0 ? (
            <EmptyState label="No transactions recorded yet." />
          ) : (
            <>
              <TableShell
                caption="Payments table"
                head={
                  <tr>
                    <Th>Invoice</Th>
                    <Th>Member</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Provider</Th>
                    <Th>Paid</Th>
                    <Th className="text-end">Actions</Th>
                  </tr>
                }
              >
                {payments.data.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-cream/4">
                    <Td className="text-xs font-mono text-cream/70">{row.invoice_number ?? row.id.slice(0, 8)}</Td>
                    <Td>
                      <Link to="/admin/user/$id" params={{ id: row.user_id }} className="font-semibold text-cream hover:text-gold">
                        {row.userName}
                      </Link>
                    </Td>
                    <Td className="tabular-nums">{money(row.amount_cents, row.currency ?? "USD")}</Td>
                    <Td>
                      <Pill tone={toneFor(row.status)}>{row.status}</Pill>
                    </Td>
                    <Td className="text-xs text-cream/55">{row.provider ?? "manual"}</Td>
                    <Td className="text-xs tabular-nums">{(row.paid_at ?? row.created_at).slice(0, 10)}</Td>
                    <Td>
                      <div className="flex justify-end">
                        {row.status === "succeeded" ? (
                          <ActionButton
                            tone="danger"
                            onClick={() =>
                              confirm({
                                title: "Mark payment as refunded",
                                description: `${money(row.amount_cents, row.currency ?? "USD")} for ${row.userName}. Record the refund in SAKAN after issuing it with the provider.`,
                                confirmLabel: "Mark refunded",
                                destructive: true,
                                requireReason: true,
                                onConfirm: (reason) => refund.mutateAsync({ paymentId: row.id, reason }),
                              })
                            }
                          >
                            Refund
                          </ActionButton>
                        ) : (
                          <span className="text-xs text-cream/35">—</span>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </TableShell>
              <Pagination page={payments.data.page} pageSize={payments.data.pageSize} total={payments.data.total} onPage={setPage} />
            </>
          )
        ) : null}
      </Panel>
      {confirmNode}
    </div>
  );
}
