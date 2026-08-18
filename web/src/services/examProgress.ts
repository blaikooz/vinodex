import { ExamCategory, ExamTier, EXAM_CATEGORIES } from '@/shared/data/exam';
import { ExamRun, examTierLadder, runCorrect, runPassed } from './examPaper';
import { QuizTier, recordTierPass } from './quiz';
import { dayIndex } from './dailyPick';

/**
 * The Wine Exam's performance history, ported from
 * `vinodex-ios/Sources/VinodexCore/ExamProgress.swift` (v6#8).
 *
 * What this does *not* do, and why: it does not hold the tier ladder —
 * `quiz.ts` already does (it is the store behind `quizTierUnlocked`, it
 * already gates which papers may be started), and a second ladder store would
 * have to be kept in step with it forever. `record()` calls
 * `recordTierPass` and returns what it returns. Statistics are **derived from
 * the history rather than separately maintained**: a stored counter and a
 * stored list are two things that can disagree, and the one that disagrees is
 * always the counter.
 *
 * Storage keys match the iOS raw values (`examResults`,
 * `examBestPassStreak`) — persisted vocabulary is shared vocabulary.
 */

export interface ExamCategoryTally {
  right: number;
  asked: number;
}

export const tallyAccuracy = (t: ExamCategoryTally): number => (t.asked === 0 ? 0 : t.right / t.asked);

/**
 * One completed paper. Deliberately small and flat — a record that carried
 * the questions would grow the stored blob by two orders of magnitude for a
 * statistic nobody asked for. Category keys are raw strings so a category
 * retired in a later batch degrades to a row the stats skip rather than
 * failing the whole history's parse.
 */
export interface ExamResult {
  tier: ExamTier;
  correct: number;
  length: number;
  passed: boolean;
  /** `dayIndex()` at the moment the paper finished. */
  day: number;
  categories: Record<string, ExamCategoryTally>;
}

export interface ExamStats {
  papers: number;
  passes: number;
  questionsAnswered: number;
  questionsRight: number;
  /** Papers passed in a row from the most recent — **not** a calendar streak. */
  passStreak: number;
  bestPassStreak: number;
  perfectPapers: number;
  /** Best score at each tier, as a fraction. Absent means never sat. */
  bestByTier: Partial<Record<ExamTier, number>>;
  byCategory: Partial<Record<ExamCategory, ExamCategoryTally>>;
}

export const STORAGE_KEY = 'examResults';
export const BEST_STREAK_KEY = 'examBestPassStreak';
/** `localStorage` is not a database; enough for every statistic on screen. */
export const HISTORY_LIMIT = 100;

const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach(fn => fn());
export const subscribe = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

/**
 * A corrupt or partly-unknown blob degrades to empty rather than throwing —
 * losing the stats is an inconvenience, refusing to open the exam is not.
 */
export const history = (): ExamResult[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is ExamResult =>
        !!r && typeof r === 'object' && typeof (r as ExamResult).correct === 'number' && typeof (r as ExamResult).length === 'number',
    );
  } catch {
    return [];
  }
};

export const bestPassStreak = (): number => {
  try {
    const raw = window.localStorage.getItem(BEST_STREAK_KEY);
    const n = raw === null ? 0 : Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
  } catch {
    return 0;
  }
};

/**
 * Papers passed in a row, counting back from the most recent. Bounded by
 * `HISTORY_LIMIT`, deliberately — derived from the retained history rather
 * than stored as a counter, which is the thing this module is built to avoid.
 */
export const passStreak = (results: ExamResult[] = history()): number => {
  let run = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (!results[i]!.passed) break;
    run += 1;
  }
  return run;
};

const isPerfect = (r: ExamResult): boolean => r.length > 0 && r.correct === r.length;

export const stats = (results: ExamResult[] = history()): ExamStats => {
  let passes = 0;
  let answered = 0;
  let right = 0;
  let perfect = 0;
  const best: Partial<Record<ExamTier, number>> = {};
  const byCategory: Partial<Record<ExamCategory, ExamCategoryTally>> = {};

  for (const r of results) {
    if (r.passed) passes += 1;
    if (isPerfect(r)) perfect += 1;
    answered += r.length;
    right += r.correct;
    const accuracy = r.length === 0 ? 0 : r.correct / r.length;
    best[r.tier] = Math.max(best[r.tier] ?? 0, accuracy);
    for (const [key, tally] of Object.entries(r.categories ?? {})) {
      if (!(EXAM_CATEGORIES as readonly string[]).includes(key)) continue;
      const category = key as ExamCategory;
      const held = byCategory[category] ?? { right: 0, asked: 0 };
      byCategory[category] = { right: held.right + tally.right, asked: held.asked + tally.asked };
    }
  }

  return {
    papers: results.length,
    passes,
    questionsAnswered: answered,
    questionsRight: right,
    passStreak: passStreak(results),
    bestPassStreak: bestPassStreak(),
    perfectPapers: perfect,
    bestByTier: best,
    byCategory,
  };
};

/**
 * The category with the worst accuracy over a meaningful sample — what a study
 * tool exists to tell you. `minimumAsked` is why this takes a floor: one wrong
 * FORTIFIED answer is 0% and would top a weakness list forever. Ties break on
 * category order so the readout does not flicker.
 */
export const weakest = (
  s: ExamStats,
  minimumAsked = 3,
): { category: ExamCategory; tally: ExamCategoryTally } | null => {
  let found: { category: ExamCategory; tally: ExamCategoryTally } | null = null;
  for (const category of EXAM_CATEGORIES) {
    const tally = s.byCategory[category];
    if (!tally || tally.asked < minimumAsked) continue;
    if (!found || tallyAccuracy(tally) < tallyAccuracy(found.tally)) found = { category, tally };
  }
  return found;
};

/** The record a sitting leaves behind. */
export const runResult = (run: ExamRun, day: number): ExamResult => {
  const tallies: Record<string, ExamCategoryTally> = {};
  run.marks.forEach((mark, i) => {
    const key = run.markedCategories[i];
    if (!key) return;
    const held = tallies[key] ?? { right: 0, asked: 0 };
    tallies[key] = { right: held.right + (mark ? 1 : 0), asked: held.asked + 1 };
  });
  return {
    tier: run.tier,
    correct: runCorrect(run),
    length: run.length,
    passed: runPassed(run),
    day,
    categories: tallies,
  };
};

/**
 * Records a completed paper and returns the ladder tier it unlocked, if any.
 * Call exactly once per completion, from the handler that completes it — never
 * from a render, where a re-render would record the same paper twice.
 */
export const record = (run: ExamRun, day: number = dayIndex()): QuizTier | null => {
  const results = history();
  results.push(runResult(run, day));
  const trimmed = results.length > HISTORY_LIMIT ? results.slice(results.length - HISTORY_LIMIT) : results;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    const streak = passStreak(trimmed);
    if (streak > bestPassStreak()) window.localStorage.setItem(BEST_STREAK_KEY, String(streak));
  } catch {
    /* ignore */
  }
  notify();
  if (!runPassed(run)) return null;
  return recordTierPass(examTierLadder[run.tier]);
};

export const reset = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(BEST_STREAK_KEY);
  } catch {
    /* ignore */
  }
  notify();
};
