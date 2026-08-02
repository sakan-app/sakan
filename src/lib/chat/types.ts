import type { Database } from "@/integrations/supabase/types";

export type MessageKind = Database["public"]["Enums"]["message_kind"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export type ChatMessage = MessageRow & {
  /** Present while the optimistic message hasn't been persisted yet. */
  pending?: boolean;
  /** True if the mutation failed and the message needs a retry. */
  failed?: boolean;
};

export type ConversationListItem = {
  id: string;
  otherUserId: string;
  otherName: string;
  otherAvatarPath: string | null;
  otherAvatarUrl: string | null;
  otherLastSeenAt: string | null;
  lastMessageBody: string | null;
  lastMessageKind: MessageKind | null;
  lastMessageAt: string | null;
  lastSenderId: string | null;
  lastDeleted: boolean;
  unreadCount: number;
};

export type SendMessageInput = {
  conversationId: string;
  senderId: string;
  body: string;
  kind: MessageKind;
  attachmentPath?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentMime?: string | null;
};
