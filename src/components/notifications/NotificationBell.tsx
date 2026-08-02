import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Heart, MessageCircle, ShieldCheck, Sparkles, Eye } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotificationsList,
  useUnreadCount,
  type NotificationItem,
  type NotificationType,
} from "@/hooks/useNotifications";
import { useFeatureStrings } from "@/i18n/feature";
import { socialStrings } from "@/lib/social/strings";

const ICONS: Record<NotificationType, typeof Heart> = {
  like: Heart,
  match: Sparkles,
  message: MessageCircle,
  profile_view: Eye,
  verification: ShieldCheck,
  system: Bell,
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function destinationFor(item: NotificationItem): { to: string; params?: Record<string, string>; search?: Record<string, string> } {
  const actorId = item.actor?.id;
  switch (item.type) {
    case "like":
    case "profile_view":
      return actorId ? { to: "/member/$id", params: { id: actorId } } : { to: "/matches" };
    case "match":
      return { to: "/matches" };
    case "message":
      return actorId ? { to: "/messages", search: { to: actorId } } : { to: "/messages" };
    default:
      return { to: "/profile" };
  }
}

export function NotificationBell({ className = "" }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const s = useFeatureStrings(socialStrings).notifications;

  const listQ = useNotificationsList();
  const unreadQ = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  if (!isAuthenticated) return null;

  const items = listQ.data ?? [];
  const unread = unreadQ.data ?? 0;

  const handleItemClick = (item: NotificationItem) => {
    if (!item.readAt) markAsRead.mutate(item.id);
    setOpen(false);
    const dest = destinationFor(item);
    void navigate(dest);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={s.bellLabel}
        className="relative grid h-9 w-9 place-items-center rounded-full text-cream transition hover:bg-white/10"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy-deep">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute end-0 z-50 mt-2 w-80 max-w-[90vw] panel-navy p-2 text-cream">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-sm font-bold text-gold">{s.title}</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead.mutate()}
                  className="text-xs text-cream/70 hover:text-gold"
                >
                  {s.markAllRead}
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-cream/60">{s.empty}</p>
              ) : (
                items.slice(0, 8).map((item) => {
                  const Icon = ICONS[item.type];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-start text-xs transition hover:bg-white/5 ${
                        item.readAt ? "" : "bg-white/5"
                      }`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy">
                        {item.actor?.avatarUrl ? (
                          <img src={item.actor.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <Icon className="h-4 w-4 text-gold" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-cream">{item.title}</span>
                        {item.body && <span className="block truncate text-cream/60">{item.body}</span>}
                        <span className="mt-0.5 block text-[10px] text-cream/40">{relativeTime(item.createdAt)}</span>
                      </span>
                      {!item.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />}
                    </button>
                  );
                })
              )}
            </div>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-lg px-2 py-2 text-center text-xs font-semibold text-gold hover:bg-white/5"
            >
              {s.viewAll}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
