import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const REACTION_EMOJIS = ["❤️", "👍", "👎", "😂", "😮", "😢", "🙏"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type MessageReaction = {
  id: string;
  message_id: string;
  conversation_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export const reactionKeys = {
  conversation: (conversationId: string) => ["chat", "reactions", conversationId] as const,
};

export function conversationReactionsQuery(conversationId: string) {
  return queryOptions({
    queryKey: reactionKeys.conversation(conversationId),
    queryFn: async (): Promise<MessageReaction[]> => {
      const { data, error } = await supabase
        .from("message_reactions")
        .select("id, message_id, conversation_id, user_id, emoji, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MessageReaction[];
    },
    enabled: Boolean(conversationId),
    staleTime: 30_000,
  });
}

/** Groups reactions by message id for O(1) lookup inside the message list. */
export function groupReactions(rows: MessageReaction[] | undefined) {
  const map = new Map<string, MessageReaction[]>();
  for (const row of rows ?? []) {
    const list = map.get(row.message_id);
    if (list) list.push(row);
    else map.set(row.message_id, [row]);
  }
  return map;
}

/**
 * One reaction per user per message: picking the same emoji removes it, a
 * different emoji replaces the previous one. The cache is patched optimistically.
 */
export async function toggleReaction(
  queryClient: QueryClient,
  args: { conversationId: string; messageId: string; userId: string; emoji: string },
) {
  const key = reactionKeys.conversation(args.conversationId);
  const previous = queryClient.getQueryData<MessageReaction[]>(key) ?? [];
  const mine = previous.find((r) => r.message_id === args.messageId && r.user_id === args.userId);
  const removing = mine?.emoji === args.emoji;

  const optimistic = removing
    ? previous.filter((r) => r.id !== mine.id)
    : mine
      ? previous.map((r) => (r.id === mine.id ? { ...r, emoji: args.emoji } : r))
      : [
          ...previous,
          {
            id: `temp-${args.messageId}-${args.userId}`,
            message_id: args.messageId,
            conversation_id: args.conversationId,
            user_id: args.userId,
            emoji: args.emoji,
            created_at: new Date().toISOString(),
          } satisfies MessageReaction,
        ];
  queryClient.setQueryData<MessageReaction[]>(key, optimistic);

  try {
    if (removing && mine) {
      const { error } = await supabase.from("message_reactions").delete().eq("id", mine.id);
      if (error) throw error;
    } else if (mine) {
      const { error } = await supabase
        .from("message_reactions")
        .update({ emoji: args.emoji })
        .eq("id", mine.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("message_reactions").insert({
        message_id: args.messageId,
        conversation_id: args.conversationId,
        user_id: args.userId,
        emoji: args.emoji,
      });
      if (error) throw error;
    }
  } catch (error) {
    queryClient.setQueryData<MessageReaction[]>(key, previous);
    throw error;
  } finally {
    void queryClient.invalidateQueries({ queryKey: key });
  }
}