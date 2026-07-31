import { QuizSession, newSession } from './quiz';
import { dayIndex } from './dailyPick';

/**
 * The daily challenge, ported from
 * `vinodex-ios/Sources/VinodexCore/DailyChallenge.swift`.
 *
 * One shared 5-question paper per local day (everyone gets the same one),
 * seeded off the day so it's stable and unrepeatable. 4/5 to pass. A pass on the
 * day after the last sitting extends the streak; a gap restarts it at 1; any
 * fail zeroes it. One sitting per day — no retry.
 */

const DAILY_LENGTH = 5;
const DAILY_PASS = 4;
const DAILY_MULT = 8093;

export function dailySession(date = new Date()): QuizSession {
  return newSession(dayIndex(date) * DAILY_MULT, 'ENTHUSIAST', DAILY_LENGTH, DAILY_PASS);
}

// --- StreakStore ------------------------------------------------------------
const STREAK_KEY = 'dailyStreak';
const LAST_DAY_KEY = 'dailyLastDay';
const BEST_KEY = 'dailyBestStreak';

function readInt(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    const n = raw == null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}
function writeInt(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* ignore */
  }
}
/** null distinguishes "never played" from "played on day 0". */
function readLastDay(): number | null {
  try {
    const raw = window.localStorage.getItem(LAST_DAY_KEY);
    if (raw == null) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function currentStreak(): number {
  return readInt(STREAK_KEY);
}
export function bestStreak(): number {
  return readInt(BEST_KEY);
}
export function isTodayDone(day = dayIndex()): boolean {
  return readLastDay() === day;
}

/**
 * Record a sitting. Returns the new current streak. Same-day re-sit is a no-op.
 * pass on the day after last → +1; pass after a gap (or first ever) → 1;
 * fail → 0.
 */
export function recordDaily(passed: boolean, day = dayIndex()): number {
  const previous = readLastDay();
  if (previous === day) return currentStreak();
  let current: number;
  if (passed) current = previous === day - 1 ? currentStreak() + 1 : 1;
  else current = 0;
  const best = Math.max(bestStreak(), current);
  writeInt(STREAK_KEY, current);
  writeInt(BEST_KEY, best);
  writeInt(LAST_DAY_KEY, day);
  return current;
}
