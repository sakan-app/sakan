import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Locale } from "@/i18n";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit.server";
import {
  toCompatibilityProfile,
  isFresh,
  scoreOne,
  scoreBatch,
  gatewayErrorToMessage,
  type ProfileRow,
  type CompatibilityScoreRow,
} from "@/lib/ai/matchmaking-helpers.server";

const PROFILE_COLS =
  "id, display_name, birth_date, gender, looking_for, country_code, city, bio, interests, occupation, education, marital_status, religiosity, preferred_language, is_active, is_hidden, looking_for";

const scoreCompatibilityInput = z.object({ candidateId: z.string().uuid() });

export const scoreCompatibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(scoreCompatibilityInput)
  .handler(async ({ data, context }): Promise<CompatibilityScoreRow> => {
    try {
      await enforceRateLimit(`ai:${context.userId}`, 20, 60_000);
      const { assertCandidateVisible } = await import("@/lib/ai/visibility.server");
      await assertCandidateVisible(context.userId, data.candidateId);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: meRow, error: meErr } = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_COLS)
        .eq("id", context.userId)
        .maybeSingle();
      if (meErr || !meRow) throw new Error("failed");
      const language = (meRow.preferred_language ?? "ar") as Locale;

      const { data: existing } = await supabaseAdmin
        .from("compatibility_scores")
        .select("*")
        .eq("user_id", context.userId)
        .eq("candidate_id", data.candidateId)
        .eq("language", language)
        .maybeSingle();
      if (existing && isFresh(existing as CompatibilityScoreRow)) {
        return existing as CompatibilityScoreRow;
      }

      const { data: candidateRow, error: candErr } = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_COLS)
        .eq("id", data.candidateId)
        .maybeSingle();
      if (candErr || !candidateRow) throw new Error("failed");

      const result = await scoreOne(
        toCompatibilityProfile(meRow as ProfileRow),
        toCompatibilityProfile(candidateRow as ProfileRow),
        language,
      );

      const { data: saved, error: upsertErr } = await supabaseAdmin
        .from("compatibility_scores")
        .upsert(
          {
            user_id: context.userId,
            candidate_id: data.candidateId,
            score: result.score,
            summary: result.summary,
            strengths: result.strengths,
            considerations: result.considerations,
            language,
          },
          { onConflict: "user_id,candidate_id,language" },
        )
        .select("*")
        .single();
      if (upsertErr || !saved) throw new Error("failed");
      return saved as CompatibilityScoreRow;
    } catch (error) {
      if (error instanceof RateLimitError) throw error;
      throw new Error(gatewayErrorToMessage(error));
    }
  });

const recommendMatchesInput = z.object({ limit: z.number().int().min(1).max(20).default(6) });

export const recommendMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(recommendMatchesInput)
  .handler(async ({ data, context }): Promise<{ items: Array<{ candidateId: string; score: number; reason: string }> }> => {
    try {
      await enforceRateLimit(`ai:${context.userId}`, 20, 60_000);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: meRow, error: meErr } = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_COLS)
        .eq("id", context.userId)
        .maybeSingle();
      if (meErr || !meRow) throw new Error("failed");
      const language = (meRow.preferred_language ?? "ar") as Locale;

      const [{ data: likedRows }, { data: blockedRows }] = await Promise.all([
        supabaseAdmin.from("likes").select("liked_id").eq("liker_id", context.userId),
        supabaseAdmin
          .from("blocked_users")
          .select("blocked_id, blocker_id")
          .or(`blocker_id.eq.${context.userId},blocked_id.eq.${context.userId}`),
      ]);
      const excludeIds = new Set<string>([
        context.userId,
        ...(likedRows ?? []).map((r) => r.liked_id),
        ...(blockedRows ?? []).flatMap((r) => [r.blocker_id, r.blocked_id]),
      ]);

      let query = supabaseAdmin
        .from("profiles")
        .select(PROFILE_COLS)
        .eq("is_active", true)
        .eq("is_hidden", false)
        .limit(30);
      if (meRow.looking_for) query = query.eq("gender", meRow.looking_for);
      const { data: candidateRows, error: candErr } = await query;
      if (candErr) throw new Error("failed");

      const candidates = (candidateRows ?? []).filter((c) => !excludeIds.has(c.id));
      if (candidates.length === 0) return { items: [] as Array<{ candidateId: string; score: number; reason: string }> };

      const scored = await scoreBatch(
        toCompatibilityProfile(meRow as ProfileRow),
        candidates.map((c) => ({ id: c.id, ...toCompatibilityProfile(c as ProfileRow) })),
        language,
      );
      const top = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, data.limit);
      return { items: top };
    } catch (error) {
      if (error instanceof RateLimitError) throw error;
      throw new Error(gatewayErrorToMessage(error));
    }
  });
