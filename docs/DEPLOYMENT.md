# SAKAN — Deployment Guide

## Purpose

Describes how SAKAN is built, configured, and released: the Vite/TanStack
Start build pipeline, environment variables and secrets, backend migrations,
Stripe and Web Push configuration, and operational guidance for rollback and
monitoring. The app runs on **Lovable Cloud** (a managed Supabase-compatible
backend); this document does not reference a dashboard, project ID, or secret
values.

## Table of Contents

1. [Build Pipeline](#build-pipeline)
2. [Environment Variables](#environment-variables)
3. [Secret Management](#secret-management)
4. [Backend Migrations](#backend-migrations)
5. [Stripe Configuration](#stripe-configuration)
6. [Push Configuration](#push-configuration)
7. [Preview vs. Production](#preview-vs-production)
8. [Custom Domains](#custom-domains)
9. [Rollback](#rollback)
10. [Monitoring and Logs](#monitoring-and-logs)
11. [Troubleshooting](#troubleshooting)

Related: [SECURITY.md](./SECURITY.md) · [TESTING.md](./TESTING.md)

## Build Pipeline

The app is a TanStack Start (React 19, SSR) project built with Vite via the
`@lovable.dev/vite-tanstack-config` preset (`vite.config.ts`). Key facts from
`package.json` scripts:

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite dev` | Local development server |
| `build` | `vite build` | Production build |
| `build:dev` | `vite build --mode development` | Development-mode build (unminified, dev checks) |
| `preview` | `vite preview` | Serve a built bundle locally |
| `lint` | `eslint .` | Static analysis |
| `format` | `prettier --write .` | Code formatting |

`vite.config.ts` layers two customizations on top of the shared preset:

- **PWA build** — `vite-plugin-pwa` (`strategies: "generateSW"`) generates the
  production service worker at `dist/client/sw.js`, importing hand-written
  push/notification logic from `public/sw-push.js` via `importScripts`.
  Precaching covers JS/CSS/HTML/image/font assets plus explicit SSR document
  entries (`/`, `/offline`) so a cold offline start still renders. Runtime
  caching strategies are `NetworkFirst` for navigations (with an offline-shell
  fallback), `CacheFirst` for images and Google Fonts static assets, and
  `StaleWhileRevalidate` for font CSS and Supabase Storage media.
- **Dependency optimization** — `react`, `react/jsx-runtime`, `react-dom`,
  `react-dom/client`, and `sonner` are explicitly pre-bundled
  (`optimizeDeps.include`, `force: true`) to keep every hook-based dependency
  on a single React instance during development.
- **Server entry** — `tanstackStart.server.entry` is redirected to
  `src/server.ts`, which wraps SSR responses to render a generic error page
  instead of leaking stack traces (see `src/start.ts`'s `errorMiddleware`,
  described in [SECURITY.md](./SECURITY.md#server-function-bearer-middleware)).

The preset (not overridden here) already supplies TanStack devtools (dev
only), `tanstackStart`, `viteReact`, Tailwind CSS v4, `tsConfigPaths`, the
Nitro build target (Cloudflare by default), `VITE_*` env injection, the `@`
path alias, and React/TanStack dependency deduplication.

> **Best practice:** the harness/platform runs builds and typechecks
> automatically as part of deployment — do not invoke `vite build` or a
> TypeScript check manually as a substitute for the pipeline's own gating.

## Environment Variables

No `VITE_*` (client-exposed) environment variables are referenced in
application source in this repository; the Supabase browser client and any
public keys are supplied by the Lovable Cloud platform build rather than read
from `import.meta.env` here. All environment variables actually referenced in
code are **server-only**, read via `process.env["NAME"]`, and are listed by
name (not value) in [SECURITY.md — Secrets Inventory](./SECURITY.md#secrets-inventory):

- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_TEST_API_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PUSH_DISPATCH_TOKEN`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`
- `LOVABLE_API_KEY`
- `NODE_ENV`

`NODE_ENV` also controls which Stripe key takes precedence: in production
(`NODE_ENV === "production"`), `STRIPE_SECRET_KEY` is tried first, falling
back to `STRIPE_TEST_API_KEY`; in any other environment the order is reversed,
so non-production environments default to test-mode Stripe unless only a live
key is configured (`src/lib/billing/stripe.server.ts`, `stripeKey()`).

## Secret Management

Secrets are provisioned through the Lovable Cloud platform's environment
configuration for each deployment target (never committed to the repository,
never printed in logs or documentation). When adding a new secret:

1. Add the `process.env["NEW_SECRET"]` read in the smallest possible
   server-only module (a `.server.ts` file or an `api/` route handler).
2. Fail fast and descriptively if the secret is missing (see the pattern in
   `client.server.ts` and `auth-middleware.ts`, which list every missing
   variable by name in a thrown error rather than failing silently).
3. Never import the module that reads the secret from client-reachable code;
   use a dynamic `import()` inside the handler as done throughout this
   codebase (see [SECURITY.md — Admin Client Usage Rules](./SECURITY.md#admin-client-usage-rules)).
4. Configure the value in every environment that needs it (preview and
   production are configured independently).

## Backend Migrations

Database schema, RLS policies, triggers, and scheduled jobs are version
controlled as plain SQL files under `supabase/migrations/`, applied in
filename (timestamp) order. Migrations in this repository define, among other
things:

- The `app_role` enum and its later extension to add `super_admin`.
- `user_roles`, `has_role`, `is_staff`, `is_super_admin`.
- RLS policies for every application table and for `storage.objects`.
- Storage bucket provisioning (e.g., `chat-media`), each defaulting to
  `public = false`.
- The `dispatch_push_on_notification` trigger (`AFTER INSERT ON notifications`)
  and an earlier interval-based `cron.schedule('sakan-push-dispatch', ...)`
  job, both of which call `POST /api/public/push-dispatch` — see
  [Push Configuration](#push-configuration).

Because migrations are Lovable Cloud–managed (not applied through a separate
CLI workflow in this repository), new schema changes should be added as new,
additive SQL files rather than editing historical migrations, keeping the
migration history reproducible across environments.

> **Warning:** Historical migration files in this project embed the push
> dispatch endpoint URL and a token value directly in trigger/cron SQL. Any
> new migration that calls an internal endpoint should instead parameterize
> the token (e.g., read it from a Postgres setting or Vault secret if
> available) rather than hardcoding a literal secret in SQL, since SQL
> migration files are part of the durable history of the project.

## Stripe Configuration

1. Create a webhook endpoint in Stripe pointing at:
   `https://<your-deployment-domain>/api/public/stripe-webhook`
2. Select at least the following events, which are handled explicitly by
   `src/routes/api/public/stripe-webhook.ts`:
   - `checkout.session.completed`
   - `invoice.paid` / `invoice_payment.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
   (Unhandled event types are acknowledged with `200 ok` and ignored.)
3. Store the endpoint's signing secret as the `STRIPE_WEBHOOK_SECRET` secret
   for the deployment environment. Until this secret is set, the endpoint
   responds `503 webhook_not_configured` and processes nothing.
4. Store the API secret key as `STRIPE_SECRET_KEY` (live) and/or
   `STRIPE_TEST_API_KEY` (test mode) — see [Environment Variables](#environment-variables)
   for which one is preferred per `NODE_ENV`.
5. Verify configuration by sending a test event from Stripe and confirming a
   `200 ok` (or `duplicate` on redelivery) response; a `401 invalid_signature`
   indicates a secret mismatch, and `500 handler_error` indicates a downstream
   failure — see [Troubleshooting](#troubleshooting).

## Push Configuration

Web Push uses VAPID keys, configured as:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (typically a `mailto:` contact address)

If any are unset, `vapidConfigured()` (`src/lib/push/webpush.server.ts`)
returns `false` and the dispatch route responds
`{ skipped: true, reason: "vapid_not_configured" }` without attempting
delivery — this fails safe rather than erroring.

**Delivery path:** an `AFTER INSERT` trigger on `public.notifications`
(`dispatch_push_on_notification`, added in a later migration that supersedes
an earlier once-a-minute `cron.schedule('sakan-push-dispatch', ...)` polling
job) calls `net.http_post` against
`POST /api/public/push-dispatch` with the new notification's ID, authenticated
by an `x-push-token` header compared against `PUSH_DISPATCH_TOKEN`
(constant-time comparison — see
[SECURITY.md — Push Dispatch Token](./SECURITY.md#push-dispatch-token)). The
route then:

1. Validates the shared token and the JSON body (`notificationId` must be a
   UUID).
2. Loads the notification and the recipient's presence/locale, skipping
   delivery (but still marking the row handled) for members in Do-Not-Disturb.
3. Sends the push via `sendPushToUser` and stamps `push_sent_at` once the
   attempt is genuinely finished (a devices-exist-but-zero-sent, not-yet-expired
   case is left unstamped so it remains eligible for a later retry, bounded
   by a 15-minute give-up window).

Post-deployment checklist:

- [ ] `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` configured.
- [ ] `PUSH_DISPATCH_TOKEN` configured and matches the value embedded in the
      active database trigger for this environment.
- [ ] The trigger/cron job's target URL matches this environment's public
      base URL (a preview deployment must not point at the production URL,
      and vice versa).
- [ ] Exercise the in-app diagnostics console at `/diagnostics`
      (`src/routes/_authenticated/diagnostics.tsx`) to confirm service worker
      registration, permission grant, and a live test dispatch — see
      [TESTING.md](./TESTING.md#push-tests).

## Preview vs. Production

Lovable Cloud provisions a distinct backend/runtime per deployment target
(preview vs. production), so:

- Secrets (Stripe keys, VAPID keys, `PUSH_DISPATCH_TOKEN`, TURN credentials)
  are configured independently per environment; a preview environment should
  use `STRIPE_TEST_API_KEY` rather than a live key.
- Database triggers/cron jobs that call back into the app (push dispatch)
  embed an absolute URL and must be updated whenever the environment's public
  URL changes, since they are not resolved dynamically from application
  config.
- `NODE_ENV` distinguishes production from other modes for the Stripe key
  precedence described above; confirm it is set correctly for each target.

## Custom Domains

When a deployment is placed behind a custom domain:

- Update the Stripe webhook endpoint URL to the custom domain.
- Update the database trigger/cron job's `net.http_post` target URL to the
  custom domain (see [Backend Migrations](#backend-migrations) and
  [Push Configuration](#push-configuration)).
- No application code branches on hostname; routing and CORS-sensitive
  behavior are otherwise domain-agnostic in this codebase.

## Rollback

This project does not include a scripted rollback tool; rollback is a
combination of:

- **Application code**: redeploy a previous build/commit through the
  platform's deployment history.
- **Database schema**: migrations under `supabase/migrations/` are additive
  SQL files. Rolling back a schema change requires authoring and applying a
  new, compensating migration (e.g., reverting a trigger or policy) rather
  than deleting a historical file, to keep the applied-migration history
  consistent across environments.
- **Secrets**: previous secret values (e.g., a rotated `PUSH_DISPATCH_TOKEN`)
  must be resynchronized between the environment configuration and any
  database trigger that embeds the token literal, since the two are not
  linked automatically.

> **Warning:** Because the push-dispatch token is embedded directly in
> trigger/cron SQL rather than read from a runtime secret, rotating
> `PUSH_DISPATCH_TOKEN` requires a corresponding migration that updates the
> trigger definition — updating only the environment secret will desynchronize
> the trigger from the route and cause every push dispatch call to fail with
> `401`.

## Monitoring and Logs

- **Server-side errors**: unhandled exceptions in server functions and SSR
  are caught by `errorMiddleware` (`src/start.ts`) and `src/server.ts`,
  logged via `console.error`, and returned to the client as a generic error
  page/response rather than a stack trace.
- **Webhook failures**: `stripe-webhook.ts` logs handler errors with
  `console.error("[stripe-webhook]", type, error)` and removes the
  `webhook_events` claim row so Stripe's automatic retry can reprocess the
  event.
- **Rate-limit activity**: `enforceRateLimit` writes marker rows into the
  `activity_logs` table, which can be queried to observe request volume per
  limited key.
- **Admin actions**: `logAction` in `src/lib/admin/admin.server.ts` writes an
  audit trail to `admin_actions` for staff-performed operations.
- **Client/service worker diagnostics**: the authenticated `/diagnostics`
  route surfaces live service worker lifecycle state, Cache Storage contents,
  push permission/subscription status, and the result of a manually triggered
  test push — the primary tool for verifying a deployment's PWA/push health
  from a real device.

## Troubleshooting

| Symptom | Likely cause | Where to look |
|---|---|---|
| Stripe webhook returns `503 webhook_not_configured` | `STRIPE_WEBHOOK_SECRET` missing in this environment | Environment secret configuration |
| Stripe webhook returns `401 invalid_signature` | Wrong secret, or endpoint URL configured against the wrong environment | Stripe endpoint config vs. `STRIPE_WEBHOOK_SECRET` |
| Push notifications never arrive | VAPID keys missing (`skipped: true`), or trigger URL/token mismatch for this environment | `/diagnostics` route, `webpush.server.ts`, trigger SQL |
| Push dispatch returns `401` from the trigger | `PUSH_DISPATCH_TOKEN` was rotated without updating the trigger definition | New migration updating `dispatch_push_on_notification` |
| Build fails referencing a missing Supabase env var | `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SERVICE_ROLE_KEY` not configured for the target environment | Deployment secret configuration |
| Offline shell doesn't appear when navigating offline | Service worker not yet installed/activated, or `/offline` precache entry stale | `vite.config.ts` PWA `additionalManifestEntries`, `/diagnostics` cache inspector |
