// Prompt builders and constants for AI features. Kept out of *.functions.ts
// files so those modules only contain server-function declarations.
import type { Locale } from "@/i18n";

export const DEFAULT_AI_MODEL = "google/gemini-3-flash-preview";

export const LANGUAGE_NAMES: Record<Locale, string> = {
  ar: "Arabic",
  en: "English",
  de: "German",
  fr: "French",
};

export type CompatibilityProfile = {
  displayName: string;
  age: number | null;
  gender: string | null;
  city: string | null;
  countryCode: string | null;
  bio: string | null;
  interests: string[];
  occupation: string | null;
  education: string | null;
  maritalStatus: string | null;
  religiosity: string | null;
};

export const compatibilitySchema = {
  name: "compatibility_result",
  schema: {
    type: "object",
    properties: {
      score: { type: "number" },
      summary: { type: "string" },
      strengths: { type: "array", items: { type: "string" } },
      considerations: { type: "array", items: { type: "string" } },
    },
    required: ["score", "summary", "strengths", "considerations"],
    additionalProperties: false,
  },
} as const;

function describeProfile(p: CompatibilityProfile): string {
  return [
    `Name: ${p.displayName}`,
    `Age: ${p.age ?? "unknown"}`,
    `Gender: ${p.gender ?? "unknown"}`,
    `Location: ${[p.city, p.countryCode].filter(Boolean).join(", ") || "unknown"}`,
    `Occupation: ${p.occupation ?? "unknown"}`,
    `Education: ${p.education ?? "unknown"}`,
    `Marital status: ${p.maritalStatus ?? "unknown"}`,
    `Religiosity: ${p.religiosity ?? "unknown"}`,
    `Interests: ${p.interests.join(", ") || "none listed"}`,
    `Bio: ${p.bio ?? "none"}`,
  ].join("\n");
}

export function buildCompatibilityMessages(
  me: CompatibilityProfile,
  candidate: CompatibilityProfile,
  language: Locale,
) {
  const langName = LANGUAGE_NAMES[language];
  return [
    {
      role: "system" as const,
      content:
        "You are a marriage-oriented matchmaking assistant for a serious, respectful matrimonial platform called SAKAN. " +
        "Given two anonymized user profiles, evaluate their compatibility as potential marriage partners. " +
        `Respond ONLY with strict JSON matching the given schema, and write every text field in ${langName}. ` +
        "Be warm, respectful and realistic. Do not invent facts not present in the profiles.",
    },
    {
      role: "user" as const,
      content:
        `Profile A (the requester):\n${describeProfile(me)}\n\n` +
        `Profile B (the candidate):\n${describeProfile(candidate)}\n\n` +
        "Score compatibility from 0 to 100, write a short summary (2-3 sentences), " +
        "list up to 4 strengths and up to 3 considerations (things worth discussing).",
    },
  ];
}

export const batchCompatibilitySchema = {
  name: "batch_compatibility_result",
  schema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            candidateId: { type: "string" },
            score: { type: "number" },
            reason: { type: "string" },
          },
          required: ["candidateId", "score", "reason"],
          additionalProperties: false,
        },
      },
    },
    required: ["results"],
    additionalProperties: false,
  },
} as const;

export function buildBatchRecommendationMessages(
  me: CompatibilityProfile,
  candidates: Array<CompatibilityProfile & { id: string }>,
  language: Locale,
) {
  const langName = LANGUAGE_NAMES[language];
  const list = candidates
    .map((c) => `Candidate ID: ${c.id}\n${describeProfile(c)}`)
    .join("\n\n---\n\n");
  return [
    {
      role: "system" as const,
      content:
        "You are a marriage-oriented matchmaking assistant for the serious matrimonial platform SAKAN. " +
        "Score each candidate's compatibility with the requester from 0 to 100 and give one short, warm, one-line reason per candidate. " +
        `Respond ONLY with strict JSON matching the given schema, and write every reason in ${langName}.`,
    },
    {
      role: "user" as const,
      content: `Requester profile:\n${describeProfile(me)}\n\nCandidates:\n\n${list}`,
    },
  ];
}

