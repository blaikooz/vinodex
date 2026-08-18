import {
  EXAM_QUESTIONS,
  EXAM_CATEGORIES,
  ExamCategory,
  ExamQuestion,
  ExamTier,
} from '@/shared/data/exam';
import { QuizTier } from './quiz';

/**
 * The Wine Exam engine, ported from
 * `vinodex-ios/Sources/VinodexCore/ExamPaper.swift` and the ladder half of
 * `Exam.swift` (v6#8).
 *
 * The bank (`shared/data/exam.ts`) authors the correct answer first, matching
 * pairs correctly paired and ordering items already in order — the only sane
 * way to author them and completely unusable as a presentation. Everything a
 * screen shows goes through a seeded permutation, and the permutation is
 * stored, so grading is a lookup rather than a second guess at what the user
 * saw. Indices are **presented** indices throughout.
 *
 * Deterministic rather than random for the reason `TastingQuiz` and
 * `DailyPick` are: a given seed is a given paper, which is what makes any of
 * this testable.
 */

// ---------------------------------------------------------------------------
// The two tier vocabularies, one ladder (Exam.swift)
// ---------------------------------------------------------------------------

/**
 * The bank is authored `beginner`/`intermediate`/`advanced`; the device's
 * ladder is `QuizTier`'s NOVICE/ENTHUSIAST/SOMMELIER. Not two ladders — an
 * authoring vocabulary and a product one, mapped 1:1 and in order. The
 * device's words win on screen: `QuizTier` raw values are persisted in
 * `quizTierUnlocked`, so a user's SOMMELIER unlock is a string on disk. The
 * bank's words never reach the screen.
 */
export const examTierLadder: Record<ExamTier, QuizTier> = {
  beginner: 'NOVICE',
  intermediate: 'ENTHUSIAST',
  advanced: 'SOMMELIER',
};

export const ladderExamTier: Record<QuizTier, ExamTier> = {
  NOVICE: 'beginner',
  ENTHUSIAST: 'intermediate',
  SOMMELIER: 'advanced',
};

// ---------------------------------------------------------------------------
// ExamRandom — SplitMix64 (ExamPaper.swift)
// ---------------------------------------------------------------------------

const MASK = 0xffffffffffffffffn;
const GOLDEN = 0x9e3779b97f4a7c15n;

/**
 * SplitMix64. Twenty lines, no dependencies, and it passes the only bar that
 * matters here: successive draws from the same stream are uncorrelated, so
 * option order and question order do not move together. The golden-ratio odd
 * constant in the seed means a seed of 0 is not a degenerate stream — papers
 * are seeded off day indices and counters, and 0 is a value both really take.
 */
export class ExamRandom {
  private state: bigint;

  constructor(seed: number) {
    this.state = (BigInt.asUintN(64, BigInt(Math.trunc(seed))) + GOLDEN) & MASK;
  }

  next(): bigint {
    this.state = (this.state + GOLDEN) & MASK;
    let z = this.state;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK;
    return z ^ (z >> 31n);
  }

  /** A draw in [0, bound). Modulo bias is immaterial at these bounds. */
  nextInt(bound: number): number {
    if (bound <= 0) return 0;
    return Number(this.next() % BigInt(bound));
  }
}

/** Fisher–Yates over a copy, drawing from `rng`. */
export const shuffledBy = <T>(items: readonly T[], rng: ExamRandom): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
};

// ---------------------------------------------------------------------------
// Answers — what the candidate actually did (presented indices throughout)
// ---------------------------------------------------------------------------

export type ExamAnswer =
  /** multipleChoice, aromaIdentification, imageIdentification. */
  | { kind: 'choice'; slot: number }
  | { kind: 'truth'; value: boolean }
  /** selectAll. A set — tapping an option twice is a toggle, not a second vote. */
  | { kind: 'selection'; slots: number[] }
  /** matching: presented-left index → presented-right index. Partial while working. */
  | { kind: 'pairing'; map: Record<number, number> }
  /** ordering: presented indices in the order the candidate put them. */
  | { kind: 'sequence'; slots: number[] };

// ---------------------------------------------------------------------------
// ExamPrompt — one question as a screen shows it
// ---------------------------------------------------------------------------

