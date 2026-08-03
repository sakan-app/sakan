import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";

import { useFeatureStrings } from "@/i18n/feature";
import { aiAssistStrings } from "@/lib/ai/assist-strings";
import { improveMyBio } from "@/lib/ai/coaching.functions";

/** AI rewrite helper shown under the bio field in profile editing. */
export function BioAssistant({ onApply }: { onApply: (bio: string) => void }) {
  const s = useFeatureStrings(aiAssistStrings);
  const mutation = useMutation({ mutationFn: async () => await improveMyBio() });

  return (
    <div className="mt-2 rounded-2xl border border-gold/20 bg-navy-deep/40 p-3 backdrop-blur" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-gold">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {s.bioTitle}
        </span>
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="tap-scale inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1.5 text-xs font-medium text-gold disabled:opacity-60"
        >
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {mutation.isPending ? s.loading : s.bioAction}
        </button>
      </div>

      {mutation.isError && <p className="mt-2 text-xs text-destructive">{s.error}</p>}

      {mutation.isSuccess && (
        <div className="mt-3 space-y-2">
          <p className="whitespace-pre-wrap rounded-xl bg-background/40 p-3 text-sm text-foreground">
            {mutation.data.bio}
          </p>
          {mutation.data.notes.length > 0 && (
            <ul className="list-inside list-disc text-xs text-muted-foreground">
              {mutation.data.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onApply(mutation.data.bio);
                mutation.reset();
              }}
              className="tap-scale rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-navy-deep"
            >
              {s.bioApply}
            </button>
            <button
              type="button"
              onClick={() => mutation.reset()}
              className="tap-scale rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground"
            >
              {s.bioDismiss}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