export const translateSchema = {
  name: "translation_result",
  schema: {
    type: "object",
    properties: { text: { type: "string" } },
    required: ["text"],
    additionalProperties: false,
  },
} as const;

export function buildTranslateMessages(text: string, targetLanguage: Locale) {
  const langName = LANGUAGE_NAMES[targetLanguage];
  return [
    {
      role: "system" as const,
      content:
        `You are a precise translator. Translate the user's message into ${langName}. ` +
        "Preserve line breaks, emoji and formatting exactly. " +
        "If the text is already written in the target language, return it unchanged. " +
        "Respond ONLY with strict JSON matching the given schema.",
    },
    { role: "user" as const, content: text },
  ];
}

export const moderationSchema = {
  name: "moderation_result",
  schema: {
    type: "object",
    properties: {
      verdict: { type: "string", enum: ["approved", "flagged", "rejected"] },
      categories: { type: "array", items: { type: "string" } },
      score: { type: "number" },
      reason: { type: "string" },
    },
    required: ["verdict", "categories", "score", "reason"],
    additionalProperties: false,
  },
} as const;

const SUBJECT_HINTS: Record<string, string> = {
  message: "a private chat message between two matrimonial platform members",
  bio: "a public profile biography on a matrimonial platform",
  name: "a public display name on a matrimonial platform",
  other: "user-generated text on a matrimonial platform",
};

export function buildModerateTextMessages(text: string, subject: string) {
  const hint = SUBJECT_HINTS[subject] ?? SUBJECT_HINTS["other"];
  return [
    {
      role: "system" as const,
      content:
        `You are a strict content moderator for a respectful, family-oriented matrimonial platform. ` +
        `Review ${hint} for spam, harassment, toxicity, sexual content, scams, and violence. ` +
        '"approved" = clean. "flagged" = borderline, needs human review. "rejected" = clearly violates policy and must be blocked. ' +
        "Respond ONLY with strict JSON matching the given schema, in English, with a score from 0 (safe) to 1 (severe violation).",
    },
    { role: "user" as const, content: text },
  ];
}

export function buildModerateImageMessages(imageUrl: string) {
  return [
    {
      role: "system" as const,
      content:
        "You are a strict content moderator for a respectful, family-oriented matrimonial platform. " +
        "Review the attached photo for nudity, sexual content, violence, hate symbols or other policy violations. " +
        '"approved" = clean. "flagged" = borderline, queue for human review. "rejected" = clearly violates policy and must be blocked. ' +
        "Respond ONLY with strict JSON matching the given schema, in English, with a score from 0 (safe) to 1 (severe violation).",
    },
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: "Please moderate this image." },
        { type: "image_url" as const, image_url: { url: imageUrl } },
      ],
    },
  ];
}

export const openerSchema = {
  name: "conversation_openers",
  schema: {
    type: "object",
    properties: {
      openers: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
    },
    required: ["openers"],
    additionalProperties: false,
  },
} as const;

export function buildOpenerMessages(
  me: CompatibilityProfile,
  candidate: CompatibilityProfile,
  language: Locale,
) {
  const langName = LANGUAGE_NAMES[language];
  return [
    {
      role: "system" as const,
      content:
        "You write short, warm, respectful conversation openers for a serious matrimonial platform called SAKAN. " +
        "Given the requester's profile and a candidate's profile, suggest 3 distinct opening messages the requester could send. " +
        "Each should reference something concrete from the candidate's profile (interests, occupation, bio), stay under 220 characters, " +
        "and respect a modest, family-oriented tone. " +
        `Respond ONLY with strict JSON matching the given schema, and write every opener in ${langName}.`,
    },
    {
      role: "user" as const,
      content: `Requester profile:\n${describeProfile(me)}\n\nCandidate profile:\n${describeProfile(candidate)}`,
    },
  ];
}

