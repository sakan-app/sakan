# SAKAN — Release Notes

**Release:** 1.0.0 — Production Release Candidate
**Status:** Feature complete · Production hardened · Ready for customer delivery

These notes summarise what is being delivered, what is verified, what is intentionally
disabled, and what the operator must do after handover. The engineering-level history is
in [CHANGELOG.md](./CHANGELOG.md).

## Table of Contents

1. [Highlights](#highlights)
2. [Delivered scope](#delivered-scope)
3. [Languages and localisation](#languages-and-localisation)
4. [Platform and compatibility](#platform-and-compatibility)
5. [Intentionally disabled or placeholder](#intentionally-disabled-or-placeholder)
6. [Verification performed](#verification-performed)
7. [Known limitations](#known-limitations)
8. [Post-delivery checklist](#post-delivery-checklist)
9. [Support and documentation map](#support-and-documentation-map)

---

## Highlights

- Complete matrimonial platform: profiles, verification, search, likes, favourites,
  matches, real-time messaging, voice and video calling.
- Four fully translated languages with automatic RTL/LTR switching.
- Subscription tiers with server-enforced entitlements, plus the paid featured banner.
- Installable PWA with offline support, background sync and Web Push.
- Full administrative back office with append-only audit logging.

## Delivered scope

| Area | Delivered |
|---|---|
| Public site | Home, search, member profile, pricing, about, guide, terms, privacy, impressum |
| Accounts | Email/password authentication, password reset, protected route gating, role storage in `user_roles` |
| Profiles | Multi-step onboarding with validation, profile studio, private galleries with signed URLs, completeness scoring |
| Discovery | Filtered search, saved searches, recent searches, virtualised result grid, mobile carousel |
| Social | Likes, favourites, mutual-match creation with real-time notification |
| Messaging | 1:1 realtime chat, delivery/read receipts, typing indicators, attachments, reactions, reply, edit, delete, pin, forward, per-conversation wallpapers |
| Calling | WebRTC voice (Premium) and video (Premium Plus), entitlement checked server-side |
| Notifications | Notification centre with grouping, realtime updates, presence and privacy modes, Web Push |
| Billing | Plans, subscriptions, grace period, invoices, payment history, refunds |
| Monetization | Featured promotion strip (0.99 €, direction-aware travel, fixed lifetime) and ad placements |
| Trust & safety | Identity verification (KYC), reporting, blocking, moderation flags |
| Admin | Dashboard, users, user detail, conversations, matches, reports, verifications, payments, subscriptions, featured ads, notifications, analytics, activity log, platform settings |
| PWA | Workbox service worker, offline shell, offline outbox replay, install prompt, update banner, app badge |

## Languages and localisation

Arabic (default, RTL), English, German and French are complete across the interface,
pricing feature lists, legal pages, notifications and the footer. Typography follows the
brand system: Cairo for Arabic, Montserrat for Latin scripts.

## Platform and compatibility

- Rendering: server-side rendered React 19 on an edge worker runtime.
- Browsers: current versions of Chrome, Edge, Safari and Firefox.
- Mobile: responsive layouts with a fixed glassmorphism bottom navigation; installable on
  Android and iOS. Web Push is available where the browser supports it (on iOS, after the
  app is added to the Home Screen).

## Intentionally disabled or placeholder

| Item | State | To enable |
|---|---|---|
| Stripe payments | Placeholder/disabled per customer instruction | Supply the Stripe secret and webhook signing secret |
| AI services | Providers wired and ready, dormant without a key | Supply the AI gateway credential |
| Push delivery | Requires VAPID key pair and dispatch token | Configure the push secrets |

No source changes are required to activate any of the above — only configuration.

## Verification performed

- Functional QA of every user action across two live accounts: authentication, profiles,
  search, likes, favourites, matches, messaging (including delete-for-everyone,
  attachments and pinning), notifications and admin operations.
- Cross-language and RTL verification of the home page, pricing page and footer in
  Arabic, English, German and French, on desktop and mobile viewports.
- Production hardening pass covering resource leaks, listener/timer cleanup, realtime
  channel teardown, media-track release, object-URL revocation and stray debug logging.
- Security review of RLS coverage, privileged function execution grants, storage bucket
  privacy and admin authorisation boundaries.
- Offline and PWA verification: cold offline start, outbox replay on reconnect, service
  worker update flow.
- Type checking and linting clean; test/QA accounts removed from the production database.

## Known limitations

Documented in [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md). Notable operational items:

- Rate-limit marker rows accumulate in the activity log with no automatic purge job.
- Automated end-to-end test coverage is manual/scripted rather than a CI suite.

## Post-delivery checklist

1. Publish the application and attach the production domain.
2. Configure the payment, AI and push secrets when those features are to go live.
3. Grant `admin` roles to the operator accounts and remove any temporary staff access.
4. Review the legal pages (Impressum, Terms, Privacy) with counsel before public launch.
5. Schedule a periodic cleanup for rate-limit marker rows.
6. Confirm notification email deliverability for the support address in platform settings.

## Support and documentation map

[INSTALL.md](./INSTALL.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [DATABASE.md](./DATABASE.md) · [API.md](./API.md) · [SECURITY.md](./SECURITY.md) · [BILLING.md](./BILLING.md) · [ADMIN.md](./ADMIN.md) · [PWA.md](./PWA.md) · [CHANGELOG.md](./CHANGELOG.md)
