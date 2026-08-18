/**
 * The two daily primitives every dated feature reads.
 *
 * This file used to be the WHAT'S THAT…? reveal's engine
 * (`DailyPick.swift`'s port). Ruling v6#6 deleted the game to match iOS
 * 0.8.93 — screen, route, tile and the reveal arithmetic — and this was
 * **trimmed, not deleted** (review R3): `dayIndex` is the calendar every
 * dated feature reads (the daily challenge, the moon dial, the tried-day
 * log, the exam record, the archive), and `revealCursor` outlived its game
 * as a seeding primitive, exactly as iOS's `RevealCursor` did — the WINE
 * EXAM seeds papers from `revealCursor() + dayIndex()` on both platforms.
 */

/**
 * Days since the Unix epoch in *local* time, so a day turns over at local
 * midnight — a UTC day would roll at an arbitrary hour of the reader's
 * evening. Computed from the local calendar date rather than by dividing a
 * timestamp, which would drift by an hour across a DST boundary and could
 * skip or repeat a day.
 */
export function dayIndex(date: Date = new Date()): number {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.floor(startOfDay.getTime() / MS_PER_DAY);
}

/**
 * A per-install counter, persisted so the exam-seed cycle continues across
 * visits rather than restarting at the same paper every cold load. The key
 * keeps its `revealCursor` spelling — persisted raw values are never renamed,
 * and it is archived under that name on both platforms.
 */
const CURSOR_KEY = 'revealCursor';

export function revealCursor(): number {
  try {
    const raw = window.localStorage.getItem(CURSOR_KEY);
    const parsed = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    // Private-mode Safari throws on localStorage access. A seed that always
    // starts from today is a far better failure than a blank screen.
    return 0;
  }
}