export const profileQualitySchema = {
  name: "profile_quality_suggestions",
  schema: {
    type: "object",
    properties: {
      score: { type: "number" },
      suggestions: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
    },
    required: ["score", "suggestions"],
    additionalProperties: false,
  },
} as const;

export function buildProfileQualityMessages(profile: CompatibilityProfile & { hasPhotos: boolean }, language: Locale) {
  const langName = LANGUAGE_NAMES[language];
  return [
    {
      role: "system" as const,
      content:
        "You are a profile coach for a serious matrimonial platform called SAKAN. " +
        "Review the user's profile and give a completeness/attractiveness score from 0 to 100, " +
        "plus up to 5 short, specific, actionable suggestions to improve it (e.g. add a bio detail, mention interests, add photos). " +
        `Respond ONLY with strict JSON matching the given schema, and write every suggestion in ${langName}.`,
    },
    {
      role: "user" as const,
      content: `${describeProfile(profile)}\nHas at least one photo: ${profile.hasPhotos ? "yes" : "no"}`,
    },
  ];
}

export const suggestionsSchema = {
  name: "suggestions_result",
  schema: {
    type: "object",
    properties: { suggestions: { type: "array", items: { type: "string" } } },
    required: ["suggestions"],
    additionalProperties: false,
  },
} as const;

/** Opening lines for a brand-new conversation with a candidate. */
export function buildIceBreakerMessages(
  me: CompatibilityProfile,
  candidate: CompatibilityProfile,
  language: Locale,
) {
  const langName = LANGUAGE_NAMES[language];
  return [
    {
      role: "system" as const,
      content:
        "You help members of SAKAN, a serious marriage-oriented platform, start respectful conversations. " +
        `Write every suggestion in ${langName}. Respond ONLY with strict JSON matching the schema. ` +
        "Suggestions must be culturally respectful, never flirtatious or physical, one or two sentences each, " +
        "and grounded only in facts present in the profiles.",
    },
    {
      role: "user" as const,
      content:
        `Sender:\n${describeProfile(me)}\n\nRecipient:\n${describeProfile(candidate)}\n\n` +
        "Give exactly 4 opening messages the sender could send.",
    },
  ];
}

/** Short reply options for the last few messages in a conversation. */
export function buildSmartReplyMessages(
  transcript: Array<{ fromMe: boolean; body: string }>,
  language: Locale,
) {
  const langName = LANGUAGE_NAMES[language];
  const lines = transcript
    .map((m) => `${m.fromMe ? "Me" : "Them"}: ${m.body}`)
    .join("\n");
  return [
    {
      role: "system" as const,
      content:
        "You suggest short, polite replies for a member of SAKAN, a serious marriage-oriented platform. " +
        `Write every suggestion in ${langName}. Respond ONLY with strict JSON matching the schema. ` +
        "Each reply is at most 20 words, respectful, and moves the conversation forward.",
    },
    { role: "user" as const, content: `Conversation so far:\n${lines}\n\nGive exactly 3 replies I could send next.` },
  ];
}

export const bioSchema = {
  name: "bio_result",
  schema: {
    type: "object",
    properties: {
      bio: { type: "string" },
      notes: { type: "array", items: { type: "string" } },
    },
    required: ["bio", "notes"],
    additionalProperties: false,
  },
} as const;

/** Rewrites a member bio while keeping every stated fact. */
export function buildBioMessages(profile: CompatibilityProfile, language: Locale) {
  const langName = LANGUAGE_NAMES[language];
  return [
    {
      role: "system" as const,
      content:
        "You improve member bios for SAKAN, a serious marriage-oriented platform. " +
        `Write the bio in ${langName}. Respond ONLY with strict JSON matching the schema. ` +
        "Keep every fact the member stated, invent nothing, stay respectful and modest, " +
        "and keep the bio between 60 and 600 characters. Notes are up to 3 short tips.",
    },
    { role: "user" as const, content: `Member profile:\n${describeProfile(profile)}` },
  ];
}
