// Server-only helpers for coaching.functions.ts (profile quality suggestions).
import type { Locale } from "@/i18n";
import { chatCompletion, parseJsonContent, GatewayError } from "@/lib/ai/gateway.server";
import {
  bioSchema,
  buildBioMessages,
  buildProfileQualityMessages,
  profileQualitySchema,
  suggestionsSchema,
  type CompatibilityProfile,
} from "@/lib/ai/prompts";

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

export async function generateSuggestions(
  messages: Parameters<typeof chatCompletion>[0]["messages"],
  limit: number,
): Promise<string[]> {
  const { content } = await chatCompletion({ messages, jsonSchema: suggestionsSchema });
  const parsed = parseJsonContent<{ suggestions: string[] }>(content);
  if (!parsed || !Array.isArray(parsed.suggestions)) {
    throw new GatewayError("failed", "Could not parse suggestions response.");
  }
  return parsed.suggestions.map((s) => String(s).trim()).filter(Boolean).slice(0, limit);
}

export async function improveBio(
  profile: CompatibilityProfile,
  language: Locale,
): Promise<{ bio: string; notes: string[] }> {
  const { content } = await chatCompletion({
    messages: buildBioMessages(profile, language),
    jsonSchema: bioSchema,
  });
  const parsed = parseJsonContent<{ bio: string; notes: string[] }>(content);
  if (!parsed?.bio) throw new GatewayError("failed", "Could not parse bio response.");
  return { bio: parsed.bio.slice(0, 800), notes: Array.isArray(parsed.notes) ? parsed.notes.slice(0, 3) : [] };
}
