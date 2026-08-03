import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Archive, Bell, CheckCheck, Inbox, Loader2, Search, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { useFeatureStrings } from "@/i18n/feature";
import { socialStrings } from "@/lib/social/strings";
import { NotificationRow } from "@/components/notifications/NotificationRow";
import {
  NOTIFICATION_FILTERS,
  groupNotifications,
  haptic,
  matchesFilter,
  matchesSearch,
  notificationDestination,
  type NotificationFilter,
} from "@/lib/notifications/shared";
import {
  useArchiveNotifications,
  useArchivedNotifications,
  useDeleteNotifications,
  useMarkAllAsRead,
  useMarkAsRead,
  useMarkManyAsRead,
  useNotificationsList,
  type NotificationItem,
} from "@/hooks/useNotifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | سَكَن" },
      { name: "description", content: "تابع كل جديد يخص حسابك على منصة سَكَن." },
    ],
  }),
  component: NotificationsPage,
});

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

function NotificationsPage() {
  const { locale } = useI18n();
  const s = useFeatureStrings(socialStrings).notifications;
  const shared = useFeatureStrings(socialStrings);
  const navigate = useNavigate();
  const [view, setView] = useState<"inbox" | "archive">("inbox");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const inboxQ = useNotificationsList();
  const archiveQ = useArchivedNotifications(view === "archive");
  const listQ = view === "archive" ? archiveQ : inboxQ;

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const markManyAsRead = useMarkManyAsRead();
  const archiveNotifications = useArchiveNotifications();
  const deleteNotifications = useDeleteNotifications();

  const items = useMemo(() => listQ.data ?? [], [listQ.data]);
  const visible = useMemo(
    () => items.filter((n) => matchesFilter(n, filter) && matchesSearch(n, term)),
    [items, filter, term],
  );
  const groups = useMemo(() => groupNotifications(visible), [visible]);
  const hasUnread = items.some((n) => !n.readAt);
  const selectionMode = selected.length > 0;

  const toggleSelect = useCallback((id: string) => {
    haptic(8);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const handleOpen = useCallback(
    (item: NotificationItem) => {
      if (!item.readAt) markAsRead.mutate(item.id);
      void navigate(notificationDestination(item));
    },
    [markAsRead, navigate],
  );

  const handleDelete = useCallback((id: string) => deleteNotifications.mutate([id]), [deleteNotifications]);
  const handleArchiveToggle = useCallback(
    (id: string, archived: boolean) => archiveNotifications.mutate({ ids: [id], archived }),
    [archiveNotifications],
  );

  const runBulk = (action: "read" | "archive" | "delete") => {
    const ids = selected;
    if (ids.length === 0) return;
    haptic([10, 20]);
    if (action === "read") markManyAsRead.mutate(ids);
    if (action === "archive") archiveNotifications.mutate({ ids, archived: view === "inbox" });
    if (action === "delete") deleteNotifications.mutate(ids);
    setSelected([]);
  };

  const switchView = (next: "inbox" | "archive") => {
    setView(next);
    setSelected([]);
  };

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-cream">{s.title}</h1>
            <p className="mt-1 text-sm text-cream/60">{s.subtitle}</p>
          </div>
          {hasUnread && view === "inbox" && (
            <button type="button" onClick={() => markAllAsRead.mutate()} className="btn-outline-gold px-4 py-2 text-xs">
              {s.markAllRead}
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2" role="tablist" aria-label={s.title}>
          {(["inbox", "archive"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={view === tab}
              onClick={() => switchView(tab)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                view === tab ? "bg-gold-deep text-navy" : "glass-card border-white/10 text-cream/70 hover:text-cream"
              }`}
            >
              {tab === "inbox" ? <Inbox className="h-3.5 w-3.5" aria-hidden /> : <Archive className="h-3.5 w-3.5" aria-hidden />}
              {tab === "inbox" ? s.inbox : s.archiveView}
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-cream/40" aria-hidden />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={s.searchPlaceholder}
            aria-label={s.searchPlaceholder}
            className="field-navy w-full rounded-full py-2.5 ps-10 pe-4 text-sm"
          />
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {NOTIFICATION_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === key ? "bg-gold-deep text-navy" : "glass-card border-white/10 text-cream/70 hover:text-cream"
              }`}
            >
              {s.filters[key]}
            </button>
          ))}
        </div>

        {selectionMode && (
          <div className="glass-card mt-4 flex flex-wrap items-center gap-2 rounded-2xl border-white/10 p-3" role="region" aria-live="polite">
            <span className="text-xs font-bold text-cream">{s.selectedCount.replace("{n}", String(selected.length))}</span>
            <div className="ms-auto flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelected(visible.map((n) => n.id))} className="btn-outline-gold px-3 py-1.5 text-[11px]">
                {s.selectAll}
              </button>
              <button type="button" onClick={() => runBulk("read")} className="btn-outline-gold inline-flex items-center gap-1 px-3 py-1.5 text-[11px]">
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                {s.markSelectedRead}
              </button>
              <button type="button" onClick={() => runBulk("archive")} className="btn-outline-gold px-3 py-1.5 text-[11px]">
                {view === "inbox" ? s.archiveSelected : s.unarchive}
              </button>
              <button
                type="button"
                onClick={() => runBulk("delete")}
                className="rounded-full bg-red-500/20 px-3 py-1.5 text-[11px] font-bold text-red-200 transition hover:bg-red-500/30"
              >
                {s.deleteSelected}
              </button>
              <button type="button" onClick={() => setSelected([])} aria-label={s.clearSelection} className="rounded-full p-1.5 text-cream/60 hover:text-cream">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-cream/40 sm:hidden">{s.swipeHint}</p>

        <div className="mt-6">
          {listQ.isPending ? (
            <div className="flex justify-center py-16" role="status" aria-live="polite">
              <Loader2 className="h-7 w-7 animate-spin text-gold-deep" aria-hidden />
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
              <Bell className="mx-auto h-12 w-12 text-gold-deep" aria-hidden />
              <h2 className="mt-4 text-lg font-bold text-cream">
                {term.trim() ? s.noResults : view === "archive" ? s.archiveEmpty : s.empty}
              </h2>
              <p className="mt-2 text-xs leading-6 text-cream/60">
                {view === "archive" ? s.archiveEmptyText : s.emptyText}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map((group) => (
                <section key={group.id}>
                  <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-cream/50">{s.groups[group.id]}</h2>
                  <ul className="flex flex-col gap-2">
                    {group.items.map((item) => (
                      <NotificationRow
                        key={item.id}
                        item={item}
                        timeLabel={relativeTime(item.createdAt, locale)}
                        typeLabel={s.types[item.type]}
                        selected={selected.includes(item.id)}
                        selectionMode={selectionMode}
                        archived={view === "archive"}
                        labels={{ delete: s.delete, archive: s.archive, unarchive: s.unarchive, select: s.select }}
                        onOpen={handleOpen}
                        onToggleSelect={toggleSelect}
                        onDelete={handleDelete}
                        onArchiveToggle={handleArchiveToggle}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
