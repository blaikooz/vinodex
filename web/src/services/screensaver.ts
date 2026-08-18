/**
 * The screensaver's clockwork, ported from
 * `vinodex-ios/Sources/VinodexCore/ScreensaverBounce.swift` and the threshold
 * half of `IdleTimer.swift` (0.7.3 A5/F2, 0.7.6 A2, 0.8.0 H) — v6#33.
 *
 * **A closed form, not a simulation.** A stepped velocity/position drifts
 * (floating-point error accumulates over the minutes a screensaver actually
 * runs) and is untestable; a position that is a pure function of elapsed time
 * has neither problem — the frame loop asks for the point at `t`, and a test
 * can ask for the point at t = 10,000 seconds and get an exact answer.
 *
 * The path is the classic one: constant velocity, perfect reflection off all
 * four walls. On each axis independently that is a triangle wave.
 */

/**
 * One authored threshold (0.8.0 H moved it to 60 — one edit, both
 * behaviours). The marquee toast stage folded into it in 0.7.6 (A4); the
 * web's marquee-script port (v6#20) inherits that fold when it lands.
 */
export const IDLE_SCREENSAVER_SECONDS = 60;

/**
 * Points per second per axis. Different and coprime-ish rather than equal, so
 * the mark traces a long path that does not repeat quickly — equal speeds
 * send it round a short diagonal loop, which reads as a bug.
 */
export const BOUNCE_VELOCITY = { x: 47, y: 31 };

/**
 * Where the mark starts, as a phase on each axis — **a phase, not a point, so
 * the closed form survives.** The path on each axis is a triangle wave with
 * period 2 × travel, so any start position and either heading is reachable by
 * shifting `t` along the wave: one random pair gives a random position *and*
 * a random heading, and the position stays exact at t = 10,000 s.
 */
export interface ScreensaverStart {
  /** Both in [0, 1). */
  x: number;
  y: number;
}

const wrapPhase = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  const phase = value % 1;
  return phase < 0 ? phase + 1 : phase;
};

export const screensaverStart = (x: number, y: number): ScreensaverStart => ({
  x: wrapPhase(x),
  y: wrapPhase(y),
});

/** The top-left corner, travelling down and right — the pre-0.7.6 start. */
export const CORNER_START: ScreensaverStart = { x: 0, y: 0 };

export const randomStart = (rand: () => number = Math.random): ScreensaverStart =>
  screensaverStart(rand(), rand());

/**
 * A triangle wave: a value walking up from 0 to `span` and back, forever.
 * `span` is the *travel* — the box minus the mark — so a fold at the top of
 * the range puts the mark's far edge exactly on the wall. Guards a
 * non-positive span: a box smaller than the mark it holds has no travel.
 */
export const fold = (distance: number, span: number): number => {
  if (span <= 0) return 0;
  const cycle = span * 2;
  let phase = distance % cycle;
  if (phase < 0) phase += cycle;
  return phase <= span ? phase : cycle - phase;
};

/** Distance along an axis by `time`, including the phase's head start. */
export const distanceAt = (time: number, velocity: number, span: number, phase: number): number =>
  Math.max(time, 0) * velocity + phase * span * 2;

/** The mark's top-left corner at `time` seconds into the screensaver. */
export const bouncePosition = (
  time: number,
  box: { width: number; height: number },
  mark: { width: number; height: number },
  start: ScreensaverStart = CORNER_START,
): { x: number; y: number } => {
  const travelX = box.width - mark.width;
  const travelY = box.height - mark.height;
  return {
    x: fold(distanceAt(time, BOUNCE_VELOCITY.x, travelX, start.x), travelX),
    y: fold(distanceAt(time, BOUNCE_VELOCITY.y, travelY, start.y), travelY),
  };
};