export interface ExamPrompt {
  question: ExamQuestion;
  /**
   * Presentation order over the authored list: presented slot `i` holds
   * authored index `order[i]`. Empty for `trueFalse`. For `matching` this
   * permutes the **right** column only — the left column is the question.
   */
  order: number[];
}

const authoredOptions = (q: ExamQuestion): string[] => {
  switch (q.format) {
    case 'multipleChoice':
    case 'selectAll':
    case 'aromaIdentification':
    case 'imageIdentification':
      return q.options;
    case 'ordering':
      return q.items;
    case 'trueFalse':
    case 'matching':
      return [];
  }
};

/**
 * Builds the presentation. `seed` is per-question so two papers containing the
 * same question do not present it identically.
 *
 * An ordering question presented in the authored order is presented already
 * solved — one run in n! is the identity — so that one case re-rolls by a
 * swap. Options are deliberately *not* corrected this way: forcing the answer
 * off slot 0 would make slot 0 never correct, a bigger tell than the one it
 * fixes.
 */
export const buildPrompt = (question: ExamQuestion, seed: number): ExamPrompt => {
  const rng = new ExamRandom(seed);
  const count =
    question.format === 'matching' ? question.pairs.length : authoredOptions(question).length;
  let order = shuffledBy(Array.from({ length: count }, (_, i) => i), rng);
  if (question.format === 'ordering' && count > 1 && order.every((v, i) => v === i)) {
    order = [...order];
    const tmp = order[0]!;
    order[0] = order[1]!;
    order[1] = tmp;
  }
  return { question, order };
};

/** The authored options/items, in presentation order. Empty for trueFalse/matching. */
export const presentedOptions = (p: ExamPrompt): string[] => {
  const authored = authoredOptions(p.question);
  return p.order.filter(i => i >= 0 && i < authored.length).map(i => authored[i]!);
};

/** The left column, in authored order — the prompts of a matching question. */
export const matchingLeft = (p: ExamPrompt): string[] =>
  p.question.format === 'matching' ? p.question.pairs.map(pair => pair.left) : [];

/** The right column, shuffled — the answers to be paired against the left. */
export const matchingRight = (p: ExamPrompt): string[] => {
  const q = p.question;
  if (q.format !== 'matching') return [];
  return p.order.filter(i => i >= 0 && i < q.pairs.length).map(i => q.pairs[i]!.right);
};

/** The presented slot holding the single correct option, where the format has one. */
export const correctChoice = (p: ExamPrompt): number | null => {
  const q = p.question;
  if (q.format === 'multipleChoice' || q.format === 'aromaIdentification' || q.format === 'imageIdentification') {
    const slot = p.order.indexOf(q.answerIndex);
    return slot >= 0 ? slot : null;
  }
  return null;
};

/** Every presented slot holding a correct option, for selectAll. */
export const correctSelection = (p: ExamPrompt): Set<number> => {
  if (p.question.format !== 'selectAll') return new Set();
  return new Set(p.question.answerIndices.map(i => p.order.indexOf(i)).filter(s => s >= 0));
};

/** The correct presented sequence for ordering — presented slots in authored order. */
export const correctSequence = (p: ExamPrompt): number[] => {
  if (p.question.format !== 'ordering') return [];
  return p.question.items.map((_, i) => p.order.indexOf(i)).filter(s => s >= 0);
};

/**
 * presented-left → presented-right, for matching. Left is unshuffled, so left
 * slot `i` is authored pair `i`, whose right sits wherever the permutation put
 * it.
 */
export const correctPairing = (p: ExamPrompt): Record<number, number> => {
  if (p.question.format !== 'matching') return {};
  const map: Record<number, number> = {};
  p.question.pairs.forEach((_, i) => {
    const slot = p.order.indexOf(i);
    if (slot >= 0) map[i] = slot;
  });
  return map;
};

/** Whether a presented slot is part of the correct answer — what the reveal paints green. */
export const isCorrectSlot = (p: ExamPrompt, slot: number): boolean => {
  switch (p.question.format) {
    case 'multipleChoice':
    case 'aromaIdentification':
    case 'imageIdentification':
      return correctChoice(p) === slot;
    case 'selectAll':
      return correctSelection(p).has(slot);
    default:
      return false;
  }
};

