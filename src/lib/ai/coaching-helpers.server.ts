// Server-only helpers for coaching.functions.ts (profile quality suggestions).
import type { Locale } from "@/i18n";
import { chatCompletion, parseJsonContent, GatewayError } from "@/lib/ai/gateway.server";
import { buildProfileQualityMessages, profileQualitySchema, type CompatibilityProfile } from "@/lib/ai/prompts";

export async function scoreProfileQuality(
  profile: CompatibilityProfile & { hasPhotos: boolean },
  language: Locale,
): Promise<{ score: number; suggestions: string[] }> {
  const { content } = await chatCompletion({
    messages: buildProfileQualityMessages(profile, language),
    jsonSchema: profileQualitySchema,
  });
  const parsed = parseJsonContent<{ score: number; suggestions: string[] }>(content);
  if (!parsed) throw new GatewayError("failed", "Could not parse profile quality response.");
  return {
    score: Math.max(0, Math.min(100, Math.round(parsed.score))),
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
  };
}

export function gatewayErrorToMessage(error: unknown): string {
  if (error instanceof GatewayError) return error.kind;
  return "failed";
}
