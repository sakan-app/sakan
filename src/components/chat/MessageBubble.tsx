import {
  Check,
  CheckCheck,
  CornerUpLeft,
  Download,
  FileText,
  Image as ImageIcon,
  Languages,
  Loader2,
  Pin,
} from "lucide-react";
import { memo, useRef, useState } from "react";

import type { ChatMessage } from "@/lib/chat/types";
import { signStoragePath } from "@/lib/chat/queries";
import { useQuery } from "@tanstack/react-query";
import type { ChatStrings } from "@/lib/chat/strings";
import type { Locale } from "@/i18n";

type Props = {
  message: ChatMessage;
  isOwn: boolean;
  strings: ChatStrings;
  locale: Locale;
  rtl: boolean;
  replyTarget?: ChatMessage | null;
  replyTargetName?: string;
  highlighted?: boolean;
  searchTerm?: string;
  selectionMode?: boolean;
  selected?: boolean;
  editing?: boolean;
  onRetry?: () => void;
  onReply?: () => void;
  onOpenMenu?: (point: { x: number; y: number }) => void;
  onToggleSelect?: () => void;
  onJumpToReply?: (messageId: string) => void;
  onOpenImage?: () => void;
  onSubmitEdit?: (body: string) => void;
  onCancelEdit?: () => void;
};

const SWIPE_TRIGGER = 56;

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate?.(12);
    } catch {
      /* haptics unavailable */
    }
  }
}

