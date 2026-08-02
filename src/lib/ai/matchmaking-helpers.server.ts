// Server-only helpers for matchmaking.functions.ts.
import type { Locale } from "@/i18n";
import { chatCompletion, parseJsonContent, GatewayError } from "@/lib/ai/gateway.server";
import {
  buildCompatibilityMessages,
  buildBatchRecommendationMessages,
  compatibilitySchema,
  batchCompatibilitySchema,
  type CompatibilityProfile,
} from "@/lib/ai/prompts";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type ProfileRow = {
  id: string;
  display_name: string;
  birth_date: string | null;
  gender: string | null;
  looking_for: string | null;
  country_code: string | null;
  city: string | null;
  bio: string | null;
  interests: string[] | null;
  occupation: string | null;
  education: string | null;
  marital_status: string | null;
  religiosity: string | null;
};

function ageOf(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  return Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function toCompatibilityProfile(row: ProfileRow): CompatibilityProfile {
  return {
    displayName: row.display_name,
    age: ageOf(row.birth_date),
    gender: row.gender,
    city: row.city,
    countryCode: row.country_code,
    bio: row.bio,
    interests: row.interests ?? [],
    occupation: row.occupation,
    education: row.education,
    maritalStatus: row.marital_status,
    religiosity: row.religiosity,
  };
}

export type CompatibilityScoreRow = {
  id: string;
  user_id: string;
  candidate_id: string;
  score: number;
  summary: string | null;
  strengths: string[];
  considerations: string[];
  language: string;
  created_at: string;
};

export function isFresh(row: { created_at: string }): boolean {
  return Date.now() - new Date(row.created_at).getTime() < SEVEN_DAYS_MS;
}

export async function scoreOne(
  me: CompatibilityProfile,
  candidate: CompatibilityProfile,
  language: Locale,
): Promise<{ score: number; summary: string; strengths: string[]; considerations: string[] }> {
  const { content } = await chatCompletion({
    messages: buildCompatibilityMessages(me, candidate, language),
    jsonSchema: compatibilitySchema,
  });
  const parsed = parseJsonContent<{
    score: number;
    summary: string;
    strengths: string[];
    considerations: string[];
  }>(content);
  if (!parsed) throw new GatewayError("failed", "Could not parse compatibility response.");
  return {
    score: Math.max(0, Math.min(100, Math.round(parsed.score))),
    summary: parsed.summary ?? "",
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : [],
    considerations: Array.isArray(parsed.considerations) ? parsed.considerations.slice(0, 3) : [],
  };
}

export async function scoreBatch(
  me: CompatibilityProfile,
  candidates: Array<CompatibilityProfile & { id: string }>,
  language: Locale,
): Promise<Array<{ candidateId: string; score: number; reason: string }>> {
  if (candidates.length === 0) return [];
  const { content } = await chatCompletion({
    messages: buildBatchRecommendationMessages(me, candidates, language),
    jsonSchema: batchCompatibilitySchema,
  });
  const parsed = parseJsonContent<{
    results: Array<{ candidateId: string; score: number; reason: string }>;
  }>(content);
  if (!parsed || !Array.isArray(parsed.results)) {
    throw new GatewayError("failed", "Could not parse batch compatibility response.");
  }
  return parsed.results.map((r) => ({
    candidateId: r.candidateId,
    score: Math.max(0, Math.min(100, Math.round(r.score))),
    reason: r.reason ?? "",
  }));
}

export function gatewayErrorToMessage(error: unknown): string {
  if (error instanceof GatewayError) return error.kind;
  return "failed";
}

export async function generateOpeners(
  me: CompatibilityProfile,
  candidate: CompatibilityProfile,
  language: Locale,
): Promise<string[]> {
  const { buildOpenerMessages, openerSchema } = await import("@/lib/ai/prompts");
  const { content } = await chatCompletion({
    messages: buildOpenerMessages(me, candidate, language),
    jsonSchema: openerSchema,
  });
  const parsed = parseJsonContent<{ openers: string[] }>(content);
  if (!parsed || !Array.isArray(parsed.openers)) {
    throw new GatewayError("failed", "Could not parse openers response.");
  }
  return parsed.openers.slice(0, 3);
}
