import { Check, CheckCheck, Download, FileText, Languages, Loader2 } from "lucide-react";
import { useState } from "react";

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
  onRetry?: () => void;
};

export function MessageBubble({ message, isOwn, strings, locale, onRetry }: Props) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
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

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
          isOwn ? "bg-gradient-gold text-navy-deep" : "panel-navy text-cream"
        }`}
      >
        {message.deleted_at ? (
          <p className="italic opacity-70">{strings.deleted}</p>
        ) : (
          <>
            {message.kind === "image" && attachmentQ.data && (
              <a href={attachmentQ.data} target="_blank" rel="noreferrer">
                <img
                  src={attachmentQ.data}
                  alt={message.attachment_name ?? ""}
                  className="mb-1.5 max-h-64 w-full rounded-lg object-cover"
                />
              </a>
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
            {message.body && <p className="whitespace-pre-wrap break-words">{translated ?? message.body}</p>}
          </>
        )}

        <div
          className={`mt-1 flex items-center gap-1.5 text-[10px] ${
            isOwn ? "justify-end text-navy-deep/70" : "text-cream/50"
          }`}
        >
          {!message.deleted_at && message.kind === "text" && message.body && (
            <button
              type="button"
              onClick={() => void handleTranslate()}
              className="flex items-center gap-1 opacity-80 hover:opacity-100"
            >
              {translating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Languages className="h-3 w-3" />
              )}
              {translated ? strings.showOriginal : strings.translate}
            </button>
          )}
          <span>{time}</span>
          {isOwn && !message.pending && !message.failed && (
            <span>
              {message.read_at ? (
                <CheckCheck className="h-3.5 w-3.5 text-navy-deep" />
              ) : message.delivered_at ? (
                <CheckCheck className="h-3.5 w-3.5 opacity-60" />
              ) : (
                <Check className="h-3.5 w-3.5 opacity-60" />
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
