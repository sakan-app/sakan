import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useFeatureStrings } from "@/i18n/feature";
import { MemberCard } from "@/components/MemberCard";
import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_COLUMNS, toMemberViews, type MemberView } from "@/lib/members";
import { searchStrings } from "@/components/search/strings";

type RecommendationItem = { candidateId: string; score: number; reason: string };

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; kind: "rate_limited" | "payment_required" | "failed" }
  | { status: "done"; items: Array<{ member: MemberView; score: number; reason: string }> };

export function AiRecommendations() {
  const { user } = useAuth();
  const s = useFeatureStrings(searchStrings);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>({ status: "idle" });

  if (!user) return null;

  async function load() {
    setState({ status: "loading" });
    try {
      const { recommendMatches } = await import("@/lib/ai/matchmaking.functions");
      const result = await recommendMatches({ data: { limit: 6 } });
      const items = result.items as RecommendationItem[];
      if (items.length === 0) {
        setState({ status: "done", items: [] });
        return;
      }
      const { data: rows, error } = await supabase
        .from("profiles")
        .select(PUBLIC_COLUMNS)
        .in(
          "id",
          items.map((i) => i.candidateId),
        );
      if (error) throw error;
      const members = await toMemberViews(rows ?? []);
      const byId = new Map(members.map((m) => [m.id, m]));
      const merged = items
        .map((i) => {
          const member = byId.get(i.candidateId);
          return member ? { member, score: i.score, reason: i.reason } : null;
        })
        .filter((v): v is { member: MemberView; score: number; reason: string } => Boolean(v));
      setState({ status: "done", items: merged });
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed";
      const kind =
        message === "rate_limited" || message === "payment_required" ? message : "failed";
      setState({ status: "error", kind: kind as "rate_limited" | "payment_required" | "failed" });
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && state.status === "idle") void load();
  }

  return (
    <section className="panel-navy p-4 sm:p-5">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2 text-start"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <span>
            <span className="block text-sm font-bold text-cream">{s.ai.title}</span>
            <span className="block text-[11px] text-cream/55">{s.ai.subtitle}</span>
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gold" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gold" />
        )}
      </button>

      {open && (
        <div className="mt-4">
          {state.status === "loading" && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-cream/70">
              <Loader2 className="h-5 w-5 animate-spin text-gold" /> {s.ai.loading}
            </div>
          )}
          {state.status === "error" && (
            <div className="py-6 text-center text-xs text-red-300">
              {state.kind === "rate_limited"
                ? s.ai.rateLimited
                : state.kind === "payment_required"
                  ? s.ai.creditsExhausted
                  : s.ai.failed}
              <div>
                <button type="button" onClick={() => void load()} className="btn-outline-gold mt-3 px-4 py-1.5 text-xs">
                  {s.ai.retry}
                </button>
              </div>
            </div>
          )}
          {state.status === "done" && state.items.length === 0 && (
            <p className="py-6 text-center text-xs text-cream/60">{s.ai.empty}</p>
          )}
          {state.status === "done" && state.items.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {state.items.map(({ member, score, reason }) => (
                  <div key={member.id} className="flex flex-col gap-1.5">
                    <div className="relative">
                      <MemberCard member={member} />
                      <span className="absolute end-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy-deep">
                        {s.ai.scoreLabel} {score}%
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[11px] text-cream/60">{reason}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center">
                <button type="button" onClick={() => void load()} className="btn-outline-gold px-4 py-1.5 text-xs">
                  {s.ai.refresh}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