/**
 * Grading. All-or-nothing on every format, including selectAll: `correct` is
 * an integer out of `length` on a results card and against a pass mark, and a
 * paper where one question can be worth two thirds makes both numbers a lie.
 * The reveal still shows which individual options were right. A mismatched
 * format/answer pair grades false — there is no fifth arm that could be right.
 */
export const isCorrect = (p: ExamPrompt, answer: ExamAnswer): boolean => {
  const q = p.question;
  if (q.format === 'trueFalse' && answer.kind === 'truth') return q.answer === answer.value;
  if (
    (q.format === 'multipleChoice' || q.format === 'aromaIdentification' || q.format === 'imageIdentification') &&
    answer.kind === 'choice'
  ) {
    return correctChoice(p) === answer.slot;
  }
  if (q.format === 'selectAll' && answer.kind === 'selection') {
    const want = correctSelection(p);
    const got = new Set(answer.slots);
    return want.size === got.size && [...want].every(s => got.has(s));
  }
  if (q.format === 'matching' && answer.kind === 'pairing') {
    const want = correctPairing(p);
    const wantKeys = Object.keys(want);
    const gotKeys = Object.keys(answer.map);
    return (
      wantKeys.length === gotKeys.length &&
      wantKeys.every(k => want[Number(k)] === answer.map[Number(k)])
    );
  }
  if (q.format === 'ordering' && answer.kind === 'sequence') {
    const want = correctSequence(p);
    return want.length === answer.slots.length && want.every((s, i) => s === answer.slots[i]);
  }
  return false;
};

// ---------------------------------------------------------------------------
// The bank (the catalog half of Exam.swift)
// ---------------------------------------------------------------------------

export const questionsFor = (
  tier: ExamTier,
  category: ExamCategory,
  bank: readonly ExamQuestion[] = EXAM_QUESTIONS,
): ExamQuestion[] => bank.filter(q => q.tier === tier && q.category === category);

/** Every distinct question at a tier. */
export const capacity = (tier: ExamTier, bank: readonly ExamQuestion[] = EXAM_QUESTIONS): number =>
  bank.filter(q => q.tier === tier).length;

/** The thinnest category cell at a tier. */
export const thinnestCell = (tier: ExamTier, bank: readonly ExamQuestion[] = EXAM_QUESTIONS): number =>
  Math.min(...EXAM_CATEGORIES.map(c => questionsFor(tier, c, bank).length));

/**
 * How many questions a tier can furnish while every category still contributes
 * equally. Beyond this `assemble` still returns a full paper, but its tail
 * leans on the fat categories — the honest degradation.
 */
export const balancedCapacity = (tier: ExamTier, bank: readonly ExamQuestion[] = EXAM_QUESTIONS): number =>
  thinnestCell(tier, bank) * EXAM_CATEGORIES.length;

// ---------------------------------------------------------------------------
// ExamPaper — assembling a balanced paper (D4)
// ---------------------------------------------------------------------------

/**
 * The practice paper's shape, unchanged from the generated quiz it replaces:
 * ten questions, eight to pass. The numbers are on screen and in every user's
 * head.
 */
export const EXAM_LENGTH = 10;
export const EXAM_PASS_MARK = 8;

export type ExamAssembly =
  | { ok: true; prompts: ExamPrompt[] }
  | { ok: false; message: string };

const tierDisplay = (tier: ExamTier): string => examTierLadder[tier];

/**
 * A balanced paper, or the reason there isn't one.
 *
 * Round-robin over the sixteen categories, starting at a rotation derived from
 * the seed, taking one unused question from each in turn: a short paper covers
 * that many *different* categories, which ones rotates with the seed, and an
 * exhausted category is skipped, never re-drawn — **no question appears twice
 * in a paper**, and a tier that cannot furnish `length` distinct ones refuses.
 */
