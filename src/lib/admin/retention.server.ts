/**
 * Inactivity retention sweep (server-only).
 *
 * Non-destructive by design:
 *  - accounts are NEVER deleted, only archived (deactivated + hidden);
 *  - the archive window comes from `platform_settings.inactivity_archive_days`
 *    and the sweep is skipped entirely when it is not configured;
 *  - members with a live subscription (active / trialing / past_due, or still
 *    inside a grace period) are never archived;
 *  - already-archived profiles are filtered out, so running the sweep twice
 *    changes nothing (idempotent).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { logAdminAction } from "./ops.server";

const BATCH = 500;
const PAYING_STATUSES = ["active", "trialing", "past_due"] as const;

export type RetentionSweepResult = {
  configuredDays: number | null;
  cutoff: string | null;
  eligible: number;
  archived: number;
  skippedPaying: number;
  dryRun: boolean;
  reason?: "not_configured";
};

async function payingUserIds(candidateIds: string[]): Promise<Set<string>> {
  if (candidateIds.length === 0) return new Set();
  const nowIso = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, status, grace_until, plan_code")
    .in("user_id", candidateIds);
  const paying = new Set<string>();
  for (const row of data ?? []) {
    const live = (PAYING_STATUSES as readonly string[]).includes(row.status as string);
    const inGrace = row.grace_until ? row.grace_until > nowIso : false;
    const isFree = (row.plan_code ?? "free") === "free";
    if ((live || inGrace) && !isFree) paying.add(row.user_id);
  }
  return paying;
}

export async function runInactivitySweep(params: {
  adminId: string;
  dryRun: boolean;
}): Promise<RetentionSweepResult> {
  const { data: settings } = await supabaseAdmin
    .from("platform_settings")
    .select("inactivity_archive_days")
    .eq("id", true)
    .maybeSingle();

  const days = settings?.inactivity_archive_days ?? null;
  if (!days || days <= 0) {
    return {
      configuredDays: days,
      cutoff: null,
      eligible: 0,
      archived: 0,
      skippedPaying: 0,
      dryRun: params.dryRun,
      reason: "not_configured",
    };
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error } = await supabaseAdmin
    .from("profiles")
    .select("id, last_seen_at")
    .is("archived_at", null)
    .eq("is_active", true)
    .lt("last_seen_at", cutoff)
    .order("last_seen_at", { ascending: true })
    .limit(BATCH);
  if (error) throw new Error(error.message);

  const ids = (candidates ?? []).map((c) => c.id);
  const paying = await payingUserIds(ids);
  const targets = ids.filter((id) => !paying.has(id));

  const result: RetentionSweepResult = {
    configuredDays: days,
    cutoff,
    eligible: targets.length,
    archived: 0,
    skippedPaying: ids.length - targets.length,
    dryRun: params.dryRun,
  };

  if (params.dryRun || targets.length === 0) return result;

  const { error: upErr } = await supabaseAdmin
    .from("profiles")
    .update({ archived_at: new Date().toISOString(), is_active: false, is_hidden: true })
    .in("id", targets)
    .is("archived_at", null);
  if (upErr) throw new Error(upErr.message);

  result.archived = targets.length;

  await logAdminAction({
    adminId: params.adminId,
    action: "retention.inactivity_sweep",
    targetTable: "profiles",
    details: { days, cutoff, archived: result.archived, skippedPaying: result.skippedPaying },
  });

  return result;
}

/** Restores an archived profile (staff correction path). */
export async function unarchiveProfile(params: { adminId: string; targetId: string }) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ archived_at: null, is_active: true, is_hidden: false })
    .eq("id", params.targetId);
  if (error) throw new Error(error.message);
  await logAdminAction({
    adminId: params.adminId,
    action: "retention.unarchive",
    targetTable: "profiles",
    targetId: params.targetId,
  });
  return { ok: true as const };
}
