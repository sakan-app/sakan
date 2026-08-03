import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AdminPageHeader,
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
import { listMatches } from "@/lib/admin/ops.functions";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/matches")({ component: AdminMatches, errorComponent: RouteErrorBoundary });

const FILTERS = ["all", "active", "inactive"] as const;

function AdminMatches() {
  const listFn = useServerFn(listMatches);
  const [active, setActive] = useState<(typeof FILTERS)[number]>("all");
  const [page, setPage] = useState(1);

  const matches = useQuery({
    queryKey: ["admin", "matches", active, page],
    queryFn: () => listFn({ data: { active, page, pageSize: 25 } }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Matches" subtitle="Read-only view of mutual matches created on the platform." />
      <Panel className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setActive(value);
                setPage(1);
              }}
              className={cn("chip-glass px-3 py-1.5 text-xs font-semibold capitalize", active === value && "chip-glass-active")}
            >
              {value}
            </button>
          ))}
        </div>

        {matches.isLoading ? <LoadingState /> : null}
        {matches.isError ? <ErrorState message="Could not load matches." onRetry={() => void matches.refetch()} /> : null}

        {matches.data ? (
          matches.data.rows.length === 0 ? (
            <EmptyState label="No matches yet." />
          ) : (
            <>
              <TableShell
                head={
                  <tr>
                    <Th>Member A</Th>
                    <Th>Member B</Th>
                    <Th>Status</Th>
                    <Th>Messages</Th>
                    <Th>Matched</Th>
                  </tr>
                }
              >
                {matches.data.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-cream/4">
                    <Td>
                      <Link to="/admin/user/$id" params={{ id: row.user_a }} className="font-semibold text-cream hover:text-gold">
                        {row.profileA?.display_name ?? row.user_a.slice(0, 8)}
                      </Link>
                    </Td>
                    <Td>
                      <Link to="/admin/user/$id" params={{ id: row.user_b }} className="font-semibold text-cream hover:text-gold">
                        {row.profileB?.display_name ?? row.user_b.slice(0, 8)}
                      </Link>
                    </Td>
                    <Td>
                      <Pill tone={row.is_active ? "success" : "neutral"}>{row.is_active ? "active" : "inactive"}</Pill>
                    </Td>
                    <Td className="tabular-nums">{row.messageCount ?? 0}</Td>
                    <Td className="text-xs tabular-nums">{row.created_at.slice(0, 10)}</Td>
                  </tr>
                ))}
              </TableShell>
              <Pagination page={matches.data.page} pageSize={matches.data.pageSize} total={matches.data.total} onPage={setPage} />
            </>
          )
        ) : null}
      </Panel>
    </div>
  );
}
