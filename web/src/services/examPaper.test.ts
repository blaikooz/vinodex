import { beforeEach, describe, expect, it } from 'vitest';
import iconManifest from '../data/iconManifest.json';
import {
  EXAM_QUESTIONS,
  EXAM_FORMATS,
  EXAM_MIN_CELL_COUNT,
  EXAM_TIERS,
  ExamFormat,
  ExamQuestion,
  ExamTier,
} from '@/shared/data/exam';
import {
  ExamAnswer,
  ExamPrompt,
  advanceRun,
  assemble,
  balancedCapacity,
  buildPrompt,
  capacity,
  correctChoice,
  correctPairing,
  correctSelection,
  correctSequence,
  draft,
  examTierLadder,
  ladderExamTier,
  isCorrect,
  newRun,
  retryRun,
  runCorrect,
  runIsComplete,
  runPassed,
  submit,
  thinnestCell,
  EXAM_LENGTH,
} from './examPaper';
import {
  HISTORY_LIMIT,
  STORAGE_KEY,
  BEST_STREAK_KEY,
  history,
  record,
  runResult,
  stats,
  weakest,
} from './examProgress';
import { QUIZ_TIERS, tierRank, highestUnlocked } from './quiz';

/**
 * Ported from `vinodex-ios/Tests/VinodexCoreTests/ExamTests.swift`.
 *
 * Differences from the Swift suite, and why:
 * - `examBankDecodes` has no counterpart: the web imports the TS bank
 *   directly, so there is no JSON decode step to exercise.
 * - `runIsCodable` becomes a JSON round-trip — the web session store is
 *   `JSON.stringify`, not `Codable`.
 * - The store cases run against jsdom's `localStorage`, as the iOS ones run
 *   against a real `UserDefaults`.
 */

const correctAnswerFor = (p: ExamPrompt): ExamAnswer => {
  switch (p.question.format) {
    case 'trueFalse':
      return { kind: 'truth', value: p.question.answer };
    case 'multipleChoice':
    case 'aromaIdentification':
    case 'imageIdentification':
      return { kind: 'choice', slot: correctChoice(p)! };
    case 'selectAll':
      return { kind: 'selection', slots: [...correctSelection(p)] };
    case 'matching':
      return { kind: 'pairing', map: correctPairing(p) };
    case 'ordering':
      return { kind: 'sequence', slots: correctSequence(p) };
  }
};

const wrongAnswerFor = (p: ExamPrompt): ExamAnswer => {
  switch (p.question.format) {
    case 'trueFalse':
      return { kind: 'truth', value: !p.question.answer };
    case 'multipleChoice':
    case 'aromaIdentification':
    case 'imageIdentification': {
      const right = correctChoice(p)!;
      return { kind: 'choice', slot: (right + 1) % p.question.options.length };
    }
    case 'selectAll': {
      const want = correctSelection(p);
      const slots = p.question.options.map((_, i) => i).filter(s => !want.has(s));
      // Never empty and never all: complement of a non-empty proper subset.
      return { kind: 'selection', slots };
    }
    case 'matching': {
      const right = correctPairing(p);
      const keys = Object.keys(right).map(Number);
      const map: Record<number, number> = { ...right };
      if (keys.length >= 2) {
        const a = keys[0]!;
        const b = keys[1]!;
        const tmp = map[a]!;
        map[a] = map[b]!;
        map[b] = tmp;
      }
      return { kind: 'pairing', map };
    }
    case 'ordering': {
      const seq = [...correctSequence(p)];
      if (seq.length >= 2) {
        const tmp = seq[0]!;
        seq[0] = seq[1]!;
        seq[1] = tmp;
      }
      return { kind: 'sequence', slots: seq };
    }
  }
};

