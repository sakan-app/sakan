/**
 * Call tones: ringtone, ringback, busy, and the end-of-call chime.
 *
 * Cadences follow familiar telephony patterns so they read correctly to users
 * on any device. Everything is synthesised, so the tones also work offline and
 * need no autoplay-blocked <audio> elements.
 */
import { playTones, startToneLoop, type Note } from "@/lib/audio/engine";

export type CallTone = "ringtone" | "ringback" | "busy";

/** Incoming call — bright double-buzz repeated every 3s (classic ring cadence). */
const RINGTONE: Note[] = [
  { freq: 880, start: 0, duration: 0.38, gain: 0.55, type: "triangle" },
  { freq: 1108.73, start: 0.02, duration: 0.36, gain: 0.35, type: "sine" },
  { freq: 880, start: 0.5, duration: 0.38, gain: 0.55, type: "triangle" },
  { freq: 1108.73, start: 0.52, duration: 0.36, gain: 0.35, type: "sine" },
];

/** Outgoing call — European ringback: 1s tone, 4s silence. */
const RINGBACK: Note[] = [{ freq: 425, start: 0, duration: 0.9, gain: 0.4, type: "sine" }];

/** Peer busy — 480/620Hz style beeps at 0.5s on / 0.5s off. */
const BUSY: Note[] = [
  { freq: 480, start: 0, duration: 0.42, gain: 0.42 },
  { freq: 620, start: 0, duration: 0.42, gain: 0.3 },
];

/** Call ended — soft descending two-note chime. */
const ENDED: Note[] = [
  { freq: 659.25, start: 0, duration: 0.12, gain: 0.4 },
  { freq: 440, start: 0.12, duration: 0.24, gain: 0.36 },
];

/** Call failed / unreachable — low double thud. */
const FAILED: Note[] = [
  { freq: 311.13, start: 0, duration: 0.18, gain: 0.42, type: "triangle" },
  { freq: 233.08, start: 0.2, duration: 0.28, gain: 0.42, type: "triangle" },
];

const LOOPS: Record<CallTone, { notes: Note[]; period: number; volume: number }> = {
  ringtone: { notes: RINGTONE, period: 3000, volume: 0.32 },
  ringback: { notes: RINGBACK, period: 5000, volume: 0.2 },
  busy: { notes: BUSY, period: 1000, volume: 0.24 },
};

let stopCurrent: (() => void) | null = null;
let currentTone: CallTone | null = null;

/** Starts (or switches to) a looping call tone. Idempotent per tone. */
export function startCallTone(tone: CallTone): void {
  if (currentTone === tone) return;
  stopCallTone();
  const config = LOOPS[tone];
  currentTone = tone;
  stopCurrent = startToneLoop(config.notes, config.period, config.volume);
}

export function stopCallTone(): void {
  stopCurrent?.();
  stopCurrent = null;
  currentTone = null;
}

/** One-shot end-of-call cue. `failed` uses the lower, negative variant. */
export function playCallEndTone(failed = false): void {
  stopCallTone();
  playTones(failed ? FAILED : ENDED, failed ? 0.26 : 0.24);
}
