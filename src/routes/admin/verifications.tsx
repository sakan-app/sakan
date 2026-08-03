import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/admin/ConfirmDialog";
import {
  ActionButton,
  AdminPageHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  Panel,
  Pill,
} from "@/components/admin/ui";
import { decideVerification, listVerificationQueue } from "@/lib/admin/ops.functions";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/verifications")({ component: AdminVerifications, errorComponent: RouteErrorBoundary });

const TABS = ["pending", "approved", "rejected", "expired", "all"] as const;

function AdminVerifications() {
  const listFn = useServerFn(listVerificationQueue);
  const decideFn = useServerFn(decideVerification);
  const queryClient = useQueryClient();
  const [, confirm, , confirmNode] = useConfirm();
  const [status, setStatus] = useState<(typeof TABS)[number]>("pending");
  const [page, setPage] = useState(1);

  const queue = useQuery({
    queryKey: ["admin", "verifications", status, page],
    queryFn: () => listFn({ data: { status, page, pageSize: 12 } }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const decide = useMutation({
    mutationFn: (input: { id: string; decision: "approved" | "rejected" | "expired" | "more_info"; notes?: string }) =>
      decideFn({ data: input }),
    onSuccess: () => {
      toast.success("Verification updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "verifications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "live-stats"] });
    },
    onError: (error: Error) => toast.error(error.message || "Update failed"),
  });

  return (
    <div className="space-y-5">
      {confirmNode}
      <AdminPageHeader title="Verification center" subtitle="Review identity documents and approve trusted members." />

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setStatus(tab);
              setPage(1);
            }}
            className={cn("chip-glass px-3 py-1.5 text-xs font-semibold capitalize", status === tab && "chip-glass-active")}
          >
            {tab}
          </button>
        ))}
      </div>

      {queue.isLoading ? <LoadingState /> : null}
      {queue.isError ? <ErrorState message="Could not load the queue." onRetry={() => void queue.refetch()} /> : null}

      {queue.data ? (
        queue.data.rows.length === 0 ? (
          <Panel>
            <EmptyState label="Nothing in this queue." />
          </Panel>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              {queue.data.rows.map((row) => (
                <Panel key={row.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to="/admin/user/$id"
                        params={{ id: row.user_id }}
                        className="text-sm font-bold text-cream hover:text-gold"
                      >
                        {row.profile?.display_name ?? row.user_id.slice(0, 8)}
                      </Link>
                      <p className="text-xs text-cream/45">
                        submitted {row.created_at.replace("T", " ").slice(0, 16)} · {row.profile?.country_code ?? "—"}
                      </p>
                    </div>
                    <Pill
                      tone={
                        row.status === "approved"
                          ? "success"
                          : row.status === "pending"
                            ? "warning"
                            : row.status === "expired"
                              ? "neutral"
                              : "danger"
                      }
                    >
                      {row.status}
                    </Pill>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <DocumentTile label="Document" url={row.documentUrl} />
                    <DocumentTile label="Selfie" url={row.selfieUrl} />
                  </div>

                  {row.reviewer_notes ? (
                    <p className="rounded-lg bg-cream/5 px-3 py-2 text-xs text-cream/70">{row.reviewer_notes}</p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      tone="gold"
                      disabled={decide.isPending}
                      onClick={() =>
                        confirm({
                          title: "Approve verification?",
                          description: "The member's profile will be marked as verified immediately.",
                          onConfirm: () => decide.mutateAsync({ id: row.id, decision: "approved" }),
                        })
                      }
                    >
                      Approve
                    </ActionButton>
                    <ActionButton
                      tone="danger"
                      disabled={decide.isPending}
                      onClick={() =>
                        confirm({
                          title: "Reject verification?",
                          destructive: true,
                          requireReason: true,
                          onConfirm: (reason) => decide.mutateAsync({ id: row.id, decision: "rejected", notes: reason }),
                        })
                      }
                    >
                      Reject
                    </ActionButton>
                    <ActionButton
                      disabled={decide.isPending}
                      onClick={() =>
                        confirm({
                          title: "Request more information",
                          description: "The request stays pending and the member receives your message.",
                          requireReason: true,
                          onConfirm: (reason) => decide.mutateAsync({ id: row.id, decision: "more_info", notes: reason }),
                        })
                      }
                    >
                      Request info
                    </ActionButton>
                    <ActionButton disabled={decide.isPending} onClick={() => decide.mutate({ id: row.id, decision: "expired" })}>
                      Mark expired
                    </ActionButton>
                  </div>
                </Panel>
              ))}
            </div>
            <Pagination page={queue.data.page} pageSize={queue.data.pageSize} total={queue.data.total} onPage={setPage} />
          </>
        )
      ) : null}
    </div>
  );
}

function DocumentTile({ label, url }: { label: string; url: string | null }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-cream/10 bg-cream/5">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt={label} className="aspect-4/3 w-full object-cover" />
        </a>
      ) : (
        <div className="flex aspect-4/3 items-center justify-center text-xs text-cream/40">not provided</div>
      )}
      <figcaption className="px-2 py-1 text-[10px] uppercase tracking-wide text-cream/45">{label}</figcaption>
    </figure>
  );
}
