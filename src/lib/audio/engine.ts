/**
 * Tiny WebAudio tone engine.
 *
 * All product sounds (notifications, ringtones, call tones) are synthesised at
 * runtime instead of shipping audio files: no extra network requests, works
 * offline, and every browser that can run WebRTC can run this.
 *
 * Browsers block audio until the user has interacted with the page, so the
 * context is created lazily and `primeAudio()` is wired to the first gesture.
 */

export type Note = {
  /** Frequency in Hz. */
  freq: number;
  /** Offset from the start of the sequence, in seconds. */
  start: number;
  /** Length in seconds. */
  duration: number;
  /** Peak gain 0..1 (before the master volume). */
  gain?: number;
  type?: OscillatorType;
};

type Ctor = typeof AudioContext;

let ctx: AudioContext | null = null;
let unlocked = false;
let listening = false;

function contextCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Lazily creates the shared AudioContext. Returns null when unsupported/SSR. */
export function audioContext(): AudioContext | null {
  const Ctor = contextCtor();
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
  return ctx;
}

export function isAudioUnlocked(): boolean {
  return unlocked && ctx?.state === "running";
}

/**
 * Unlocks audio playback. Safe to call repeatedly; must run inside (or after)
 * a user gesture on iOS Safari and Chrome's autoplay policy.
 */
export function primeAudio(): void {
  const context = audioContext();
  if (!context) return;
  void context.resume().catch(() => undefined);
  try {
    // A one-sample silent buffer is what actually flips iOS into "unlocked".
    const buffer = context.createBuffer(1, 1, 22_050);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
    unlocked = true;
  } catch {
    /* ignore */
  }
}

/** Installs one-shot gesture listeners so the first tap unlocks audio. */
export function installAudioUnlock(): () => void {
  if (typeof window === "undefined" || listening) return () => undefined;
  listening = true;
  const events = ["pointerdown", "keydown", "touchstart"] as const;
  const handler = () => primeAudio();
  events.forEach((event) => window.addEventListener(event, handler, { passive: true }));
  return () => {
    events.forEach((event) => window.removeEventListener(event, handler));
    listening = false;
  };
}

/** Plays a one-shot sequence. No-ops when audio is unavailable or locked. */
export function playTones(notes: Note[], volume = 0.28): void {
  const context = audioContext();
  if (!context || context.state !== "running") return;
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume));
  master.connect(context.destination);

  for (const note of notes) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = note.type ?? "sine";
    osc.frequency.setValueAtTime(note.freq, now + note.start);
    const peak = note.gain ?? 1;
    // Short attack / exponential release keeps the tones click-free.
    gain.gain.setValueAtTime(0.0001, now + note.start);
    gain.gain.exponentialRampToValueAtTime(peak, now + note.start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + note.start);
    osc.stop(now + note.start + note.duration + 0.05);
  }

  // Release the master node once the longest note has finished.
  const total = notes.reduce((max, n) => Math.max(max, n.start + n.duration), 0);
  window.setTimeout(() => master.disconnect(), (total + 0.3) * 1000);
}

/**
 * Repeats a sequence every `periodMs` until the returned stopper is called.
 * Used for ringtone / ringback / busy cadences.
 */
export function startToneLoop(notes: Note[], periodMs: number, volume = 0.28): () => void {
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    playTones(notes, volume);
  };
  tick();
  const timer = window.setInterval(tick, periodMs);
  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}
