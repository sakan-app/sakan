// Server-only helper for calling the Lovable AI Gateway. Never import this
// from client code; only from *.server.ts modules or inside server-fn handlers.
import { DEFAULT_AI_MODEL } from "@/lib/ai/prompts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TIMEOUT_MS = 20_000;

export type GatewayMessageContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

export type GatewayMessage = {
  role: "system" | "user" | "assistant";
  content: GatewayMessageContent;
};

export type GatewayErrorKind = "rate_limited" | "payment_required" | "failed";

export class GatewayError extends Error {
  kind: GatewayErrorKind;
  constructor(kind: GatewayErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "GatewayError";
  }
}

async function callOnce(body: Record<string, unknown>, apiKey: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function chatCompletion(options: {
  messages: GatewayMessage[];
  model?: string;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  temperature?: number;
}): Promise<{ content: string }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw new GatewayError("failed", "Missing LOVABLE_API_KEY environment variable.");
  }

  const body: Record<string, unknown> = {
    model: options.model ?? DEFAULT_AI_MODEL,
    messages: options.messages,
    temperature: options.temperature ?? 0.4,
  };
  if (options.jsonSchema) {
    body["response_format"] = {
      type: "json_schema",
      json_schema: { name: options.jsonSchema.name, schema: options.jsonSchema.schema, strict: true },
    };
  }

  let response: Response;
  try {
    response = await callOnce(body, apiKey);
  } catch (error) {
    throw new GatewayError("failed", error instanceof Error ? error.message : "Network error");
  }

  if (response.status >= 500) {
    try {
      response = await callOnce(body, apiKey);
    } catch (error) {
      throw new GatewayError("failed", error instanceof Error ? error.message : "Network error");
    }
  }

  if (response.status === 429) {
    throw new GatewayError("rate_limited", "AI gateway rate limit exceeded.");
  }
  if (response.status === 402) {
    throw new GatewayError("payment_required", "AI gateway credits exhausted.");
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new GatewayError("failed", `AI gateway error ${response.status}: ${text.slice(0, 300)}`);
  }

  const json = (await response.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string } }> }
    | null;
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new GatewayError("failed", "AI gateway returned an empty response.");
  }
  return { content };
}

/** Parses model JSON output defensively, stripping code fences if present. */
export function parseJsonContent<T>(content: string): T | null {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}
