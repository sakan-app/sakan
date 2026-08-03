import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Phone,
  PhoneOff,
  RefreshCw,
  UserRound,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useFeatureStrings } from "@/i18n/feature";
import { useCalls } from "@/lib/calls/CallProvider";
import { callStrings } from "@/lib/calls/strings";

function useDuration(startedAt: number | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return "00:00";
  const total = Math.max(0, Math.floor((now - startedAt) / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/** Short WebAudio ring so incoming/outgoing calls are audible without assets. */
function useRingtone(active: boolean, pattern: "incoming" | "outgoing" | null) {
  useEffect(() => {
    if (!active || !pattern) return;
    const AudioCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    let stopped = false;
    const beep = () => {
      if (stopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = pattern === "incoming" ? 660 : 440;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    };
    beep();
    const id = window.setInterval(beep, pattern === "incoming" ? 1600 : 2600);
    return () => {
      stopped = true;
      window.clearInterval(id);
      void ctx.close();
    };
  }, [active, pattern]);
}

function ControlButton({
  label,
  onClick,
  active,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : active}
      className={`grid h-14 w-14 place-items-center rounded-full border transition tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 ${
        danger
          ? "border-transparent bg-[#e04848] text-white hover:bg-[#c93c3c]"
          : active
            ? "border-gold/50 bg-[color-mix(in_oklab,var(--gold)_22%,transparent)] text-gold"
            : "border-white/15 bg-white/10 text-cream hover:bg-white/16"
      }`}
    >
      {children}
    </button>
  );
}

function PeerAvatar({ url, name, size = 112 }: { url: string | null; name: string; size?: number }) {
  return url ? (
    <img
      src={url}
      alt=""
      style={{ width: size, height: size }}
      className="rounded-full object-cover ring-2 ring-gold/40"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="grid place-items-center rounded-full bg-navy text-gold/60 ring-2 ring-gold/30"
      aria-hidden
    >
      <UserRound className="h-1/2 w-1/2" />
    </span>
  );
}

export function CallOverlay() {
  const {
    state,
    localStream,
    remoteStream,
    accept,
    decline,
    hangUp,
    dismiss,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    switchCamera,
  } = useCalls();
  const s = useFeatureStrings(callStrings);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const duration = useDuration(state.startedAt);
  const isVideo = state.kind === "video";
  const open = state.phase !== "idle";

  useRingtone(open, state.phase === "incoming" ? "incoming" : state.phase === "outgoing" ? "outgoing" : null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    if (audioRef.current && remoteStream) audioRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  // Speaker routing where the browser exposes output device selection.
  useEffect(() => {
    const el = audioRef.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (!el) return;
    el.volume = state.speakerOn ? 1 : 0.35;
    if (typeof el.setSinkId === "function") void el.setSinkId("default").catch(() => undefined);
  }, [state.speakerOn]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shellRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  const statusLine = (() => {
    switch (state.phase) {
      case "incoming":
        return isVideo ? s.incomingVideo : s.incomingVoice;
      case "outgoing":
        return s.ringing;
      case "connecting":
        return s.connecting;
      case "reconnecting":
        return s.reconnecting;
      case "active":
        return duration;
      case "ended":
        if (state.errorCode && state.errorCode !== "generic") {
          return s.errors[state.errorCode] ?? s.errors["generic"]!;
        }
        if (state.endReason === "rejected") return s.rejected;
        if (state.endReason === "missed") return s.missed;
        if (state.endReason === "noAnswer") return s.noAnswer;
        if (state.endReason === "busy") return s.busy;
        if (state.endReason === "failed") return s.failed;
        return s.ended;
      default:
        return "";
    }
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={isVideo ? s.videoCall : s.voiceCall}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-navy-deep/70 p-0 backdrop-blur-md sm:items-center sm:p-6"
        >
          <motion.div
            ref={shellRef}
            initial={{ y: 24, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden border border-white/12 glass-card sm:h-auto sm:max-h-[86vh] sm:min-h-[520px] sm:w-full sm:max-w-[440px] sm:rounded-[28px]"
          >
            {/* remote video layer */}
            {isVideo && (state.phase === "active" || state.phase === "reconnecting") && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full bg-navy-deep object-cover"
              />
            )}

            <audio ref={audioRef} autoPlay className="hidden" />

            <div className="relative flex flex-1 flex-col items-center justify-between gap-6 px-6 py-8 app-safe-top">
              <div className="flex flex-col items-center gap-4 text-center">
                {(!isVideo || state.phase !== "active") && (
                  <motion.div
                    animate={
                      state.phase === "incoming" || state.phase === "outgoing"
                        ? { scale: [1, 1.04, 1] }
                        : { scale: 1 }
                    }
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <PeerAvatar url={state.peer?.avatarUrl ?? null} name={state.peer?.name ?? ""} />
                  </motion.div>
                )}
                <div className="rounded-2xl bg-navy-deep/40 px-4 py-2">
                  <p className="text-lg font-bold text-cream">{state.peer?.name}</p>
                  <p
                    aria-live="polite"
                    className={`text-sm ${state.phase === "reconnecting" ? "text-gold" : "text-cream/70"}`}
                  >
                    {statusLine}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wide text-gold/70">
                    {isVideo ? s.videoCall : s.voiceCall}
                  </p>
                </div>
                {state.relayWarning && state.phase !== "ended" && (
                  <p className="max-w-[280px] text-[11px] text-cream/50">{s.relayWarning}</p>
                )}
              </div>

              {/* local preview */}
              {isVideo && localStream && state.phase !== "ended" && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  aria-label={s.you}
                  className="absolute end-4 top-4 h-32 w-24 rounded-2xl border border-white/20 bg-navy object-cover shadow-[var(--shadow-float)] rtl:-scale-x-100"
                />
              )}

              {/* controls */}
              <div className="flex w-full flex-col items-center gap-4">
                {state.phase === "incoming" ? (
                  <div className="flex w-full items-center justify-around">
                    <ControlButton label={s.decline} onClick={() => void decline()} danger>
                      <PhoneOff className="h-6 w-6" />
                    </ControlButton>
                    <button
                      type="button"
                      onClick={() => void accept()}
                      aria-label={s.accept}
                      className="grid h-16 w-16 place-items-center rounded-full bg-[#2fa96a] text-white transition tap-scale hover:bg-[#279059] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                    >
                      {isVideo ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
                    </button>
                  </div>
                ) : state.phase === "ended" ? (
                  <button
                    type="button"
                    onClick={dismiss}
                    className="rounded-full border border-gold/40 px-6 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                  >
                    {s.close}
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <ControlButton
                      label={state.muted ? s.unmute : s.mute}
                      onClick={toggleMute}
                      active={state.muted}
                    >
                      {state.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </ControlButton>

                    {isVideo ? (
                      <>
                        <ControlButton
                          label={state.cameraOff ? s.cameraOn : s.cameraOff}
                          onClick={toggleCamera}
                          active={state.cameraOff}
                        >
                          {state.cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                        </ControlButton>
                        <ControlButton label={s.switchCamera} onClick={() => void switchCamera()}>
                          <Camera className="h-5 w-5" />
                        </ControlButton>
                        <ControlButton
                          label={fullscreen ? s.exitFullscreen : s.fullscreen}
                          onClick={toggleFullscreen}
                          active={fullscreen}
                        >
                          {fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                        </ControlButton>
                      </>
                    ) : (
                      <ControlButton
                        label={state.speakerOn ? s.speakerOff : s.speakerOn}
                        onClick={toggleSpeaker}
                        active={state.speakerOn}
                      >
                        {state.speakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                      </ControlButton>
                    )}

                    {state.phase === "reconnecting" && (
                      <span className="grid h-14 w-14 place-items-center rounded-full border border-gold/40 text-gold">
                        <RefreshCw className="h-5 w-5 animate-spin" aria-hidden />
                      </span>
                    )}

                    <ControlButton label={s.hangUp} onClick={() => void hangUp()} danger>
                      <PhoneOff className="h-6 w-6" />
                    </ControlButton>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}