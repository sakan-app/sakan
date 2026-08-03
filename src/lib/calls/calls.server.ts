import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { FREE_LIMITS, type PlanLimits } from "@/lib/billing/types";
import type { CallGrant, CallKind, CallStatus, IceServerConfig } from "./types";

/** Error codes surfaced to the client (mapped to localized copy in the UI). */
export const CALL_ERRORS = {
  forbidden: "call_forbidden",
  notMember: "call_not_member",
  planRequired: "call_plan_required",
  busy: "call_peer_busy",
  selfCall: "call_self",
  notFound: "call_not_found",
} as const;

export class CallError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "CallError";
  }
}

/**
 * Server-side entitlement resolution. This is the only authority for call
 * access — the client's `useSubscription()` result is a UX hint, never a gate.
 */
export async function serverLimits(userId: string): Promise<PlanLimits & { planCode: string }> {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("plan_code, status, grace_until, current_period_end")
    .eq("user_id", userId)
    .in("status", ["trialing", "active", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let planCode = "free";
  if (sub) {
    const graceOrEnd = sub.grace_until ?? sub.current_period_end;
    const lapsed = sub.status === "past_due" && graceOrEnd && new Date(graceOrEnd) < new Date();
    if (!lapsed) planCode = sub.plan_code;
  }

  if (planCode === "free") return { ...FREE_LIMITS, planCode };

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("code, limits")
    .eq("code", planCode)
    .maybeSingle();

  return {
    ...FREE_LIMITS,
    ...((plan?.limits ?? {}) as Partial<PlanLimits>),
    planCode,
  };
}

export async function assertCanCall(userId: string, kind: CallKind) {
  const limits = await serverLimits(userId);
  const allowed = kind === "video" ? limits.video_calls : limits.voice_calls;
  if (!allowed) throw new CallError(CALL_ERRORS.planRequired);
  return limits;
}

/** STUN is always available; TURN relay only when the deployment provides it. */
export function iceServers(): { iceServers: IceServerConfig[]; relayConfigured: boolean } {
  const list: IceServerConfig[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ];
  const turnUrl = process.env["TURN_URL"];
  const turnUser = process.env["TURN_USERNAME"];
  const turnCredential = process.env["TURN_CREDENTIAL"];
  const relayConfigured = Boolean(turnUrl && turnUser && turnCredential);
  if (relayConfigured) {
    list.push({
      urls: turnUrl!.split(",").map((u) => u.trim()).filter(Boolean),
      username: turnUser!,
      credential: turnCredential!,
    });
  }
  return { iceServers: list, relayConfigured };
}

async function peerOf(conversationId: string, userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("id, user_low, user_high")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new CallError(CALL_ERRORS.notFound);
  if (data.user_low !== userId && data.user_high !== userId) {
    throw new CallError(CALL_ERRORS.notMember);
  }
  const peer = data.user_low === userId ? data.user_high : data.user_low;
  if (peer === userId) throw new CallError(CALL_ERRORS.selfCall);
  return peer;
}

/** Any session still ringing/accepted after this window is considered stale. */
const STALE_MS = 3 * 60_000;

async function sweepStale() {
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  await supabaseAdmin
    .from("call_sessions")
    .update({ status: "missed", end_reason: "stale", ended_at: new Date().toISOString() })
    .in("status", ["ringing"])
    .lt("started_at", cutoff);
}

async function hasLiveSession(userId: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  const { data } = await supabaseAdmin
    .from("call_sessions")
    .select("id")
    .in("status", ["ringing", "accepted"])
    .gte("started_at", cutoff)
    .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function startCall(args: {
  callerId: string;
  conversationId: string;
  kind: CallKind;
}): Promise<CallGrant> {
  await assertCanCall(args.callerId, args.kind);
  await sweepStale();
  const calleeId = await peerOf(args.conversationId, args.callerId);

  if (await hasLiveSession(calleeId)) throw new CallError(CALL_ERRORS.busy);

  // Close anything the caller left dangling before opening a new session.
  await supabaseAdmin
    .from("call_sessions")
    .update({ status: "ended", end_reason: "superseded", ended_at: new Date().toISOString() })
    .in("status", ["ringing", "accepted"])
    .eq("caller_id", args.callerId);

  const { data, error } = await supabaseAdmin
    .from("call_sessions")
    .insert({
      conversation_id: args.conversationId,
      caller_id: args.callerId,
      callee_id: calleeId,
      kind: args.kind,
      status: "ringing",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const ice = iceServers();
  return {
    callId: data.id,
    conversationId: args.conversationId,
    kind: args.kind,
    peerId: calleeId,
    iceServers: ice.iceServers,
    relayConfigured: ice.relayConfigured,
  };
}

async function loadSession(callId: string) {
  const { data, error } = await supabaseAdmin
    .from("call_sessions")
    .select("id, conversation_id, caller_id, callee_id, kind, status")
    .eq("id", callId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new CallError(CALL_ERRORS.notFound);
  return data;
}

/** Callee accepts: re-validates membership and re-issues ICE credentials. */
export async function answerCall(callId: string, userId: string): Promise<CallGrant> {
  const session = await loadSession(callId);
  if (session.callee_id !== userId) throw new CallError(CALL_ERRORS.forbidden);
  if (session.status !== "ringing") throw new CallError(CALL_ERRORS.notFound);

  // The receiving side must also hold the entitlement for the call kind.
  await assertCanCall(session.caller_id, session.kind as CallKind);

  await supabaseAdmin
    .from("call_sessions")
    .update({ status: "accepted", answered_at: new Date().toISOString() })
    .eq("id", callId);

  const ice = iceServers();
  return {
    callId,
    conversationId: session.conversation_id,
    kind: session.kind as CallKind,
    peerId: session.caller_id,
    iceServers: ice.iceServers,
    relayConfigured: ice.relayConfigured,
  };
}

export async function closeCall(args: {
  callId: string;
  userId: string;
  status: Extract<CallStatus, "rejected" | "missed" | "ended" | "failed" | "busy">;
  reason?: string | undefined;
}) {
  const session = await loadSession(args.callId);
  if (session.caller_id !== args.userId && session.callee_id !== args.userId) {
    throw new CallError(CALL_ERRORS.forbidden);
  }
  if (["rejected", "missed", "ended", "failed", "busy"].includes(session.status)) {
    return { ok: true as const };
  }
  await supabaseAdmin
    .from("call_sessions")
    .update({
      status: args.status,
      end_reason: args.reason ?? null,
      ended_at: new Date().toISOString(),
    })
    .eq("id", args.callId);
  return { ok: true as const };
}