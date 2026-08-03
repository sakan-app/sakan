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
} from "@/components/admin/ui";
import { getConversationMessages, listConversations } from "@/lib/admin/ops.functions";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/conversations")({
  head: () => ({
    meta: [
      { title: "Conversations · SAKAN Admin" },
      { name: "description", content: "Conversations management for SAKAN administrators." },
      { property: "og:title", content: "Conversations · SAKAN Admin" },
      { property: "og:description", content: "Conversations management for SAKAN administrators." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminConversations,
  errorComponent: RouteErrorBoundary,
});

function AdminConversations() {
  const listFn = useServerFn(listConversations);
  const messagesFn = useServerFn(getConversationMessages);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [messageSearch, setMessageSearch] = useState("");

  const conversations = useQuery({
    queryKey: ["admin", "conversations", search, page],
    queryFn: () => listFn({ data: { search: search || undefined, page, pageSize: 20 } }),
    placeholderData: keepPreviousData,
  });

  const messages = useQuery({
    queryKey: ["admin", "conversation-messages", selected, messageSearch],
    queryFn: () => messagesFn({ data: { conversationId: selected!, search: messageSearch || undefined } }),
    enabled: Boolean(selected),
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Conversations"
        subtitle="Read-only moderation view. Opening a thread is recorded in the audit log."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
        <Panel className="space-y-3">
          <AdminInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by member name…"
          />
          {conversations.isLoading ? <LoadingState /> : null}
          {conversations.isError ? (
            <ErrorState message="Could not load conversations." onRetry={() => void conversations.refetch()} />
          ) : null}
          {conversations.data?.rows.length === 0 ? <EmptyState label="No conversations found." /> : null}
          <ul className="space-y-2">
            {conversations.data?.rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row.id)}
                  className={cn(
                    "w-full rounded-xl border border-cream/10 bg-cream/5 px-3 py-2 text-start transition hover:bg-cream/10",
                    selected === row.id && "border-gold/50 bg-gold/10",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-cream">
                      {row.participantA?.display_name ?? "—"} ↔ {row.participantB?.display_name ?? "—"}
                    </span>
                    <Pill tone={row.is_blocked ? "danger" : "neutral"}>{row.messageCount ?? 0}</Pill>
                  </div>
                  <p className="mt-1 truncate text-xs text-cream/50">{row.lastMessage ?? "No messages yet"}</p>
                  <p className="text-[11px] text-cream/35">{(row.last_message_at ?? row.created_at).replace("T", " ").slice(0, 16)}</p>
                </button>
              </li>
            ))}
          </ul>
          {conversations.data ? (
            <Pagination
              page={conversations.data.page}
              pageSize={conversations.data.pageSize}
              total={conversations.data.total}
              onPage={setPage}
            />
          ) : null}
        </Panel>

        <Panel className="space-y-3">
          {!selected ? (
            <EmptyState label="Select a conversation to inspect its messages." />
          ) : (
            <>
              <AdminInput
                value={messageSearch}
                onChange={(event) => setMessageSearch(event.target.value)}
                placeholder="Search inside this thread…"
              />
              {messages.isLoading ? <LoadingState /> : null}
              {messages.isError ? <ErrorState message="Could not load messages." onRetry={() => void messages.refetch()} /> : null}
              {messages.data?.length === 0 ? <EmptyState label="No messages match." /> : null}
              <ol className="max-h-[62vh] space-y-2 overflow-y-auto pe-1">
                {messages.data?.map((message) => (
                  <li key={message.id} className="rounded-xl bg-cream/5 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-cream/45">
                      <span className="font-semibold text-cream/70">{message.senderName ?? message.sender_id.slice(0, 8)}</span>
                      <span>{message.created_at.replace("T", " ").slice(0, 16)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-cream/85">{message.body ?? `[${message.kind}]`}</p>
                    {message.attachment_url ? (
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-gold hover:underline"
                      >
                        View attachment
                      </a>
                    ) : null}
                  </li>
                ))}
              </ol>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
