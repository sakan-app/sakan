import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { useAuth } from "@/hooks/useAuth";
import { useIsOnline } from "@/hooks/usePresence";
import { useFeatureStrings } from "@/i18n/feature";
import { useI18n } from "@/lib/i18n";
import { chatStrings } from "@/lib/chat/strings";
import { chatKeys, conversationsQuery, startConversation } from "@/lib/chat/queries";
import type { ConversationListItem } from "@/lib/chat/types";

const messagesIndexSearchSchema = z.object({
  to: z.string().uuid().optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/messages/")({
  validateSearch: (s: Record<string, unknown>) => messagesIndexSearchSchema.parse({ to: s["to"] }),
  head: () => ({
    meta: [
      { title: "الرسائل | سَكَن" },
      { name: "description", content: "محادثاتك الخاصة على منصة سَكَن." },
    ],
  }),
  component: MessagesIndexPage,
});

function formatRelativeTime(iso: string | null, locale: string): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(locale);
}

function ConversationRow({ item }: { item: ConversationListItem }) {
  const { locale } = useI18n();
  const s = useFeatureStrings(chatStrings);
  const online = useIsOnline(item.otherUserId, item.otherLastSeenAt);
  const preview =
    item.lastMessageKind === "image"
      ? s.photoMessage
      : item.lastMessageKind === "file"
        ? s.fileMessage
        : item.lastDeleted
          ? s.deleted
          : (item.lastMessageBody ?? "");

  return (
    <Link
      to="/messages/$id"
      params={{ id: item.id }}
      className="flex items-center gap-3 rounded-xl border border-gold/15 bg-navy-deep/40 px-3 py-3 transition hover:border-gold/40"
    >
      <span className="relative shrink-0">
        {item.otherAvatarUrl ? (
          <img
            src={item.otherAvatarUrl}
            alt={item.otherName}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-full bg-navy text-gold/60">
            <UserRound className="h-6 w-6" />
          </span>
        )}
        {online && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-navy-deep bg-emerald-400" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold text-cream">{item.otherName}</span>
          <span className="shrink-0 text-[11px] text-cream/45">
            {formatRelativeTime(item.lastMessageAt, locale)}
          </span>
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-cream/60">{preview}</span>
          {item.unreadCount > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-navy-deep">
              {item.unreadCount}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

function MessagesIndexPage() {
  const { to } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const s = useFeatureStrings(chatStrings);
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";
  const [query, setQuery] = useState("");
  const [startError, setStartError] = useState(false);
  const convQ = useQuery(conversationsQuery(userId));

  useEffect(() => {
    if (!to || !userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const conversationId = await startConversation(to);
        await queryClient.invalidateQueries({ queryKey: chatKeys.conversations(userId) });
        if (!cancelled) {
          void navigate({ to: "/messages/$id", params: { id: conversationId }, replace: true });
        }
      } catch {
        if (!cancelled) setStartError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [to, userId, navigate, queryClient]);

  const items = convQ.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.otherName.toLowerCase().includes(q) ||
        (item.lastMessageBody ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  if (to && !startError) {
    return (
      <div className="w-full">
        <main className="flex flex-1 items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
        </main>
      </div>
    );
  }

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-[720px] pt-4">
        <h1 className="text-2xl font-black text-cream">{s.title}</h1>

        <div className="glass-card mt-4 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={s.searchPlaceholder}
              className="field-navy w-full ps-9 text-sm"
            />
          </div>

          <div className="mt-4 space-y-2">
            {startError && (
              <p className="mb-2 text-center text-xs text-red-400">{s.startChatError}</p>
            )}
            {convQ.isPending ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[68px] animate-pulse rounded-xl bg-cream/5" />
                ))}
              </div>
            ) : convQ.isError ? (
              <div className="mx-auto max-w-md p-10 text-center">
                <h2 className="text-lg font-bold text-cream">{s.loadError}</h2>
                <button onClick={() => void convQ.refetch()} className="btn-gold mt-6 px-6 py-2.5 text-sm">
                  {s.retry}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="mx-auto max-w-md p-10 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-gold-deep" />
                <h2 className="mt-4 text-lg font-bold text-cream">{s.emptyTitle}</h2>
                <p className="mt-2 text-xs leading-6 text-cream/60">{s.emptyText}</p>
              </div>
            ) : (
              filtered.map((item) => <ConversationRow key={item.id} item={item} />)
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
