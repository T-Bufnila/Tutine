import { api, DEFAULT_SOUND_ID } from "./api";

interface BuiltinSound {
  id: string;
  name: string;
}

export const BUILTIN_SOUNDS: BuiltinSound[] = [
  { id: "builtin:chime", name: "Chime" },
  { id: "builtin:bell", name: "Bell" },
  { id: "builtin:ring", name: "Ring" },
  { id: "builtin:beep", name: "Beep" },
];

/** Alerts should never run on indefinitely, even if a long MP3 is selected. */
const MAX_PLAY_SECONDS = 15;

let context: AudioContext | null = null;
let current: Playback | null = null;
const decodedCustom = new Map<number, AudioBuffer>();

// --- Audio permission --------------------------------------------------------

function getContext(): AudioContext {
  context ??= new AudioContext();
  return context;
}

export function isAudioReady(): boolean {
  return context?.state === "running";
}

/** Browsers only start audio after a user gesture; call this from one. */
export async function unlockAudio(): Promise<boolean> {
  const ctx = getContext();
  if (ctx.state === "suspended") await ctx.resume();
  return ctx.state === "running";
}

/** Unlocks audio on the first click or key press anywhere in the app. */
export function installAudioUnlock(): () => void {
  const unlock = () => {
    unlockAudio().then((ready) => {
      if (ready) remove();
    });
  };
  const events = ["pointerdown", "keydown"] as const;
  const remove = () => events.forEach((e) => window.removeEventListener(e, unlock));
  events.forEach((e) => window.addEventListener(e, unlock));
  return remove;
}

export function onAudioStateChange(listener: () => void): () => void {
  const ctx = getContext();
  ctx.addEventListener("statechange", listener);
  return () => ctx.removeEventListener("statechange", listener);
}

// --- Built-in tones (synthesised, no asset files) -----------------------------

interface Tone {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

interface Playback {
  stop: () => void;
}

function stoppable(nodes: AudioScheduledSourceNode[]): Playback {
  return {
    stop: () =>
      nodes.forEach((node) => {
        try {
          node.stop();
        } catch {
          // Already finished.
        }
      }),
  };
}

function schedule(ctx: AudioContext, out: AudioNode, tones: Tone[]): Playback {
  const nodes: OscillatorNode[] = [];
  const t0 = ctx.currentTime + 0.02;

  for (const { freq, start, duration, type = "sine", gain = 0.25 } of tones) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0.0001, t0 + start);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + start + duration);
    osc.connect(amp).connect(out);
    osc.start(t0 + start);
    osc.stop(t0 + start + duration + 0.05);
    nodes.push(osc);
  }

  return stoppable(nodes);
}

const builtinTones: Record<string, Tone[]> = {
  "builtin:chime": [
    { freq: 880, start: 0, duration: 0.9 },
    { freq: 1320, start: 0.18, duration: 1.1 },
    { freq: 1760, start: 0.36, duration: 1.3, gain: 0.15 },
  ],
  "builtin:bell": [
    { freq: 523, start: 0, duration: 2, gain: 0.3 },
    { freq: 1318, start: 0, duration: 1.4, gain: 0.12 },
    { freq: 1568, start: 0, duration: 1, gain: 0.08 },
  ],
  // Classic two-tone telephone ring, repeated twice.
  "builtin:ring": [0, 0.9].flatMap((offset) => [
    { freq: 440, start: offset, duration: 0.6, type: "triangle" as const, gain: 0.2 },
    { freq: 480, start: offset, duration: 0.6, type: "triangle" as const, gain: 0.2 },
  ]),
  "builtin:beep": [0, 0.25, 0.5].map((start) => ({
    freq: 1000,
    start,
    duration: 0.15,
    type: "square" as const,
    gain: 0.1,
  })),
};

// --- Custom (uploaded) sounds -------------------------------------------------

async function loadCustom(id: number): Promise<AudioBuffer> {
  const cached = decodedCustom.get(id);
  if (cached) return cached;
  const bytes = await api.getSoundData(id);
  const buffer = await getContext().decodeAudioData(bytes);
  decodedCustom.set(id, buffer);
  return buffer;
}

export function forgetCustomSound(id: number) {
  decodedCustom.delete(id);
}

function playBuffer(ctx: AudioContext, out: AudioNode, buffer: AudioBuffer): Playback {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(out);
  source.start();
  source.stop(ctx.currentTime + Math.min(buffer.duration, MAX_PLAY_SECONDS));
  return stoppable([source]);
}

// --- Public API ------------------------------------------------------------------

/** Plays a built-in or custom sound at `volume` (0-100), falling back to the default chime. */
export async function playSound(soundId: string, volume: number): Promise<void> {
  const ctx = getContext();
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});
  current?.stop();

  // Squared so the slider feels even to the ear.
  const master = ctx.createGain();
  master.gain.value = (Math.min(Math.max(volume, 0), 100) / 100) ** 2;
  master.connect(ctx.destination);

  if (soundId.startsWith("custom:")) {
    try {
      current = playBuffer(ctx, master, await loadCustom(Number(soundId.slice("custom:".length))));
      return;
    } catch {
      // Missing or undecodable: fall through to the default sound.
    }
  }
  current = schedule(ctx, master, builtinTones[soundId] ?? builtinTones[DEFAULT_SOUND_ID]);
}
