/**
 * The SFX pack, ported from `vinodex-ios/Sources/VinodexUI/DexSound.swift`.
 *
 * Opt-in (default off, key `soundsEnabled`). Five clips: a percussive tap that
 * rides every button click, a warm selection ping, the quiz's correct and
 * wrong answer stings (wrong since iOS 0.6.8 J3 -- this header claimed it was
 * deliberately silent long after it stopped being true), and the orb-depress
 * voice for the device flip. `page`/`boot` stay silent, as iOS keeps them.
 * Everything is failure-tolerant
 * — a browser that refuses audio gets a silent app, not a crash.
 */

type SoundKind = 'tap' | 'select' | 'correct' | 'wrong' | 'orb';

const FILES: Record<SoundKind, string> = {
  tap: '/sfx/button-tap.mp3',
  select: '/sfx/warm-ping.mp3',
  correct: '/sfx/correct-answer.mp3',
  wrong: '/sfx/incorrect-answer.mp3',
  orb: '/sfx/orb-depress.mp3',
};

const STORAGE_KEY = 'soundsEnabled';

let revision = 0;
const listeners = new Set<() => void>();
const cache = new Map<SoundKind, HTMLAudioElement>();

export function soundsEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSoundsEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'true' : 'false');
  } catch {
    /* ignore */
  }
  revision += 1;
  listeners.forEach(fn => fn());
}

function base(kind: SoundKind): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  let a = cache.get(kind);
  if (!a) {
    try {
      a = new Audio(FILES[kind]);
      a.preload = 'auto';
      cache.set(kind, a);
    } catch {
      return null;
    }
  }
  return a;
}

/** Play a clip if sounds are on. Clones the node so overlaps don't cut off. */
export function playSound(kind: SoundKind): void {
  if (!soundsEnabled()) return;
  const a = base(kind);
  if (!a) return;
  try {
    const node = a.cloneNode(true) as HTMLAudioElement;
    node.volume = kind === 'tap' ? 0.5 : 0.7;
    void node.play().catch(() => {});
  } catch {
    /* a device that refuses audio gets silence, not a crash */
  }
}

export const playTap = () => playSound('tap');
export const playSelect = () => playSound('select');
export const playCorrect = () => playSound('correct');
export const playWrong = () => playSound('wrong');
export const playOrb = () => playSound('orb');

/**
 * Rides the tap onto every button click, the web analogue of iOS piggybacking
 * on the Haptics call sites — one listener rather than touching every button.
 * Call once at app start.
 */
export function installGlobalTapSound(): void {
  if (typeof document === 'undefined') return;
  document.addEventListener(
    'click',
    e => {
      if (!soundsEnabled()) return;
      const el = e.target as HTMLElement | null;
      if (el && el.closest('button')) playTap();
    },
    true,
  );
}

export function subscribeToSound(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}
export function soundRevision(): number {
  return revision;
}
