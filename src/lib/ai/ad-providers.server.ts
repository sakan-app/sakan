/**
 * Server-side AI advertising providers — OpenAI and Anthropic (Claude) only.
 *
 * Keys are read from the server environment inside the call, never shipped to
 * the browser. When a key is missing the module reports `not_configured`; it
 * never fabricates a provider response.
 */
export type AdCopyProvider = "openai" | "anthropic";

export type AdCopyRequest = {
  advertiserName: string;
  brief: string;
  language: "ar" | "en" | "de" | "fr";
  provider?: AdCopyProvider | undefined;
};

export type AdCopyResult =
  | { status: "ok"; provider: AdCopyProvider; headline: string; body: string }
  | { status: "not_configured"; missing: string[] }
  | { status: "provider_error"; provider: AdCopyProvider; code: string };

const OPENAI_KEY = "OPENAI_API_KEY";
const ANTHROPIC_KEY = "ANTHROPIC_API_KEY";

const key = (name: string): string | null => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
};

/** Which providers hold real credentials right now (no secrets returned). */
export function adProviderStatus() {
  return {
    openai: { configured: Boolean(key(OPENAI_KEY)), envVar: OPENAI_KEY, model: "gpt-4o-mini" },
    anthropic: {
      configured: Boolean(key(ANTHROPIC_KEY)),
      envVar: ANTHROPIC_KEY,
      model: "claude-3-5-sonnet-latest",
    },
  };
}

function promptFor(input: AdCopyRequest) {
  return [
    `Write one advertising banner headline and one short body line for a 728x90 banner.`,
    `Advertiser: ${input.advertiserName}`,
    `Brief: ${input.brief}`,
    `Language: ${input.language}`,
    `Rules: family-friendly, no medical, political or adult claims, no invented facts,`,
    `headline max 60 characters, body max 90 characters.`,
    `Answer as JSON: {"headline":"...","body":"..."}`,
  ].join("\n");
}

function parseCopy(text: string): { headline: string; body: string } | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { headline?: unknown; body?: unknown };
    const headline = typeof parsed.headline === "string" ? parsed.headline.trim() : "";
    const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
    if (!headline) return null;
    return { headline, body };
  } catch {
    return null;
  }
}

async function callOpenAi(apiKey: string, input: AdCopyRequest): Promise<AdCopyResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: "You are a concise multilingual advertising copywriter." },
        { role: "user", content: promptFor(input) },
      ],
    }),
  });
  if (!response.ok) {
    console.error("[ad-ai] openai", response.status);
    return { status: "provider_error", provider: "openai", code: `http_${response.status}` };
  }
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const copy = parseCopy(json.choices?.[0]?.message?.content ?? "");
  if (!copy) return { status: "provider_error", provider: "openai", code: "unparsable_response" };
  return { status: "ok", provider: "openai", ...copy };
}

async function callAnthropic(apiKey: string, input: AdCopyRequest): Promise<AdCopyResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 400,
      messages: [{ role: "user", content: promptFor(input) }],
    }),
  });
  if (!response.ok) {
    console.error("[ad-ai] anthropic", response.status);
    return { status: "provider_error", provider: "anthropic", code: `http_${response.status}` };
  }
  const json = (await response.json()) as { content?: { text?: string }[] };
  const copy = parseCopy(json.content?.map((part) => part.text ?? "").join("\n") ?? "");
  if (!copy) return { status: "provider_error", provider: "anthropic", code: "unparsable_response" };
  return { status: "ok", provider: "anthropic", ...copy };
}

/** Generates banner copy with the requested (or first configured) provider. */
export async function generateAdCopy(input: AdCopyRequest): Promise<AdCopyResult> {
  const openAi = key(OPENAI_KEY);
  const anthropic = key(ANTHROPIC_KEY);

  const chosen: AdCopyProvider | null =
    input.provider === "openai" && openAi
      ? "openai"
      : input.provider === "anthropic" && anthropic
        ? "anthropic"
        : input.provider
          ? null
          : openAi
            ? "openai"
            : anthropic
              ? "anthropic"
              : null;

  if (!chosen) {
    const missing: string[] = [];
    if (!openAi) missing.push(OPENAI_KEY);
    if (!anthropic) missing.push(ANTHROPIC_KEY);
    return { status: "not_configured", missing };
  }

  try {
    return chosen === "openai"
      ? await callOpenAi(openAi!, input)
      : await callAnthropic(anthropic!, input);
  } catch (error) {
    console.error("[ad-ai] request failed", chosen, error);
    return { status: "provider_error", provider: chosen, code: "request_failed" };
  }
}
