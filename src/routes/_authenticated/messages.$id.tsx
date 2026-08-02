import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowDown, Loader2, Search, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Composer } from "@/components/chat/Composer";
import { ConversationSearchBar } from "@/components/chat/ConversationSearchBar";
import { DeleteMessageDialog } from "@/components/chat/DeleteMessageDialog";
import { ForwardSheet } from "@/components/chat/ForwardSheet";
import { ImageViewer, type ViewerImage } from "@/components/chat/ImageViewer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageContextMenu, type ContextMenuAction } from "@/components/chat/MessageContextMenu";
import { MessageInfoSheet } from "@/components/chat/MessageInfoSheet";
import { PinnedBanner } from "@/components/chat/PinnedBanner";
import { SelectionBar } from "@/components/chat/SelectionBar";
import { useAuth } from "@/hooks/useAuth";
import { formatLastSeen, useIsOnline } from "@/hooks/usePresence";
import { useFeatureStrings } from "@/i18n/feature";
import { useI18n } from "@/lib/i18n";
import { chatStrings } from "@/lib/chat/strings";
import {
  chatKeys,
  deleteMessageForEveryone,
  deleteMessageForMe,
  editMessage,
  fetchMessageById,
  flattenMessagePages,
  markConversationRead,
  mergeMessagesIntoCache,
  messagesQuery,
  searchConversation,
  sendMessage,
  setMessagePinned,
  signStoragePath,
} from "@/lib/chat/queries";
import { useConversationRealtime } from "@/lib/chat/realtime";
import type { ChatMessage, MessageKind } from "@/lib/chat/types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  head: () => ({
    meta: [
      { title: "محادثة | سَكَن" },
      { name: "description", content: "محادثة خاصة على منصة سَكَن." },
    ],
  }),
  component: ConversationPage,
});

type ConversationHeaderInfo = {
  otherUserId: string;
  otherName: string;
  otherAvatarUrl: string | null;
  otherLastSeenAt: string | null;
};

function conversationInfoQuery(conversationId: string, userId: string) {
  return {
    queryKey: ["chat", "conversation-info", conversationId, userId] as const,
    queryFn: async (): Promise<ConversationHeaderInfo | null> => {
      const { data: conv, error } = await supabase
        .from("conversations")
        .select("id, user_low, user_high")
        .eq("id", conversationId)
        .maybeSingle();
      if (error || !conv) return null;
      const otherUserId = conv.user_low === userId ? conv.user_high : conv.user_low;
      if (conv.user_low !== userId && conv.user_high !== userId) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, last_seen_at")
        .eq("id", otherUserId)
        .maybeSingle();
      const avatarUrl = profile?.avatar_url ? await signStoragePath("avatars", profile.avatar_url) : null;
      return {
        otherUserId,
        otherName: profile?.display_name ?? "",
        otherAvatarUrl: avatarUrl,
        otherLastSeenAt: profile?.last_seen_at ?? null,
      };
    },
    enabled: Boolean(conversationId && userId),
  };
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="fade-up sticky top-1 z-[5] my-3 flex items-center justify-center">
      <span className="rounded-full bg-navy-deep/85 px-3 py-1 text-[11px] font-medium text-cream/70 backdrop-blur">
        {label}
      </span>
    </div>
  );
}

function UnreadSeparator({ label }: { label: string }) {
  return (
    <div className="fade-up my-3 flex items-center gap-2" aria-label={label}>
      <span className="h-px flex-1 bg-gold/35" />
      <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold text-gold">{label}</span>
      <span className="h-px flex-1 bg-gold/35" />
    </div>
  );
}

function TypingBubble({ label }: { label: string }) {
  return (
    <div className="msg-enter-in flex justify-start" aria-live="polite">
      <div className="bubble-in flex items-center gap-1.5 rounded-2xl px-3.5 py-3">
        <span className="sr-only">{label}</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot h-1.5 w-1.5 rounded-full bg-cream/70"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function MessagesSkeleton() {
  const widths = ["58%", "42%", "70%", "36%", "64%"];
  return (
    <div className="space-y-3 py-2">
      {widths.map((w, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <div className="skeleton-glass h-11 rounded-2xl" style={{ width: w }} />
        </div>
      ))}
    </div>
  );
}

function dayLabel(iso: string, s: ReturnType<typeof useFeatureStrings<typeof chatStrings.en>>, locale: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, today)) return s.today;
  if (sameDay(date, yesterday)) return s.yesterday;
  return date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

