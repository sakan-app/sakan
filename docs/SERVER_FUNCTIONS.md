# SAKAN Server Functions Reference (Implementation-Facing)

## Purpose

This document is the exhaustive, per-module breakdown of every SAKAN
`createServerFn` definition (`src/**/*.functions.ts`) and its paired business-logic module
(`*.server.ts`). It is intended for engineers modifying backend behavior. For the
caller/client-facing contract (how these are invoked from React, public HTTP routes, rate
limiting rules, error shapes), see [`API.md`](./API.md).

All eleven files matched by `rg -l "createServerFn" src` are documented below.

## Table of Contents

- [1. Shared Building Blocks](#1-shared-building-blocks)
- [2. `src/lib/admin/admin.functions.ts`](#2-srclibadminadminfunctionsts)
- [3. `src/lib/admin/ops.functions.ts`](#3-srclibadminopsfunctionsts)
- [4. `src/lib/ads/ads.functions.ts`](#4-srclibadsadsfunctionsts)
- [5. `src/lib/ai/coaching.functions.ts`](#5-srclibaicoachingfunctionsts)
- [6. `src/lib/ai/matchmaking.functions.ts`](#6-srclibaimatchmakingfunctionsts)
- [7. `src/lib/ai/moderation.functions.ts`](#7-srclibaimoderationfunctionsts)
- [8. `src/lib/ai/translate.functions.ts`](#8-srclibaitranslatefunctionsts)
- [9. `src/lib/billing/billing.functions.ts`](#9-srclibbillingbillingfunctionsts)
- [10. `src/lib/calls/calls.functions.ts`](#10-srclibcallscallsfunctionsts)
- [11. `src/lib/push/push.functions.ts`](#11-srclibpushpushfunctionsts)
- [12. `src/lib/pwa/analytics.functions.ts`](#12-srclibpwaanalyticsfunctionsts)
- [Rate-Limiting Reference](#rate-limiting-reference)

## 1. Shared Building Blocks

| Building block | File | Role |
| --- | --- | --- |
| `requireSupabaseAuth` | `src/integrations/supabase/auth-middleware.ts` | `.middleware([...])` entry that verifies the bearer JWT and injects `{ supabase, userId, claims }`. Generated file — do not hand-edit. |
| `attachSupabaseAuth` | `src/integrations/supabase/auth-attacher.ts` | Client-side middleware, attaches `Authorization: Bearer <token>` to every serverFn call. Registered globally in `src/start.ts`. |
| `enforceRateLimit(key, limit, windowMs)` / `RateLimitError` | `src/lib/rate-limit.server.ts` | Shared limiter backed by `activity_logs`; throws `RateLimitError` when `limit` markers exist for `key` inside `windowMs`. Fails open on DB errors. |
| `assertStaff(supabase, userId)` / `assertAdmin(supabase, userId)` / `AdminForbiddenError` | `src/lib/admin/admin.server.ts` | Role gates. `assertStaff` calls the `is_staff` RPC (moderator, admin, or super_admin); `assertAdmin` calls `has_role(_role: "admin")`. Both throw `AdminForbiddenError` on failure. |
| `supabaseAdmin` | `src/integrations/supabase/client.server.ts` | Service-role Supabase client, bypasses RLS. Used once a role check has already passed, or for tables with no direct end-user RLS policy (e.g. `activity_logs`, `pwa_install_events`). |

Every server function in this document is declared with `createServerFn({ method: "GET" | "POST" })`.
Method choice reflects idempotency intent (`GET` for reads) rather than strict HTTP semantics —
TanStack Start still transports all of them as RPC calls, not conventional REST resources.

---

## 2. `src/lib/admin/admin.functions.ts`

Legacy/parallel admin surface (still exercised by parts of the admin UI alongside
`ops.functions.ts`). Every handler lazy-imports its implementation from
`./admin.server` (572 lines) to keep the function-definition bundle small.

Shared validators in this file:

```ts
const appRole = z.enum(["user", "moderator", "admin"]);
const pageInput = { page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(20) };
```

| Function | Method | Zod validator | Permission | `admin.server.ts` export | Tables touched |
| --- | --- | --- | --- | --- | --- |
| `getDashboardStats` | GET | none | Staff | `getDashboardStats()` | `profiles`, `subscriptions`, `reports`, `verification_requests` (aggregate counts) |
| `listUsers` | GET | `{ search?: string≤200, status: "active"\|"suspended"\|"all"=all, verified: "verified"\|"unverified"\|"all"=all, page, pageSize }` | Staff | `listUsers(filter)` | `profiles` |
| `getUserDetail` | GET | `{ targetId: uuid }` | Staff | `getUserDetail(targetId)` | `profiles` |
| `setUserStatus` | POST | `{ targetId: uuid, action: "suspend"\|"unsuspend"\|"ban", reason?: string≤500 }` | Staff | `setUserStatus({ adminId, ...data })` | `profiles`, `admin_actions` |
| `changeUserRole` | POST | `{ targetId: uuid, role: appRole, grant: boolean }` | Admin | `changeUserRole({ adminId, ...data })` | `user_roles`, `admin_actions` |
| `bulkChangeUserRole` | POST | `{ targetIds: uuid[] (1–200), role: appRole, grant: boolean }` | Admin | `bulkChangeUserRole({ adminId, ...data })` | `user_roles`, `admin_actions` |
| `listVerifications` | GET | `{ status: "pending"\|"approved"\|"rejected"\|"all"=pending, page, pageSize }` | Staff | `listVerifications(params)` | `verification_requests` |
| `reviewVerification` | POST | `{ id: uuid, decision: "approved"\|"rejected", notes?: string≤500 }` | Staff | `reviewVerification({ adminId, ...data })` | `verification_requests`, `admin_actions` |
| `bulkReviewVerifications` | POST | `{ ids: uuid[] (1–200), decision: "approved"\|"rejected" }` | Staff | `bulkReviewVerifications({ adminId, ...data })` | `verification_requests`, `admin_actions` |
| `listReports` | GET | `{ status: "open"\|"reviewing"\|"resolved"\|"dismissed"\|"all"=open, page, pageSize }` | Staff | `listReports(params)` | `reports` |
| `resolveReport` | POST | `{ id: uuid, action: "resolved"\|"dismissed", notes?: string≤500 }` | Staff | `resolveReport({ adminId, ...data })` | `reports`, `admin_actions` |
| `bulkResolveReports` | POST | `{ ids: uuid[] (1–200), action: "resolved"\|"dismissed" }` | Staff | `bulkResolveReports({ adminId, ...data })` | `reports`, `admin_actions` |
| `listModerationFlags` | GET | `{ verdict: "pending"\|"approved"\|"flagged"\|"rejected"\|"all"=flagged, page, pageSize }` | Staff | `listModerationFlags(params)` | `moderation_flags` |
| `resolveModerationFlag` | POST | `{ id: uuid, verdict: "approved"\|"rejected" }` | Staff | `resolveModerationFlag({ adminId, ...data })` | `moderation_flags`, `admin_actions` |
| `listSubscriptions` | GET | `{ status?: string≤30, planCode?: string≤60, page, pageSize }` | Staff | `listSubscriptions(params)` | `subscriptions` |
| `listPayments` | GET | `{ status?: string≤30, page, pageSize }` | Staff | `listPayments(params)` | `payments` |
| `listAuditLog` | GET | `{ action?: string≤100, adminId?: uuid, page, pageSize }` | Staff | `listAuditLog(params)` | `admin_actions` |

**Failure cases:** `AdminForbiddenError` ("forbidden") if the caller fails `assertStaff`/`assertAdmin`;
unauthenticated calls fail earlier inside `requireSupabaseAuth` ("Unauthorized: ..."); any
Supabase query error inside `admin.server.ts` is surfaced as a generic `Error` with the
Postgres error message.

**Rate limits:** none — these are staff-only, low-volume operations and are not passed through
`enforceRateLimit`.

---

## 3. `src/lib/admin/ops.functions.ts`

The current/primary admin console API (1014-line `ops.server.ts` backing it, plus
`admin.server.ts` for role assertions and `billing.server.ts` for the billing sub-surface).
Comment in source: *"Phase 5 — admin dashboard RPC surface. Every call re-verifies staff
server-side."*

Shared validators:

```ts
const appRole = z.enum(["user", "moderator", "admin", "super_admin"]);
const paging = { page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(20) };
```

### 3.1 Access & dashboard

| Function | Method | Validator | Permission | Backing call | Tables |
| --- | --- | --- | --- | --- | --- |
| `getAdminAccess` | GET | none | Any authenticated user | Inline: `context.supabase.rpc("is_staff", …)` + `user_roles` select | `user_roles` | Returns `{ isStaff, roles, isAdmin, isSuperAdmin }`. No staff assertion — this *is* the access-check endpoint. |
| `getLiveStats` | GET | none | Staff | `ops.server.getLiveStats()` | multiple (see `LiveStats` type, ~line 52) | Real-time dashboard counters. |
| `getAnalytics` | GET | `{ range: 7\|30\|90 = 30 }` | Staff | `ops.server.getAnalytics(range)` | aggregated from `profiles`, `payments`, `subscriptions`, etc. |
| `listActivity` | GET | `{ search?≤200, source: "admin"\|"system"=admin, page, pageSize }` | Staff | `ops.server.listActivity(params)` | `activity_logs`, `admin_actions` |

### 3.2 Users

| Function | Method | Validator | Permission | Backing call |
| --- | --- | --- | --- | --- |
| `listUsersAdvanced` | GET | `{ search?≤200, status: "all"\|"active"\|"suspended"\|"shadow_banned"=all, verified: "all"\|"verified"\|"unverified"=all, role: "all"\|appRole=all, country?≤2, sort: "created_at"\|"last_seen_at"\|"display_name"\|"completeness"=created_at, direction: "asc"\|"desc"=desc, page, pageSize }` | Staff | `listUsersAdvanced(params)` (`profiles`) |
| `runUserAction` | POST | `{ targetId: uuid, action: "suspend"\|"unsuspend"\|"shadow_ban"\|"unshadow_ban"\|"verify"\|"unverify"\|"reset_password"\|"force_logout"\|"delete", reason?≤500 }` | Staff for all actions **except** `"delete"`, which requires Admin | `runUserAction({ adminId, ...data })` | Note the in-handler branch: `if (data.action === "delete") await assertAdmin(...) else await assertStaff(...)`. |
| `getUserDetailFull` | GET | `{ targetId: uuid }` | Staff | `getUserDetailFull(targetId)` |
| `addAdminNote` | POST | `{ targetId: uuid, note: string 1–2000 }` | Staff | `addAdminNote({ adminId, ...data })` (`admin_notes`) |
| `changeUserRoleV2` | POST | `{ targetId: uuid, role: appRole, grant: boolean }` | Admin; granting `"super_admin"` additionally requires `is_super_admin` RPC to return true for the caller | Inline handler (writes `user_roles` via `supabaseAdmin`, then `logAdminAction`) | Throws plain `Error("forbidden")` (not `AdminForbiddenError`) if the extra super-admin check fails. |

### 3.3 Verification & moderation

| Function | Method | Validator | Permission | Backing call |
| --- | --- | --- | --- | --- |
| `listVerificationQueue` | GET | `{ status: "pending"\|"approved"\|"rejected"\|"expired"\|"all"=pending, page, pageSize }` | Staff | `listVerificationQueue(params)` (`verification_requests`) |
| `decideVerification` | POST | `{ id: uuid, decision: "approved"\|"rejected"\|"expired"\|"more_info", notes?≤1000 }` | Staff | `decideVerification({ adminId, ...data })` |
| `listReportsFull` | GET | `{ status: "open"\|"reviewing"\|"resolved"\|"dismissed"\|"all"=open, reason?≤60, page, pageSize }` | Staff | `listReportsFull(params)` (`reports`) |
| `actOnReport` | POST | `{ id: uuid, action: "resolve"\|"dismiss"\|"warn"\|"suspend"\|"ban", notes?≤1000 }` | Staff | `actOnReport({ adminId, ...data })` |

### 3.4 Matches, conversations & notifications

| Function | Method | Validator | Permission | Backing call | Tables |
| --- | --- | --- | --- | --- | --- |
| `listMatches` | GET | `{ active: "all"\|"active"\|"inactive"=all, page, pageSize }` | Staff | `listMatches(params)` | `matches` |
| `listConversations` | GET | `{ search?≤200, page, pageSize }` | Staff | `listConversations(params)` | `conversations` |
| `getConversationMessages` | GET | `{ conversationId: uuid, search?≤200 }` | Staff | `getConversationMessages(params)` | `messages` |
| `listAdminNotifications` | GET | `{ filter: "all"\|"unread"\|"read"\|"system"\|"verification"\|"match"\|"message"\|"like"=all, page, pageSize }` | Staff | `listNotifications(params)` | `notifications` |
| `broadcastNotification` | POST | `{ audience: "all"\|"country"\|"premium"\|"moderators"\|"user", countryCode?≤2, userId?: uuid, title: string 1–120, body: string 1–1000 }` | **Admin** (not merely staff) | `broadcastNotification({ adminId, ...data })` | `notifications`, `profiles` |

### 3.5 Platform settings

| Function | Method | Validator | Permission | Backing call |
| --- | --- | --- | --- | --- |
| `getPlatformSettings` | GET | none | Staff | `getPlatformSettings()` (`platform_settings`) |
| `updatePlatformSettings` | POST | `{ support_email?: email≤200, maintenance_mode?: boolean, default_language?: "ar"\|"en"\|"de"\|"fr", registration_enabled?: boolean, verification_required?: boolean, max_gallery_photos?: int 1–50, max_image_mb?: int 1–25, allowed_image_types?: string≤60[] (≤10), notify_defaults?: Record<string, boolean> }` | **Super Admin only** — checked inline via `is_super_admin` RPC, *not* `assertAdmin`/`assertStaff` | `updatePlatformSettings({ adminId, patch })` | Throws plain `Error("forbidden")` if the RPC returns falsy. |

### 3.6 Billing sub-surface (delegates to `billing.server.ts`, 267 lines)

| Function | Method | Validator | Permission | Backing call | Tables |
| --- | --- | --- | --- | --- | --- |
| `getBillingOverview` | GET | none | Staff | `billing.server.getBillingOverview()` | `payments`, `subscriptions`, `plans` |
| `listSubscriptionsAdmin` | GET | `{ status: "all"\|"active"\|"trialing"\|"past_due"\|"canceled"\|"expired"=all, planCode?≤60, search?≤200, page, pageSize }` | Staff | `listSubscriptions(params)` | `subscriptions`, `profiles` |
| `listPlansAdmin` | GET | none | Staff | `listPlans()` | `plans` |
| `runSubscriptionAction` | POST | `{ subscriptionId: uuid, action: "set_status"\|"change_plan"\|"extend_period"\|"set_grace"\|"cancel_at_period_end", status?: "active"\|"trialing"\|"past_due"\|"canceled"\|"expired", planCode?≤60, days?: int 1–365, reason: string 1–500 }` | Admin | `runSubscriptionAction({ adminId, ...data })` | `subscriptions` |
| `listPaymentsAdmin` | GET | `{ status: "all"\|"pending"\|"succeeded"\|"failed"\|"refunded"=all, provider?≤60, search?≤200, page, pageSize }` | Staff | `listPayments(params)` | `payments` |
| `markPaymentRefunded` | POST | `{ paymentId: uuid, reason: string 1–500 }` | Admin | `markPaymentRefunded({ adminId, ...data })` | `payments` |
| `exportPaymentsCsv` | GET | `{ status: "all"\|"pending"\|"succeeded"\|"failed"\|"refunded"=all }` | Staff | `exportPaymentsCsv(data)` → returns `{ csv: string }` | `payments` |

**Failure cases (whole file):** `AdminForbiddenError` from `assertStaff`/`assertAdmin`; plain
`Error("forbidden")` from the two inline `is_super_admin` checks (`updatePlatformSettings`,
`changeUserRoleV2` granting `super_admin`); underlying Postgres errors propagate as `Error`
with the driver's message.

**Rate limits:** none in this file.

---

## 4. `src/lib/ads/ads.functions.ts`

Featured-ad placement, Stripe checkout for ad slots, and public click/impression tracking.
Backed by `src/lib/ads/ads.server.ts` (255 lines).

| Function | Method | Validator | Auth | Rate limit | Backing call | Tables |
| --- | --- | --- | --- | --- | --- | --- |
| `createFeaturedCheckout` | POST | `{ adId: uuid, returnUrl: url≤500 }` | Authenticated user | `ad_checkout:<userId>` — 5 / 60 min | `startFeaturedCheckout({ userId, adId, returnUrl })` | `featured_ads`, Stripe Checkout session |
| `getFeaturedQueue` | POST | none | **None** (public; used by the rotating banner) | none | `listFeaturedQueue()` | `featured_ads` |
| `trackAdEvent` | POST | `{ adId: uuid, metric: "impressions"\|"clicks" }` | **None** (public) | `ad_track:<adId>:<metric>` — 120 / 60 s; on limit hit, **silently returns `{ ok: true }` instead of throwing** | `bumpAdMetric(adId, metric)` | `featured_ads` |
| `reviewFeaturedAd` | POST | `{ adId: uuid, decision: "approve"\|"reject"\|"expire", note?≤500 }` | Staff (inline `is_staff` RPC check, throws plain `Error("forbidden")`) | none | `publishFeaturedAd(...)` (approve) or direct `supabaseAdmin.from("featured_ads").update(...)` (reject/expire) | `featured_ads` |
| `listFeaturedAdsAdmin` | POST | none | Staff (inline `is_staff` RPC check) | none | `sweepExpiredAds()` then a direct `supabaseAdmin` select (limit 200) | `featured_ads`, `featured` |

**Notes:**
- `reviewFeaturedAd` and `listFeaturedAdsAdmin` do **not** use `assertStaff`/`assertAdmin` from
  `admin.server.ts` — they inline `context.supabase.rpc("is_staff", { _user_id: context.userId })`
  and throw a bare `Error("forbidden")` instead of `AdminForbiddenError`. Treat this
  inconsistently-typed error the same way in client error handling.
- `trackAdEvent` deliberately swallows `RateLimitError` (`catch { return { ok: true } }`) so a
  throttled client never sees a failure for pure analytics traffic — the write is simply
  skipped.

**Failure cases:** `RateLimitError` from `createFeaturedCheckout`; generic
`Error("ad_checkout_failed")` (or the underlying message) if `startFeaturedCheckout` throws;
`Error("forbidden")` for non-staff callers of the two admin endpoints; Supabase errors surfaced
via `Error(error.message)` in `listFeaturedAdsAdmin`.

---

## 5. `src/lib/ai/coaching.functions.ts`

Profile-quality scoring, ice-breakers, smart replies, and bio improvement, all backed by the
AI gateway (`src/lib/ai/gateway.server.ts`) via `src/lib/ai/coaching-helpers.server.ts` (57 lines).

Shared constants: `AI_LIMIT = 20`, `AI_WINDOW_MS = 60_000` (per-user, per-file rate limit key
`ai:<userId>` — **shared with `matchmaking.functions.ts`**, see [Rate-Limiting Reference](#rate-limiting-reference)).

| Function | Method | Validator | Return type | Backing helper | Tables read/written |
| --- | --- | --- | --- | --- | --- |
| `suggestProfileQuality` | POST | `z.void()` | `{ score: number; suggestions: string[] }` | `scoreProfileQuality(profile, language)` | `profiles`, `photos` (read) |
| `suggestIceBreakers` | POST | `{ candidateId: uuid }` | `{ suggestions: string[] }` | `assertCandidateVisible` (`visibility.server.ts`) then `generateSuggestions(...)` | `profiles` (read, both users) |
| `suggestSmartReplies` | POST | `{ conversationId: uuid }` | `{ suggestions: string[] }` | `generateSuggestions(buildSmartReplyMessages(...))` | `messages` (RLS-scoped read via caller's own client, last 10, non-deleted), `profiles` (read, `preferred_language`) |
| `improveMyBio` | POST | `z.void()` | `{ bio: string; notes: string[] }` | `improveBio(profile, language)` | `profiles` (read, via caller's own RLS-scoped client) |

**Visibility guard:** `suggestIceBreakers` calls `assertCandidateVisible(context.userId,
candidateId)` before touching profile data — see `src/lib/ai/visibility.server.ts` (25 lines,
single export `assertCandidateVisible`).

**Failure cases:** every handler wraps its body in `try { ... } catch`, re-throwing
`RateLimitError` unchanged and converting anything else with
`gatewayErrorToMessage(error)` (from `coaching-helpers.server.ts`) — meaning gateway/network
errors are normalized to a stable message string rather than leaking raw provider errors.
A missing/failed profile read throws a generic `Error("failed")` before it ever reaches the
gateway.

**Rate limit:** `ai:<userId>` — 20 calls / 60 s (shared bucket across every function in this
file **and** every function in `matchmaking.functions.ts`).

---

## 6. `src/lib/ai/matchmaking.functions.ts`

AI-assisted compatibility scoring and match recommendations, backed by
`src/lib/ai/matchmaking-helpers.server.ts` (136 lines).

| Function | Method | Validator | Return type | Cache behavior | Tables |
| --- | --- | --- | --- | --- | --- |
| `scoreCompatibility` | POST | `{ candidateId: uuid }` | `CompatibilityScoreRow` | Reads an existing `compatibility_scores` row for `(user_id, candidate_id, language)`; if `isFresh(existing)` (see `matchmaking-helpers.server.ts:65`), returns it without calling the AI gateway. Otherwise scores, then `upsert`s on `onConflict: "user_id,candidate_id,language"`. | `profiles` (both users), `compatibility_scores` (read/write) |
| `recommendMatches` | POST | `{ limit: int 1–20 = 6 }` | `{ items: Array<{ candidateId: string; score: number; reason: string }> }` | No persistence; scores a fresh batch every call. | `profiles` (self + up to 30 active/unhidden candidates filtered by `looking_for`/`gender`), `likes` (exclude already-liked), `blocked_users` (exclude blocked in either direction) |

**Visibility guard:** `scoreCompatibility` calls `assertCandidateVisible` before scoring, same
as the coaching functions.

**Failure cases:** identical pattern to Section 5 — `RateLimitError` re-thrown, everything else
funneled through `gatewayErrorToMessage`.

**Rate limit:** `ai:<userId>` — 20 calls / 60 s, **same bucket as every `coaching.functions.ts`
function** (both files call `enforceRateLimit(\`ai:${context.userId}\`, 20, 60_000)`, so a user
exhausting bio suggestions will also be blocked from compatibility scoring within the same
window).

---

## 7. `src/lib/ai/moderation.functions.ts`

Text/image moderation, backed by `src/lib/ai/moderation-helpers.server.ts` (74 lines).
Constants: `AI_LIMIT = 40`, `AI_WINDOW_MS = 60_000`.

| Function | Method | Validator | Return type | Flow | Tables |
| --- | --- | --- | --- | --- | --- |
| `moderateText` | POST | `{ text: string 1–4000, subject: "message"\|"bio"\|"name"\|"other" }` | `ModerationResult` (`{ verdict: "approved"\|"flagged"\|"rejected"; ... }`, see `moderation-helpers.server.ts:11`) | `runTextModeration(text, subject)` → `persistModerationFlag({ userId, subjectType: subject, result, excerpt: text.slice(0, 280) })` | `moderation_flags` (write) |
| `moderateImage` | POST | `{ storagePath: string 1–500, bucket: "avatars"\|"gallery"\|"verification"\|"wallpapers" }` | `ModerationResult` | Creates a 300s signed URL via `supabaseAdmin.storage.from(bucket).createSignedUrl(...)`, runs `runImageModeration(signedUrl)`, then `persistModerationFlag({ userId, subjectType: bucket === "avatars" ? "avatar" : "gallery", subjectId: null, result, excerpt: storagePath })` | Supabase Storage (`avatars`/`gallery`/`verification`/`wallpapers` buckets, read), `moderation_flags` (write) |

**Failure cases:** `RateLimitError` re-thrown as-is; failed signed-URL creation throws
`Error("failed")`; all other errors funneled through `gatewayErrorToMessage`.

**Rate limit:** `ai:<userId>` — 40 calls / 60 s (independent bucket key-space from Sections 5–6
because the limit value differs, but note the **key format `ai:<userId>` is identical**, so in
practice a single 60-second window is shared across coaching (20), matchmaking (20), and
moderation (40) calls made by the same user — whichever limit is checked first in a given
window determines when `RateLimitError` starts firing, since they all increment the same
underlying counter).

---

## 8. `src/lib/ai/translate.functions.ts`

Single-purpose text translation via the AI gateway.

| Function | Method | Validator | Return type | Backing call | Rate limit |
| --- | --- | --- | --- | --- | --- |
| `translateText` | POST | `{ text: string 1–4000, targetLanguage: "ar"\|"en"\|"de"\|"fr" }` | `{ text: string }` | `chatCompletion({ messages: buildTranslateMessages(text, targetLanguage), jsonSchema: translateSchema })` (`src/lib/ai/gateway.server.ts`, `src/lib/ai/prompts.ts`) | `ai:<userId>` — 40 / 60 s (same shared key-space as Section 7) |

**Failure cases:** `GatewayError` is caught and re-thrown as `Error(error.kind)` (one of
`"rate_limited" | "payment_required" | "failed"` — see `gateway.server.ts:17`); a response that
fails to parse into `{ text: string }` throws `GatewayError("failed", "Could not parse
translation response.")`; `RateLimitError` re-thrown unchanged; anything else collapses to
`Error("failed")`.

---

## 9. `src/lib/billing/billing.functions.ts`

End-user subscription checkout, cancellation, and Stripe Billing Portal access. Backed by
`src/lib/billing/billing.server.ts` (486 lines) and, for verification, `stripe.server.ts`.

| Function | Method | Validator | Rate limit | Backing call | Tables / external |
| --- | --- | --- | --- | --- | --- |
| `createCheckout` | POST | `{ planCode: "premium"\|"premium_plus", interval: "monthly"\|"annual", returnUrl: url≤500 }` | `billing_checkout:<userId>` — 10 / 60 min | `startCheckout({ userId, planCode, interval, returnUrl })` | `plans`, `subscriptions`, Stripe Checkout |
| `cancelSubscription` | POST | none | none | `cancelAtPeriodEnd(userId)` | `subscriptions` |
| `resumeSubscription` | POST | none | none | `resumeSubscription(userId)` | `subscriptions` |
| `createPortalSession` | POST | `{ returnUrl: url≤500 }` | `billing_portal:<userId>` — 20 / 60 min | `billingPortalUrl(userId, returnUrl)` | Stripe Billing Portal session |
| `refreshBillingState` | POST | none | none | `sweepExpiries()` | `subscriptions` (transitions grace-period rows to `expired`) |

**Failure cases:** `createCheckout` catches everything, re-throwing `RateLimitError` as-is and
wrapping other errors as `Error(error.message ?? "checkout_failed")`. The other four functions
do not wrap errors — a Stripe/DB failure inside `billing.server.ts` propagates directly (check
`billing.server.ts` for the specific thrown messages, e.g. `"stripe_not_configured"` from
`stripeRequest`).

**Notes:** `GRACE_DAYS = 7` (exported constant in `billing.server.ts`) governs how long a
`past_due` subscription remains usable before `sweepExpiries()` marks it `expired`.

---

## 10. `src/lib/calls/calls.functions.ts`

Voice/video call signalling (session grants, ICE server config, entitlement checks). Backed by
`src/lib/calls/calls.server.ts` (224 lines). Doc comment: *"Entitlement (Premium / Premium Plus)
is enforced server-side."*

| Function | Method | Validator | Return type | Rate limit | Backing call | Tables |
| --- | --- | --- | --- | --- | --- | --- |
| `startCallFn` | POST | `{ conversationId: uuid, kind: "voice"\|"video" }` | `CallGrant` | `call_start:<userId>` — 20 / 10 min (rate-limit failure is caught, and `RateLimitError` is re-thrown, but **any other error from `enforceRateLimit` is silently swallowed** before proceeding to `startCall`) | `startCall({ callerId, conversationId, kind })` | `call_sessions`, `conversations`, `subscriptions`, `plans` |
| `answerCallFn` | POST | `{ callId: uuid }` | `CallGrant` | none | `answerCall(callId, userId)` | `call_sessions` |
| `closeCallFn` | POST | `{ callId: uuid, status: "rejected"\|"missed"\|"ended"\|"failed"\|"busy", reason?≤80 }` | (implementation return type, see `closeCall`) | none | `closeCall({ callId, userId, status, reason })` | `call_sessions` |
| `callEntitlementsFn` | POST | none | `{ voice: boolean; video: boolean; planCode: string }` | none | `serverLimits(userId)` | `subscriptions`, `plans` |

**Error codes:** `CallError` (`calls.server.ts:16`) carries one of the `CALL_ERRORS` codes:
`call_forbidden`, `call_not_member`, `call_plan_required`, `call_peer_busy`, `call_self`,
`call_not_found`. These are UI-mapped codes, not free-form messages — client code should switch
on `error.code` (or the message string, since `CallError extends Error` with `message = code`)
rather than pattern-matching English text.

**Entitlement authority:** per the source comment, `serverLimits`/`assertCanCall` in
`calls.server.ts` are *"the only authority for call access — the client's `useSubscription()`
result is a UX hint, never a gate."* Do not rely on client-side plan checks for security.

---

## 11. `src/lib/push/push.functions.ts`

Web Push (VAPID) subscription lifecycle and diagnostics. Backed by
`src/lib/push/webpush.server.ts` (327 lines). All five functions require authentication;
none declare an explicit rate limit.

| Function | Method | Validator | Backing call | Tables |
| --- | --- | --- | --- | --- |
| `savePushSubscription` | POST | `{ endpoint: url≤1000, p256dh: string 1–500, auth: string 1–500, expirationTime?: number\|null, userAgent?≤500, locale?≤10 }` | Inline: `context.supabase.from("push_subscriptions").upsert(..., { onConflict: "endpoint" })` | `push_subscriptions` |
| `deletePushSubscription` | POST | `{ endpoint: url≤1000 }` | Inline delete scoped to `endpoint` **and** `user_id = context.userId` | `push_subscriptions` |
| `getPushConfig` | GET | none | `vapidConfigured()` + a count query | `push_subscriptions` (count of non-disabled rows) |
| `sendTestPush` | POST | none | `sendPushToUser(userId, { title: "سَكَن", body: "الإشعارات الفورية مفعّلة على هذا الجهاز.", url: "/notifications", tag: "sakan-test", kind: "system" })` | `push_subscriptions` (read), sends via Web Push |
| `getPushDiagnostics` | GET | none | Three parallel queries: devices, last dispatched notification, pending count | `push_subscriptions`, `notifications` |

**Return shapes worth noting:**
- `getPushConfig` returns `{ configured: boolean; publicKey: string \| null; devices: number }`
  (`publicKey` sourced from `process.env["VAPID_PUBLIC_KEY"]`).
- `getPushDiagnostics` returns device rows with the **full raw endpoint string** (the code
  comment claims endpoints are shown "head/tail" only, but the implementation currently returns
  `row.endpoint as string` unmodified — flagging this as a discrepancy between comment and code
  for anyone hardening this response before wider exposure).

**Failure cases:** `savePushSubscription`/`deletePushSubscription` throw
`Error(error.message)` on any Supabase error; the other three do not perform explicit error
handling beyond what Supabase/`webpush.server.ts` raises.

---

## 12. `src/lib/pwa/analytics.functions.ts`

Single unauthenticated function for PWA install funnel telemetry.

| Function | Method | Validator | Auth | Rate limit | Backing writes |
| --- | --- | --- | --- | --- | --- |
| `recordInstallEvent` | POST | `{ eventType: "prompt_shown"\|"accepted"\|"dismissed"\|"installed"\|"uninstalled", platform?≤60, locale?≤10 }` | **None** — deliberately public because `beforeinstallprompt`/`appinstalled` fire for signed-out visitors | `pwa_install:<eventType>` — 600 / 60 s | `supabaseAdmin.from("pwa_install_events").insert(...)` |

**Failure handling:** the entire body is wrapped in `try { ... } catch { /* swallow */ }` — the
function **always** returns `{ ok: true }` regardless of rate-limit or insert failure, per the
source comment: *"analytics must never break the install flow."* This is the only function in
the codebase that unconditionally reports success even when its side effect did not happen;
do not use its return value to infer whether the event was actually recorded.

**Table:** `pwa_install_events` — written via `supabaseAdmin` because the table is
admin-read-only (no end-user RLS `SELECT`/`INSERT` policy is expected for anon/authenticated
roles).

---

## Rate-Limiting Reference

All limits are enforced by `enforceRateLimit(key, limit, windowMs)` from
`src/lib/rate-limit.server.ts`, counting rows in `activity_logs` where
`event = 'rl:' || key` within the trailing `windowMs`. The limiter **fails open**: a query
error while counting never blocks the call.

| Key pattern | Limit | Window | Used by |
| --- | --- | --- | --- |
| `ad_checkout:<userId>` | 5 | 60 min | `ads.functions.ts` → `createFeaturedCheckout` |
| `ad_track:<adId>:<metric>` | 120 | 60 s | `ads.functions.ts` → `trackAdEvent` (failure is swallowed, returns `{ ok: true }`) |
| `ai:<userId>` | 20 | 60 s | `coaching.functions.ts` (all 4 functions), `matchmaking.functions.ts` (both functions) |
| `ai:<userId>` | 40 | 60 s | `moderation.functions.ts` (both functions), `translate.functions.ts` → `translateText` |
| `billing_checkout:<userId>` | 10 | 60 min | `billing.functions.ts` → `createCheckout` |
| `billing_portal:<userId>` | 20 | 60 min | `billing.functions.ts` → `createPortalSession` |
| `call_start:<userId>` | 20 | 10 min | `calls.functions.ts` → `startCallFn` |
| `pwa_install:<eventType>` | 600 | 60 s | `pwa/analytics.functions.ts` → `recordInstallEvent` |

**Important caveat:** because the counter key is literally `ai:<userId>` for four different
files with two different limit values (20 vs. 40), all AI endpoints for a given user share one
counter. The effective behavior is: the first `enforceRateLimit` call in a 60-second window
establishes the marker; whichever limit (20 or 40) is checked by the *next* call determines
whether it is rejected, but all calls increment the *same* underlying count. In practice, a
user who rapidly alternates between `translateText` (limit 40) and `suggestIceBreakers` (limit
20) will be blocked from the 20-limit endpoints well before hitting 40 total calls.

No `enforceRateLimit` calls exist in `admin.functions.ts` or `ops.functions.ts` — those
surfaces rely solely on role checks (`assertStaff`/`assertAdmin`/`is_super_admin`), not
request-volume throttling, since they are staff-only.

---

Related: [`API.md`](./API.md) for the client-facing contract (transport, auth attachment,
public HTTP routes, error handling patterns) built on top of everything documented here.
