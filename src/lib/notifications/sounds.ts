/**
 * Notification sounds.
 *
 * One short, distinct cue per notification type, synthesised through the
 * shared WebAudio engine. Playback respects: the member's sound preference,
 * do-not-disturb / busy presence, and the browser's autoplay policy (nothing
 * is heard until the first user interaction unlocks audio).
 */
import { isAudioUnlocked, playTones, type Note } from "@/lib/audio/engine";
import type { NotificationType } from "@/hooks/useNotifications";

export type SoundKey = NotificationType | "admin";

const PREF_KEY = "sakan:sound-enabled";
/** Two cues of the same kind inside this window collapse into one. */
const DEDUPE_MS = 1200;

const lastPlayedAt = new Map<SoundKey, number>();

const SOUNDS: Record<SoundKey, { notes: Note[]; volume: number }> = {
  // Soft two-tone "pop" — the most frequent sound, so the quietest.
  message: {
    notes: [
      { freq: 660, start: 0, duration: 0.09, gain: 0.5 },
      { freq: 880, start: 0.08, duration: 0.13, gain: 0.45 },
    ],
    volume: 0.22,
  },
  // Warm rising third.
  like: {
    notes: [
      { freq: 587.33, start: 0, duration: 0.1, gain: 0.5 },
      { freq: 739.99, start: 0.09, duration: 0.16, gain: 0.45 },
    ],
    volume: 0.24,
  },
  // Celebratory major arpeggio for a mutual match.
  match: {
    notes: [
      { freq: 523.25, start: 0, duration: 0.12, gain: 0.5 },
      { freq: 659.25, start: 0.11, duration: 0.12, gain: 0.5 },
      { freq: 783.99, start: 0.22, duration: 0.14, gain: 0.5 },
      { freq: 1046.5, start: 0.34, duration: 0.26, gain: 0.42 },
    ],
    volume: 0.26,
  },
  // Confident confirmation for identity verification.
  verification: {
    notes: [
      { freq: 783.99, start: 0, duration: 0.12, gain: 0.45 },
      { freq: 1046.5, start: 0.12, duration: 0.22, gain: 0.42 },
    ],
    volume: 0.24,
  },
  premium: {
    notes: [
      { freq: 880, start: 0, duration: 0.1, gain: 0.42 },
      { freq: 1174.66, start: 0.1, duration: 0.1, gain: 0.42 },
      { freq: 1567.98, start: 0.2, duration: 0.22, gain: 0.36 },
    ],
    volume: 0.22,
  },
  profile_view: {
    notes: [{ freq: 698.46, start: 0, duration: 0.14, gain: 0.4 }],
    volume: 0.18,
  },
  // Neutral generic notification.
  system: {
    notes: [
      { freq: 523.25, start: 0, duration: 0.1, gain: 0.45 },
      { freq: 698.46, start: 0.1, duration: 0.18, gain: 0.4 },
    ],
    volume: 0.22,
  },
  // Lower, more serious cue for staff/admin alerts.
  admin: {
    notes: [
      { freq: 392, start: 0, duration: 0.13, gain: 0.5, type: "triangle" },
      { freq: 329.63, start: 0.14, duration: 0.13, gain: 0.5, type: "triangle" },
      { freq: 392, start: 0.28, duration: 0.2, gain: 0.42, type: "triangle" },
    ],
    volume: 0.26,
  },
};

/** Reads the member's sound preference (enabled by default). */
export function soundsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
    window.dispatchEvent(new CustomEvent("sakan:sound-pref", { detail: enabled }));
  } catch {
    /* storage blocked */
  }
}

export const SOUND_PREF_EVENT = "sakan:sound-pref";

/**
 * Plays the cue for a notification type.
 * `silent` carries do-not-disturb (and any caller-side muting).
 */
export function playNotificationSound(key: SoundKey, silent = false): void {
  if (silent || !soundsEnabled() || !isAudioUnlocked()) return;
  const now = Date.now();
  const previous = lastPlayedAt.get(key) ?? 0;
  if (now - previous < DEDUPE_MS) return;
  lastPlayedAt.set(key, now);
  const sound = SOUNDS[key] ?? SOUNDS.system;
  playTones(sound.notes, sound.volume);
}
