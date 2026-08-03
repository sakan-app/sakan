# SAKAN API Reference (Caller-Facing)

## Purpose

This document describes how **clients** (the SAKAN React app, admin console, and external
webhook senders) invoke SAKAN's backend surface. SAKAN has two kinds of backend endpoints:

1. **TanStack Start server functions** — RPC-style calls invoked from React code via
   `useServerFn`, transported as authenticated HTTP requests under the hood.
2. **Public HTTP API routes** (`src/routes/api/public/*`) — plain HTTP endpoints for
   server-to-server integrations (Stripe, the notification cron job) that do not go through
   Supabase user sessions.

For an exhaustive per-module breakdown of server function implementations, see
[`SERVER_FUNCTIONS.md`](./SERVER_FUNCTIONS.md).

## Table of Contents

- [1. Transport Overview](#1-transport-overview)
  - [1.1 Server functions (`useServerFn`)](#11-server-functions-useserverfn)
  - [1.2 Bearer token attachment](#12-bearer-token-attachment)
  - [1.3 CSRF protection](#13-csrf-protection)
  - [1.4 Error handling](#14-error-handling)
- [2. Server Function Catalog (by domain)](#2-server-function-catalog-by-domain)
- [3. Public HTTP API Routes](#3-public-http-api-routes)
  - [3.1 `POST /api/public/push-dispatch`](#31-post-apipublicpush-dispatch)
  - [3.2 `POST /api/public/stripe-webhook`](#32-post-apipublicstripe-webhook)
- [4. Rate Limiting](#4-rate-limiting)
- [5. Notes & Troubleshooting](#5-notes--troubleshooting)

## 1. Transport Overview

### 1.1 Server functions (`useServerFn`)

SAKAN uses [TanStack Start](https://tanstack.com/start) server functions instead of a
hand-rolled REST layer. Each server function is declared with `createServerFn()` in a
`*.functions.ts` module (see `src/lib/**/*.functions.ts`) and imported directly into route
components. Client code never constructs a URL by hand; it calls `useServerFn` to get a
callable that performs the RPC over HTTP and returns a strongly typed result inferred from the
handler's return type.

```tsx
// src/routes/admin/dashboard.tsx
import { useServerFn } from "@tanstack/react-start";
import { getLiveStats } from "@/lib/admin/ops.functions";

function DashboardPage() {
  const fn = useServerFn(getLiveStats);

  useEffect(() => {
    fn().then(setStats);
  }, []);
}
```

```tsx
// src/routes/_authenticated/featured.tsx
import { useServerFn } from "@tanstack/react-start";
import { createFeaturedCheckout, getFeaturedQueue } from "@/lib/ads/ads.functions";

const checkout = useServerFn(createFeaturedCheckout);
const fetchQueue = useServerFn(getFeaturedQueue);

// Validated with the function's zod schema before the request is sent.
await checkout({ data: { adId, returnUrl } });
```

Server functions declared with `.validator(zodSchema)` accept a single `data` argument that is
parsed with the schema **on the server** (TanStack Start also runs it client-side for early
feedback, but the server-side check is authoritative). Functions without a `.validator()` call
take no input (`createFeaturedCheckout`'s sibling `getFeaturedQueue`, for example).

### 1.2 Bearer token attachment

Every server function call automatically carries the caller's Supabase session token. This is
wired once, globally, via `functionMiddleware` in `src/start.ts`:

```ts
// src/start.ts
export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
```

`attachSupabaseAuth` (`src/integrations/supabase/auth-attacher.ts`) runs on the **client** side
of the RPC boundary before every server function request:

```ts
export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },
)
```

This means:

- If the browser has an active Supabase session, `Authorization: Bearer <access_token>` is
  attached to **every** server function call, whether or not that function requires auth.
- If there is no session, the header is simply omitted — functions that don't call
  `requireSupabaseAuth` in their middleware chain will still succeed.
- There is no manual header plumbing required in route/component code.

On the server, functions that need an authenticated caller add
`requireSupabaseAuth` (`src/integrations/supabase/auth-middleware.ts`) to their middleware
array. That middleware:

1. Reads the `Authorization` header from the incoming request.
2. Rejects (throws) if it is missing, not a `Bearer` scheme, empty, or not a 3-segment JWT.
3. Builds a per-request Supabase client scoped to that bearer token (so downstream `.from()`
   queries respect Row Level Security as the calling user).
4. Calls `supabase.auth.getClaims(token)` to verify the JWT and extract `sub` (the user id).
5. Injects `{ supabase, userId, claims }` into the handler's `context`.

Handlers do not implement their own JWT verification — they rely entirely on this middleware,
then layer role checks on top (see [Section 2](#2-server-function-catalog-by-domain)).

### 1.3 CSRF protection

`src/start.ts` explicitly re-registers `createCsrfMiddleware` scoped to `handlerType: "serverFn"`.
TanStack Start enables this automatically unless `src/start.ts` exists; SAKAN defines the file
for the auth wiring above, so CSRF protection is re-added on purpose — removing `src/start.ts`
or dropping `csrfMiddleware` from `requestMiddleware` would silently disable it.

### 1.4 Error handling

`errorMiddleware` in `src/start.ts` wraps every request. Thrown errors that carry a
`statusCode` property are re-thrown as-is (framework-native error shape); anything else is
logged server-side and converted into a generic `500` HTML error page — **server function
error messages thrown as plain `Error` objects are not guaranteed to reach the client verbatim**
for non-serverFn requests, but for `serverFn` handler calls (the case documented here), TanStack
Start serializes the thrown `Error`'s `message` back to the caller as a rejected promise. Client
code should always wrap `useServerFn` calls in `try/catch` and surface `error.message`.

Common thrown error messages across the codebase (see `SERVER_FUNCTIONS.md` for the exact
function that throws each):

| Message / type | Meaning |
| --- | --- |
| `Unauthorized: No authorization header provided` | Missing bearer token — caller is signed out. |
| `Unauthorized: Only Bearer tokens are supported` | Non-Bearer `Authorization` scheme. |
| `Unauthorized: Invalid token` | JWT malformed or rejected by Supabase. |
| `forbidden` / `AdminForbiddenError` | Caller lacks the `moderator`/`admin`/`super_admin` role required. |
| `RateLimitError` (`"Too many requests. Please try again in a moment."`) | Per-key rate limit exceeded — see [Section 4](#4-rate-limiting). |
| Domain-specific strings (`ad_checkout_failed`, `checkout_failed`, `stripe_not_configured`, gateway error kinds, etc.) | Business-logic failures raised by the underlying `*.server.ts` helper. |

## 2. Server Function Catalog (by domain)

This is the caller's view — grouped by feature area, with the client-visible contract only.
Full internals (helper modules, DB reads/writes) are in `SERVER_FUNCTIONS.md`.

| Domain | Module | Representative functions | Auth | Notes |
| --- | --- | --- | --- | --- |
| Admin — users/reports/verification (legacy) | `src/lib/admin/admin.functions.ts` | `listUsers`, `setUserStatus`, `changeUserRole`, `listReports`, `resolveReport`, `listModerationFlags` | Staff or Admin | Superseded in the UI by `ops.functions.ts`; still wired into some admin routes. |
| Admin — operations console (current) | `src/lib/admin/ops.functions.ts` | `getAdminAccess`, `getLiveStats`, `listUsersAdvanced`, `runUserAction`, `broadcastNotification`, `getBillingOverview`, `runSubscriptionAction` | Staff, Admin, or Super Admin depending on action | Primary admin dashboard API. |
| Ads (featured listings) | `src/lib/ads/ads.functions.ts` | `createFeaturedCheckout`, `getFeaturedQueue`, `trackAdEvent`, `reviewFeaturedAd`, `listFeaturedAdsAdmin` | Mixed: authenticated user, staff, or none (public tracking) | Stripe Checkout for ad placement. |
| AI coaching | `src/lib/ai/coaching.functions.ts` | `suggestProfileQuality`, `suggestIceBreakers`, `suggestSmartReplies`, `improveMyBio` | Authenticated user | Rate-limited AI gateway calls. |
| AI matchmaking | `src/lib/ai/matchmaking.functions.ts` | `scoreCompatibility`, `recommendMatches` | Authenticated user | Cached compatibility scores. |
| AI moderation | `src/lib/ai/moderation.functions.ts` | `moderateText`, `moderateImage` | Authenticated user | Persists a moderation flag record for every call. |
| AI translation | `src/lib/ai/translate.functions.ts` | `translateText` | Authenticated user | Thin wrapper over the AI gateway. |
| Billing | `src/lib/billing/billing.functions.ts` | `createCheckout`, `cancelSubscription`, `resumeSubscription`, `createPortalSession`, `refreshBillingState` | Authenticated user | Stripe Checkout/Billing Portal integration. |
| Calls (voice/video signalling) | `src/lib/calls/calls.functions.ts` | `startCallFn`, `answerCallFn`, `closeCallFn`, `callEntitlementsFn` | Authenticated user | Entitlements enforced server-side by plan. |
| Push notifications | `src/lib/push/push.functions.ts` | `savePushSubscription`, `deletePushSubscription`, `getPushConfig`, `sendTestPush`, `getPushDiagnostics` | Authenticated user | Web Push (VAPID) subscription management. |
| PWA install analytics | `src/lib/pwa/analytics.functions.ts` | `recordInstallEvent` | None (public, rate-limited) | Fire-and-forget install funnel telemetry. |

See `SERVER_FUNCTIONS.md` for the full signature, validator schema, and error surface of every
function listed above.

## 3. Public HTTP API Routes

Unlike server functions, these are plain HTTP endpoints defined with
`createFileRoute(...).server.handlers`, reachable at a fixed URL, and intended for
server-to-server callers (they are **not** invoked through `useServerFn`).

### 3.1 `POST /api/public/push-dispatch`

**File:** `src/routes/api/public/push-dispatch.ts`

Fans a single notification out to all of a user's registered Web Push devices. It is triggered
by a Postgres `AFTER INSERT` trigger on `notifications` (via `pg_net`/`pg_cron`, see
`supabase/migrations/20260803142929_*.sql` and `20260803123231_*.sql`), not by end-user
browsers.

**Auth:** Shared-secret header, compared in constant time to prevent timing attacks:

```ts
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}
```

The header `x-push-token` must exactly match the `PUSH_DISPATCH_TOKEN` environment variable.
If that variable is unset, or the header doesn't match, the route returns `401 Unauthorized`
without touching the database.

**Request:**

```
POST /api/public/push-dispatch
Content-Type: application/json
x-push-token: <PUSH_DISPATCH_TOKEN>

{ "notificationId": "b3f4b7d0-....-....-....-............" }
```

Validated with:

```ts
const dispatchInput = z.object({ notificationId: z.string().uuid() });
```

**Responses:**

| Status | Body | Meaning |
| --- | --- | --- |
| `401` | `Unauthorized` | Missing/invalid token. |
| `400` | `Invalid dispatch payload` | Body failed the zod schema. |
| `200` | `{ skipped: true, reason: "vapid_not_configured" }` | VAPID keys not configured server-side. |
| `500` | `<error message>` | Supabase query error while loading the notification. |
| `200` | `{ processed, sent, retrying, attempts }` | Success (see below). |

`processed` counts notifications matched by id that were still `push_sent_at IS NULL AND
read_at IS NULL`; `sent` is the number of devices successfully pushed; `attempts` lists every
per-device outcome (`{ notificationId, subscriptionId, status, outcome }`). Rows belonging to
Do-Not-Disturb (`presence_status = 'dnd'`) users are marked `push_sent_at` immediately without
sending. A notification with zero successful sends is left **unstamped** (so it can be retried)
unless it is older than `GIVE_UP_AFTER_MS` (15 minutes), at which point it is force-stamped to
stop indefinite retries.

**Idempotency:** Re-invoking with the same `notificationId` after it has been stamped
(`push_sent_at` set) is a no-op — the `WHERE push_sent_at IS NULL` filter returns zero rows and
the endpoint responds `{ processed: 0, sent: 0 }`.

**curl example:**

```bash
curl -X POST https://<your-deployment>/api/public/push-dispatch \
  -H "Content-Type: application/json" \
  -H "x-push-token: $PUSH_DISPATCH_TOKEN" \
  -d '{"notificationId":"b3f4b7d0-1234-4a5b-9c6d-abcdef012345"}'
```

**Security notes:**

- Never expose `PUSH_DISPATCH_TOKEN` to the browser bundle; it must only exist as a server
  environment variable and inside the Postgres cron job configuration.
- The route uses `supabaseAdmin` (service role), bypassing RLS — the token check is the *only*
  authorization boundary. Rotate the token if it is ever leaked in logs.

### 3.2 `POST /api/public/stripe-webhook`

**File:** `src/routes/api/public/stripe-webhook.ts`

Receives asynchronous billing events from Stripe (checkout completion, invoice lifecycle,
subscription changes, refunds) and applies them to SAKAN's billing tables.

**Auth:** Stripe signature verification, not a shared secret header. The route calls
`verifyStripeEvent(payload, header, secret)` (`src/lib/billing/stripe.server.ts`), which:

1. Requires the `Stripe-Signature` header (`t=<timestamp>,v1=<hex hmac>` scheme).
2. Rejects if the timestamp is more than 300 seconds (`toleranceSeconds`) old — replay
   protection.
3. Recomputes an HMAC-SHA256 over `"${timestamp}.${rawPayload}"` using
   `STRIPE_WEBHOOK_SECRET`, and compares it to `v1` with the same constant-time `safeEqual`
   helper used by the push-dispatch route.
4. Returns the parsed JSON event only after signature verification succeeds.

If `STRIPE_WEBHOOK_SECRET` is not configured, the route immediately returns `503
webhook_not_configured` without reading the body. If verification fails for any reason
(missing header, malformed header, expired timestamp, bad signature), it returns `401
invalid_signature`.

**Request:** Raw Stripe event JSON, exactly as sent by Stripe (the route reads
`request.text()` — the raw body is required for signature verification, so no body-parsing
middleware may run before this handler).

**Responses:**

| Status | Body | Meaning |
| --- | --- | --- |
| `503` | `webhook_not_configured` | `STRIPE_WEBHOOK_SECRET` missing. |
| `401` | `invalid_signature` | Signature verification failed. |
| `200` | `duplicate` | Event id already claimed (idempotent replay). |
| `500` | `handler_error` | The type-specific handler threw; Stripe will retry. |
| `200` | `ok` | Event processed and marked `processed`. |

**Idempotency:** Before running any handler, the route attempts to `INSERT` the Stripe event
`id` into `webhook_events` with `status: "processing"`. A Postgres unique-violation (`23505`)
means this event id was already claimed — the route acknowledges with `duplicate` and does not
reprocess it. If the downstream handler throws, the claim row is deleted so a Stripe retry can
re-claim and reprocess the event; on success the row is updated to `status: "processed"`.

**Event types handled** (unhandled types fall through to the default branch and are
acknowledged with `ok` but otherwise ignored):

| Stripe event type | Handler (`src/lib/billing/webhook.server.ts`) |
| --- | --- |
| `checkout.session.completed` | `handleCheckoutCompleted` |
| `invoice.paid`, `invoice_payment.paid` | `handleInvoicePaid` |
| `invoice.payment_failed` | `handleInvoiceFailed` |
| `customer.subscription.updated` | `handleSubscriptionUpdated` |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` |
| `charge.refunded` | `handleChargeRefunded` |

**curl example** (for local testing with the Stripe CLI, which computes the signature for you):

```bash
stripe listen --forward-to localhost:3000/api/public/stripe-webhook
stripe trigger checkout.session.completed
```

Manually crafting a valid signature without the Stripe CLI/SDK is not practical — always use
`stripe trigger` or `stripe listen` against your dev server.

**Security notes:**

- The endpoint intentionally has no session-based auth; the Stripe signature is the entire
  trust boundary. Never disable verification or accept unsigned payloads, even in development.
- `stripeIsLive()` / `stripeKey()` (same file) select between `STRIPE_SECRET_KEY` (production)
  and `STRIPE_TEST_API_KEY` (non-production) — make sure `STRIPE_WEBHOOK_SECRET` matches the
  mode (test vs. live) of the key in use, or signature verification will always fail.

## 4. Rate Limiting

See `src/lib/rate-limit.server.ts` for full details and [`SERVER_FUNCTIONS.md`](./SERVER_FUNCTIONS.md#rate-limiting-reference)
for the per-function limit table. In summary:

- Backed by the `activity_logs` table — no dedicated rate-limit infrastructure. Each call
  writes a marker row (`event = "rl:<key>"`) and counts markers within the trailing window.
- **Fails open**: if the counting query itself errors, the call is allowed (a DB hiccup never
  blocks an unrelated feature).
- On limit exceeded, throws `RateLimitError` with the message `"Too many requests. Please try
  again in a moment."` — callers should catch this specifically (`instanceof RateLimitError`)
  to show a distinct "slow down" UI rather than a generic error.

## 5. Notes & Troubleshooting

- **"Unauthorized" errors immediately after sign-in**: the Supabase session may not yet be
  persisted when `attachSupabaseAuth` calls `supabase.auth.getSession()`; ensure the auth state
  change has settled before firing authenticated server function calls.
- **A server function seems to ignore the caller's role**: check whether it calls
  `assertStaff` (moderator/admin/super_admin) vs. `assertAdmin` (admin/super_admin only) vs. an
  inline `is_super_admin` RPC check (`updatePlatformSettings`, `changeUserRoleV2` for granting
  `super_admin`) — these are not interchangeable.
- **CSRF failures on server function calls from custom fetch/XHR code**: don't bypass
  `useServerFn`/the generated RPC client with hand-rolled `fetch()` calls to the internal
  server-function URL; `createCsrfMiddleware` expects the framework's own request shape.
- **Public API routes return 401/503 in production**: confirm `PUSH_DISPATCH_TOKEN` and
  `STRIPE_WEBHOOK_SECRET` are set as server environment variables (not client-exposed `VITE_*`
  variables) and that the Postgres cron job / Stripe dashboard webhook URL point at the current
  deployment origin.

Related: [`SERVER_FUNCTIONS.md`](./SERVER_FUNCTIONS.md) for implementation-level detail on
every function and its paired `*.server.ts` helper module.
