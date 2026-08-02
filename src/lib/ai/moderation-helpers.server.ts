// Server-only helpers for moderation.functions.ts (kept out of that module's
// scope per the *.functions.ts module-scope rule).
import { chatCompletion, parseJsonContent, GatewayError } from "@/lib/ai/gateway.server";
import {
  buildModerateTextMessages,
  buildModerateImageMessages,
  moderationSchema,
} from "@/lib/ai/prompts";

export type ModerationVerdict = "approved" | "flagged" | "rejected";
export type ModerationResult = {
  verdict: ModerationVerdict;
  categories: string[];
  score: number;
  reason: string;
};

function normalize(raw: unknown): ModerationResult {
  const r = raw as Partial<ModerationResult> | null;
  const verdict: ModerationVerdict =
    r?.verdict === "flagged" || r?.verdict === "rejected" ? r.verdict : "approved";
  return {
    verdict,
    categories: Array.isArray(r?.categories) ? r!.categories!.filter((c) => typeof c === "string") : [],
    score: typeof r?.score === "number" ? r.score : 0,
    reason: typeof r?.reason === "string" ? r.reason : "",
  };
}

export async function runTextModeration(text: string, subject: string): Promise<ModerationResult> {
  const { content } = await chatCompletion({
    messages: buildModerateTextMessages(text, subject),
    jsonSchema: moderationSchema,
  });
  const parsed = parseJsonContent<ModerationResult>(content);
  if (!parsed) throw new GatewayError("failed", "Could not parse moderation response.");
  return normalize(parsed);
}

export async function runImageModeration(imageUrl: string): Promise<ModerationResult> {
  const { content } = await chatCompletion({
    messages: buildModerateImageMessages(imageUrl),
    jsonSchema: moderationSchema,
  });
  const parsed = parseJsonContent<ModerationResult>(content);
  if (!parsed) throw new GatewayError("failed", "Could not parse moderation response.");
  return normalize(parsed);
}

export async function persistModerationFlag(params: {
  userId: string;
  subjectType: "message" | "bio" | "name" | "other" | "avatar" | "gallery";
  subjectId?: string | null;
  result: ModerationResult;
  excerpt?: string | null;
}) {
  if (params.result.verdict === "approved") return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("moderation_flags").insert({
    user_id: params.userId,
    subject_type: params.subjectType,
    subject_id: params.subjectId ?? null,
    verdict: params.result.verdict,
    categories: params.result.categories,
    score: params.result.score,
    excerpt: params.excerpt ?? null,
    reason: params.result.reason,
  });
}

export function gatewayErrorToMessage(error: unknown): string {
  if (error instanceof GatewayError) return error.kind;
  return "failed";
}
