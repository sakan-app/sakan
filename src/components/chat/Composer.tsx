import { Loader2, Paperclip, Send } from "lucide-react";
import { useRef, useState } from "react";

import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { useAuth } from "@/hooks/useAuth";
import { uploadChatAttachment } from "@/lib/chat/queries";
import type { ChatStrings } from "@/lib/chat/strings";
import { MAX_IMAGE_BYTES } from "@/lib/validation";

const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type ComposerProps = {
  strings: ChatStrings;
  onSendText: (body: string) => void;
  onSendAttachment: (args: {
    kind: "image" | "file";
    attachmentPath: string;
    attachmentName: string;
    attachmentSize: number;
    attachmentMime: string;
  }) => void;
  onTyping: () => void;
  disabled?: boolean;
};

export function Composer({ strings, onSendText, onSendAttachment, onTyping, disabled }: ComposerProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function handleSend() {
    const body = text.trim();
    if (!body || disabled) return;
    onSendText(body);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setError(null);

    if (file.size > MAX_IMAGE_BYTES) {
      setError(strings.attachmentTooLarge);
      return;
    }
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      setError(strings.attachmentInvalidType);
      return;
    }

    setUploading(true);
    try {
      const path = await uploadChatAttachment(user.id, file);
      onSendAttachment({
        kind: file.type.startsWith("image/") ? "image" : "file",
        attachmentPath: path,
        attachmentName: file.name,
        attachmentSize: file.size,
        attachmentMime: file.type,
      });
    } catch {
      setError(strings.attachmentFailed);
    } finally {
      setUploading(false);
    }
  }

  const remaining = 2000 - text.length;

  return (
    <div className="sticky bottom-0 z-10 border-t border-gold/15 bg-navy-deep px-3 py-2.5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-2.5">
      {error && (
        <p role="alert" className="mb-1.5 text-[11px] text-red-400">
          {error}
        </p>
      )}
      <div className="flex items-end gap-2">
        <EmojiPicker onSelect={(emoji) => setText((prev) => prev + emoji)} />
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_ATTACHMENT_TYPES.join(",")}
          className="hidden"
          onChange={(e) => void handleFilePick(e)}
        />
        <button
          type="button"
          aria-label={strings.attach}
          disabled={uploading || disabled}
          onClick={() => fileInputRef.current?.click()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gold/80 hover:bg-gold/10 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          placeholder={strings.writeMessage}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            autoGrow(e.target);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          aria-label={strings.writeMessage}
          className="field-navy max-h-40 flex-1 resize-none py-2 text-sm"
        />
        <button
          type="button"
          aria-label={strings.send}
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="btn-gold tap-scale grid h-9 w-9 shrink-0 place-items-center rounded-full p-0 transition-transform disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      {remaining <= 200 && (
        <p aria-live="polite" className="mt-1 text-end text-[10px] tabular-nums text-cream/45">
          {remaining}
        </p>
      )}
    </div>
  );
}
