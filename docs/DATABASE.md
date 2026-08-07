# SAKAN — Database Guide

## Purpose

Behavioural reference for the SAKAN Postgres database (Lovable Cloud / Supabase).
It documents the table inventory, the Row Level Security model, database functions,
triggers, storage buckets and operational conventions.

For the entity-relationship shape of the data (columns, keys, enums) see
[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md). For the access-control threat model see
[SECURITY.md](./SECURITY.md).

Source of truth: `supabase/migrations/*.sql` and the generated
`src/integrations/supabase/types.ts`.

## Table of Contents

1. [Table inventory](#table-inventory)
2. [Row Level Security model](#row-level-security-model)
3. [Database functions](#database-functions)
4. [Triggers](#triggers)
5. [Storage buckets](#storage-buckets)
6. [Migrations](#migrations)
7. [Operational notes](#operational-notes)

---

## Table inventory

All application tables live in the `public` schema. Every table has RLS enabled and
explicit `GRANT`s for the roles its policies allow.

| Domain | Tables |
|---|---|
| Identity & profile | `profiles`, `user_roles`, `photos`, `consents`, `profile_views` |
| Social graph | `likes`, `matches`, `favorites`, `blocked_users`, `compatibility_scores`, `saved_searches` |
| Messaging | `conversations`, `conversation_pins`, `messages`, `message_reactions`, `chat_wallpapers` |
| Calling | `call_sessions` |
| Notifications & push | `notifications`, `notification_preferences`, `push_subscriptions` |
| Billing | `plans`, `subscriptions`, `payments`, `billing_customers`, `billing_events`, `webhook_events` |
| Monetization | `featured_ads`, `ad_placements` |
| Trust & safety | `verification_requests`, `reports`, `moderation_flags` |
| Administration | `admin_actions`, `admin_notes`, `activity_logs`, `platform_settings` |
| PWA telemetry | `pwa_install_events` |

## Row Level Security model

The model has four access tiers:

| Tier | Rule |
|---|---|
| Owner | `auth.uid() = user_id` — profile data, photos, saved searches, notifications, push subscriptions, wallpapers, consents |
| Participant | Membership predicate — `is_conversation_participant()` for conversations, messages and reactions; caller/callee for `call_sessions` |
| Staff | `is_staff()` / `has_role(auth.uid(), 'admin')` — moderation queues, audit tables, platform settings |
| Public read | Narrow `TO anon` SELECT only where a page must render signed out (e.g. active `plans`) |

Additional invariants:

- Sensitive profile columns are not readable by `anon`.
- Mutual blocks are enforced through `is_blocked_between()` inside policies, so a blocked
  pair cannot read or write each other's rows.
- `call_sessions` write paths are revoked from `authenticated`/`anon`; state changes flow
  exclusively through server functions in `src/lib/calls/calls.server.ts`.
- `platform_settings` is staff-readable only; writes require `is_super_admin()`.
- Admin server functions authorize first (`assertStaff` / `assertAdmin`) and then use the
  service-role client, so the server-function boundary — not RLS — is the authorization
  boundary for `/admin`.

## Database functions

| Function | Type | Role |
|---|---|---|
| `has_role(uuid, app_role)` | security definer | Canonical role check used by RLS; prevents recursive policy evaluation |
| `is_staff(uuid)` | security definer | True for `moderator`, `admin`, `super_admin` |
| `is_super_admin(uuid)` | security definer | Highest privilege gate (settings, `super_admin` grants) |
| `is_conversation_participant(uuid, uuid)` | security definer | Membership predicate for chat policies |
| `is_blocked_between(uuid, uuid)` | security definer | Bidirectional block check |
| `get_or_create_conversation(uuid, uuid)` | RPC | Idempotent 1:1 conversation creation using ordered `user_low`/`user_high` |
| `current_subscription(uuid)`, `user_plan(uuid)`, `user_plan_tier(uuid)`, `has_premium(uuid)` | entitlements | Server-side plan resolution for feature gating |
| `compute_profile_completeness()` | trigger fn | Recomputes profile completeness score |
| `guard_profile_privileged_columns()` | trigger fn | Blocks self-service edits to privileged profile columns (verification, status) |
| `handle_new_user()` | trigger fn | Creates the `profiles` row for a new `auth.users` record |
| `create_match_on_mutual_like()` | trigger fn | Inserts a `matches` row when a like becomes mutual |
| `notify_on_like()`, `notify_on_match()`, `notify_on_message()` | trigger fn | Insert `notifications` rows |
| `dispatch_push_on_notification()` | trigger fn | Calls `/api/public/push-dispatch` immediately after a notification insert |
| `bump_conversation()`, `touch_conversation_on_message()` | trigger fn | Maintain conversation ordering/last-message state |
| `assign_invoice_number()` | trigger fn | Sequential invoice numbering on `payments` |
| `sync_profile_verification()` | trigger fn | Mirrors an approved verification onto `profiles.is_verified` |
| `expire_due_subscriptions()`, `sweep_billing_lifecycle()` | maintenance | Grace-period and expiry sweeps |
| `set_updated_at()`, `touch_last_seen()` | utility | Timestamp maintenance |

`SECURITY DEFINER` functions run with `set search_path = public` and have public
`EXECUTE` revoked except where RLS or an authenticated RPC requires it.

## Triggers

| Trigger | Table | Effect |
|---|---|---|
| `on_auth_user_created` | `auth.users` | Provision profile |
| `profiles_completeness`, `profiles_guard_privileged`, `profiles_set_updated_at` | `profiles` | Score, privilege guard, timestamps |
| `likes_create_match`, `notify_on_like_trigger` | `likes` | Match creation and like notification |
| `notify_on_match_trigger` | `matches` | Match notification titled with the counterpart's display name |
| `notify_on_message_trigger`, `messages_touch_conversation`, `bump_conversation_on_message` | `messages` | Notification and conversation ordering |
| `dispatch_push_on_notification_trigger` | `notifications` | Immediate Web Push dispatch |
| `verification_sync_profile` | `verification_requests` | Verification badge sync |
| `payments_assign_invoice_number` | `payments` | Invoice numbering |
| `*_set_updated_at` / `*_updated_at` | many | `updated_at` maintenance |

## Storage buckets

All buckets are **private**; media is served through short-lived signed URLs.

| Bucket | Contents | Path convention |
|---|---|---|
| `avatars` | Profile avatars | `<user_id>/...` |
| `gallery` / `photos` | Profile gallery images | `<user_id>/...` |
| `chat-media` | Message attachments | `<conversation_id>/<user_id>/...` |
| `wallpapers` | Custom chat wallpapers (premium) | `<user_id>/...` |
| `featured` | Featured-banner creatives | `<user_id>/...` |

Storage policies match on the leading path segment, so a user can only read or write
objects under their own prefix (or, for `chat-media`, a conversation they belong to).

## Migrations

- Migrations are immutable, timestamped SQL files in `supabase/migrations/`.
- Every `CREATE TABLE public.*` is followed, in the same migration, by `GRANT`s, then
  `ENABLE ROW LEVEL SECURITY`, then policies.
- Migrations apply automatically on deployment; backend changes go live immediately,
  independently of the frontend release.
- Never edit an applied migration — add a new one.

## Operational notes

- **Indexes** exist on the hot read paths: `messages(conversation_id, created_at)`,
  `notifications(user_id, created_at)`, `likes`, `matches`, `favorites`, and the
  `profiles` search filters.
- **Pagination** is applied to all list endpoints (admin tables, search, conversations).
- **Audit trail**: `admin_actions` (staff-initiated) and `activity_logs` (system events)
  are append-only and staff-readable.
- **Rate limiting** writes marker rows into the activity log; these accumulate and should
  be purged periodically as volume grows.

## Related documents

[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) · [SECURITY.md](./SECURITY.md) · [SERVER_FUNCTIONS.md](./SERVER_FUNCTIONS.md) · [BILLING.md](./BILLING.md) · [ADMIN.md](./ADMIN.md)
