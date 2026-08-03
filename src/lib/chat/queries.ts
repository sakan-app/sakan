import { infiniteQueryOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { ChatMessage, ConversationListItem, MessageKind, MessageRow } from "@/lib/chat/types";

export const PAGE_SIZE = 30;

export const chatKeys = {
  conversations: (userId: string) => ["chat", "conversations", userId] as const,
  messages: (conversationId: string) => ["chat", "messages", conversationId] as const,
};

/** Signs private storage paths in bulk; used for avatars and message attachments. */
export async function signStoragePaths(bucket: "avatars" | "gallery", paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(unique, 60 * 60);
  if (error || !data) return map;
  for (const entry of data) {
    if (entry.signedUrl && entry.path) map.set(entry.path, entry.signedUrl);
  }
  return map;
}

export async function signStoragePath(bucket: "avatars" | "gallery", path: string | null | undefined) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

type ConversationRow = {
  id: string;
  user_low: string;
  user_high: string;
  last_message_at: string | null;
};

type MessagePreviewRow = Pick<
  MessageRow,
  "id" | "conversation_id" | "sender_id" | "body" | "kind" | "created_at" | "read_at" | "deleted_at"
>;

export function conversationsQuery(userId: string) {
  return queryOptions({
    queryKey: chatKeys.conversations(userId),
    queryFn: async (): Promise<ConversationListItem[]> => {
      if (!userId) return [];
      const { data: convRows, error } = await supabase
        .from("conversations")
        .select("id, user_low, user_high, last_message_at")
        .or(`user_low.eq.${userId},user_high.eq.${userId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      const conversations = (convRows ?? []) as ConversationRow[];
      if (conversations.length === 0) return [];

      const ids = conversations.map((c) => c.id);
      const otherIds = conversations.map((c) => (c.user_low === userId ? c.user_high : c.user_low));

      const [{ data: profiles }, { data: messages }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, avatar_url, last_seen_at, presence_status, hide_last_seen").in("id", otherIds),
        supabase
          .from("messages")
          .select("id, conversation_id, sender_id, body, kind, created_at, read_at, deleted_at")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false }),
      ]);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const avatarPaths = (profiles ?? [])
        .map((p) => p.avatar_url)
        .filter((p): p is string => Boolean(p));
      const signedAvatars = await signStoragePaths("avatars", avatarPaths);

      const latestByConv = new Map<string, MessagePreviewRow>();
      const unreadByConv = new Map<string, number>();
      for (const m of (messages ?? []) as MessagePreviewRow[]) {
        if (!latestByConv.has(m.conversation_id)) latestByConv.set(m.conversation_id, m);
        if (m.sender_id !== userId && !m.read_at && !m.deleted_at) {
          unreadByConv.set(m.conversation_id, (unreadByConv.get(m.conversation_id) ?? 0) + 1);
        }
      }

      return conversations.map((c): ConversationListItem => {
        const otherId = c.user_low === userId ? c.user_high : c.user_low;
        const profile = profileMap.get(otherId);
        const latest = latestByConv.get(c.id);
        return {
          id: c.id,
          otherUserId: otherId,
          otherName: profile?.display_name ?? "",
          otherAvatarPath: profile?.avatar_url ?? null,
          otherAvatarUrl: profile?.avatar_url ? (signedAvatars.get(profile.avatar_url) ?? null) : null,
          otherLastSeenAt: profile?.hide_last_seen ? null : (profile?.last_seen_at ?? null),
          otherPresence:
            !profile || profile.presence_status === "invisible" ? null : profile.presence_status,
          lastMessageBody: latest && !latest.deleted_at ? latest.body : null,
          lastMessageKind: latest?.kind ?? null,
          lastMessageAt: latest?.created_at ?? c.last_message_at,
          lastSenderId: latest?.sender_id ?? null,
          lastDeleted: Boolean(latest?.deleted_at),
          unreadCount: unreadByConv.get(c.id) ?? 0,
        };
      });
    },
  });
}

export type MessagesPage = {
  items: ChatMessage[];
  nextCursor: string | null;
};

export function messagesQuery(conversationId: string) {
  return infiniteQueryOptions({
    queryKey: chatKeys.messages(conversationId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<MessagesPage> => {
      let query = supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (pageParam) query = query.lt("created_at", pageParam);
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as MessageRow[];
      const nextCursor = rows.length === PAGE_SIZE ? rows[rows.length - 1]!.created_at : null;
      return { items: rows, nextCursor };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

/** Flattens infinite pages (newest-first pages) into an oldest-to-newest list for display. */
export function flattenMessagePages(
  pages: MessagesPage[] | undefined,
  viewerId?: string,
): ChatMessage[] {
  if (!pages) return [];
  const merged = pages.flatMap((page) => page.items);
  const byId = new Map<string, ChatMessage>();
  for (const m of merged) byId.set(m.id, m);
  return [...byId.values()]
    .filter((m) => !(viewerId && (m.deleted_for ?? []).includes(viewerId)))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function startConversation(otherUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_conversation", { other_user: otherUserId });
  if (error) throw error;
  return data as unknown as string;
}

export async function uploadChatAttachment(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = ext.replace(/[^a-z0-9]/gi, "") || "bin";
  const path = `${userId}/chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const { error } = await supabase.storage
    .from("gallery")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}

function insertMessageIntoCache(queryClient: QueryClient, conversationId: string, message: ChatMessage) {
  queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] } | undefined>(
    chatKeys.messages(conversationId),
    (old) => {
      if (!old) {
        return { pages: [{ items: [message], nextCursor: null }], pageParams: [null] };
      }
      const pages = old.pages.map((page, index) => {
        if (index !== 0) return page;
        const withoutDupe = page.items.filter((m) => m.id !== message.id);
        return { ...page, items: [message, ...withoutDupe] };
      });
      return { ...old, pages };
    },
  );
}

function replaceMessageInCache(
  queryClient: QueryClient,
  conversationId: string,
  tempId: string,
  message: ChatMessage,
) {
  queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] } | undefined>(
    chatKeys.messages(conversationId),
    (old) => {
      if (!old) return old;
      const pages = old.pages.map((page) => ({
        ...page,
        items: page.items.map((m) => (m.id === tempId ? message : m)),
      }));
      return { ...old, pages };
    },
  );
}

function markMessageFailed(queryClient: QueryClient, conversationId: string, tempId: string) {
  queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] } | undefined>(
    chatKeys.messages(conversationId),
    (old) => {
      if (!old) return old;
      const pages = old.pages.map((page) => ({
        ...page,
        items: page.items.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)),
      }));
      return { ...old, pages };
    },
  );
}

