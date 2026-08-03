/**
 * Web Push (RFC 8291 / RFC 8292) implemented on Web Crypto only.
 *
 * The Worker runtime has no Node crypto and no `web-push` package, so the
 * VAPID JWT (ES256) and the aes128gcm payload encryption are built here from
 * `crypto.subtle` primitives.
 *
 * Env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (base64url raw values),
 *      VAPID_SUBJECT (mailto: or https: contact).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  kind?: string;
  lang?: string;
  dir?: "rtl" | "ltr" | "auto";
  icon?: string;
  image?: string;
  badge_count?: number;
  renotify?: boolean;
  require_interaction?: boolean;
};

const encoder = new TextEncoder();

export function vapidConfigured(): boolean {
  return Boolean(process.env["VAPID_PUBLIC_KEY"] && process.env["VAPID_PRIVATE_KEY"]);
}

function b64urlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToB64url(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  view.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** HKDF-SHA256 (extract + expand) as required by RFC 8291. */
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

/** Builds the signed `Authorization: vapid …` header for one push origin. */
async function vapidHeader(audience: string): Promise<string> {
  const publicKey = process.env["VAPID_PUBLIC_KEY"]!;
  const privateKey = process.env["VAPID_PRIVATE_KEY"]!;
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:support@sakan.app";

  const raw = b64urlToBytes(publicKey); // 65-byte uncompressed point
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: bytesToB64url(raw.slice(1, 33)),
    y: bytesToB64url(raw.slice(33, 65)),
    d: privateKey.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    ext: true,
  };
  const signingKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const header = bytesToB64url(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = bytesToB64url(
    encoder.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject,
      }),
    ),
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingKey,
    encoder.encode(`${header}.${claims}`),
  );
  return `vapid t=${header}.${claims}.${bytesToB64url(signature)}, k=${publicKey}`;
}

/** Encrypts the payload for one subscription using aes128gcm. */
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string,
): Promise<Uint8Array> {
  const clientPublic = b64urlToBytes(p256dh);
  const authSecret = b64urlToBytes(auth);

  const serverKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const serverPublic = new Uint8Array(
    await crypto.subtle.exportKey("raw", (serverKeys as CryptoKeyPair).publicKey),
  );
  const clientKey = await crypto.subtle.importKey(
    "raw",
    clientPublic as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey },
      (serverKeys as CryptoKeyPair).privateKey,
      256,
    ),
  );

  // PRK: HKDF over the ECDH secret, keyed by the subscription auth secret.
  const keyInfo = concat(
    encoder.encode("WebPush: info\0"),
    clientPublic,
    serverPublic,
  );
  const ikm = await hkdf(authSecret, sharedSecret, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);

  const aesKey = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, [
    "encrypt",
  ]);
  // 0x02 is the aes128gcm record padding delimiter for the final record.
  const plaintext = concat(encoder.encode(payload), new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as BufferSource, tagLength: 128 },
      aesKey,
      plaintext as BufferSource,
    ),
  );

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096);
  return concat(salt, recordSize, new Uint8Array([serverPublic.length]), serverPublic, ciphertext);
}

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failure_count: number;
};

export type PushAttempt = {
  subscriptionId: string;
  status: number | null;
  outcome: "accepted" | "expired" | "rejected" | "timeout" | "network_error";
};

/** Sends to one endpoint. Returns the HTTP status Stripe-style for logging. */
async function sendToSubscription(
  subscription: SubscriptionRow,
  payload: PushPayload,
): Promise<number> {
  const audience = new URL(subscription.endpoint).origin;
  const [authorization, body] = await Promise.all([
    vapidHeader(audience),
    encryptPayload(JSON.stringify(payload), subscription.p256dh, subscription.auth),
  ]);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
    },
    body: body as BodyInit,
    signal: AbortSignal.timeout(15_000),
  });
  return response.status;
}

/**
 * Fan-out to every active device of a member.
 *
 * 404/410 mean the browser dropped the subscription → it is disabled
 * immediately. Other failures increment a counter and disable the endpoint
 * after five consecutive errors, so dead devices cannot slow down delivery.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{
  sent: number;
  failed: number;
  devices: number;
  skipped: boolean;
  attempts: PushAttempt[];
}> {
  if (!vapidConfigured()) {
    return { sent: 0, failed: 0, devices: 0, skipped: true, attempts: [] };
  }

  const { data } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, failure_count")
    .eq("user_id", userId)
    .is("disabled_at", null);

  const subscriptions = (data ?? []) as SubscriptionRow[];
  let sent = 0;
  let failed = 0;
  const attempts: PushAttempt[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        const status = await sendToSubscription(subscription, payload);
        if (status === 404 || status === 410) {
          failed += 1;
          attempts.push({ subscriptionId: subscription.id, status, outcome: "expired" });
          await supabaseAdmin
            .from("push_subscriptions")
            .update({ disabled_at: new Date().toISOString() })
            .eq("id", subscription.id);
          return;
        }
        if (status >= 200 && status < 300) {
          sent += 1;
          attempts.push({ subscriptionId: subscription.id, status, outcome: "accepted" });
          await supabaseAdmin
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString(), failure_count: 0 })
            .eq("id", subscription.id);
          return;
        }
        attempts.push({ subscriptionId: subscription.id, status, outcome: "rejected" });
        throw new Error(`push_status_${status}`);
      } catch (error) {
        failed += 1;
        if (!attempts.some((attempt) => attempt.subscriptionId === subscription.id)) {
          attempts.push({
            subscriptionId: subscription.id,
            status: null,
            outcome: error instanceof DOMException && error.name === "TimeoutError"
              ? "timeout"
              : "network_error",
          });
        }
        const count = (subscription.failure_count ?? 0) + 1;
        await supabaseAdmin
          .from("push_subscriptions")
          .update({
            failure_count: count,
            disabled_at: count >= 5 ? new Date().toISOString() : null,
          })
          .eq("id", subscription.id);
        console.error("[push] send failed", {
          subscriptionId: subscription.id,
          outcome: attempts.find((attempt) => attempt.subscriptionId === subscription.id)?.outcome,
          error: error instanceof Error ? error.message : "unknown_error",
        });
      }
    }),
  );

  return { sent, failed, devices: subscriptions.length, skipped: false, attempts };
}