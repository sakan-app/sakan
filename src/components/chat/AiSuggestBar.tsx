import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { useFeatureStrings } from "@/i18n/feature";
import { aiAssistStrings } from "@/lib/ai/assist-strings";
import { suggestIceBreakers, suggestSmartReplies } from "@/lib/ai/coaching.functions";

type Props = {
  conversationId: string;
  otherUserId: string;
  /** Ice breakers are used when the conversation has no messages yet. */
  hasMessages: boolean;
  onPick: (text: string) => void;
};

/** One-tap AI opener / reply suggestions rendered above the composer. */
export function AiSuggestBar({ conversationId, otherUserId, hasMessages, onPick }: Props) {
  const s = useFeatureStrings(aiAssistStrings);
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () =>
      hasMessages
        ? await suggestSmartReplies({ data: { conversationId } })
        : await suggestIceBreakers({ data: { candidateId: otherUserId } }),
  });

  if (!open) {
    return (
      <div className="px-3 pt-2">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            mutation.mutate();
          }}
          className="press tap-scale inline-flex items-center gap-2 rounded-full border border-gold/30 bg-navy-deep/60 px-3 py-1.5 text-xs font-medium text-gold backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {s.ideas}
        </button>
      </div>
    );
  }

  return (
    <section className="px-3 pt-2" aria-live="polite" aria-label={s.ideas}>
      <div className="rounded-2xl border border-gold/20 bg-navy-deep/60 p-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-gold">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {s.ideas}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={s.hide}
            className="press tap-scale grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {mutation.isPending && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            {s.loading}
          </p>
        )}
        {mutation.isError && <p className="text-xs text-destructive">{s.error}</p>}
        {mutation.isSuccess && mutation.data.suggestions.length === 0 && (
          <p className="text-xs text-muted-foreground">{s.empty}</p>
        )}

        <div className="list-stagger flex flex-wrap gap-2">
          {(mutation.data?.suggestions ?? []).map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => {
                onPick(text);
                setOpen(false);
              }}
              className="press tap-scale max-w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-start text-xs text-foreground hover:border-gold/40"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