export type SendMessageArgs = {
  conversationId: string;
  senderId: string;
  body: string;
  kind: MessageKind;
  attachmentPath?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentMime?: string | null;
  replyToId?: string | null;
};

/** Optimistically inserts the message into the cache, then persists it. */
export async function sendMessage(queryClient: QueryClient, args: SendMessageArgs): Promise<void> {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const optimistic: ChatMessage = {
    id: tempId,
    conversation_id: args.conversationId,
    sender_id: args.senderId,
    body: args.body,
    kind: args.kind,
    attachment_path: args.attachmentPath ?? null,
    attachment_name: args.attachmentName ?? null,
    attachment_size: args.attachmentSize ?? null,
    attachment_mime: args.attachmentMime ?? null,
    delivered_at: null,
    read_at: null,
    edited_at: null,
    deleted_at: null,
    translations: {},
    source_language: null,
    moderation: "pending",
    reply_to_id: args.replyToId ?? null,
    pinned_at: null,
    pinned_by: null,
    deleted_for: [],
    created_at: now,
    pending: true,
  };
  insertMessageIntoCache(queryClient, args.conversationId, optimistic);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: args.conversationId,
      sender_id: args.senderId,
      body: args.body,
      kind: args.kind,
      attachment_path: args.attachmentPath ?? null,
      attachment_name: args.attachmentName ?? null,
      attachment_size: args.attachmentSize ?? null,
      attachment_mime: args.attachmentMime ?? null,
      reply_to_id: args.replyToId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    markMessageFailed(queryClient, args.conversationId, tempId);
    return;
  }

  replaceMessageInCache(queryClient, args.conversationId, tempId, data as ChatMessage);
  await queryClient.invalidateQueries({ queryKey: chatKeys.conversations(args.senderId) });
}

/** Marks all unread incoming messages as read, and stamps delivered_at where missing. */
export async function markConversationRead(conversationId: string, userId: string) {
  const nowIso = new Date().toISOString();
  await supabase
    .from("messages")
    .update({ delivered_at: nowIso })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("delivered_at", null);

  await supabase
    .from("messages")
    .update({ read_at: nowIso })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

/* ==========================================================================
   Premium chat operations: edit, delete, pin, search, jump-to-message
   ========================================================================== */

type MessagesCache = { pages: MessagesPage[]; pageParams: unknown[] } | undefined;

/** Applies a partial patch to a single cached message. */
export function patchMessageInCache(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  patch: Partial<ChatMessage>,
) {
  queryClient.setQueryData<MessagesCache>(chatKeys.messages(conversationId), (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
      })),
    };
  });
}