function HighlightedText({ text, term }: { text: string; term: string }) {
  const needle = term.trim();
  if (needle.length < 2) return <>{text}</>;
  const parts: Array<{ value: string; hit: boolean }> = [];
  const lower = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let cursor = 0;
  let found = lower.indexOf(lowerNeedle);
  while (found !== -1) {
    if (found > cursor) parts.push({ value: text.slice(cursor, found), hit: false });
    parts.push({ value: text.slice(found, found + needle.length), hit: true });
    cursor = found + needle.length;
    found = lower.indexOf(lowerNeedle, cursor);
  }
  parts.push({ value: text.slice(cursor), hit: false });
  return (
    <>
      {parts.map((part, i) =>
        part.hit ? (
          <mark key={i} className="search-hit">
            {part.value}
          </mark>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </>
  );
}

function MessageBubbleImpl({
  message,
  isOwn,
  strings,
  locale,
  rtl,
  replyTarget,
  replyTargetName,
  highlighted,
  searchTerm = "",
  selectionMode,
  selected,
  editing,
  onRetry,
  onReply,
  onOpenMenu,
  onToggleSelect,
  onJumpToReply,
  onOpenImage,
  onSubmitEdit,
  onCancelEdit,
}: Props) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachmentQ = useQuery({
    queryKey: ["chat-attachment", message.attachment_path],
    queryFn: () => signStoragePath("gallery", message.attachment_path),
    enabled: Boolean(message.attachment_path),
    staleTime: 50 * 60 * 1000,
  });

  async function handleTranslate() {
    if (translated) {
      setTranslated(null);
      return;
    }
    setTranslating(true);
    try {
      const { translateText } = await import("@/lib/ai/translate.functions");
      const result = await translateText({ data: { text: message.body, targetLanguage: locale } });
      setTranslated(result.text);
    } catch {
      /* ignore translation failures silently */
    } finally {
      setTranslating(false);
    }
  }

  const time = new Date(message.created_at).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isEmojiOnly =
    Boolean(message.body) &&
    message.kind === "text" &&
    message.body.trim().length <= 8 &&
    /^\p{Extended_Pictographic}(\p{Extended_Pictographic}|\uFE0F|\u200D)*$/u.test(message.body.trim());

  function clearLongPress() {
    if (longPress.current) {
      clearTimeout(longPress.current);
      longPress.current = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (editing) return;
    const touch = e.touches[0];
    if (!touch) return;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    clearLongPress();
    longPress.current = setTimeout(() => {
      vibrate();
      onOpenMenu?.({ x: touch.clientX, y: touch.clientY });
      startX.current = null;
    }, 480);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch || startX.current == null || startY.current == null) return;
    const dx = touch.clientX - startX.current;
    const dy = touch.clientY - startY.current;
    if (Math.abs(dy) > Math.abs(dx)) {
      clearLongPress();
      return;
    }
    if (Math.abs(dx) > 6) clearLongPress();
    // Reply gesture pulls toward the reading direction start edge.
    const directional = rtl ? -dx : dx;
    if (directional <= 0) return;
    setSwiping(true);
    setOffset(Math.min(72, directional) * (rtl ? -1 : 1));
  }

  function handleTouchEnd() {
    clearLongPress();
    const travelled = Math.abs(offset);
    setSwiping(false);
    setOffset(0);
    startX.current = null;
    startY.current = null;
    if (travelled >= SWIPE_TRIGGER && !message.deleted_at) {
      vibrate();
      onReply?.();
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit?.();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmitEdit?.(draft.trim());
    }
  }

  const bodyText = translated ?? message.body;

  return (
    <div
      className={`msg-window relative flex items-center ${isOwn ? "justify-end" : "justify-start"} ${
        highlighted ? "msg-highlight" : ""
      } ${selected ? "rounded-2xl bg-gold/10" : ""}`}
      onContextMenu={(e) => {
        if (editing) return;
        e.preventDefault();
        onOpenMenu?.({ x: e.clientX, y: e.clientY });
      }}
      onClick={() => {
        if (selectionMode) onToggleSelect?.();
      }}
    >
      {Math.abs(offset) > 12 && (
        <span
          aria-hidden
          className={`absolute ${rtl ? "end-2" : "start-2"} grid h-8 w-8 place-items-center rounded-full bg-gold/20 text-gold`}
          style={{ opacity: Math.min(1, Math.abs(offset) / SWIPE_TRIGGER) }}
        >
          <CornerUpLeft className="h-4 w-4 rtl:-scale-x-100" />
        </span>
      )}
      {selectionMode && (
        <span
          aria-hidden
          className={`me-2 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
            selected ? "border-gold bg-gold text-navy-deep" : "border-cream/35"
          }`}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
      )}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
        className={`swipe-row ${swiping ? "swipe-row-active" : ""} max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isOwn ? "bubble-out msg-enter-out" : "bubble-in msg-enter-in"
        }`}
      >
        {replyTarget && !message.deleted_at && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onJumpToReply?.(replyTarget.id);
            }}
            className={`mb-1.5 flex w-full items-center gap-2 rounded-lg border-s-2 px-2 py-1.5 text-start text-[11px] ${
              isOwn ? "border-s-white/70 bg-white/12" : "border-s-gold bg-cream/8"
            }`}
          >
            {replyTarget.kind === "image" ? (
              <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
            ) : replyTarget.kind === "file" ? (
              <FileText className="h-3.5 w-3.5 shrink-0 opacity-80" />
            ) : null}
            <span className="min-w-0">
              <span className="block font-semibold opacity-90">{replyTargetName ?? ""}</span>
              <span className="block truncate opacity-75">
                {replyTarget.deleted_at
                  ? strings.deleted
                  : replyTarget.body ||
                    (replyTarget.kind === "image" ? strings.photoMessage : strings.fileMessage)}
              </span>
            </span>
          </button>
        )}

        {message.deleted_at ? (
          <p className="italic">{strings.deleted}</p>
        ) : editing ? (
          <div className="w-[min(70vw,20rem)]">
            <textarea
              autoFocus
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleEditKeyDown}
              aria-label={strings.editMessage}
              maxLength={2000}
              className="w-full resize-none rounded-lg border border-white/40 bg-navy-deep/30 px-2 py-1.5 text-sm text-white outline-none"
            />
            <div className="mt-1.5 flex justify-end gap-2 text-[11px]">
              <button type="button" onClick={onCancelEdit} className="rounded px-2 py-1 underline">
                {strings.cancel}
              </button>
              <button
                type="button"
                onClick={() => onSubmitEdit?.(draft.trim())}
                className="rounded bg-white/90 px-2.5 py-1 font-semibold text-navy-deep"
              >
                {strings.saveEdit}
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.kind === "image" && attachmentQ.data && (
              <button
                type="button"
                aria-label={strings.openImage}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!selectionMode) onOpenImage?.();
                }}
                className="block w-full"
              >
                <img
                  src={attachmentQ.data}
                  alt={message.attachment_name ?? ""}
                  loading="lazy"
                  className="mb-1.5 max-h-64 w-full rounded-lg object-cover"
                />
              </button>
            )}
            {message.kind === "file" && attachmentQ.data && (
              <a
                href={attachmentQ.data}
                target="_blank"
                rel="noreferrer"
                download={message.attachment_name ?? undefined}
                className={`mb-1.5 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                  isOwn ? "border-navy-deep/30" : "border-gold/25"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{message.attachment_name ?? strings.fileMessage}</span>
                <Download className="h-3.5 w-3.5 shrink-0" />
              </a>
            )}
            {message.body && (
              <p
                className={`whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
                  isEmojiOnly ? "text-center text-3xl leading-tight" : ""
                }`}
              >
                <HighlightedText text={bodyText} term={searchTerm} />
              </p>
            )}
          </>
        )}

        <div
          className={`mt-1 flex items-center gap-1.5 text-[10px] ${
            isOwn ? "bubble-meta-out justify-end" : "bubble-meta-in"
          }`}
        >
          {!message.deleted_at && message.kind === "text" && message.body && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void handleTranslate();
              }}
              className="flex items-center gap-1 underline-offset-2 transition-opacity hover:opacity-100 focus-visible:underline"
            >
              {translating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Languages className="h-3 w-3" />
              )}
              {translated ? strings.showOriginal : strings.translate}
            </button>
          )}
          {message.pinned_at && !message.deleted_at && <Pin className="h-3 w-3" />}
          {message.edited_at && !message.deleted_at && <span>{strings.edited}</span>}
          <span>{time}</span>
          {isOwn && !message.pending && !message.failed && (
            <span>
              {message.read_at ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : message.delivered_at ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
          {message.pending && <Loader2 className="h-3 w-3 animate-spin" />}
          {message.failed && onRetry && (
            <button type="button" onClick={onRetry} className="underline">
              {strings.retrySend}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
