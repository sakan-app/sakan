import { Bell, Crown, Eye, Heart, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

import type { NotificationItem, NotificationType } from "@/hooks/useNotifications";

/** Single source of truth for notification iconography. */
export const NOTIFICATION_ICONS: Record<NotificationType, typeof Heart> = {
  like: Heart,
  match: Sparkles,
  message: MessageCircle,
  profile_view: Eye,
  verification: ShieldCheck,
  premium: Crown,
  system: Bell,
};

export type NotificationFilter =
  | "all"
  | "unread"
  | "messages"
  | "likes"
  | "matches"
  | "verification"
  | "premium"
  | "system";

export const NOTIFICATION_FILTERS: NotificationFilter[] = [
  "all",
  "unread",
  "messages",
  "likes",
  "matches",
  "verification",
  "premium",
  "system",
];

const FILTER_TYPES: Partial<Record<NotificationFilter, NotificationType[]>> = {
  messages: ["message"],
  likes: ["like", "profile_view"],
  matches: ["match"],
  verification: ["verification"],
  premium: ["premium"],
  system: ["system"],
};

export function matchesFilter(item: NotificationItem, filter: NotificationFilter): boolean {
  if (filter === "all") return true;
  if (filter === "unread") return !item.readAt;
  return FILTER_TYPES[filter]?.includes(item.type) ?? true;
}

export function matchesSearch(item: NotificationItem, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return [item.title, item.body ?? "", item.actor?.name ?? ""].join(" ").toLowerCase().includes(needle);
}

export type NotificationGroupId = "today" | "yesterday" | "earlier";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function groupOf(iso: string, now = new Date()): NotificationGroupId {
  const today = startOfDay(now);
  const created = new Date(iso).getTime();
  if (created >= today) return "today";
  if (created >= today - 86_400_000) return "yesterday";
  return "earlier";
}

export function groupNotifications(items: NotificationItem[]) {
  const groups: Array<{ id: NotificationGroupId; items: NotificationItem[] }> = [
    { id: "today", items: [] },
    { id: "yesterday", items: [] },
    { id: "earlier", items: [] },
  ];
  for (const item of items) {
    groups.find((g) => g.id === groupOf(item.createdAt))?.items.push(item);
  }
  return groups.filter((g) => g.items.length > 0);
}

/** Light haptic tick; silently ignored where unsupported. */
export function haptic(pattern: number | number[] = 12) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* haptics unavailable */
  }
}

export function notificationDestination(item: NotificationItem): {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
} {
  const actorId = item.actor?.id;
  switch (item.type) {
    case "like":
    case "profile_view":
      return actorId ? { to: "/member/$id", params: { id: actorId } } : { to: "/matches" };
    case "match":
      return { to: "/matches" };
    case "message":
      return actorId ? { to: "/messages", search: { to: actorId } } : { to: "/messages" };
    case "premium":
      return { to: "/billing" };
    case "verification":
      return { to: "/settings" };
    default:
      return { to: "/profile" };
  }
}