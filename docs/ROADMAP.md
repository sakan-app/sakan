# Roadmap

## Purpose

This roadmap separates what is **already implemented** from what is
**planned**. It exists so that contributors and stakeholders never mistake a
proposal for a shipped capability. Every item in the "Planned" sections is
future work and is not present in the codebase today; every item in
[Implemented baseline](#1-implemented-baseline) can be traced to source files.

## Table of contents

1. [Implemented baseline](#1-implemented-baseline)
2. [Near-term (next iteration)](#2-near-term-next-iteration)
3. [Mid-term](#3-mid-term)
4. [Long-term](#4-long-term)
5. [Explicitly out of scope](#5-explicitly-out-of-scope)
6. [Cross references](#6-cross-references)

---

## 1. Implemented baseline

> **Note**
> This section is descriptive, not aspirational. See [FEATURES.md](./FEATURES.md)
> for the detailed breakdown of each capability.

| Area | Status | Source |
|---|---|---|
| Authentication, onboarding, profiles | Implemented | `src/routes/auth.*`, `src/routes/_authenticated/onboarding.tsx`, `src/lib/profile-queries.ts` |
| Search, discovery, saved searches | Implemented | `src/routes/search.tsx`, `src/lib/members.ts` |
| Likes, favourites, matches | Implemented | `src/lib/social/*` |
| Real-time chat with reactions, pins, attachments, wallpapers | Implemented | `src/lib/chat/*`, `src/components/chat/*` |
| Voice and video calling | Implemented; TURN relay optional | `src/lib/calls/*` |
| Presence, DND, notification centre | Implemented | `src/hooks/usePresence.ts`, `src/hooks/useNotifications.ts` |
| Web Push and offline outbox | Implemented | `src/lib/push/*`, `src/lib/outbox.ts` |
| Stripe billing, portal, webhooks | Implemented | `src/lib/billing/*`, `src/routes/api/public/stripe-webhook.ts` |
| Featured banner and ad placements | Implemented | `src/lib/ads/*` |
| Verification (KYC), reports, blocking | Implemented | `src/routes/admin/verifications.tsx`, `reports` table |
| Admin back office with audit logging | Implemented | `src/routes/admin/*`, `src/lib/admin/*` |
| AI translation, moderation, matchmaking, coaching | Implemented | `src/lib/ai/*` |
| Four-locale i18n with RTL | Implemented | `src/i18n/*` |
| PWA install, precache, runtime caching | Implemented | `vite.config.ts`, `public/sw-push.js` |

---

## 2. Near-term (next iteration)

*Planned — not implemented.*

| Item | Rationale | Primary touch points |
|---|---|---|
| Automated test harness | Close the gap described in [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md#1-testing-and-verification): unit tests for `src/lib/**` pure logic and Playwright smoke flows for auth, chat and checkout | new `tests/`, `package.json` scripts |
| Dedicated rate-limit storage | Replace the `activity_logs`-backed limiter with a purpose-built table and an atomic counter function so limits stop failing open and stop inflating the log table | `src/lib/rate-limit.server.ts`, new migration |
| `activity_logs` retention job | Scheduled pruning of rate-limit markers and old log rows | new migration |
| Configurable TURN relay | Document and provision a managed TURN service so calls succeed behind symmetric NAT | `src/lib/calls/calls.server.ts` |
| Push delivery observability | Persist dispatch attempts (currently returned in the response payload only) for operational debugging | `src/routes/api/public/push-dispatch.ts` |

---

## 3. Mid-term

*Planned — not implemented.*

| Item | Rationale |
|---|---|
| Geospatial search | Coordinate-based distance filtering, replacing country/city text matching |
| Full-text member search | Ranked text search over bio and profile fields with a Postgres text index |
| Compatibility score invalidation | Recompute or expire `compatibility_scores` when a profile changes materially |
| Second payment provider | Regional coverage for markets where Stripe is unavailable, using the existing `PaymentProvider` abstraction |
| Group and family-mediated conversations | Extend the strictly 1:1 conversation model |
| Advanced moderation queue | Prioritised triage view combining `moderation_flags`, `reports` and message history |
| Data export and account deletion self-service | GDPR subject-access automation on top of the existing consent records |

---

## 4. Long-term

*Planned — not implemented.*

| Item | Rationale |
|---|---|
| Native mobile shells | Wrap the PWA for app-store distribution where Web Push and installation are constrained |
| Matchmaker workspace | Tooling for human matchmakers to curate introductions alongside the AI recommendations |
| Multi-region data residency | Route storage and database access per region for regulatory requirements |
| Behavioural recommendation model | Learn from interaction signals rather than profile attributes alone |
| Public partner API | Authenticated external API for vetted community organisations |

---

## 5. Explicitly out of scope

These directions have been considered and are deliberately excluded:

- **Casual dating mechanics.** Swipe-first, ephemeral or anonymous interaction
  patterns conflict with the platform's marriage-oriented positioning.
- **Public profile indexing of private data.** Member photos remain in private
  buckets served through short-lived signed URLs.
- **Supabase Edge Functions.** Server logic stays in `createServerFn` and
  TanStack server routes; see [ARCHITECTURE.md](./ARCHITECTURE.md).
- **Client-side authorization.** Entitlements and roles are resolved
  server-side; client state is a UX hint only.

---

## 6. Cross references

- [FEATURES.md](./FEATURES.md)
- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)