export const assemble = (
  tier: ExamTier,
  length: number = EXAM_LENGTH,
  seed: number = 0,
  bank: readonly ExamQuestion[] = EXAM_QUESTIONS,
): ExamAssembly => {
  const available = capacity(tier, bank);
  if (available === 0) {
    return { ok: false, message: `NO QUESTIONS AT ${tierDisplay(tier)}. THE EXAM BANK DID NOT LOAD.` };
  }
  if (length <= 0) return { ok: true, prompts: [] };
  if (available < length) {
    return { ok: false, message: `${tierDisplay(tier)} HOLDS ${available} QUESTIONS; THIS EXAM NEEDS ${length}.` };
  }

  const rng = new ExamRandom(seed);
  // One shuffled queue per category, drawn from the front by cursor.
  const queues = EXAM_CATEGORIES.map(c => shuffledBy(questionsFor(tier, c, bank), rng));
  const cursors = new Array<number>(EXAM_CATEGORIES.length).fill(0);

  // Non-negative modulo: seed is a running counter and `%` keeps the sign.
  const n = EXAM_CATEGORIES.length;
  const start = ((seed % n) + n) % n;

  const drawn: ExamQuestion[] = [];
  let step = 0;
  while (drawn.length < length) {
    let tookOne = false;
    for (let offset = 0; offset < n; offset++) {
      if (drawn.length >= length) break;
      const index = (start + step + offset) % n;
      if (cursors[index]! >= queues[index]!.length) continue;
      drawn.push(queues[index]![cursors[index]!]!);
      cursors[index] = cursors[index]! + 1;
      tookOne = true;
    }
    if (!tookOne) {
      return { ok: false, message: `${tierDisplay(tier)} HOLDS ${drawn.length} QUESTIONS; THIS EXAM NEEDS ${length}.` };
    }
    step += 1;
  }

  // Presented in draw order — a paper walks the syllabus rather than serving
  // GRAPES, GRAPES, GRAPES. Per-question seed spread with a prime so adjacent
  // shuffles are uncorrelated.
  return { ok: true, prompts: drawn.map((question, position) => buildPrompt(question, seed + position * 7919)) };
};

// ---------------------------------------------------------------------------
// ExamRun — a sitting, in the shape that survives a trip into an entry
// ---------------------------------------------------------------------------

/**
 * A plain JSON value: the run round-trips through screen state as one blob, so
 * LEARN MORE does not cost the paper you are halfway through. **It stores the
 * seed, not the questions** — `assemble` is a pure function of (tier, length,
 * seed, bank), so the seed re-derives all of it exactly.
 */
export interface ExamRun {
  seed: number;
  tier: ExamTier;
  length: number;
  passMark: number;
  /** Zero-based position of the current question. */
  index: number;
  /** The answer to the current question; null while unanswered. */
  answer: ExamAnswer | null;
  /** Whether the current question has been submitted — separate from `answer`
   *  because the multi-touch formats build one up over several taps. */
  submitted: boolean;
  /** One flag per graded question, oldest first. */
  marks: boolean[];
  /** Category of each graded question, parallel to `marks`. */
  markedCategories: ExamCategory[];
}

export const newRun = (
  seed: number,
  tier: ExamTier,
  length: number = EXAM_LENGTH,
  passMark: number = EXAM_PASS_MARK,
): ExamRun => ({
  seed,
  tier,
  length,
  passMark,
  index: 0,
  answer: null,
  submitted: false,
  marks: [],
  markedCategories: [],
});

export const runCorrect = (run: ExamRun): number => run.marks.filter(Boolean).length;
export const runIsComplete = (run: ExamRun): boolean => run.index >= run.length;
export const runPassed = (run: ExamRun): boolean => runCorrect(run) >= run.passMark;

/** Builds up the current answer without grading it. */
export const draft = (run: ExamRun, answer: ExamAnswer): ExamRun =>
  run.submitted || runIsComplete(run) ? run : { ...run, answer };

/** Locks the answer in and grades it; a second call is ignored. */
export const submit = (run: ExamRun, prompt: ExamPrompt): ExamRun => {
  if (run.submitted || runIsComplete(run) || !run.answer) return run;
  const right = isCorrect(prompt, run.answer);
  return {
    ...run,
    submitted: true,
    marks: [...run.marks, right],
    markedCategories: [...run.markedCategories, prompt.question.category],
  };
};

/** Steps to the next question once the current one is graded. */
export const advanceRun = (run: ExamRun): ExamRun =>
  !run.submitted || runIsComplete(run)
    ? run
    : { ...run, answer: null, submitted: false, index: run.index + 1 };

/** A fresh paper after RETRY, seeded off this one so a retry is never a replay. */
export const retryRun = (run: ExamRun): ExamRun =>
  newRun(run.seed + 7919, run.tier, run.length, run.passMark);