export async function editMessage(
  queryClient: QueryClient,
  args: { conversationId: string; messageId: string; body: string },
) {
  const editedAt = new Date().toISOString();
  const previous = readMessageFromCache(queryClient, args.conversationId, args.messageId);
  patchMessageInCache(queryClient, args.conversationId, args.messageId, {
    body: args.body,
    edited_at: editedAt,
  });
  const { error } = await supabase
    .from("messages")
    .update({ body: args.body, edited_at: editedAt })
    .eq("id", args.messageId);
  if (error) {
    // Roll the optimistic patch back so the bubble stops showing an edit that
    // never reached the database.
    if (previous) {
      patchMessageInCache(queryClient, args.conversationId, args.messageId, {
        body: previous.body,
        edited_at: previous.edited_at,
      });
    }
    throw error;
  }
}

export async function deleteMessageForEveryone(
  queryClient: QueryClient,
  args: { conversationId: string; messageId: string },
) {
  const deletedAt = new Date().toISOString();
  const previous = readMessageFromCache(queryClient, args.conversationId, args.messageId);
  patchMessageInCache(queryClient, args.conversationId, args.messageId, {
    deleted_at: deletedAt,
    body: "",
    pinned_at: null,
  });
  // The messages_body_len check requires 1..4000 characters, so a tombstone
  // must clear the body to NULL — an empty string is rejected (23514).
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: deletedAt, body: null, pinned_at: null, pinned_by: null })
    .eq("id", args.messageId);
  if (error) {
    if (previous) {
      patchMessageInCache(queryClient, args.conversationId, args.messageId, {
        deleted_at: previous.deleted_at,
        body: previous.body,
        pinned_at: previous.pinned_at,
      });
    }
    throw error;
  }
}

export async function deleteMessageForMe(
  queryClient: QueryClient,
  args: { conversationId: string; messageId: string; userId: string },
) {
  const { data, error: readError } = await supabase
    .from("messages")
    .select("deleted_for")
    .eq("id", args.messageId)
    .maybeSingle();
  if (readError) throw readError;
  const next = [...new Set([...(data?.deleted_for ?? []), args.userId])];
  patchMessageInCache(queryClient, args.conversationId, args.messageId, { deleted_for: next });
  const { error } = await supabase
    .from("messages")
    .update({ deleted_for: next })
    .eq("id", args.messageId);
  if (error) throw error;
}

export async function setMessagePinned(
  queryClient: QueryClient,
  args: { conversationId: string; messageId: string; userId: string; pinned: boolean },
) {
  const pinnedAt = args.pinned ? new Date().toISOString() : null;
  const previous = readMessageFromCache(queryClient, args.conversationId, args.messageId);
  patchMessageInCache(queryClient, args.conversationId, args.messageId, {
    pinned_at: pinnedAt,
    pinned_by: args.pinned ? args.userId : null,
  });
  const { error } = await supabase
    .from("messages")
    .update({ pinned_at: pinnedAt, pinned_by: args.pinned ? args.userId : null })
    .eq("id", args.messageId);
  if (error) {
    if (previous) {
      patchMessageInCache(queryClient, args.conversationId, args.messageId, {
        pinned_at: previous.pinned_at,
        pinned_by: previous.pinned_by,
      });
    }
    throw error;
  }
}

export function pinnedMessagesQuery(conversationId: string) {
  return queryOptions({
    queryKey: ["chat", "pinned", conversationId] as const,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .not("pinned_at", "is", null)
        .is("deleted_at", null)
        .order("pinned_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    },
    enabled: Boolean(conversationId),
  });
}

/** Server-side conversation search (body, attachment names). */
export async function searchConversation(conversationId: string, term: string): Promise<ChatMessage[]> {
  const trimmed = term.trim();
  if (trimmed.length < 2) return [];
  const escaped = trimmed.replace(/[%_]/g, (c) => `\\${c}`);
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .or(`body.ilike.%${escaped}%,attachment_name.ilike.%${escaped}%`)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

/** Fetches a single message (used for reply previews of unloaded history). */
export async function fetchMessageById(messageId: string): Promise<ChatMessage | null> {
  const { data, error } = await supabase.from("messages").select("*").eq("id", messageId).maybeSingle();
  if (error) return null;
  return (data as ChatMessage) ?? null;
}

/** Merges an arbitrary message into the cache so jump-to-message can render it. */
export function mergeMessagesIntoCache(
  queryClient: QueryClient,
  conversationId: string,
  messages: ChatMessage[],
) {
  if (messages.length === 0) return;
  queryClient.setQueryData<MessagesCache>(chatKeys.messages(conversationId), (old) => {
    if (!old || old.pages.length === 0) {
      return { pages: [{ items: messages, nextCursor: null }], pageParams: [null] };
    }
    const known = new Set(old.pages.flatMap((p) => p.items.map((m) => m.id)));
    const missing = messages.filter((m) => !known.has(m.id));
    if (missing.length === 0) return old;
    const pages = [...old.pages];
    pages[0] = { ...pages[0]!, items: [...missing, ...pages[0]!.items] };
    return { ...old, pages };
  });
}
