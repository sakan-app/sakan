import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Eye, Heart, Loader2, MessageCircle, ShieldCheck, Sparkles, Trash2 } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { useFeatureStrings } from "@/i18n/feature";
import { socialStrings } from "@/lib/social/strings";
import {
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotificationsList,
  type NotificationItem,
  type NotificationType,
} from "@/hooks/useNotifications";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | سَكَن" },
      { name: "description", content: "تابع كل جديد يخص حسابك على منصة سَكَن." },
    ],
  }),
  component: NotificationsPage,
});

const ICONS: Record<NotificationType, typeof Heart> = {
  like: Heart,
  match: Sparkles,
  message: MessageCircle,
  profile_view: Eye,
  verification: ShieldCheck,
  system: Bell,
};

function relativeTime(iso: string, locale: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (mins < 1) return rtf.format(0, "minute");
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
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

function NotificationsPage() {
  const { locale } = useI18n();
  const s = useFeatureStrings(socialStrings).notifications;
  const shared = useFeatureStrings(socialStrings);
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const listQ = useNotificationsList();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const items = listQ.data ?? [];
  const visible = unreadOnly ? items.filter((n) => !n.readAt) : items;
  const hasUnread = items.some((n) => !n.readAt);

  const handleClick = (item: NotificationItem) => {
    if (!item.readAt) markAsRead.mutate(item.id);
    const dest = destinationFor(item);
    void navigate(dest);
  };

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-cream">{s.title}</h1>
            <p className="mt-1 text-sm text-cream/60">{s.subtitle}</p>
          </div>
          {hasUnread && (
            <button type="button" onClick={() => markAllAsRead.mutate()} className="btn-outline-gold px-4 py-2 text-xs">
              {s.markAllRead}
            </button>
          )}
        </div>

        <label className="mt-6 flex w-fit items-center gap-2 text-sm text-cream">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="h-4 w-4 accent-gold-deep"
          />
          {s.unreadOnly}
        </label>

        <div className="mt-6">
          {listQ.isPending ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
            </div>
          ) : listQ.isError ? (
            <div className="mx-auto max-w-md glass-card p-10 text-center ">
              <h2 className="text-lg font-bold text-cream">{shared.errorTitle}</h2>
              <p className="mt-2 text-xs leading-6 text-cream/60">{shared.errorText}</p>
              <button onClick={() => void listQ.refetch()} className="btn-gold mt-6 px-6 py-2.5 text-sm">
                {shared.retry}
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="mx-auto max-w-md glass-card p-10 text-center ">
              <Bell className="mx-auto h-12 w-12 text-gold-deep" />
              <h2 className="mt-4 text-lg font-bold text-cream">{s.empty}</h2>
              <p className="mt-2 text-xs leading-6 text-cream/60">{s.emptyText}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {visible.map((item) => {
                const Icon = ICONS[item.type];
                return (
                  <li
                    key={item.id}
                    className={`flex items-start gap-3 rounded-xl glass-card border-white/10 p-4  ${
                      item.readAt ? "" : "bg-gold/5"
                    }`}
                  >
                    <button type="button" onClick={() => handleClick(item)} className="flex min-w-0 flex-1 items-start gap-3 text-start">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy">
                        {item.actor?.avatarUrl ? (
                          <img src={item.actor.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <Icon className="h-5 w-5 text-gold" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-cream">{item.title}</span>
                        {item.body && <span className="block truncate text-xs text-cream/60">{item.body}</span>}
                        <span className="mt-1 block text-[11px] text-cream/60">
                          {relativeTime(item.createdAt, locale)}
                        </span>
                      </span>
                      {!item.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-deep" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNotification.mutate(item.id)}
                      aria-label={s.delete}
                      title={s.delete}
                      className="shrink-0 rounded-full p-2 text-cream/60 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
