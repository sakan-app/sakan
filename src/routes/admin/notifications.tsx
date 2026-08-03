import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
} from "@/components/admin/ui";
import { broadcastNotification, listAdminNotifications } from "@/lib/admin/ops.functions";
import { useAdminAccess } from "@/routes/admin/route";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · SAKAN Admin" },
      { name: "description", content: "Notifications management for SAKAN administrators." },
      { property: "og:title", content: "Notifications · SAKAN Admin" },
      { property: "og:description", content: "Notifications management for SAKAN administrators." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminNotifications,
  errorComponent: RouteErrorBoundary,
});

const FILTERS = ["all", "unread", "read", "system", "verification", "match", "message", "like"] as const;

function AdminNotifications() {
  const listFn = useServerFn(listAdminNotifications);
  const broadcastFn = useServerFn(broadcastNotification);
  const queryClient = useQueryClient();
  const access = useAdminAccess();
  const [, confirm, , confirmNode] = useConfirm();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [page, setPage] = useState(1);
  const [audience, setAudience] = useState<"all" | "country" | "premium" | "moderators">("all");
  const [countryCode, setCountryCode] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const notifications = useQuery({
    queryKey: ["admin", "notifications", filter, page],
    queryFn: () => listFn({ data: { filter, page, pageSize: 25 } }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const broadcast = useMutation({
    mutationFn: () =>
      broadcastFn({
        data: {
          audience,
          ...(audience === "country" ? { countryCode: countryCode.toUpperCase() } : {}),
          title,
          body,
        },
      }),
    onSuccess: (result) => {
      setTitle("");
      setBody("");
      toast.success(`Sent to ${result?.recipients ?? 0} members`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
    onError: (error: Error) => toast.error(error.message || "Broadcast failed"),
  });

  const canBroadcast = Boolean(access.data?.isAdmin);
  const disabled = !title.trim() || !body.trim() || broadcast.isPending || (audience === "country" && countryCode.length !== 2);

  return (
    <div className="space-y-5">
      {confirmNode}
      <AdminPageHeader title="Notifications" subtitle="Monitor platform notifications and broadcast announcements." />

      {canBroadcast ? (
        <Panel className="space-y-3">
          <h2 className="text-sm font-semibold text-cream">Broadcast announcement</h2>
          <div className="grid gap-3 md:grid-cols-[180px_140px_1fr]">
            <AdminSelect value={audience} onChange={(event) => setAudience(event.target.value as typeof audience)}>
              <option value="all">All members</option>
              <option value="country">By country</option>
              <option value="premium">Premium members</option>
              <option value="moderators">Staff only</option>
            </AdminSelect>
            <AdminInput
              value={countryCode}
              maxLength={2}
              disabled={audience !== "country"}
              onChange={(event) => setCountryCode(event.target.value)}
              placeholder="DZ"
            />
            <AdminInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" maxLength={120} />
          </div>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Message body…"
            className="glass-field w-full rounded-xl px-3 py-2 text-sm text-cream placeholder:text-cream/35 focus:outline-none"
          />
          <div className="flex justify-end">
            <ActionButton
              tone="gold"
              disabled={disabled}
              onClick={() =>
                confirm({
                  title: "Send this broadcast?",
                  description: `Audience: ${audience}${audience === "country" ? ` (${countryCode.toUpperCase()})` : ""}. This cannot be recalled.`,
                  confirmLabel: "Send broadcast",
                  onConfirm: () => broadcast.mutateAsync(),
                })
              }
            >
              {broadcast.isPending ? "Sending…" : "Send broadcast"}
            </ActionButton>
          </div>
        </Panel>
      ) : null}

      <Panel className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setFilter(value);
                setPage(1);
              }}
              className={cn("chip-glass px-3 py-1.5 text-xs font-semibold capitalize", filter === value && "chip-glass-active")}
            >
              {value}
            </button>
          ))}
        </div>

        {notifications.isLoading ? <LoadingState /> : null}
        {notifications.isError ? (
          <ErrorState message="Could not load notifications." onRetry={() => void notifications.refetch()} />
        ) : null}

        {notifications.data ? (
          notifications.data.rows.length === 0 ? (
            <EmptyState label="No notifications." />
          ) : (
            <>
              <ul className="space-y-2">
                {notifications.data.rows.map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-3 rounded-xl bg-cream/5 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-cream">{row.title}</p>
                      <p className="truncate text-xs text-cream/55">{row.body}</p>
                      <p className="text-[11px] text-cream/35">
                        {row.recipientName ?? row.user_id.slice(0, 8)} · {row.created_at.replace("T", " ").slice(0, 16)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Pill>{row.type}</Pill>
                      <Pill tone={row.is_read ? "neutral" : "warning"}>{row.is_read ? "read" : "unread"}</Pill>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination
                page={notifications.data.page}
                pageSize={notifications.data.pageSize}
                total={notifications.data.total}
                onPage={setPage}
              />
            </>
          )
        ) : null}
      </Panel>
    </div>
  );
}
