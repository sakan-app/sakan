import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signStoragePath } from "@/lib/chat/queries";
import { useI18n } from "@/lib/i18n";
import { primeAudio } from "@/lib/audio/engine";
import { playCallEndTone, startCallTone, stopCallTone } from "./tones";
import { callStrings } from "./strings";
import { answerCallFn, callEntitlementsFn, closeCallFn, startCallFn } from "./calls.functions";
import {
  RECONNECT_TIMEOUT_MS,
  RING_TIMEOUT_MS,
  type CallGrant,
  type CallKind,
  type CallPeer,
  type CallPhase,
  type SignalMessage,
} from "./types";

type EndReason =
  | "ended"
  | "rejected"
  | "missed"
  | "busy"
  | "failed"
  | "noAnswer"
  | null;

type CallState = {
  phase: CallPhase;
  kind: CallKind;
  peer: CallPeer | null;
  callId: string | null;
  muted: boolean;
  cameraOff: boolean;
  speakerOn: boolean;
  startedAt: number | null;
  endReason: EndReason;
  errorCode: string | null;
  relayWarning: boolean;
};

const INITIAL: CallState = {
  phase: "idle",
  kind: "voice",
  peer: null,
  callId: null,
  muted: false,
  cameraOff: false,
  speakerOn: true,
  startedAt: null,
  endReason: null,
  errorCode: null,
  relayWarning: false,
};

type CallContextValue = {
  state: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  entitlements: { voice: boolean; video: boolean; planCode: string };
  canPlace: (kind: CallKind) => boolean;
  place: (args: { conversationId: string; kind: CallKind; peer: CallPeer }) => Promise<void>;
  accept: () => Promise<void>;
  decline: () => Promise<void>;
  hangUp: () => Promise<void>;
  dismiss: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  switchCamera: () => Promise<void>;
};

const CallContext = createContext<CallContextValue | null>(null);

export function useCalls(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCalls must be used inside <CallProvider>");
  return ctx;
}

/** Loads the peer's public card for the call UI. */
async function loadPeer(userId: string): Promise<CallPeer> {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  const avatarUrl = data?.avatar_url ? await signStoragePath("avatars", data.avatar_url) : null;
  return { id: userId, name: data?.display_name ?? "", avatarUrl };
}

