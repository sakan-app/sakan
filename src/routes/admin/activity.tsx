import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AdminInput,
  AdminPageHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  Panel,
  Pill,
  Td,
  Th,
} from "@/components/admin/ui";
import { VirtualTableShell } from "@/components/admin/VirtualTableShell";
import { listActivity } from "@/lib/admin/ops.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/activity")({ component: AdminActivity });

function AdminActivity() {
  const listFn = useServerFn(listActivity);
  const [source, setSource] = useState<"admin" | "system">("admin");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const activity = useQuery({
    queryKey: ["admin", "activity", source, search, page],
    queryFn: () => listFn({ data: { source, search: search || undefined, page, pageSize: 100 } }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Activity log"
        subtitle="Immutable record of every staff action and system audit event."
      />

      <Panel className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(["admin", "system"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSource(value);
                setPage(1);
              }}
              className={cn("chip-glass px-3 py-1.5 text-xs font-semibold capitalize", source === value && "chip-glass-active")}
            >
              {value === "admin" ? "Moderation log" : "System audit"}
            </button>
          ))}
          <AdminInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search action or table…"
            className="ms-auto max-w-xs"
          />
        </div>

        {activity.isLoading ? <LoadingState /> : null}
        {activity.isError ? <ErrorState message="Could not load the log." onRetry={() => void activity.refetch()} /> : null}

        {activity.data ? (
          activity.data.rows.length === 0 ? (
            <EmptyState label="No entries recorded." />
          ) : (
            <>
              <VirtualTableShell
                head={
                  <tr>
                    <Th>When</Th>
                    <Th>Actor</Th>
                    <Th>Action</Th>
                    <Th>Target</Th>
                    <Th>Details</Th>
                  </tr>
                }
                rows={activity.data.rows}
                rowKey={(row) => row.id}
                renderRow={(row) => (
                  <>
                    <Td className="whitespace-nowrap text-xs tabular-nums">{row.created_at.replace("T", " ").slice(0, 19)}</Td>
                    <Td className="text-xs">{row.actorName ?? row.actor_id?.slice(0, 8) ?? "system"}</Td>
                    <Td>
                      <Pill tone={row.action.includes("delete") || row.action.includes("ban") ? "danger" : "neutral"}>
                        {row.action}
                      </Pill>
                    </Td>
                    <Td className="text-xs text-cream/60">
                      {row.target_table ?? "—"}
                      {row.target_id ? ` · ${row.target_id.slice(0, 8)}` : ""}
                    </Td>
                    <Td className="max-w-[360px]">
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-cream/50">
                        {row.details ? JSON.stringify(row.details) : "—"}
                      </pre>
                    </Td>
                  </>
                )}
              />
              <Pagination page={activity.data.page} pageSize={activity.data.pageSize} total={activity.data.total} onPage={setPage} />
            </>
          )
        ) : null}
      </Panel>
    </div>
  );
}
