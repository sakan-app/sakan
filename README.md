<div align="center">

# SAKAN — سَكَن
### The International Marriage & Serious Matchmaking Platform

**Navy `#0D1B3D` · Gold `#D4AF37` · Cairo (Arabic) · Montserrat (Latin)**

A production-grade, multilingual (Arabic · English · German · French) matrimonial platform
with a native-app-quality mobile experience, real-time messaging, AI assistance,
subscriptions, advertising monetization and a full administrative back office.

</div>

---

## Table of Contents

1. [Overview](#1-overview)
2. [Brand & Design System](#2-brand--design-system)
3. [Technical Architecture](#3-technical-architecture)
4. [Public Pages](#4-public-pages)
5. [Accounts & Authentication](#5-accounts--authentication)
6. [Profiles & Progressive Onboarding](#6-profiles--progressive-onboarding)
7. [Profile Studio (Personalization)](#7-profile-studio-personalization)
8. [Search & Discovery](#8-search--discovery)
9. [Social Layer: Likes, Favorites, Matches](#9-social-layer-likes-favorites-matches)
10. [Real-Time Messaging](#10-real-time-messaging)
11. [Chat Wallpapers](#11-chat-wallpapers)
12. [Presence, DND & Notification Center](#12-presence-dnd--notification-center)
13. [AI Services](#13-ai-services)
14. [Subscriptions & Billing (Stripe)](#14-subscriptions--billing-stripe)
15. [Monetization: Featured Banner & Ad Slots](#15-monetization-featured-banner--ad-slots)
16. [Verification (KYC), Reports & Moderation](#16-verification-kyc-reports--moderation)
17. [Admin Dashboard](#17-admin-dashboard)
18. [Internationalization & RTL](#18-internationalization--rtl)
19. [Progressive Web App](#19-progressive-web-app)
20. [Database Schema](#20-database-schema)
21. [Security Model](#21-security-model)
22. [Performance, SEO & Accessibility](#22-performance-seo--accessibility)
23. [Route Map](#23-route-map)
24. [Folder Structure](#24-folder-structure)
25. [Environment, Secrets & Operations](#25-environment-secrets--operations)
26. [Legal & Company Information](#26-legal--company-information)

---

## 1. Overview

**SAKAN** is not a casual dating app. It is a serious marriage platform built for the Arab and
Muslim community both in the Arab world and in the diaspora (primarily Europe). The name comes
from the Qur'anic phrase *«لتسكنوا إليها»* — dwelling, tranquility, home. The logo merges two
wedding rings with a rooftop to form a heart: marriage = sakan = home.

| Pillar | What it means in the product |
|---|---|
| Seriousness | Identity-verified profiles, reporting, blocking, human + automated moderation |
| Privacy | All photos live in **private** storage buckets, served through short-lived signed URLs |
| Global reach | 4 complete languages, automatic RTL/LTR switching, instant in-chat translation |
| Intelligence | AI compatibility scoring, ice-breakers, smart replies, bio rewriting, profile scoring |
| Sustainability | Subscription plans + paid featured banner + ad slots, all through Stripe |
| Trust | GDPR-first data handling, German operator imprint, explicit consent records |

---

## 2. Brand & Design System

- **Palette (design tokens only — no hardcoded colors anywhere):** Navy `#0D1B3D` as the base
  surface, Deep Navy for elevated glass panels, Gold `#D4AF37` for all primary actions and
  accents, Cream for text, plus semantic success / warning / destructive tokens.
- **Typography:** Cairo for Arabic, Montserrat for Latin scripts, loaded via `<link>` in the
  root route (never `@import` in CSS, per the Tailwind v4 build).
- **Language:** Glassmorphism — translucent navy panels, gold hairline borders, soft elevation
  shadows (`--shadow-card`), rounded 2xl/3xl geometry.
- **Motion:** `fade-up`, `tap-scale`, page transitions and list stagger, all wrapped in
  `motion-safe:` so `prefers-reduced-motion` fully disables them.
- **Tailwind v4** configured through `src/styles.css` with `@theme` variables; every color,
  gradient and shadow is a semantic token so theming and dark surfaces stay consistent.

---

## 3. Technical Architecture

| Layer | Technology |
|---|---|
| Framework | TanStack Start v1 (SSR + file-based routing) on React 19 |
| Language | TypeScript (strict) |
| Build | Vite 7, edge/Worker target |
| Routing | TanStack Router (`src/routes`, generated `routeTree.gen.ts`) |
| Data | TanStack Query with route-loader prefetch + `useSuspenseQuery` |
| Styling | Tailwind CSS v4 + shadcn/ui primitives |
| Backend | Lovable Cloud (Postgres, Auth, Realtime, Storage) |
| Server logic | `createServerFn` from `@tanstack/react-start` |
| Public HTTP | File routes under `src/routes/api/public/*` (Stripe webhook) |
| AI | Lovable AI Gateway (`src/lib/ai/gateway.server.ts`) |
| Payments | Stripe (fetch-only adapter, no SDK, Worker-safe) |

**Boundaries.** Client components import `*.functions.ts` only; server-only code lives in
`*.server.ts` files that never enter the client graph. Environment variables are read *inside*
handlers. Protected server functions use the `requireSupabaseAuth` middleware and are never
called from public route loaders.

---

## 4. Public Pages

- **Landing (`/`)** — hero with search entry (gender, age range, country), live stats,
  "why SAKAN" feature grid, nearby active members, success stories, featured ticker.
- **Search (`/search`)** — public member browsing with refinement.
- **Member profile (`/member/$id`)** — public-safe profile view.
- **Pricing (`/pricing`)** — plan comparison cards.
- **About, Guide, Privacy (GDPR), Terms, Imprint** — full legal suite in 4 languages,
  driven by `src/lib/legal/*` and rendered through a shared `LegalPage` component.
- **Offline (`/offline`)** and **Unauthorized (`/unauthorized`)** system pages.
- **`/sitemap.xml`** generated from the route map; `robots.txt` in `public/`.

---

## 5. Accounts & Authentication

- Email + password sign-up/sign-in, plus **Google OAuth**.
- Email confirmation flow with resend, password reset and "set new password" screens.
- `/auth/callback` completes OAuth and hydrates the session before redirecting to the
  originally intended path (never straight into a protected route).
- The `_authenticated` route subtree is gated: unauthenticated visitors are redirected to
  `/auth` before any loader runs.
- Client-side function middleware attaches the bearer token to every protected server call.
- Friendly, translated error mapping (`src/lib/auth-errors.ts`) for invalid credentials,
  unconfirmed email, rate limits, weak/leaked passwords and duplicate accounts.

---

## 6. Profiles & Progressive Onboarding

Three-step onboarding: **Basics → About you → Photo**.

Fields: display name, birth date (18+ enforced), gender, looking-for, country, city, bio,
occupation, education, marital status, religiosity, height, interests, spoken languages.

- Live **profile completeness** meter.
- Photo upload constrained to JPG/PNG/WEBP up to 5 MB, stored privately.
- Gallery management (add/remove) on `/profile` with signed-URL delivery.
- `/profile/edit` for full editing, including the AI bio assistant.

---

## 7. Profile Studio (Personalization)

`/profile/appearance` — the personalization surface:

- **Accent color** selection layered over the navy/gold base.
- **Cover image** for the profile header.
- **Glass intensity** control for the glassmorphism panels.
- **Avatar border styles**.
- **Presence privacy**: invisible mode, hide last-seen, hide typing indicator.
- **AI Profile Strength card** — calls `suggestProfileQuality` to score the profile 0–100 and
  return concrete, localized improvement suggestions.

---

## 8. Search & Discovery

- Filters: gender, age range, country/city, plus refinement panel (`SearchRefine`).
- Sorting: most active, newest, most complete.
- **Saved searches** and **recent search chips** (`saved_searches` table + local history).
- **Virtualized member grid** (`VirtualMemberGrid`) for long result sets; plain layout is kept
  for short lists to avoid unnecessary overhead.
- **AI recommendations** panel surfacing compatibility-ranked suggestions.
- `/discover`, `/matches`, `/favorites` and `/home` for signed-in members.

---

## 9. Social Layer: Likes, Favorites, Matches

- **Likes** with optimistic updates and realtime invalidation.
- **Favorites** list with instant add/remove feedback.
- **Matches** created when interest is mutual, surfaced on `/matches`.
- **Compatibility scores** persisted per pair and shown as a percentage in the chat header
  and on member cards.
- **Blocking** (`blocked_users`) removes a member from search, chat and notifications.

---

## 10. Real-Time Messaging

The flagship surface, built to feel like Telegram/WhatsApp/iMessage.

**Composition & delivery**
- Text, emoji picker, image attachments, optimistic send, offline **outbox** with retry.
- Delivery states: sending → sent → delivered → read, with clear iconography.
- Typing indicators (respecting the sender's privacy setting).
- Realtime via Postgres changes on `messages`, `message_reactions` and `conversations`.

**Interactions**
- **Swipe to reply** with haptic feedback on touch devices.
- **Long-press / right-click context menu**: reply, copy, forward, edit, pin, delete,
  translate, report, message info.
- **Reactions** (❤️ 👍 👎 😂 😮 😢 🙏) stored in `message_reactions`, optimistic + realtime.
- **Edit** and **delete** (for me / for everyone) with a dedicated confirmation dialog.
- **Multi-select mode** with a selection bar for bulk forward/delete.
- **Forward sheet** to pick a destination conversation.
- **Pinned banner** for pinned messages.
- **In-conversation search** with highlight and jump-to-result.
- **Unread divider**, jump-to-latest button, image viewer with zoom.
- **Instant translation** of any message into the reader's language via the AI gateway.

**List screen (`/messages`)** — virtualized conversation list with presence dots, unread
counts, last-message preview and empty states.

---

## 11. Chat Wallpapers

- Curated built-in wallpaper catalog plus **custom uploads for premium members**
  (private bucket + signed URLs).
- Per-conversation settings *and* a global default from `/settings`.
- Controls: opacity, blur, brightness and a readability overlay.
- A **readability guard** (`ensureReadable`) clamps values so bubble text always stays above
  WCAG AA contrast on any wallpaper.
- Cross-fade transition when switching wallpapers; three non-interactive layers
  (image → scrim → content).

---

## 12. Presence, DND & Notification Center

**Presence**
- States: online, away, busy, do-not-disturb, invisible.
- Automatic transitions: away after idle, back to online on return.
- One unified `PresenceIndicator` (colored dot + tooltip) reused across member cards, the
  conversation list, the chat header and notifications.
- Privacy switches for invisible mode, last-seen and typing visibility.

**Notification Center (`/notifications`)**
- Inbox / Archive tabs, filters by type, instant search.
- Time grouping (Today / Yesterday / Earlier).
- Multi-select with bulk read, archive and delete.
- Swipe-to-delete with haptics on mobile.
- Realtime updates and an unread badge in the header bell.
- **DND is respected**: toasts and sounds are muted while the member is in do-not-disturb.

---

## 13. AI Services

All AI runs through the Lovable AI Gateway from server functions with JSON-schema-constrained
responses, per-user rate limiting and typed error kinds.

| Feature | Where |
|---|---|
| Compatibility scoring & ranked recommendations | Search / Discover |
| Ice-breakers (conversation starters) | Chat AI suggestion bar |
| Smart replies | Chat AI suggestion bar |
| Message translation | Message context menu |
| Bio rewriting with notes | `/profile/edit` |
| Profile quality score + suggestions | Profile Studio |
| Content moderation flags | Messages & photos → `moderation_flags` |

---

## 14. Subscriptions & Billing (Stripe)

- Plans stored in `plans`; member state in `subscriptions` with a **grace period** before
  entitlements are revoked.
- Entitlement checks gate premium features (custom wallpapers, advanced AI, visibility perks).
- `/billing` shows the current plan, renewal date, invoice history and billing events.
- **Provider-agnostic payment adapter** (`src/lib/billing/provider.server.ts`) with a real
  Stripe implementation built on `fetch` only — Worker-safe, no Node-only SDK.
- Signed **webhook** at `/api/public/stripe-webhook` verifies the Stripe signature before
  processing; unsigned requests are rejected with 401.
- Realtime: subscription, payment and billing-event changes invalidate the client cache
  instantly after checkout, renewal, cancellation or expiry.

### Billing architecture

| Layer | File | Role |
| --- | --- | --- |
| REST client | `src/lib/billing/stripe.server.ts` | fetch-based Stripe client, key resolution (live vs test), webhook signature verification |
| Provider adapter | `src/lib/billing/provider.server.ts` | `createCheckout` / `cancel` / `resume` / `portal`; manual (CCP) fallback provider |
| Customer mapping | `src/lib/billing/customers.server.ts` | `billing_customers` table: member ↔ `cus_…`; reverse lookup for invoices & charges |
| Lifecycle | `src/lib/billing/billing.server.ts` | activate, cancel-at-period-end, resume, payment failure + grace, refunds, expiry sweep |
| Event handlers | `src/lib/billing/webhook.server.ts` | one handler per Stripe event, correct object hierarchy |
| Endpoint | `src/routes/api/public/stripe-webhook.ts` | signature check → idempotency claim → dispatch |
| Server fns | `src/lib/billing/billing.functions.ts` | `createCheckout`, `cancelSubscription`, `resumeSubscription`, `createPortalSession` (all auth + rate limited) |

### Webhook lifecycle & metadata sources

Only Checkout Sessions and Subscriptions carry our metadata. Invoices and Charges never do,
so they are resolved through the parent subscription or the customer mapping:

| Event | Resolution source | Effect |
| --- | --- | --- |
| `checkout.session.completed` | `session.metadata` | first activation (or featured-ad publish) |
| `invoice.paid` (`subscription_cycle`) | `invoice.subscription` → subscription metadata → `billing_customers` | renewal: extends period, records payment |
| `invoice.payment_failed` | same as above | `past_due` + 3-day grace + in-app notification |
| `customer.subscription.updated` | `subscription.metadata` / mappings | mirrors cancel flag, status and period end |
| `customer.subscription.deleted` | `subscription.metadata` / mappings | access ends |
| `charge.refunded` | `charge.invoice` → subscription, or customer mapping | payment marked refunded; full refund closes the subscription |

### Idempotency & consistency

- Every delivery claims a row in `webhook_events` by unique event id; duplicates are ack'd
  without reprocessing, and failures delete the claim so Stripe's retry can reprocess.
- Activation is additionally guarded by a payment-level idempotency ref (checkout session id
  for the first purchase, invoice id for renewals) — concurrent retries cannot double-extend
  a period or double-record a payment.
- Refunds and failed payments check the existing payment row before writing.
- Stripe's `current_period_end` is authoritative when present; local date maths is a fallback.

### Renewal, grace, resume, portal

- **Renewal** — driven by `invoice.paid`; plan and interval are preserved, the period is
  extended and a payment + billing event is recorded.
- **Failure** — grace window of 3 days (`grace_until`), status `past_due`, notification to the
  member; a later successful payment restores `active` automatically.
- **Resume** — calls Stripe first (`cancel_at_period_end: false`) and only then updates the
  database, so a subscription Stripe already ended cannot be silently "resumed" locally.
- **Portal** — `/billing` → “Manage payment & invoices” opens a Stripe Billing Portal session
  for payment methods, invoices and cancel/resume; changes flow back through webhooks.

### Scheduled jobs

`public.sweep_billing_lifecycle()` runs hourly via `pg_cron` (`sakan-billing-sweep`): it moves
lapsed subscriptions into grace, expires them when the grace window closes, and writes the
matching billing events. No client-side refresh is required.

Required secrets: `STRIPE_SECRET_KEY` (or `STRIPE_TEST_API_KEY` for test mode),
`STRIPE_WEBHOOK_SECRET` (must start with `whsec_`).

---

## 15. Monetization: Featured Banner & Ad Slots

- **Featured banner** — a marquee ticker of promoted member photos. Each creative travels
  across the strip over ~3 minutes, then the next one takes over. Price: **€0.99 per creative**,
  paid through Stripe checkout, queued in `featured_ads`, reviewed by admins.
- **Creative cropper** in the promote flow enforces the correct aspect ratio before upload.
- **Ad placements** (`ad_placements`) render through a generic `AdSlot` component in
  well-defined positions, ready for AI agents or ad networks.
- Admin review page for approving, rejecting and scheduling both featured ads and placements.

---

## 16. Verification (KYC), Reports & Moderation

- Members submit identity/photo verification (`verification_requests`); status changes are
  pushed to the client in realtime and reflected by a verified badge everywhere.
- **Reports** (`reports`) on members and messages with reason codes and admin resolution.
- **Automated moderation flags** from the AI moderation functions, queued for human review.
- **Admin notes** and a full **activity log** / **admin actions** audit trail.

---

## 17. Admin Dashboard

Routes under `/admin`, protected by a role gate:

Dashboard · Users · User detail · Verifications · Reports · Conversations · Matches ·
Subscriptions · Payments · Ads · Notifications · Analytics · Activity · Settings.

- Role management from the users table: promote/demote **moderator**, **admin** and
  **super admin** (the super-admin option is visible to super admins only).
- Roles live in a dedicated `user_roles` table with a `has_role` security-definer function —
  never on the profile row — to prevent privilege escalation.
- Virtualized admin tables with captions, scoped headers and keyboard scrolling.
- Confirm dialogs for every destructive action.
- Platform settings stored in `platform_settings`.

---

## 18. Internationalization & RTL

- Official languages: **Arabic (default, RTL)**, **English**, **German**, **French**.
- Dictionaries in `src/i18n/locales/{ar,en,de,fr}.ts`, typed against the Arabic dictionary so a
  missing key is a compile error.
- Direction (`dir`) and font family switch automatically with the locale.
- Language switcher in the header and in profile preferences; preference persisted per member.
- Every feature area ships its own strings module (chat, billing, ads, admin, legal, PWA…).

---

## 19. Progressive Web App

- `public/manifest.webmanifest` with icons, theme color and standalone display.
- Service worker (`public/sw.js`) for asset caching and offline fallback to `/offline`.
- Custom install prompt (`InstallPrompt`) surfaced at a sensible moment.
- Offline banner, outbox-backed message queueing and background retry.
- Safe-area insets honored across the bottom nav, composer and sheets.

---

## 20. Database Schema

Public tables: `profiles`, `photos`, `user_roles`, `consents`, `likes`, `favorites`, `matches`,
`compatibility_scores`, `blocked_users`, `conversations`, `messages`, `message_reactions`,
`chat_wallpapers`, `notifications`, `saved_searches`, `reports`, `moderation_flags`,
`verification_requests`, `plans`, `subscriptions`, `payments`, `billing_events`,
`featured_ads`, `ad_placements`, `platform_settings`, `admin_actions`, `admin_notes`,
`activity_logs`.

Views / functions: `current_subscription`, `has_role`, `is_conversation_participant`,
`get_or_create_conversation`.

Storage buckets are **private**; every file is addressed as `<user_id>/<uuid>.<ext>` and
delivered through short-lived signed URLs.

---

## 21. Security Model

- **RLS enabled on every public table**, with explicit `GRANT`s per role in the same migration.
- Ownership policies scope rows to `auth.uid()`; conversation access goes through
  `is_conversation_participant`; admin access through `has_role`.
- Roles are never client-trusted: privileged checks always re-verify server-side.
- Server functions validate input with Zod and enforce per-user rate limits.
- The Stripe webhook verifies HMAC signatures with a timing-safe comparison.
- Secrets never reach the client bundle; only `VITE_*` values are public.
- GDPR: consent records, private media, data-minimizing public profile projections.

---

## 22. Performance, SEO & Accessibility

**Performance** — route-level code splitting, loader prefetch with `ensureQueryData`,
window virtualization for search results, conversation list and admin tables, memoized
list rows, optimistic mutations, lazy image loading.

**SEO** — unique `head()` per route (title, description, OG and Twitter cards), JSON-LD for
the organization and legal pages, canonical tags, generated sitemap, `robots.txt`, and
`noindex` on private surfaces.

**Accessibility (WCAG AA)** — verified contrast on all surfaces including wallpapers,
visible focus rings, ARIA labels/roles (`role="group"`, `aria-pressed`, `aria-live`),
labelled AI suggestion regions, keyboard-operable menus and tables, and full
`prefers-reduced-motion` support.

---

## 23. Route Map

**Public:** `/` · `/search` · `/member/$id` · `/pricing` · `/about` · `/guide` · `/privacy` ·
`/terms` · `/impressum` · `/auth` · `/auth/callback` · `/auth/reset-password` · `/offline` ·
`/unauthorized` · `/sitemap.xml`

**Member (`_authenticated`):** `/home` · `/discover` · `/matches` · `/favorites` ·
`/messages` · `/messages/$id` · `/notifications` · `/profile` · `/profile/edit` ·
`/profile/appearance` · `/settings` · `/billing` · `/featured` · `/onboarding`

**Admin:** `/admin` · `/admin/dashboard` · `/admin/users` · `/admin/user/$id` ·
`/admin/verifications` · `/admin/reports` · `/admin/conversations` · `/admin/matches` ·
`/admin/subscriptions` · `/admin/payments` · `/admin/ads` · `/admin/notifications` ·
`/admin/analytics` · `/admin/activity` · `/admin/settings`

**API:** `/api/public/stripe-webhook`

---

## 24. Folder Structure

```text
src/
  routes/            file-based routes (__root, public, _authenticated, admin, api)
  components/        admin, ads, app, billing, chat, legal, notifications,
                     presence, profile, pwa, search, social, ui
  lib/
    ai/              gateway, prompts, matchmaking, moderation, coaching, translate
    billing/         plans, provider adapter, Stripe, queries, types
    ads/             featured ads + placements
    chat/            queries, realtime, reactions, wallpapers, strings, types
    admin/           admin + ops server logic and strings
    notifications/   shared icon map and helpers
    profile/         appearance and presence settings
    social/          likes, favorites, matches
    legal/           about, privacy, terms, imprint, guide content
  i18n/              ar · en · de · fr dictionaries
  hooks/             useAuth, useSubscription, useNotifications, usePresence
  integrations/      Lovable Cloud clients and auth middleware
```

Naming rules: `*.functions.ts` = client-callable server functions,
`*.server.ts` = server-only helpers, `*.strings.ts` = localized copy.

---

## 25. Environment, Secrets & Operations

Public (client) variables come from `VITE_*`. Server secrets are configured in the project's
secret store and read inside handlers:

| Secret | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe API calls (subscriptions, featured-ad checkout) |
| `STRIPE_WEBHOOK_SECRET` | Signature verification for `/api/public/stripe-webhook` |
| `LOVABLE_API_KEY` | AI Gateway access (managed) |

Secrets are **not** managed through GitHub — the repository contains code only.

Stable URLs for external services (cron, Stripe webhooks):
`project--<id>.lovable.app` (production) and `project--<id>-dev.lovable.app` (preview).

Roles: assign the first `super_admin` in the database, then manage all other roles from
`/admin/users`.

---

## 26. Legal & Company Information

```text
Akhmed Ismail Saied
Ehndorfer Str. 130
24537 Neumünster (N.M.S)
Deutschland
```

Website: **www.sakanapp.net** · General: **info@sakanapp.net** · Support: **service@sakanapp.net**

The imprint (§5 DDG/TMG), GDPR privacy policy, terms of service, cookie notice and the
marriage-law & safety guide are all reachable from the footer on every page and are available
in Arabic, English, German and French.

---

<div align="center">

**© SAKAN 2026 — All rights reserved.**

</div>
