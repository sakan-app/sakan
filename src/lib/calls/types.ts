/** Shared, browser-safe types for the 1:1 calling feature. */
export type CallKind = "voice" | "video";

export type CallStatus =
  | "ringing"
  | "accepted"
  | "rejected"
  | "missed"
  | "ended"
  | "busy"
  | "failed";

/** UI phase of the local call machine (independent from the DB status). */
export type CallPhase =
  | "idle"
  | "outgoing"
  | "incoming"
  | "connecting"
  | "active"
  | "reconnecting"
  | "ended";

export type IceServerConfig = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export type CallGrant = {
  callId: string;
  conversationId: string;
  kind: CallKind;
  peerId: string;
  iceServers: IceServerConfig[];
  /** False when no TURN relay secret is configured (see README "Missing secrets"). */
  relayConfigured: boolean;
};

export type CallPeer = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

/** Broadcast payloads exchanged over the per-call signaling channel. */
export type SignalMessage =
  | { type: "ready"; from: string }
  | { type: "offer"; from: string; sdp: string }
  | { type: "answer"; from: string; sdp: string }
  | { type: "ice"; from: string; candidate: RTCIceCandidateInit }
  | { type: "hangup"; from: string };

/** How long an unanswered call rings before it is marked missed. */
export const RING_TIMEOUT_MS = 45_000;
/** How long we try to recover a dropped media path before failing the call. */
export const RECONNECT_TIMEOUT_MS = 20_000;

export function requiredPlanFor(kind: CallKind): "premium" | "premium_plus" {
  return kind === "video" ? "premium_plus" : "premium";
}