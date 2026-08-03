import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { chatKeys, type MessagesPage } from "@/lib/chat/queries";
import { reactionKeys } from "@/lib/chat/reactions";
import type { ChatMessage, MessageRow } from "@/lib/chat/types";

type UseConversationRealtimeArgs = {
  conversationId: string;
  userId: string;
  /** When true, this member's typing events are never broadcast. */
  hideTyping?: boolean;
};

function upsertPage(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  incoming: ChatMessage,
) {
  queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] } | undefined>(
    chatKeys.messages(conversationId),
    (old) => {
      if (!old || old.pages.length === 0) {
        return { pages: [{ items: [incoming], nextCursor: null }], pageParams: [null] };
      }
      let found = false;
      const pages = old.pages.map((page, index) => {
        const existingIndex = page.items.findIndex((m) => m.id === incoming.id);
        if (existingIndex >= 0) {
          found = true;
          const items = [...page.items];
          items[existingIndex] = incoming;
          return { ...page, items };
        }
        if (index === 0 && !found) return page;
        return page;
      });
      if (!found) {
        pages[0] = { ...pages[0]!, items: [incoming, ...pages[0]!.items] };
      }
      return { ...old, pages };
    },
  );
}

/**
 * Subscribes to postgres_changes for a single conversation's messages, plus a
 * broadcast/presence channel used for the typing indicator. Cache writes are
 * targeted (no list refetch) and the channel is torn down on unmount.
 */
export function useConversationRealtime({ conversationId, userId, hideTyping = false }: UseConversationRealtimeArgs) {
  const queryClient = useQueryClient();
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation:${conversationId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          upsertPage(queryClient, conversationId, payload.new as MessageRow);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          upsertPage(queryClient, conversationId, payload.new as MessageRow);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions", filter: `conversation_id=eq.${conversationId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: reactionKeys.conversation(conversationId) });
        },
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const senderId = (payload["payload"] as { userId?: string } | undefined)?.userId;
        if (!senderId || senderId === userId) return;
        setTypingUserId(senderId);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingUserId(null), 3000);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, userId, queryClient]);

  function sendTyping() {
    if (hideTyping) return;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId } });
  }

  return { typingUserId, sendTyping };
}
