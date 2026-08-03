# Changelog

## Purpose

This changelog records the development history of the SAKAN platform in
semantic-version phases. Entries describe changes that are present in the
codebase; nothing planned or speculative is listed here (see
[ROADMAP.md](./ROADMAP.md) for future work).

The project follows [Semantic Versioning](https://semver.org/) at the platform
level: each delivery phase increments the minor version until the production
release candidate, which establishes `1.0.0`.

## Table of contents

1. [1.0.0 — Production release candidate](#100--production-release-candidate)
2. [0.5.0 — Reliability: PWA, push and offline](#050--reliability-pwa-push-and-offline)
3. [0.4.0 — Commercial readiness](#040--commercial-readiness)
4. [0.3.0 — Real-time platform](#030--real-time-platform)
5. [0.2.0 — Core platform infrastructure](#020--core-platform-infrastructure)
6. [0.1.0 — Design prototype](#010--design-prototype)
7. [Breaking changes index](#breaking-changes-index)
8. [Cross references](#cross-references)

---

## 1.0.0 — Production release candidate

**Documentation**

- Added the `docs/` documentation system: architecture, database, API, server
  functions, security, deployment, testing, PWA, billing, admin, AI, features,
  routes, folder structure, translations, contributing, roadmap and known
  limitations. `README.md` remains the entry point and links into `docs/`.

**Fixed**

- `notify_on_match()` used the literal string `'match'` as the notification
  title. The trigger now resolves the counterpart member's `display_name`.
- Removed the `messages_body_len` check constraint that required
  `char_length(body) >= 1`. Delete-for-everyone tombstones and attachment-only
  messages legitimately carry an empty body; the constraint is now
  `CHECK (char_length(body) <= 4000)`.
- `src/lib/chat/queries.ts`: `editMessage`, `deleteMessageForEveryone` and
  `setMessagePinned` capture the previous cache entry and roll the optimistic
  patch back when the write fails.
- `src/routes/member.$id.tsx`: the favourite control invoked the conversation
  handler; it is now wired to the favourites mutation.
- `src/lib/members.ts`: `fetchMembers` excludes the viewer (`.neq("id",
  viewerId)`), preventing self-likes and self-match errors.

**Accessibility**

- Landing-page search controls received `aria-label` and `htmlFor` pairing.

---

## 0.5.0 — Reliability: PWA, push and offline

**Infrastructure**

- **Breaking (service worker):** replaced the hand-written service worker with
  `vite-plugin-pwa` (Workbox `generateSW`). Push, notification-click and sync
  handlers moved to `public/sw-push.js` and are pulled in with `importScripts`,
  so a single worker is served at `/sw.js`. Previously installed workers are
  replaced through `clientsClaim` + `skipWaiting`.
- Set the PWA `outDir` to `dist/client` so precache URLs resolve against the
  served asset root instead of being prefixed with `client/`.

**Added**

- RFC 8291 Web Push encryption implemented in `src/lib/push/webpush.server.ts`
  (no Node-only dependency; Worker-safe).
- Offline outbox (`src/lib/outbox.ts`) with replay on reconnect.
- Diagnostics console at `/diagnostics` (push console, server state, cache
  inspector).

**Changed**

- Push delivery moved from a one-minute `pg_cron` poll to the
  `dispatch_push_on_notification` AFTER INSERT trigger calling
  `/api/public/push-dispatch` immediately.
- `activeRegistration()` in `src/lib/push/push-browser.ts` gained a 10-second
  timeout to avoid silent hangs.
- Delivery retries for transient statuses (408, 429, 5xx); Web Push urgency set
  to `high`.

**Fixed**

- Route guards no longer treat a dead network as a signed-out session:
  `src/lib/auth/offline-session.ts` falls back to the persisted session when the
  auth call fails with a transport error.

---

## 0.4.0 — Commercial readiness

**Added**

- Stripe billing: checkout, hosted customer portal, subscription lifecycle,
  grace period and refunds (`src/lib/billing/*`).
- Webhook receiver at `/api/public/stripe-webhook` with signature verification
  and idempotency through the `webhook_events` table.
- Plan/entitlement model (`plans`, `subscriptions`) with server-side gating.
- WebRTC voice and video calling (`src/lib/calls/*`,
  `src/components/calls/*`) with server-authoritative entitlement checks.
- Featured banner monetization and ad placements (`src/lib/ads/*`).
- Administrative back office under `/admin` with audit logging.
- Identity verification (KYC) request and review flow.
- SEO layer: `src/lib/seo.ts`, `LocalizedSeo`, generated `/sitemap.xml`.

**Security**

- Restricted `anon` access to sensitive profile columns.
- Revoked public execution on `SECURITY DEFINER` functions.

---

## 0.3.0 — Real-time platform

**Added**

- `RealtimeBridge` mounting presence, notifications, social-graph and account
  subscriptions once per session.
- Real-time 1:1 messaging with delivery/read receipts, typing indicators and
  attachments; message reactions, pinning, editing, deletion, forwarding and
  swipe-to-reply.
- Chat wallpapers with per-conversation overrides.
- Notification centre with grouping, real-time updates and swipe-to-dismiss.
- Presence with idle detection and privacy modes (online, away, busy, DND,
  invisible).
- AI services: in-chat translation, moderation, bio assistance and
  ice-breakers.
- Glassmorphism bottom navigation for mobile; list virtualization for search
  results and conversations.

**Breaking (localization)**

- Russian (`ru`) was removed and replaced by French (`fr`) across the entire
  platform, including the `language_code` enum values in use.

---

## 0.2.0 — Core platform infrastructure

**Added**

- Supabase backend: core schema, Row Level Security on every user-data table,
  private storage buckets with path-scoped access.
- Authentication with protected-route gating and role storage in `user_roles`.
- Multi-step onboarding with Zod validation (`src/lib/validation.ts`).
- Locale provider and persistence (`LocaleSync`) for `ar`, `en`, `de`.

**Breaking (data)**

- Local mock member data was replaced by live database reads through TanStack
  Query.

---

## 0.1.0 — Design prototype

**Added**

- Design system in `src/styles.css` (Navy `#0D1B3D`, Gold `#D4AF37`, Cairo,
  Montserrat).
- Home, search results and member profile screens with RTL support.
- Header, footer and member card components.

---

## Breaking changes index

| Version | Change | Migration required |
|---|---|---|
| 0.5.0 | Service worker replaced by Workbox-generated `/sw.js` | Clients update automatically on next load |
| 0.5.0 | Push dispatch moved from cron poll to database trigger | `PUSH_DISPATCH_TOKEN` must match the trigger configuration |
| 0.4.0 | Feature gating enforced server-side | Entitlements now require an active subscription row |
| 0.3.0 | Locale `ru` replaced by `fr` | Stored user preferences of `ru` fall back to the default locale |
| 0.2.0 | Mock data replaced by database reads | Full schema migration |
| 1.0.0 | `messages_body_len` constraint replaced | Applied by migration |

---

## Cross references

- [ROADMAP.md](./ROADMAP.md)
- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)