function errorCodeOf(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const known = [
    "call_plan_required",
    "call_peer_busy",
    "call_not_member",
    "call_forbidden",
    "call_not_found",
    "call_self",
  ];
  const hit = known.find((code) => message.includes(code));
  return hit ?? "generic";
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { locale } = useI18n();
  const [state, setState] = useState<CallState>(INITIAL);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const isCaller = useRef(false);
  const facing = useRef<"user" | "environment">("user");
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const grantRef = useRef<CallGrant | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const entitlementsQ = useQuery({
    queryKey: ["calls", "entitlements", userId],
    queryFn: () => callEntitlementsFn(),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
  const entitlements = entitlementsQ.data ?? { voice: false, video: false, planCode: "free" };

  /* ------------------------------------------------------------- teardown */

  const teardown = useCallback(() => {
    if (ringTimer.current) clearTimeout(ringTimer.current);
    if (recoverTimer.current) clearTimeout(recoverTimer.current);
    ringTimer.current = null;
    recoverTimer.current = null;
    pendingIce.current = [];
    try {
      pcRef.current?.getSenders().forEach((sender) => sender.track?.stop());
      pcRef.current?.close();
    } catch {
      /* connection already closed */
    }
    pcRef.current = null;
    localRef.current?.getTracks().forEach((track) => track.stop());
    localRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    grantRef.current = null;
  }, []);

  const finish = useCallback(
    (reason: EndReason, errorCode: string | null = null) => {
      teardown();
      setState((prev) => ({
        ...INITIAL,
        phase: "ended",
        kind: prev.kind,
        peer: prev.peer,
        endReason: reason,
        errorCode,
      }));
      // Auto-dismiss the result card.
      window.setTimeout(() => {
        setState((prev) => (prev.phase === "ended" ? INITIAL : prev));
      }, 3200);
    },
    [teardown],
  );

  const send = useCallback((message: SignalMessage) => {
    void channelRef.current?.send({ type: "broadcast", event: "signal", payload: message });
  }, []);

  /* ----------------------------------------------------------- media I/O */

  const getMedia = useCallback(async (kind: CallKind): Promise<MediaStream> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("unsupported");
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: kind === "video" ? { facingMode: facing.current, width: { ideal: 1280 } } : false,
      });
    } catch (error) {
      const name = (error as { name?: string })?.name ?? "";
      if (name === "NotAllowedError" || name === "SecurityError") throw new Error("media_denied");
      if (name === "NotFoundError" || name === "OverconstrainedError") throw new Error("media_missing");
      throw new Error("media_denied");
    }
  }, []);

  /* ------------------------------------------------------- peer + channel */

  const attemptIceRestart = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !isCaller.current) return;
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      send({ type: "offer", from: userId, sdp: offer.sdp ?? "" });
    } catch {
      /* recovery best-effort; the failure timer takes over */
    }
  }, [send, userId]);

  const buildPeer = useCallback(
    (grant: CallGrant, stream: MediaStream) => {
      const pc = new RTCPeerConnection({ iceServers: grant.iceServers });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const inbound = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          if (!inbound.getTracks().some((t) => t.id === track.id)) inbound.addTrack(track);
        });
        setRemoteStream(inbound);
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) send({ type: "ice", from: userId, candidate: event.candidate.toJSON() });
      };
      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") {
          if (recoverTimer.current) clearTimeout(recoverTimer.current);
          recoverTimer.current = null;
          setState((prev) => ({
            ...prev,
            phase: "active",
            startedAt: prev.startedAt ?? Date.now(),
          }));
        } else if (s === "disconnected" || s === "failed") {
          setState((prev) => (prev.phase === "idle" ? prev : { ...prev, phase: "reconnecting" }));
          void attemptIceRestart();
          if (!recoverTimer.current) {
            recoverTimer.current = setTimeout(() => {
              if (pcRef.current?.connectionState !== "connected") {
                void closeCurrent("failed", "connection_lost");
              }
            }, RECONNECT_TIMEOUT_MS);
          }
        }
      };
      return pc;
    },
    // closeCurrent is defined below; referenced lazily through the ref-based closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attemptIceRestart, send, userId],
  );

  const closeCurrentRef = useRef<(reason: EndReason, detail?: string) => Promise<void>>(
    async () => {},
  );
  const closeCurrent = useCallback(
    (reason: EndReason, detail?: string) => closeCurrentRef.current(reason, detail),
    [],
  );

  const drainIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    const queued = pendingIce.current;
    pendingIce.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* stale candidate */
      }
    }
  }, []);

  const openChannel = useCallback(
    (grant: CallGrant, asCaller: boolean) => {
      const channel = supabase.channel(`call-${grant.callId}`, {
        config: { broadcast: { self: false } },
      });
      channelRef.current = channel;

      channel.on("broadcast", { event: "signal" }, async ({ payload }) => {
        const message = payload as SignalMessage;
        if (!message || message.from === userId) return;
        const pc = pcRef.current;
        if (!pc) return;

        if (message.type === "ready" && asCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          send({ type: "offer", from: userId, sdp: offer.sdp ?? "" });
        } else if (message.type === "offer") {
          await pc.setRemoteDescription({ type: "offer", sdp: message.sdp });
          await drainIce();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ type: "answer", from: userId, sdp: answer.sdp ?? "" });
        } else if (message.type === "answer") {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription({ type: "answer", sdp: message.sdp });
            await drainIce();
          }
        } else if (message.type === "ice") {
          if (pc.remoteDescription) {
            try {
              await pc.addIceCandidate(message.candidate);
            } catch {
              /* ignore */
            }
          } else {
            pendingIce.current.push(message.candidate);
          }
        } else if (message.type === "hangup") {
          finish("ended");
        }
      });

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED" && !asCaller) send({ type: "ready", from: userId });
      });
    },
    [drainIce, finish, send, userId],
  );

  /* ------------------------------------------------------------- actions */

  closeCurrentRef.current = async (reason: EndReason, detail?: string) => {
    const callId = stateRef.current.callId;
    send({ type: "hangup", from: userId });
    if (callId) {
      const status =
        reason === "rejected"
          ? "rejected"
          : reason === "missed" || reason === "noAnswer"
            ? "missed"
            : reason === "failed"
              ? "failed"
              : "ended";
      try {
        await closeCallFn({ data: { callId, status, reason: detail ?? status } });
      } catch {
        /* the sweeper closes orphaned rows */
      }
    }
    finish(reason);
  };

  const place = useCallback(
    async ({
      conversationId,
      kind,
      peer,
    }: {
      conversationId: string;
      kind: CallKind;
      peer: CallPeer;
    }) => {
      if (stateRef.current.phase !== "idle" && stateRef.current.phase !== "ended") return;
      // Placing a call is a user gesture — the safest moment to unlock audio.
      primeAudio();
      facing.current = "user";
      setState({ ...INITIAL, phase: "outgoing", kind, peer });
      try {
        const grant = await startCallFn({ data: { conversationId, kind } });
        grantRef.current = grant;
        isCaller.current = true;
        const stream = await getMedia(kind);
        localRef.current = stream;
        setLocalStream(stream);
        buildPeer(grant, stream);
        openChannel(grant, true);
        setState((prev) => ({
          ...prev,
          callId: grant.callId,
          relayWarning: !grant.relayConfigured,
        }));
        ringTimer.current = setTimeout(() => {
          if (stateRef.current.phase === "outgoing") void closeCurrent("noAnswer", "timeout");
        }, RING_TIMEOUT_MS);
      } catch (error) {
        const code = errorCodeOf(error);
        teardown();
        setState({
          ...INITIAL,
          phase: "ended",
          kind,
          peer,
          endReason: code === "call_peer_busy" ? "busy" : "failed",
          errorCode: code,
        });
      }
    },
    [buildPeer, closeCurrent, getMedia, openChannel, teardown],
  );

  const accept = useCallback(async () => {
    primeAudio();
    const callId = stateRef.current.callId;
    const kind = stateRef.current.kind;
    if (!callId) return;
    setState((prev) => ({ ...prev, phase: "connecting" }));
    try {
      const grant = await answerCallFn({ data: { callId } });
      grantRef.current = grant;
      isCaller.current = false;
      const stream = await getMedia(kind);
      localRef.current = stream;
      setLocalStream(stream);
      buildPeer(grant, stream);
      openChannel(grant, false);
      setState((prev) => ({ ...prev, relayWarning: !grant.relayConfigured }));
    } catch (error) {
      const code = errorCodeOf(error);
      try {
        await closeCallFn({ data: { callId, status: "failed", reason: code } });
      } catch {
        /* ignore */
      }
      teardown();
      setState((prev) => ({
        ...INITIAL,
        phase: "ended",
        kind: prev.kind,
        peer: prev.peer,
        endReason: "failed",
        errorCode: code,
      }));
    }
  }, [buildPeer, getMedia, openChannel, teardown]);

  const decline = useCallback(() => closeCurrent("rejected", "declined"), [closeCurrent]);
  const hangUp = useCallback(() => closeCurrent("ended", "hangup"), [closeCurrent]);
  const dismiss = useCallback(() => setState(INITIAL), []);

  /* -------------------------------------------------------- media toggles */

  const toggleMute = useCallback(() => {
    const track = localRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setState((prev) => ({ ...prev, muted: !track.enabled }));
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setState((prev) => ({ ...prev, cameraOff: !track.enabled }));
  }, []);

  const toggleSpeaker = useCallback(() => {
    setState((prev) => ({ ...prev, speakerOn: !prev.speakerOn }));
  }, []);

  const switchCamera = useCallback(async () => {
    const pc = pcRef.current;
    const stream = localRef.current;
    if (!pc || !stream) return;
    facing.current = facing.current === "user" ? "environment" : "user";
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing.current },
        audio: false,
      });
      const nextTrack = next.getVideoTracks()[0];
      if (!nextTrack) return;
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      await sender?.replaceTrack(nextTrack);
      stream.getVideoTracks().forEach((t) => {
        stream.removeTrack(t);
        t.stop();
      });
      stream.addTrack(nextTrack);
      setLocalStream(new MediaStream(stream.getTracks()));
    } catch {
      /* keep the current camera when the switch is unavailable */
    }
  }, []);

  /* --------------------------------------------------- incoming call wire */

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`calls-inbox-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_sessions",
          filter: `callee_id=eq.${userId}`,
        },
        async ({ new: row }) => {
          const session = row as {
            id: string;
            caller_id: string;
            kind: CallKind;
            status: string;
          };
          if (session.status !== "ringing") return;
          if (stateRef.current.phase !== "idle" && stateRef.current.phase !== "ended") {
            try {
              await closeCallFn({
                data: { callId: session.id, status: "busy", reason: "busy" },
              });
            } catch {
              /* ignore */
            }
            return;
          }
          const peer = await loadPeer(session.caller_id);
          setState({
            ...INITIAL,
            phase: "incoming",
            kind: session.kind,
            peer,
            callId: session.id,
          });
          ringTimer.current = setTimeout(() => {
            if (stateRef.current.phase === "incoming") void closeCurrent("missed", "timeout");
          }, RING_TIMEOUT_MS);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_sessions",
          filter: `caller_id=eq.${userId}`,
        },
        ({ new: row }) => {
          const session = row as { id: string; status: string };
          if (session.id !== stateRef.current.callId) return;
          if (session.status === "rejected") finish("rejected");
          else if (session.status === "busy") finish("busy");
          else if (session.status === "missed") finish("noAnswer");
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_sessions",
          filter: `callee_id=eq.${userId}`,
        },
        ({ new: row }) => {
          const session = row as { id: string; status: string };
          if (session.id !== stateRef.current.callId) return;
          if (
            stateRef.current.phase === "incoming" &&
            ["ended", "missed", "failed"].includes(session.status)
          ) {
            finish("missed");
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [closeCurrent, finish, userId]);

  useEffect(() => () => teardown(), [teardown]);

  /* ----------------------------------------------------------- call audio */

  // Ringtone (incoming), ringback (outgoing), busy and end-of-call cues.
  // Tones stop as soon as the call connects or the overlay closes.
  useEffect(() => {
    const { phase, endReason } = state;
    if (phase === "incoming") {
      startCallTone("ringtone");
      return;
    }
    if (phase === "outgoing") {
      startCallTone("ringback");
      return;
    }
    if (phase === "ended") {
      if (endReason === "busy") {
        startCallTone("busy");
        const timer = window.setTimeout(() => stopCallTone(), 2400);
        return () => {
          window.clearTimeout(timer);
          stopCallTone();
        };
      }
      playCallEndTone(endReason === "failed");
      return;
    }
    stopCallTone();
    return;
  }, [state.phase, state.endReason]);

  // Missed incoming call → surface it even if the tab is in the background.
  useEffect(() => {
    if (state.phase !== "ended" || state.endReason !== "missed") return;
    const label = callStrings[locale].missed;
    const name = state.peer?.name ?? "";
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted" &&
      document.visibilityState !== "visible"
    ) {
      try {
        new Notification(label, { body: name, icon: "/icons/icon-192.png", tag: "sakan-missed-call" });
        return;
      } catch {
        /* fall through to the in-app toast */
      }
    }
    toast(label, { description: name });
  }, [state.phase, state.endReason, state.peer?.name, locale]);

  useEffect(() => () => stopCallTone(), []);

  const value = useMemo<CallContextValue>(
    () => ({
      state,
      localStream,
      remoteStream,
      entitlements,
      canPlace: (kind: CallKind) => (kind === "video" ? entitlements.video : entitlements.voice),
      place,
      accept,
      decline,
      hangUp,
      dismiss,
      toggleMute,
      toggleCamera,
      toggleSpeaker,
      switchCamera,
    }),
    [
      accept,
      decline,
      dismiss,
      entitlements,
      hangUp,
      localStream,
      place,
      remoteStream,
      state,
      switchCamera,
      toggleCamera,
      toggleMute,
      toggleSpeaker,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}