function messageText(message: ChatMessage, s: ReturnType<typeof useFeatureStrings<typeof chatStrings.en>>) {
  if (message.deleted_at) return s.deleted;
  if (message.body) return message.body;
  if (message.kind === "image") return s.photoMessage;
  return message.attachment_name ?? s.fileMessage;
}

function ConversationPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const s = useFeatureStrings(chatStrings);
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";
  const rtl = locale === "ar";

  const infoQ = useQuery(conversationInfoQuery(id, userId));
  const messagesQ = useInfiniteQuery(messagesQuery(id));
  const { typingUserId, sendTyping } = useConversationRealtime({ conversationId: id, userId });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [newCount, setNewCount] = useState(0);

  /* Premium chat state */
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selection, setSelection] = useState<string[] | null>(null);
  const [menu, setMenu] = useState<{ message: ChatMessage; x: number; y: number } | null>(null);
  const [infoMessage, setInfoMessage] = useState<ChatMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage[] | null>(null);
  const [forwardTargets, setForwardTargets] = useState<ChatMessage[] | null>(null);
  const [viewerStartId, setViewerStartId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [composerFocus, setComposerFocus] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);

  const messages = useMemo(
    () => flattenMessagePages(messagesQ.data?.pages, userId),
    [messagesQ.data?.pages, userId],
  );
  const messageMap = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const online = useIsOnline(infoQ.data?.otherUserId, infoQ.data?.otherLastSeenAt);
  const pinned = useMemo(
    () =>
      messages
        .filter((m) => m.pinned_at && !m.deleted_at)
        .sort((a, b) => (b.pinned_at ?? "").localeCompare(a.pinned_at ?? "")),
    [messages],
  );

  /* First unread anchor, frozen on entry so it doesn't vanish while reading. */
  const unreadAnchor = useRef<string | null>(null);
  if (unreadAnchor.current === null && messages.length > 0) {
    const first = messages.find((m) => m.sender_id !== userId && !m.read_at && !m.deleted_at);
    unreadAnchor.current = first?.id ?? "";
  }

  /* Hydrate reply previews that live outside the loaded pages. */
  useEffect(() => {
    const missing = [
      ...new Set(
        messages
          .map((m) => m.reply_to_id)
          .filter((rid): rid is string => Boolean(rid) && !messageMap.has(rid!)),
      ),
    ];
    if (missing.length === 0) return;
    let cancelled = false;
    void Promise.all(missing.slice(0, 20).map((rid) => fetchMessageById(rid))).then((rows) => {
      if (cancelled) return;
      const found = rows.filter((r): r is ChatMessage => Boolean(r));
      if (found.length > 0) mergeMessagesIntoCache(queryClient, id, found);
    });
    return () => {
      cancelled = true;
    };
  }, [messages, messageMap, queryClient, id]);

  useEffect(() => {
    if (!id || !userId) return;
    void markConversationRead(id, userId).then(() => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations(userId) });
    });
  }, [id, userId, queryClient, messages.length]);

  const lastCount = useRef(0);
  useEffect(() => {
    if (messages.length > lastCount.current && lastCount.current > 0 && !autoScroll) {
      setNewCount((c) => c + (messages.length - lastCount.current));
    }
    lastCount.current = messages.length;
  }, [messages.length, autoScroll]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setNewCount(0);
    }
  }, [messages.length, autoScroll]);

  /* Debounced conversation search */
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedTerm(searchTerm), 250);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const searchQ = useQuery({
    queryKey: ["chat", "search", id, debouncedTerm],
    queryFn: () => searchConversation(id, debouncedTerm),
    enabled: searchOpen && debouncedTerm.trim().length >= 2,
    staleTime: 30_000,
  });
  const searchResults = useMemo(
    () => [...(searchQ.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [searchQ.data],
  );

  useEffect(() => setSearchIndex(0), [debouncedTerm]);

  const scrollToMessage = useCallback(
    async (messageId: string) => {
      let attempts = 0;
      while (!document.getElementById(`msg-${messageId}`) && messagesQ.hasNextPage && attempts < 10) {
        attempts += 1;
        await messagesQ.fetchNextPage();
        await new Promise((r) => setTimeout(r, 60));
      }
      const el = document.getElementById(`msg-${messageId}`);
      if (!el) {
        toast.error(s.originalUnavailable);
        return;
      }
      setAutoScroll(false);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(messageId);
      setTimeout(() => setHighlightId((cur) => (cur === messageId ? null : cur)), 1700);
    },
    [messagesQ, s.originalUnavailable],
  );

  function gotoResult(next: number) {
    if (searchResults.length === 0) return;
    const index = (next + searchResults.length) % searchResults.length;
    setSearchIndex(index);
    const target = searchResults[index];
    if (target) void scrollToMessage(target.id);
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setAutoScroll(atBottom);
    if (atBottom) setNewCount(0);
    if (el.scrollTop < 80 && messagesQ.hasNextPage && !messagesQ.isFetchingNextPage) {
      const prevHeight = el.scrollHeight;
      void messagesQ.fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
          }
        });
      });
    }
  }

  function handleSendText(body: string) {
    if (!userId) return;
    setAutoScroll(true);
    void sendMessage(queryClient, {
      conversationId: id,
      senderId: userId,
      body,
      kind: "text",
      replyToId: replyTo?.id ?? null,
    });
    setReplyTo(null);
  }

  function handleSendAttachment(args: {
    kind: MessageKind;
    attachmentPath: string;
    attachmentName: string;
    attachmentSize: number;
    attachmentMime: string;
  }) {
    if (!userId) return;
    setAutoScroll(true);
    void sendMessage(queryClient, {
      conversationId: id,
      senderId: userId,
      body: "",
      kind: args.kind,
      attachmentPath: args.attachmentPath,
      attachmentName: args.attachmentName,
      attachmentSize: args.attachmentSize,
      attachmentMime: args.attachmentMime,
      replyToId: replyTo?.id ?? null,
    });
    setReplyTo(null);
  }

  function handleRetry(message: ChatMessage) {
    if (!userId) return;
    void sendMessage(queryClient, {
      conversationId: id,
      senderId: userId,
      body: message.body,
      kind: message.kind,
      attachmentPath: message.attachment_path,
      attachmentName: message.attachment_name,
      attachmentSize: message.attachment_size,
      attachmentMime: message.attachment_mime,
      replyToId: message.reply_to_id,
    });
  }

  async function copyMessages(list: ChatMessage[]) {
    const text = list.map((m) => messageText(m, s)).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(s.copied);
    } catch {
      toast.error(s.shareFailed);
    }
  }

  async function shareMessages(list: ChatMessage[]) {
    const text = list.map((m) => messageText(m, s)).join("\n");
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success(s.copied);
    } catch {
      /* user dismissed the share sheet */
    }
  }

  async function handleEditSubmit(message: ChatMessage, body: string) {
    if (!body) {
      toast.error(s.editEmpty);
      return;
    }
    setEditingId(null);
    try {
      await editMessage(queryClient, { conversationId: id, messageId: message.id, body });
      toast.success(s.editSaved);
    } catch {
      toast.error(s.editFailed);
    }
  }

  async function runDelete(list: ChatMessage[], everyone: boolean) {
    setDeleteTarget(null);
    try {
      for (const message of list) {
        if (everyone) {
          await deleteMessageForEveryone(queryClient, { conversationId: id, messageId: message.id });
        } else {
          await deleteMessageForMe(queryClient, { conversationId: id, messageId: message.id, userId });
        }
      }
      setSelection(null);
      toast.success(s.deleted2);
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations(userId) });
    } catch {
      toast.error(s.deleteFailed);
    }
  }

  async function togglePin(message: ChatMessage) {
    const pin = !message.pinned_at;
    try {
      await setMessagePinned(queryClient, {
        conversationId: id,
        messageId: message.id,
        userId,
        pinned: pin,
      });
      toast.success(pin ? s.pinned : s.unpinned);
    } catch {
      toast.error(s.deleteFailed);
    }
  }

  async function forwardTo(conversationId: string) {
    const list = forwardTargets ?? [];
    setForwardTargets(null);
    for (const message of list) {
      await sendMessage(queryClient, {
        conversationId,
        senderId: userId,
        body: message.body,
        kind: message.kind,
        attachmentPath: message.attachment_path,
        attachmentName: message.attachment_name,
        attachmentSize: message.attachment_size,
        attachmentMime: message.attachment_mime,
      });
    }
    setSelection(null);
    toast.success(s.forwarded);
  }

  function handleMenuAction(action: ContextMenuAction, message: ChatMessage) {
    switch (action) {
      case "reply":
        setReplyTo(message);
        setComposerFocus((n) => n + 1);
        break;
      case "copy":
        void copyMessages([message]);
        break;
      case "edit":
        setEditingId(message.id);
        break;
      case "delete":
        setDeleteTarget([message]);
        break;
      case "forward":
        setForwardTargets([message]);
        break;
      case "share":
        void shareMessages([message]);
        break;
      case "select":
        setSelection([message.id]);
        break;
      case "info":
        setInfoMessage(message);
        break;
      case "pin":
      case "unpin":
        void togglePin(message);
        break;
    }
  }

  const imageMessages = useMemo(
    () => messages.filter((m) => m.kind === "image" && m.attachment_path && !m.deleted_at),
    [messages],
  );
  const viewerQ = useQuery({
    queryKey: ["chat", "viewer", id, imageMessages.map((m) => m.id).join(",")],
    queryFn: async (): Promise<ViewerImage[]> => {
      const signed = await Promise.all(
        imageMessages.map(async (m) => ({
          id: m.id,
          url: (await signStoragePath("gallery", m.attachment_path)) ?? "",
          name: m.attachment_name ?? "",
        })),
      );
      return signed.filter((i) => i.url);
    },
    enabled: Boolean(viewerStartId) && imageMessages.length > 0,
    staleTime: 45 * 60 * 1000,
  });

  if (infoQ.isPending) {
    return (
      <div className="flex h-screen flex-col bg-navy">
        <div className="flex items-center gap-3 border-b border-gold/15 bg-navy-deep px-3 py-2.5">
          <div className="skeleton-glass h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <div className="skeleton-glass h-3 w-32" />
            <div className="skeleton-glass h-2.5 w-20" />
          </div>
        </div>
        <main className="flex-1 px-3 py-4">
          <MessagesSkeleton />
        </main>
      </div>
    );
  }

  if (!infoQ.data) {
    return (
      <div className="w-full">
        <main className="flex flex-1 items-center justify-center px-6 py-20 text-center">
          <div>
            <h1 className="text-lg font-bold text-cream">{s.loadError}</h1>
            <Link to="/messages" className="btn-gold mt-6 inline-block px-6 py-2.5 text-sm">
              {s.back}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const info = infoQ.data;
  const selectedMessages = (selection ?? [])
    .map((sid) => messageMap.get(sid))
    .filter((m): m is ChatMessage => Boolean(m));
  const activeResultId = searchResults[searchIndex]?.id ?? null;
  const firstUnreadId = unreadAnchor.current || null;

  return (
    <div className="flex h-screen flex-col bg-navy">
      {selection ? (
        <SelectionBar
          count={selection.length}
          strings={s}
          canDelete={selectedMessages.some((m) => m.sender_id === userId)}
          onCopy={() => void copyMessages(selectedMessages)}
          onForward={() => setForwardTargets(selectedMessages)}
          onShare={() => void shareMessages(selectedMessages)}
          onDelete={() => setDeleteTarget(selectedMessages)}
          onCancel={() => setSelection(null)}
        />
      ) : searchOpen ? (
        <ConversationSearchBar
          strings={s}
          term={searchTerm}
          onTermChange={setSearchTerm}
          resultCount={searchResults.length}
          activeIndex={searchIndex}
          onPrev={() => gotoResult(searchIndex - 1)}
          onNext={() => gotoResult(searchIndex + 1)}
          onClose={() => {
            setSearchOpen(false);
            setSearchTerm("");
          }}
        />
      ) : (
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gold/15 bg-navy-deep px-3 py-2.5">
          <Link
            to="/messages"
            aria-label={s.back}
            className="grid h-9 w-9 place-items-center rounded-full text-gold hover:bg-gold/10"
          >
            <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />
          </Link>
          {info.otherAvatarUrl ? (
            <img src={info.otherAvatarUrl} alt={info.otherName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-gold/60">
              <UserRound className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-cream">{info.otherName}</p>
            <p className="truncate text-[11px] text-cream/50">
              {typingUserId ? s.typing : formatLastSeen(locale, info.otherLastSeenAt, online)}
            </p>
          </div>
          <button
            type="button"
            aria-label={s.searchInChat}
            onClick={() => setSearchOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full text-gold hover:bg-gold/10"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      )}

      <PinnedBanner
        pinned={pinned}
        strings={s}
        onJump={(mid) => void scrollToMessage(mid)}
        onUnpin={(m) => void togglePin(m)}
      />

      <div className="relative flex-1 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="h-full space-y-2 overflow-y-auto px-3 py-4">
          {messagesQ.isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-gold-deep" />
            </div>
          )}
          {messagesQ.isPending ? (
            <MessagesSkeleton />
          ) : (
            messages.map((message, index) => {
              const prev = messages[index - 1];
              const showSeparator =
                !prev || dayLabel(prev.created_at, s, locale) !== dayLabel(message.created_at, s, locale);
              const replyTarget = message.reply_to_id ? (messageMap.get(message.reply_to_id) ?? null) : null;
              return (
                <div key={message.id} id={`msg-${message.id}`}>
                  {showSeparator && <DaySeparator label={dayLabel(message.created_at, s, locale)} />}
                  {firstUnreadId === message.id && <UnreadSeparator label={s.unreadDivider} />}
                  <MessageBubble
                    message={message}
                    isOwn={message.sender_id === userId}
                    strings={s}
                    locale={locale}
                    rtl={rtl}
                    replyTarget={replyTarget}
                    replyTargetName={
                      replyTarget ? (replyTarget.sender_id === userId ? s.you : info.otherName) : undefined
                    }
                    highlighted={highlightId === message.id || activeResultId === message.id}
                    searchTerm={searchOpen ? debouncedTerm : ""}
                    selectionMode={Boolean(selection)}
                    selected={selection?.includes(message.id) ?? false}
                    editing={editingId === message.id}
                    onRetry={message.failed ? () => handleRetry(message) : undefined}
                    onReply={() => {
                      setReplyTo(message);
                      setComposerFocus((n) => n + 1);
                    }}
                    onOpenMenu={(point) =>
                      setMenu({ message, x: point.x, y: point.y })
                    }
                    onToggleSelect={() =>
                      setSelection((cur) => {
                        if (!cur) return [message.id];
                        const next = cur.includes(message.id)
                          ? cur.filter((x) => x !== message.id)
                          : [...cur, message.id];
                        return next.length === 0 ? null : next;
                      })
                    }
                    onJumpToReply={(mid) => void scrollToMessage(mid)}
                    onOpenImage={() => setViewerStartId(message.id)}
                    onSubmitEdit={(body) => void handleEditSubmit(message, body)}
                    onCancelEdit={() => setEditingId(null)}
                  />
                </div>
              );
            })
          )}
          {typingUserId && <TypingBubble label={s.typing} />}
          <div ref={bottomRef} />
        </div>

        {firstUnreadId && !autoScroll && (
          <button
            type="button"
            onClick={() => void scrollToMessage(firstUnreadId)}
            className="fade-up absolute inset-x-0 top-2 mx-auto w-fit rounded-full border border-gold/30 bg-navy-deep/90 px-3 py-1.5 text-[11px] font-semibold text-gold backdrop-blur"
          >
            {s.jumpToUnread}
          </button>
        )}

        {!autoScroll && (
          <button
            type="button"
            aria-label={s.scrollToBottom}
            onClick={() => {
              setAutoScroll(true);
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="tap-scale absolute bottom-4 end-4 grid h-11 w-11 place-items-center rounded-full border border-gold/30 bg-navy-deep/95 text-gold shadow-[var(--shadow-card)] backdrop-blur"
          >
            <ArrowDown className="h-5 w-5" />
            {newCount > 0 && (
              <span className="absolute -top-1 -end-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy-deep">
                {newCount}
              </span>
            )}
          </button>
        )}
      </div>

      <Composer
        strings={s}
        onSendText={handleSendText}
        onSendAttachment={handleSendAttachment}
        onTyping={sendTyping}
        replyTo={replyTo}
        replyToName={replyTo ? (replyTo.sender_id === userId ? s.you : info.otherName) : undefined}
        onCancelReply={() => setReplyTo(null)}
        focusToken={composerFocus}
      />

      {menu && (
        <MessageContextMenu
          x={menu.x}
          y={menu.y}
          strings={s}
          isOwn={menu.message.sender_id === userId}
          isPinned={Boolean(menu.message.pinned_at)}
          canCopy={Boolean(menu.message.body) && !menu.message.deleted_at}
          canEdit={
            menu.message.sender_id === userId &&
            menu.message.kind === "text" &&
            !menu.message.deleted_at &&
            !menu.message.pending
          }
          onAction={(action) => handleMenuAction(action, menu.message)}
          onClose={() => setMenu(null)}
        />
      )}

      {infoMessage && (
        <MessageInfoSheet
          message={infoMessage}
          strings={s}
          locale={locale}
          onClose={() => setInfoMessage(null)}
        />
      )}

      {deleteTarget && (
        <DeleteMessageDialog
          strings={s}
          canDeleteForEveryone={deleteTarget.every((m) => m.sender_id === userId && !m.deleted_at)}
          onDeleteForMe={() => void runDelete(deleteTarget, false)}
          onDeleteForEveryone={() => void runDelete(deleteTarget, true)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {forwardTargets && (
        <ForwardSheet
          userId={userId}
          strings={s}
          excludeConversationId={id}
          onPick={(cid) => void forwardTo(cid)}
          onClose={() => setForwardTargets(null)}
        />
      )}

      {viewerStartId && (viewerQ.data?.length ?? 0) > 0 && (
        <ImageViewer
          images={viewerQ.data ?? []}
          startId={viewerStartId}
          strings={s}
          onClose={() => setViewerStartId(null)}
        />
      )}
    </div>
  );
}