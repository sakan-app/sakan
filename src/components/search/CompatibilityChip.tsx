import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

import { useFeatureStrings } from "@/i18n/feature";
import { searchStrings } from "@/components/search/strings";

type ScoreState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; kind: "rate_limited" | "payment_required" | "failed" }
  | { status: "done"; score: number };

export function CompatibilityChip({ candidateId }: { candidateId: string }) {
  const s = useFeatureStrings(searchStrings);
  const [state, setState] = useState<ScoreState>({ status: "idle" });

  async function run() {
    setState({ status: "loading" });
    try {
      const { scoreCompatibility } = await import("@/lib/ai/matchmaking.functions");
      const result = await scoreCompatibility({ data: { candidateId } });
      setState({ status: "done", score: result.score });
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed";
      const kind =
        message === "rate_limited" || message === "payment_required" ? message : "failed";
      setState({ status: "error", kind: kind as "rate_limited" | "payment_required" | "failed" });
    }
  }

  if (state.status === "idle") {
    return (
      <button
        type="button"
        onClick={() => void run()}
        className="flex items-center gap-1 rounded-full border border-gold/40 px-2 py-0.5 text-[10px] font-semibold text-gold transition-colors hover:bg-gold/10"
      >
        <Sparkles className="h-3 w-3" /> {s.compat.cta}
      </button>
    );
  }

  if (state.status === "loading") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
        <Loader2 className="h-3 w-3 animate-spin" /> {s.compat.loading}
      </span>
    );
  }

  if (state.status === "error") {
    const text =
      state.kind === "rate_limited"
        ? s.compat.rateLimited
        : state.kind === "payment_required"
          ? s.compat.creditsExhausted
          : s.compat.failed;
    return <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">{text}</span>;
  }

  return (
    <span className="flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy-deep">
      <Sparkles className="h-3 w-3" /> {s.compat.scoreLabel} {state.score}%
    </span>
  );
}
