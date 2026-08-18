import { IDLE_SCREENSAVER_SECONDS } from './screensaver';

/**
 * What the marquee panel says on the main screen, and when it changes —
 * ported from `vinodex-ios/Sources/VinodexCore/MarqueeScript.swift`
 * (0.7.1 B1–B3, 0.7.2 A8, 0.8.1 I2) — v6#20 (script half; the drawn marquee
 * art rides the v6#2 ruling).
 *
 * The device greets you once, settles into naming the screen, and only goes
 * back to a toast when you have stopped using it. Three states, two
 * transitions, and an end. The policy lives here where a test can see it;
 * the chassis owns the clock and reads the table.
 *
 * The script only runs on the main menu — every other screen's panel is its
 * own title.
 */

export type MarqueeStage = 'welcome' | 'menu' | 'cheers';

/**
 * The toasts the idle panel rotates through (0.7.2, A8). ASCII, uppercase,
 * and 14 characters or fewer — the bundled Press Start 2P has a partial
 * Latin-1 range, and a missing glyph on the device's most prominent panel is
 * worse than a missing accent (SANTE and SAUDE lose theirs on purpose).
 * Index 0 is CHEERS! — the first idle of a launch should be the toast in the
 * user's own interface language.
 */
export const MARQUEE_CHEERS: string[] = [
  'CHEERS!', // English
  'SANTE!', // French
  'SALUD!', // Spanish
  'CIN CIN!', // Italian
  'PROST!', // German
  'SAUDE!', // Portuguese
  'YAMAS!', // Greek
  'SKAL!', // Danish, Norwegian, Swedish
  'KANPAI!', // Japanese
];

/** The toast at a rotation count, wrapping forever, floored at zero. */
export const cheersToast = (index: number): string =>
  MARQUEE_CHEERS[Math.max(index, 0) % MARQUEE_CHEERS.length]!;

/**
 * How long one language holds the panel (0.8.1, I2): five seconds against a
 * 60-second idle delay means an idle that runs its course walks most of the
 * nine.
 */
export const CHEERS_DWELL_SECONDS = 5;

/** Languages an idle period of this length has moved through — a pure
 *  function of elapsed time, on the screensaver's footing. */
export const cheersSteps = (seconds: number): number =>
  Math.floor(Math.max(seconds, 0) / CHEERS_DWELL_SECONDS);

/** WELCOME! is a beat — long enough to read eight characters, no longer. */
export const WELCOME_BEAT_SECONDS = 2.4;

/**
 * When the greeting is due — `IdleSchedule.cheers`: the pre-idle toast folded
 * into the screensaver's one threshold (0.7.6 A4, 60 s since 0.8.0 H), so
 * the marquee idles on the same reckoning as everything else that cares.
 */
export const IDLE_CHEERS_SECONDS = IDLE_SCREENSAVER_SECONDS;

export const stageText = (stage: MarqueeStage): string => {
  switch (stage) {
    case 'welcome':
      return 'WELCOME!';
    case 'menu':
      return 'MENU';
    case 'cheers':
      return MARQUEE_CHEERS[0]!;
  }
};

/** The dwell a stage is waiting out; null is a resting state only interaction leaves. */
export const stageTimeout = (stage: MarqueeStage): { after: number; then: MarqueeStage } | null => {
  switch (stage) {
    case 'welcome':
      return { after: WELCOME_BEAT_SECONDS, then: 'menu' };
    case 'menu':
      return { after: IDLE_CHEERS_SECONDS, then: 'cheers' };
    case 'cheers':
      return null;
  }
};

/**
 * The state machine, as a plain value with pure transitions (the web's
 * `mutating struct`).
 */
export interface MarqueeScript {
  stage: MarqueeStage;
  /** WELCOME! has had its turn this launch — once, per launch, is the whole
   *  of B1. Not persisted; the greeting ladder is a per-launch story. */
  greeted: boolean;
  /** Idle periods this launch has spent — the index into the toasts.
   *  Advanced on *leaving* CHEERS!, never on arriving: the panel on screen
   *  must not change under the user. */
  idleCount: number;
}

export const newScript = (): MarqueeScript => ({ stage: 'welcome', greeted: false, idleCount: 0 });

/** What the panel says right now. */
export const scriptText = (s: MarqueeScript): string =>
  s.stage === 'cheers' ? cheersToast(s.idleCount) : stageText(s.stage);

/**
 * What the panel says `seconds` into this idle period (0.8.1, I2): the
 * rotation advances every dwell *as well as* per idle period — `idleCount`
 * still sets where the period starts, so consecutive idles do not all open
 * on CHEERS!. Off `.cheers` this is `scriptText`, unchanged — WELCOME! and
 * MENU are statements about a screen, and a statement that rotated would be
 * a different kind of thing.
 */
export const scriptTextAfter = (s: MarqueeScript, seconds: number): string =>
  s.stage === 'cheers' ? cheersToast(s.idleCount + cheersSteps(seconds)) : scriptText(s);

/** A dwell expired. Returns the next state and whether the stage moved. */
export const timedOut = (s: MarqueeScript): { script: MarqueeScript; moved: boolean } => {
  const next = stageTimeout(s.stage)?.then;
  if (!next) return { script: s, moved: false };
  return { script: { ...s, stage: next, greeted: next !== 'welcome' ? true : s.greeted }, moved: true };
};

/**
 * The user did something. Consumes WELCOME! — someone who taps within the
 * first two seconds has been greeted whether or not they read it — and ends
 * a CHEERS! period, so the next idle brings the next language. Activity on
 * an already-resting MENU is the common case and reports unmoved.
 */
export const noteActivity = (s: MarqueeScript): { script: MarqueeScript; moved: boolean } => {
  if (s.stage === 'menu') return { script: { ...s, greeted: true }, moved: false };
  return {
    script: { stage: 'menu', greeted: true, idleCount: s.stage === 'cheers' ? s.idleCount + 1 : s.idleCount },
    moved: true,
  };
};

/** The user left the main screen — consume the greeting, park at MENU. */
export const leftMainScreen = (s: MarqueeScript): MarqueeScript => ({
  stage: 'menu',
  greeted: true,
  idleCount: s.stage === 'cheers' ? s.idleCount + 1 : s.idleCount,
});

// ---------------------------------------------------------------------------
// The one script of this launch. In module state rather than component state
// because the web chassis unmounts per screen — iOS keeps it in `@State` on a
// chassis that never unmounts, and the per-launch story must survive a trip
// into GRAPES and back.
// ---------------------------------------------------------------------------

let current: MarqueeScript = newScript();
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach(fn => fn());

export const subscribeToMarquee = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

export const currentScript = (): MarqueeScript => current;

export const applyTimedOut = (): boolean => {
  const { script, moved } = timedOut(current);
  current = script;
  if (moved) notify();
  return moved;
};

export const applyActivity = (): boolean => {
  const { script, moved } = noteActivity(current);
  current = script;
  if (moved) notify();
  return moved;
};

export const applyLeftMainScreen = (): void => {
  current = leftMainScreen(current);
  notify();
};

/** Test hook. */
export const resetScriptForTests = (): void => {
  current = newScript();
};
