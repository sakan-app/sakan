import { X } from "lucide-react";

import type { ChatStrings } from "@/lib/chat/strings";
import type { Locale } from "@/i18n";
import type { ChatMessage } from "@/lib/chat/types";

type Props = {
  message: ChatMessage;
  strings: ChatStrings;
  locale: Locale;
  onClose: () => void;
};

function formatStamp(locale: Locale, iso: string | null, fallback: string) {
  if (!iso) return fallback;
  return new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function bytes(size: number | null) {
  if (!size) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageInfoSheet({ message, strings, locale, onClose }: Props) {
  const rows: Array<[string, string]> = [
    [strings.sentAt, formatStamp(locale, message.created_at, "—")],
    [strings.deliveredAt, formatStamp(locale, message.delivered_at, strings.notDelivered)],
    [strings.readAt, formatStamp(locale, message.read_at, strings.notRead)],
  ];
  if (message.edited_at) rows.push([strings.edited, formatStamp(locale, message.edited_at, "—")]);
  if (message.attachment_name) {
    const size = bytes(message.attachment_size);
    rows.push([strings.attachmentLabel, `${message.attachment_name}${size ? ` · ${size}` : ""}`]);
  }
  rows.push([strings.statusLabel, message.read_at ? strings.readAt : message.delivered_at ? strings.deliveredAt : strings.sentAt]);

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-deep/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fade-up relative w-full max-w-md rounded-t-3xl border border-gold/20 bg-navy-deep p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[var(--shadow-card)] sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-cream">{strings.messageInfo}</h2>
          <button
            type="button"
            aria-label={strings.cancel}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-cream/70 hover:bg-cream/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {message.body && (
          <p className="mb-4 line-clamp-3 rounded-xl bg-cream/5 px-3 py-2 text-xs text-cream/75">{message.body}</p>
        )}
        <dl className="space-y-2.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 text-xs">
              <dt className="text-cream/55">{label}</dt>
              <dd className="text-end font-medium text-cream">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}