describe('the bank', () => {
  it('holds the questions it was authored to', () => {
    expect(EXAM_QUESTIONS.length).toBe(420);
    expect(capacity('beginner')).toBe(144);
    expect(capacity('intermediate')).toBe(151);
    expect(capacity('advanced')).toBe(125);
  });

  it('every question id is unique', () => {
    const ids = EXAM_QUESTIONS.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('the shipped cell floor matches the live pools', () => {
    expect(EXAM_MIN_CELL_COUNT).toBe(6);
    for (const tier of EXAM_TIERS) {
      expect(thinnestCell(tier), `${tier} has a cell below the shipped floor`).toBeGreaterThanOrEqual(EXAM_MIN_CELL_COUNT);
    }
  });

  it('every format is represented, so every answering UI is reachable', () => {
    const present = new Set(EXAM_QUESTIONS.map(q => q.format));
    for (const format of EXAM_FORMATS) expect(present.has(format), `${format} unrepresented`).toBe(true);
  });

  it('the format mix is what the bank was authored to', () => {
    const counts = new Map<ExamFormat, number>();
    for (const q of EXAM_QUESTIONS) counts.set(q.format, (counts.get(q.format) ?? 0) + 1);
    expect(counts.get('multipleChoice')).toBe(246);
    expect(counts.get('trueFalse')).toBe(64);
    expect(counts.get('selectAll')).toBe(37);
    expect(counts.get('aromaIdentification')).toBe(23);
    expect(counts.get('matching')).toBe(21);
    expect(counts.get('ordering')).toBe(18);
    expect(counts.get('imageIdentification')).toBe(11);
  });

  it('every question carries a teachable explanation', () => {
    for (const q of EXAM_QUESTIONS) {
      expect(q.explanation.trim().length, `${q.id} has no explanation`).toBeGreaterThan(0);
    }
  });

  it('every asset-backed question resolves against the icon manifest', () => {
    // Review M2: `questionImage` falls back silently, so a renamed manifest
    // key would strip the picture off a question that is nothing but one.
    const flavorArt = (iconManifest as { flavorArt?: Record<string, string> }).flavorArt ?? {};
    const shapes = (iconManifest as { countryShapeIcons?: Record<string, string> }).countryShapeIcons ?? {};
    const byEntry = (iconManifest as { byEntry?: Record<string, string> }).byEntry ?? {};
    for (const q of EXAM_QUESTIONS) {
      if (q.format === 'aromaIdentification') {
        for (const key of q.noteKeys) expect(flavorArt[key], `${q.id} noteKey "${key}" unresolved`).toBeTruthy();
      }
      if (q.format === 'imageIdentification') {
        const table = q.image.kind === 'countryOutline' ? shapes : byEntry;
        expect(table[q.image.key], `${q.id} image key "${q.image.key}" unresolved`).toBeTruthy();
      }
    }
  });

  it('exam tiers map onto the ladder in order, as a bijection', () => {
    EXAM_TIERS.forEach((tier, rank) => {
      const rung = examTierLadder[tier];
      expect(tierRank(rung), `${tier} is not the ${rank}th rung`).toBe(rank);
      expect(ladderExamTier[rung], `the map is not a bijection at ${tier}`).toBe(tier);
    });
    for (const rung of QUIZ_TIERS) expect(examTierLadder[ladderExamTier[rung]]).toBe(rung);
  });
});

describe('shuffling', () => {
  const shuffleable = EXAM_QUESTIONS.filter(q => q.format !== 'trueFalse');

  it('the correct option is not always first', () => {
    const mc = EXAM_QUESTIONS.filter(q => q.format === 'multipleChoice').slice(0, 40);
    let moved = 0;
    for (const [i, q] of mc.entries()) {
      if (correctChoice(buildPrompt(q, i)) !== 0) moved += 1;
    }
    expect(moved).toBeGreaterThan(0);
  });

  it('an ordering question is never presented already solved', () => {
    const ordering = EXAM_QUESTIONS.filter(q => q.format === 'ordering');
    for (const q of ordering) {
      for (let seed = 0; seed < 30; seed++) {
        const p = buildPrompt(q, seed);
        expect(p.order.every((v, i) => v === i), `${q.id} seed ${seed} presented solved`).toBe(false);
      }
    }
  });

  it('the shuffle is a permutation, never a loss', () => {
    for (const [i, q] of shuffleable.slice(0, 60).entries()) {
      const p = buildPrompt(q, i * 31);
      const sorted = [...p.order].sort((a, b) => a - b);
      expect(sorted).toEqual(sorted.map((_, idx) => idx));
    }
  });

  it('the same seed presents the same question the same way', () => {
    for (const q of shuffleable.slice(0, 20)) {
      expect(buildPrompt(q, 1234).order).toEqual(buildPrompt(q, 1234).order);
    }
  });
});

describe('grading', () => {
  it('the authored answer grades correct, on every question and format', () => {
    for (const [i, q] of EXAM_QUESTIONS.entries()) {
      const p = buildPrompt(q, i * 7919);
      expect(isCorrect(p, correctAnswerFor(p)), `${q.id} rejects its own answer`).toBe(true);
    }
  });

  it('a wrong answer grades wrong, on every format', () => {
    for (const format of EXAM_FORMATS) {
      const q = EXAM_QUESTIONS.find(x => x.format === format)!;
      const p = buildPrompt(q, 5);
      expect(isCorrect(p, wrongAnswerFor(p)), `${format} accepted a wrong answer`).toBe(false);
    }
  });

  it('an answer of the wrong shape never grades correct', () => {
    const q = EXAM_QUESTIONS.find(x => x.format === 'multipleChoice')!;
    const p = buildPrompt(q, 5);
    expect(isCorrect(p, { kind: 'truth', value: true })).toBe(false);
    expect(isCorrect(p, { kind: 'sequence', slots: [0] })).toBe(false);
  });
});

describe('assembly', () => {
  it('a paper is balanced, distinct, and the length it asked for', () => {
    const result = assemble('beginner', EXAM_LENGTH, 42);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.prompts.length).toBe(EXAM_LENGTH);
    const ids = result.prompts.map(p => p.question.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Ten questions, ten *different* categories — never two from GRAPES and
    // none from FAULTS.
    const cats = result.prompts.map(p => p.question.category);
    expect(new Set(cats).size).toBe(cats.length);
  });

  it('different seeds examine different ground', () => {
    const a = assemble('intermediate', EXAM_LENGTH, 0);
    const b = assemble('intermediate', EXAM_LENGTH, 1);
    if (!a.ok || !b.ok) throw new Error('assembly failed');
    const catsA = a.prompts.map(p => p.question.category).join(',');
    const catsB = b.prompts.map(p => p.question.category).join(',');
    expect(catsA).not.toBe(catsB);
  });

  it('the same seed is the same paper', () => {
    const a = assemble('advanced', EXAM_LENGTH, 99);
    const b = assemble('advanced', EXAM_LENGTH, 99);
    if (!a.ok || !b.ok) throw new Error('assembly failed');
    expect(a.prompts.map(p => p.question.id)).toEqual(b.prompts.map(p => p.question.id));
    expect(a.prompts.map(p => p.order)).toEqual(b.prompts.map(p => p.order));
  });

  it('assembly refuses rather than repeating', () => {
    const tiny: ExamQuestion[] = EXAM_QUESTIONS.filter(q => q.tier === 'beginner').slice(0, 4);
    const result = assemble('beginner', EXAM_LENGTH, 0, tiny);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain('NOVICE HOLDS 4 QUESTIONS');
  });

  it('an empty bank is refused, not presented', () => {
    const result = assemble('beginner', EXAM_LENGTH, 0, []);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain('THE EXAM BANK DID NOT LOAD');
  });

  it('a paper at the balanced ceiling is still distinct', () => {
    const tier: ExamTier = 'beginner';
    const ceiling = balancedCapacity(tier);
    const result = assemble(tier, ceiling, 7);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ids = result.prompts.map(p => p.question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('beyond the balanced ceiling a paper degrades rather than repeating', () => {
    const tier: ExamTier = 'advanced';
    const length = Math.min(capacity(tier), balancedCapacity(tier) + 5);
    const result = assemble(tier, length, 3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ids = result.prompts.map(p => p.question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('the run', () => {
  const paper = (() => {
    const r = assemble('beginner', EXAM_LENGTH, 11);
    if (!r.ok) throw new Error('assembly failed');
    return r.prompts;
  })();

  it('grades, advances and completes exactly once per question', () => {
    let run = newRun(11, 'beginner');
    for (let i = 0; i < run.length; i++) {
      const prompt = paper[i]!;
      expect(run.index).toBe(i);
      run = draft(run, correctAnswerFor(prompt));
      run = submit(run, prompt);
      expect(run.submitted).toBe(true);
      // A second submit is ignored — the first commit is the exam's answer.
      const again = submit(run, prompt);
      expect(again.marks.length).toBe(run.marks.length);
      run = advanceRun(run);
    }
    expect(runIsComplete(run)).toBe(true);
    expect(runCorrect(run)).toBe(EXAM_LENGTH);
    expect(runPassed(run)).toBe(true);
    // Advancing a finished run does nothing.
    expect(advanceRun(run).index).toBe(run.index);
  });

  it('a failed paper is a failed paper', () => {
    let run = newRun(11, 'beginner');
    for (let i = 0; i < run.length; i++) {
      const prompt = paper[i]!;
      run = draft(run, i < 3 ? correctAnswerFor(prompt) : wrongAnswerFor(prompt));
      run = submit(run, prompt);
      run = advanceRun(run);
    }
    expect(runCorrect(run)).toBe(3);
    expect(runPassed(run)).toBe(false);
  });

  it('a run round-trips through the session store encoding', () => {
    let run = newRun(11, 'beginner');
    run = draft(run, correctAnswerFor(paper[0]!));
    run = submit(run, paper[0]!);
    const revived = JSON.parse(JSON.stringify(run)) as typeof run;
    expect(revived).toEqual(run);
  });

  it('retry is a different paper at the same tier', () => {
    const run = newRun(11, 'beginner');
    const again = retryRun(run);
    expect(again.tier).toBe(run.tier);
    expect(again.length).toBe(run.length);
    expect(again.seed).not.toBe(run.seed);
    const a = assemble(run.tier, run.length, run.seed);
    const b = assemble(again.tier, again.length, again.seed);
    if (!a.ok || !b.ok) throw new Error('assembly failed');
    expect(a.prompts.map(p => p.question.id)).not.toEqual(b.prompts.map(p => p.question.id));
  });
});

describe('the record store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const finishedRun = (rightCount: number, tier: ExamTier = 'beginner') => {
    const r = assemble(tier, EXAM_LENGTH, 21);
    if (!r.ok) throw new Error('assembly failed');
    let run = newRun(21, tier);
    for (let i = 0; i < run.length; i++) {
      const prompt = r.prompts[i]!;
      run = draft(run, i < rightCount ? correctAnswerFor(prompt) : wrongAnswerFor(prompt));
      run = submit(run, prompt);
      run = advanceRun(run);
    }
    return run;
  };

  it('the history derives the statistics rather than counting alongside them', () => {
    record(finishedRun(10), 100);
    record(finishedRun(5), 101);
    record(finishedRun(9), 102);
    const s = stats();
    expect(s.papers).toBe(3);
    expect(s.passes).toBe(2);
    expect(s.questionsAnswered).toBe(30);
    expect(s.questionsRight).toBe(24);
    expect(s.perfectPapers).toBe(1);
    expect(s.passStreak).toBe(1);
    expect(s.bestByTier.beginner).toBe(1);
  });

  it('the history is bounded, oldest first', () => {
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) record(finishedRun(10), i);
    const h = history();
    expect(h.length).toBe(HISTORY_LIMIT);
    expect(h[0]!.day).toBe(5);
    expect(h[h.length - 1]!.day).toBe(HISTORY_LIMIT + 4);
  });

  it('the weakest category ignores samples too small to mean anything', () => {
    const run = finishedRun(10);
    const result = runResult(run, 0);
    // One category with a big failing sample, one with a single miss.
    result.categories = {
      FAULTS: { right: 1, asked: 4 },
      FORTIFIED: { right: 0, asked: 1 },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([result]));
    const found = weakest(stats());
    expect(found?.category).toBe('FAULTS');
  });

  it('a corrupt blob degrades to empty rather than throwing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(history()).toEqual([]);
    window.localStorage.setItem(BEST_STREAK_KEY, 'NaNsense');
    expect(stats().bestPassStreak).toBe(0);
  });

  it('passing a paper unlocks the next rung of the ladder', () => {
    expect(highestUnlocked()).toBe('NOVICE');
    const unlocked = record(finishedRun(9, 'beginner'), 1);
    expect(unlocked).toBe('ENTHUSIAST');
    expect(highestUnlocked()).toBe('ENTHUSIAST');
    // Failing unlocks nothing.
    expect(record(finishedRun(2, 'intermediate'), 2)).toBe(null);
    expect(highestUnlocked()).toBe('ENTHUSIAST');
  });
});
