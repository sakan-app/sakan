# Known Limitations

## Purpose

This document lists limitations that are **confirmed in the current source
code**. Each entry states the limitation, where it originates, its practical
impact and the available workaround. No speculative or hypothetical issues are
recorded here. Planned work is tracked separately in
[ROADMAP.md](./ROADMAP.md).

## Table of contents

1. [Testing and verification](#1-testing-and-verification)
2. [Rate limiting](#2-rate-limiting)
3. [Voice and video calling](#3-voice-and-video-calling)
4. [Payments](#4-payments)
5. [Push notifications](#5-push-notifications)
6. [Offline behaviour](#6-offline-behaviour)
7. [AI services](#7-ai-services)
8. [Search and discovery](#8-search-and-discovery)
9. [Runtime constraints](#9-runtime-constraints)
10. [Cross references](#10-cross-references)

---

## 1. Testing and verification

| Limitation | Detail |
|---|---|
| No automated test suite | `package.json` defines `dev`, `build`, `build:dev`, `preview`, `lint` and `format` only. There is no unit, integration or end-to-end runner in the repository. |
| Verification is manual | Regression coverage depends on the manual QA procedures documented in [TESTING.md](./TESTING.md) and on the in-app diagnostics route. |

**Impact.** Regressions are caught by review and manual passes rather than CI.

---

## 2. Rate limiting

`src/lib/rate-limit.server.ts` implements the shared limiter on top of the
`activity_logs` table:

```ts
const { count, error } = await supabaseAdmin
  .from("activity_logs")
  .select("id", { count: "exact", head: true })
  .eq("event", event)
  .gte("created_at", since);
if (error) return;              // fails open
if ((count ?? 0) >= limit) throw new RateLimitError();
```

| Limitation | Detail |
|---|---|
| Fails open | If the counting query errors, the request is allowed. This is deliberate — a database hiccup must not disable unrelated features — but it means the limiter is not a hard security control. |
| Not atomic | Counting and inserting are two statements, so concurrent requests can briefly exceed the limit. |
| Storage growth | Marker rows accumulate in `activity_logs`; there is no automatic pruning job in the codebase. |

> **Warning**
> Treat rate limiting as abuse dampening, not as an authorization boundary.
> Authorization is enforced by RLS and by the server-side entitlement checks.

---

## 3. Voice and video calling

| Limitation | Detail |
|---|---|
| TURN relay is optional | `iceServers()` in `src/lib/calls/calls.server.ts` always returns public STUN servers and only adds a TURN relay when the deployment configures one (`relayConfigured`). Without TURN, calls between peers behind symmetric NAT or restrictive corporate firewalls will fail to connect. |
| Public STUN dependency | The default STUN endpoints are Google's public servers; availability is outside the platform's control. |
| Signalling rides Realtime broadcast | Offers, answers and ICE candidates are exchanged over a Supabase Realtime broadcast channel (`event: "signal"`). Delivery is best-effort; a dropped socket during negotiation ends the attempt rather than recovering it. |
| One-to-one only | `call_sessions` models a single caller and a single callee. Group calling does not exist. |

---

## 4. Payments

| Limitation | Detail |
|---|---|
| Manual provider fallback | `src/lib/billing/provider.server.ts` selects `stripeProvider() ?? manualProvider`. When Stripe credentials are absent, checkout resolves to a manual activation (`providerRef: "manual_<plan>_<timestamp>"`) with no money movement. This is intended for operator-driven activation, and it must not be mistaken for a completed online payment. |
| Single PSP integrated | Stripe is the only automated provider implemented. |
| Refunds are recorded, not initiated | The webhook handler processes `charge.refunded` events; refunds themselves are issued outside the application (Stripe dashboard or API). |

See [BILLING.md](./BILLING.md) for the full lifecycle.

---

## 5. Push notifications

| Limitation | Detail |
|---|---|
| Requires VAPID configuration | `vapidConfigured()` short-circuits dispatch and returns `{ skipped: true, reason: "vapid_not_configured" }` when the VAPID keys are missing. |
| Delivery window | `/api/public/push-dispatch` gives up on a notification after `GIVE_UP_AFTER_MS` (15 minutes); rows are then stamped as handled even if no device accepted the payload. |
| Do-Not-Disturb suppresses silently | Members with `presence_status = 'dnd'` have their notification rows stamped as handled without any push being sent. The in-app notification remains, but no device alert is produced. |
| iOS constraints | Web Push on iOS requires the app to be installed to the home screen; this is a platform restriction, not an application setting. |

---

## 6. Offline behaviour

| Limitation | Detail |
|---|---|
| Cold-start coverage is limited | Only `/`, `/offline` and hashed build assets are precached. A route that was never visited renders the static offline shell rather than its own content. |
| Outbox replay is best-effort | Queued writes are replayed when connectivity returns; conflicting server state (for example a conversation deleted meanwhile) surfaces as a failed replay rather than an automatic merge. |
| Guard fallback trusts the cached session | `resolveGuardUser()` intentionally accepts the persisted session when the network is unreachable, so a session revoked while the device is offline still passes the client-side gate. Server-side calls still fail closed because the bearer token is validated on every protected server function. |

---

## 7. AI services

| Limitation | Detail |
|---|---|
| Single upstream gateway | All AI features route through `src/lib/ai/gateway.server.ts`. There is no secondary provider or local fallback model. |
| Hard timeout | Requests abort after 20 seconds (`TIMEOUT_MS`). |
| Limited retry policy | Only `5xx` responses are retried, exactly once. `429` and `402` are surfaced immediately as `GatewayError` kinds `rate_limited` and `payment_required`. |
| Best-effort JSON parsing | `parseJsonContent` strips code fences and returns `null` on malformed output; features degrade instead of failing hard. |
| AI moderation is advisory | Verdicts are written to `moderation_flags`/`messages.moderation`; final enforcement is a human moderator action. |

---

## 8. Search and discovery

| Limitation | Detail |
|---|---|
| No geospatial distance | Location filtering is by country and city text, not by coordinates or radius. |
| No full-text ranking | Member search filters on structured columns; there is no relevance-ranked text index. |
| Compatibility scores are cached rows | `compatibility_scores` holds generated results; they are not recomputed automatically when a profile changes. |

---

## 9. Runtime constraints

| Limitation | Detail |
|---|---|
| Edge Worker runtime | Server code runs on a Cloudflare Worker. Node-only packages, native addons, child processes and a persistent filesystem are unavailable; all crypto (including Web Push encryption) uses Web Crypto APIs. |
| Stateless server | No in-memory state survives between requests; all durable state lives in Postgres. |
| No Supabase Edge Functions | Server logic is `createServerFn` plus file routes under `src/routes/api/`; the codebase deliberately contains no edge functions. |

---

## 10. Cross references

- [TESTING.md](./TESTING.md)
- [SECURITY.md](./SECURITY.md)
- [BILLING.md](./BILLING.md)
- [PWA.md](./PWA.md)
- [AI.md](./AI.md)
- [ROADMAP.md](./ROADMAP.md)