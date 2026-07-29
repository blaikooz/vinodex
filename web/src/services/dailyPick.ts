import { EntryCategory, WineEntry } from '@/shared/types';

/**
 * One entry surfaced per day — the reveal behind "WHAT'S THAT…?".
 *
 * Ported from `vinodex-ios/Sources/VinodexCore/DailyPick.swift`. Deterministic
 * from the date rather than stored: everyone on the same day gets the same
 * entry, reopening never reshuffles it, and there is no state to migrate.
 */

/**
 * Days since the Unix epoch in *local* time, so the pick turns over at local
 * midnight — a UTC day would roll at an arbitrary hour of the reader's evening.
 *
 * Computed from the local calendar date rather than by dividing a timestamp,
 * which would drift by an hour across a DST boundary and could skip or repeat a
 * day.
 */
export function dayIndex(date: Date = new Date()): number {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.floor(startOfDay.getTime() / MS_PER_DAY);
}

/**
 * Categories the reveal rotates through. Regions and styles are as guessable
 * from a silhouette as grapes are, and rotating keeps this from being a
 * grape-only habit.
 */
export const REVEAL_CATEGORIES: EntryCategory[] = ['GRAPES', 'REGIONS', 'STYLES'];

/** Positive modulo — `dayIndex` is negative for dates before 1970. */
const wrap = (value: number, length: number): number => ((value % length) + length) % length;

/** The category for a given day, one step per day. */
export function categoryForDay(date: Date = new Date()): EntryCategory {
  return REVEAL_CATEGORIES[wrap(dayIndex(date), REVEAL_CATEGORIES.length)]!;
}

/**
 * A stride coprime with most pool sizes, so consecutive opens land far apart in
 * the sorted order instead of walking neighbours — adjacent ids are often the
 * same grape family, which made each "new" entry look like a variant of the
 * last one.
 */
const CURSOR_STRIDE = 37;

/**
 * The pick at a given position in the cycle.
 *
 * Strictly one entry per calendar day is right for a "grape of the day" and
 * wrong for what this is: a guessing game you can play. `cursor` advances once
 * per open, while the day still sets the starting point — so the first play of
 * the day is unchanged and two people opening it cold get the same entry.
 *
 * Walks the three categories as one flat sequence rather than rotating category
 * first, which would telegraph the answer's *kind* on every turn.
 */
export function revealEntry(
  entries: WineEntry[],
  cursor: number,
  date: Date = new Date(),
): WineEntry | null {
  const pool = entries
    .filter(e => REVEAL_CATEGORIES.includes(e.category))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (pool.length === 0) return null;

  const raw = dayIndex(date) + cursor * CURSOR_STRIDE;
  return pool[wrap(raw, pool.length)]!;
}

/**
 * How many times the reveal has been opened.
 *
 * Persisted so the cycle continues across visits rather than restarting at the
 * same entry every cold load. This one *is* written to localStorage, unlike
 * `screenState` — a reveal cursor that reset on refresh would hand you the same
 * answer you had just been given.
 */
const CURSOR_KEY = 'revealCursor';

export function revealCursor(): number {
  try {
    const raw = window.localStorage.getItem(CURSOR_KEY);
    const parsed = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    // Private-mode Safari throws on localStorage access. A reveal that always
    // starts from today's entry is a far better failure than a blank screen.
    return 0;
  }
}

/** Advances and returns the new position. Called once per open. */
export function advanceRevealCursor(): number {
  const next = revealCursor() + 1;
  try {
    window.localStorage.setItem(CURSOR_KEY, String(next));
  } catch {
    // Ignored for the same reason as above; the cycle just will not persist.
  }
  return next;
}
