import { Smile } from "lucide-react";
import { useState } from "react";

const EMOJIS = [
  "😀", "😂", "🥰", "😍", "😘", "😊", "😉", "😢", "😭", "😅",
  "❤️", "💛", "💍", "🌹", "🎉", "👍", "🙏", "😴", "🤔", "😎",
];

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full text-gold/80 hover:bg-gold/10"
        aria-label="emoji"
      >
        <Smile className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute bottom-11 z-20 grid w-52 grid-cols-5 gap-1 rounded-xl border border-gold/25 bg-navy-deep p-2 shadow-[var(--shadow-card)]">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onSelect(e);
                setOpen(false);
              }}
              className="grid h-8 w-8 place-items-center rounded-lg text-lg hover:bg-gold/15"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
