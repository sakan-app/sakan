/**
 * Minimal Stripe REST client.
 *
 * The Worker runtime has fetch + Web Crypto, so we talk to the Stripe API
 * directly instead of bundling the Node SDK.
 */

const API = "https://api.stripe.com/v1";

export function stripeKey(): string | null {
  const key = process.env["STRIPE_SECRET_KEY"];
  return key && key.startsWith("sk_") ? key : null;
}

export function stripeIsLive(): boolean {
  return stripeKey()?.startsWith("sk_live_") ?? false;
}

/** Flattens nested objects/arrays into Stripe's bracketed form encoding. */
export function encodeForm(input: Record<string, unknown>, prefix = ""): string {
  const parts: string[] = [];
  for (const [rawKey, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    const key = prefix ? `${prefix}[${rawKey}]` : rawKey;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item && typeof item === "object") {
          parts.push(encodeForm(item as Record<string, unknown>, `${key}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (typeof value === "object") {
      parts.push(encodeForm(value as Record<string, unknown>, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

export async function stripeRequest<T = Record<string, unknown>>(
  path: string,
  body?: Record<string, unknown>,
  method: "GET" | "POST" | "DELETE" = "POST",
): Promise<T> {
  const key = stripeKey();
  if (!key) throw new Error("stripe_not_configured");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2024-06-20",
    },
    body: body ? encodeForm(body) : null,
  });
  const json = (await res.json()) as { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `stripe_error_${res.status}`);
  }
  return json as T;
}

/** Constant-time-ish comparison of two hex strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verifies the `Stripe-Signature` header (scheme v1, HMAC-SHA256 over
 * `${timestamp}.${payload}`) and returns the parsed event.
 */
export async function verifyStripeEvent(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
): Promise<Record<string, unknown>> {
  if (!header) throw new Error("missing_signature");
  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const [k, ...rest] = piece.trim().split("=");
      return [k, rest.join("=")];
    }),
  ) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) throw new Error("malformed_signature");

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(parts.t));
  if (!Number.isFinite(age) || age > toleranceSeconds) throw new Error("signature_expired");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${parts.t}.${payload}`),
  );
  if (!safeEqual(toHex(mac), parts.v1)) throw new Error("invalid_signature");
  return JSON.parse(payload) as Record<string, unknown>;
}