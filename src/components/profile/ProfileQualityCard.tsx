import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles, Lightbulb } from "lucide-react";

import { useFeatureStrings } from "@/i18n/feature";
import { aiAssistStrings } from "@/lib/ai/assist-strings";
import { suggestProfileQuality } from "@/lib/ai/coaching.functions";
import { haptic } from "@/lib/notifications/shared";

/**
 * AI quality review for the Profile Studio: scores the profile and lists
 * concrete, localized improvements.
 */
export function ProfileQualityCard({ accent }: { accent: string }) {
  const s = useFeatureStrings(aiAssistStrings);
  const mutation = useMutation({
    mutationFn: async () => await suggestProfileQuality(),
    onSuccess: () => haptic([10, 20]),
  });

  return (
    <div aria-live="polite">
      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        className="tap-scale btn-outline-gold inline-flex items-center gap-2 px-4 py-2 text-xs disabled:opacity-60"
      >
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden />
        )}
        {mutation.isPending ? s.loading : s.qualityAction}
      </button>

      {mutation.isError && (
        <p role="alert" className="mt-3 text-xs text-red-300">
          {s.error}
        </p>
      )}

      {mutation.isSuccess && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-cream/70">
            <span>{s.qualityScore}</span>
            <span className="font-bold text-cream">{Math.round(mutation.data.score)}%</span>
          </div>
          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream/10"
            role="progressbar"
            aria-valuenow={Math.round(mutation.data.score)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={s.qualityScore}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${Math.round(mutation.data.score)}%`, backgroundColor: accent }}
            />
          </div>
          <ul className="mt-3 space-y-2">
            {mutation.data.suggestions.map((tip: string) => (
              <li key={tip} className="flex items-start gap-2 text-xs leading-5 text-cream/80">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
