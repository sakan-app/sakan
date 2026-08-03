import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
  ActionButton,
  AdminPageHeader,
  AdminSelect,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  Panel,
  Pill,
  TableShell,
  Td,
  Th,
} from "@/components/admin/ui";
import { actOnReport, listReportsFull } from "@/lib/admin/ops.functions";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports · SAKAN Admin" },
      { name: "description", content: "Reports management for SAKAN administrators." },
      { property: "og:title", content: "Reports · SAKAN Admin" },
      { property: "og:description", content: "Reports management for SAKAN administrators." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminReports,
  errorComponent: RouteErrorBoundary,
});

const STATUSES = ["open", "reviewing", "resolved", "dismissed", "all"] as const;
const REASONS = ["all", "spam", "fake_profile", "harassment", "scam", "inappropriate_photos", "duplicate_account", "other"];

function AdminReports() {
  const listFn = useServerFn(listReportsFull);
  const actFn = useServerFn(actOnReport);
  const queryClient = useQueryClient();
  const [, confirm, , confirmNode] = useConfirm();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("open");
  const [reason, setReason] = useState("all");
  const [page, setPage] = useState(1);

  const reports = useQuery({
    queryKey: ["admin", "reports", status, reason, page],
    queryFn: () => listFn({ data: { status, reason, page, pageSize: 20 } }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const act = useMutation({
    mutationFn: (input: { id: string; action: "resolve" | "dismiss" | "warn" | "suspend" | "ban"; notes?: string }) =>
      actFn({ data: input }),
    onSuccess: () => {
      toast.success("Report handled");
      void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "live-stats"] });
    },
    onError: (error: Error) => toast.error(error.message || "Action failed"),
  });

  return (
    <div className="space-y-5">
      {confirmNode}
      <AdminPageHeader title="Reports" subtitle="Abuse reports filed by members. Every decision is written to the audit log." />

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
          <AdminSelect
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setPage(1);
            }}
            className="ms-auto"
          >
            {REASONS.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </AdminSelect>
        </div>

        {reports.isLoading ? <LoadingState /> : null}
        {reports.isError ? <ErrorState message="Could not load reports." onRetry={() => void reports.refetch()} /> : null}

        {reports.data ? (
          reports.data.rows.length === 0 ? (
            <EmptyState label="No reports here." />
          ) : (
            <>
              <TableShell
                caption="Reports table"
                head={
                  <tr>
                    <Th>Reported</Th>
                    <Th>Reporter</Th>
                    <Th>Reason</Th>
                    <Th>Details</Th>
                    <Th>Status</Th>
                    <Th>Filed</Th>
                    <Th className="text-end">Actions</Th>
                  </tr>
                }
              >
                {reports.data.rows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-cream/4">
                    <Td>
                      {row.reported_id ? (
                        <Link to="/admin/user/$id" params={{ id: row.reported_id }} className="font-semibold text-cream hover:text-gold">
                          {row.reported?.display_name ?? row.reported_id.slice(0, 8)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-xs">{row.reporter?.display_name ?? "—"}</Td>
                    <Td>
                      <Pill tone="warning">{row.reason.replace(/_/g, " ")}</Pill>
                    </Td>
                    <Td className="max-w-[280px] text-xs text-cream/60">{row.details ?? "—"}</Td>
                    <Td>
                      <Pill tone={row.status === "open" ? "danger" : row.status === "resolved" ? "success" : "neutral"}>
                        {row.status}
                      </Pill>
                    </Td>
                    <Td className="text-xs tabular-nums">{row.created_at.slice(0, 10)}</Td>
                    <Td>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <ActionButton onClick={() => act.mutate({ id: row.id, action: "resolve" })}>Resolve</ActionButton>
                        <ActionButton onClick={() => act.mutate({ id: row.id, action: "dismiss" })}>Dismiss</ActionButton>
                        <ActionButton
                          onClick={() =>
                            confirm({
                              title: "Send warning",
                              requireReason: true,
                              onConfirm: (notes) => act.mutateAsync({ id: row.id, action: "warn", notes }),
                            })
                          }
                        >
                          Warn
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          onClick={() =>
                            confirm({
                              title: "Suspend reported member?",
                              destructive: true,
                              requireReason: true,
                              onConfirm: (notes) => act.mutateAsync({ id: row.id, action: "suspend", notes }),
                            })
                          }
                        >
                          Suspend
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          onClick={() =>
                            confirm({
                              title: "Permanently ban member?",
                              description: "The account is disabled and can no longer sign in.",
                              destructive: true,
                              requireReason: true,
                              confirmLabel: "Ban permanently",
                              onConfirm: (notes) => act.mutateAsync({ id: row.id, action: "ban", notes }),
                            })
                          }
                        >
                          Ban
                        </ActionButton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </TableShell>
              <Pagination page={reports.data.page} pageSize={reports.data.pageSize} total={reports.data.total} onPage={setPage} />
            </>
          )
        ) : null}
      </Panel>
    </div>
  );
}
