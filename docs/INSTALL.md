# SAKAN — Installation Guide

## Purpose

How to obtain, install, configure and run the SAKAN platform — locally for development
and as a delivered production application. For the release/build pipeline and
operational procedures see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Table of Contents

1. [Requirements](#requirements)
2. [Local installation](#local-installation)
3. [Available scripts](#available-scripts)
4. [Backend configuration](#backend-configuration)
5. [Server secrets](#server-secrets)
6. [Verifying the installation](#verifying-the-installation)
7. [Production installation](#production-installation)
8. [Troubleshooting](#troubleshooting)

---

## Requirements

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20 LTS or newer | Required by Vite 7 / TanStack Start |
| Package manager | Bun (recommended) or npm | Lockfile committed for the project manager |
| Backend | Lovable Cloud (managed Supabase-compatible) | Provisioned with the project; no manual database install |
| Browser | Any evergreen browser | Chromium recommended for PWA/push testing |

The application is a **TanStack Start** (React 19, SSR) app built with Vite and
Tailwind CSS v4, deployed to an edge worker runtime. No native modules or system
packages are required.

## Local installation

```bash
# 1. Obtain the source
git clone <repository-url> sakan
cd sakan

# 2. Install dependencies
bun install       # or: npm install

# 3. Start the development server
bun run dev       # or: npm run dev
```

The dev server prints a local URL (default `http://localhost:8080`). Hot module
replacement is enabled; source changes reload automatically.

## Available scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite dev` | Development server with HMR |
| `build` | `vite build` | Production build (SSR + client + service worker) |
| `build:dev` | `vite build --mode development` | Unminified build with development checks |
| `preview` | `vite preview` | Serve a built bundle locally |
| `lint` | `eslint .` | Static analysis |
| `format` | `prettier --write .` | Formatting |

## Backend configuration

The backend (database, authentication, storage, realtime) is provisioned and connected
automatically by the platform. The generated integration lives in
`src/integrations/supabase/` and **must not be edited by hand**:

- `client.ts` — browser client (RLS applies)
- `client.server.ts` — server clients, including the privileged admin client
- `auth-middleware.ts` / `auth-attacher.ts` — bearer-token plumbing for server functions
- `types.ts` — generated database types

Database schema is applied from `supabase/migrations/*.sql`; migrations run automatically
on deployment. See [DATABASE.md](./DATABASE.md).

## Server secrets

All secrets are server-only and are read inside server-function handlers via
`process.env["NAME"]`. They are configured through the platform's secret store, never in
source control. The names referenced by the code are inventoried in
[SECURITY.md — Secrets Inventory](./SECURITY.md#secrets-inventory) and include the backend
URL/keys, the Stripe secret and webhook signing secret, the Web Push VAPID key pair, and
the push-dispatch token.

Missing optional secrets degrade gracefully: Stripe remains in placeholder mode, AI
features stay dormant, and push delivery is skipped — the rest of the application runs.

## Verifying the installation

After `bun run dev`, verify:

1. The home page renders in Arabic (RTL) with the navy/gold design system.
2. The language switcher cycles Arabic, English, German and French.
3. `/pricing`, `/about`, `/terms`, `/privacy`, `/impressum` and `/guide` render with the footer.
4. Sign-up and sign-in complete, and a new account is routed into onboarding.
5. Search returns member cards; a member profile opens and shows the gallery.
6. Messaging shows realtime delivery between two signed-in accounts.
7. `/admin` returns a 403 screen for non-staff accounts and the dashboard for staff.

## Production installation

The delivered application is published from the platform's publish flow:

- Frontend changes go live when the deployment is published.
- Backend changes (migrations, server functions) apply immediately.
- A `.lovable.app` subdomain is created on first publish; custom domains can then be
  attached in project settings.

Self-hosting the built output is possible but requires manual worker/runtime setup and is
outside the scope of this delivery.

## Troubleshooting

| Symptom | Cause | Resolution |
|---|---|---|
| `Cannot find module` after pulling | Dependencies out of date | Re-run `bun install` |
| Port already in use | Another dev server running | Stop the other process or change the port |
| Blank page after a build | Stale service worker | Hard-reload, or unregister the worker in DevTools → Application |
| Push notifications never arrive | VAPID keys or dispatch token missing/mismatched | Reconfigure the push secrets (see [PWA.md](./PWA.md)) |
| Checkout does nothing | Stripe intentionally disabled in this delivery | Supply the Stripe secrets to enable (see [BILLING.md](./BILLING.md)) |
| `403 Forbidden` at `/admin` | Account has no staff role | Grant `admin` or `moderator` in `user_roles` |

## Related documents

[DEPLOYMENT.md](./DEPLOYMENT.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [DATABASE.md](./DATABASE.md) · [SECURITY.md](./SECURITY.md) · [PWA.md](./PWA.md)
