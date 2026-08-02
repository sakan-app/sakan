import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Composer } from "@/components/chat/Composer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useAuth } from "@/hooks/useAuth";
import { formatLastSeen, useIsOnline } from "@/hooks/usePresence";
import { useFeatureStrings } from "@/i18n/feature";
import { useI18n } from "@/lib/i18n";
import { chatStrings } from "@/lib/chat/strings";
import {
  chatKeys,
  flattenMessagePages,
  markConversationRead,
  messagesQuery,
  sendMessage,
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
    <div className="fade-up my-3 flex items-center justify-center">
      <span className="rounded-full bg-cream/8 px-3 py-1 text-[11px] font-medium text-cream/65">{label}</span>
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

function ConversationPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const s = useFeatureStrings(chatStrings);
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const infoQ = useQuery(conversationInfoQuery(id, userId));
  const messagesQ = useInfiniteQuery(messagesQuery(id));
  const { typingUserId, sendTyping } = useConversationRealtime({ conversationId: id, userId });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const messages = flattenMessagePages(messagesQ.data?.pages);
  const online = useIsOnline(infoQ.data?.otherUserId, infoQ.data?.otherLastSeenAt);

  useEffect(() => {
    if (!id || !userId) return;
    void markConversationRead(id, userId).then(() => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations(userId) });
    });
  }, [id, userId, queryClient, messages.length]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, autoScroll]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 120);
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
    void sendMessage(queryClient, { conversationId: id, senderId: userId, body, kind: "text" });
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
    });
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
    });
  }

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

  return (
    <div className="flex h-screen flex-col bg-navy">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gold/15 bg-navy-deep px-3 py-2.5">
        <Link to="/messages" aria-label={s.back} className="grid h-9 w-9 place-items-center rounded-full text-gold hover:bg-gold/10">
          <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />
        </Link>
        {info.otherAvatarUrl ? (
          <img src={info.otherAvatarUrl} alt={info.otherName} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-gold/60">
            <UserRound className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-cream">{info.otherName}</p>
          <p className="truncate text-[11px] text-cream/50">
            {typingUserId ? s.typing : formatLastSeen(locale, info.otherLastSeenAt, online)}
          </p>
        </div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
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
            const showSeparator = !prev || dayLabel(prev.created_at, s, locale) !== dayLabel(message.created_at, s, locale);
            return (
              <div key={message.id}>
                {showSeparator && <DaySeparator label={dayLabel(message.created_at, s, locale)} />}
                {message.failed ? (
                  <MessageBubble
                    message={message}
                    isOwn={message.sender_id === userId}
                    strings={s}
                    locale={locale}
                    onRetry={() => handleRetry(message)}
                  />
                ) : (
                  <MessageBubble
                    message={message}
                    isOwn={message.sender_id === userId}
                    strings={s}
                    locale={locale}
                  />
                )}
              </div>
            );
          })
        )}
        {typingUserId && <TypingBubble label={s.typing} />}
        <div ref={bottomRef} />
      </div>

      <Composer
        strings={s}
        onSendText={handleSendText}
        onSendAttachment={handleSendAttachment}
        onTyping={sendTyping}
      />
    </div>
  );
}
