import { describe, it, expect, beforeEach } from 'vitest';
import { buildWineEntries } from '@/shared/constants';
import { normalizeLabel } from '@/shared/services/entryUtils';
import type { WineEntry } from '@/shared/types';
import {
  quizQuestion,
  QUIZ_TIERS,
  DEFAULT_LENGTH,
  DEFAULT_PASS,
  newSession,
  chooseAnswer,
  advance,
  retrySession,
  isComplete,
  isPassed,
  isAnswered,
  highestUnlocked,
  isTierUnlocked,
  recordTierPass,
  type QuizTier,
} from './quiz';

const all = buildWineEntries() as WineEntry[];
const byId = new Map(all.map(e => [e.id, e]));
const label = normalizeLabel;
const someQ = (seed: number, tier: QuizTier = 'ENTHUSIAST') => quizQuestion(all, 0, seed, tier)!;

// Mirrors ToolsTests.swift / TastingQuizTests.
describe('quiz question generation', () => {
  it('produces a question for every slot across a spread of seeds (negatives included)', () => {
    for (let seed = -45; seed < 255; seed += 10) {
      for (let n = 0; n < DEFAULT_LENGTH; n++) {
        expect(quizQuestion(all, n, seed, 'ENTHUSIAST'), `seed ${seed} q${n}`).not.toBeNull();
      }
    }
  });

  it('every question is well formed: 4 distinct real options, answer among them', () => {
    for (let seed = 0; seed < 200; seed += 10) {
      for (let n = 0; n < DEFAULT_LENGTH; n++) {
        const q = quizQuestion(all, n, seed, 'ENTHUSIAST');
        if (!q) continue;
        const tag = `seed ${seed} q${n}`;
        expect(q.optionIDs.length, tag).toBe(4);
        expect(new Set(q.optionIDs).size, `${tag} repeats an option`).toBe(4);
        expect(q.optionIDs, `${tag} omits its answer`).toContain(q.answerID);
        expect(q.prompt.length).toBeGreaterThan(0);
        for (const id of q.optionIDs) expect(byId.get(id), `${tag} missing ${id}`).toBeTruthy();
      }
    }
  });

  it('a session mixes all three kinds — at least three of each', () => {
    for (let seed = -20; seed < 120; seed += 7) {
      const counts: Record<string, number> = {};
      for (let n = 0; n < DEFAULT_LENGTH; n++) {
        const q = quizQuestion(all, n, seed, 'ENTHUSIAST');
        if (q) counts[q.kind] = (counts[q.kind] ?? 0) + 1;
      }
      for (const k of ['grapes', 'region', 'style']) {
        expect(counts[k] ?? 0, `seed ${seed}: ${k}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('no distractor is also a right answer', () => {
    for (let seed = 0; seed < 200; seed += 5) {
      for (let n = 0; n < DEFAULT_LENGTH; n++) {
        const q = quizQuestion(all, n, seed, 'ENTHUSIAST');
        if (!q) continue;
        const answer = byId.get(q.answerID) as any;
        const tag = `seed ${seed} q${n}`;
        if (q.kind === 'grapes') {
          for (const id of q.optionIDs) {
            if (id === q.answerID) continue;
            const o = byId.get(id) as any;
            const differs =
              o.grapeType !== answer.grapeType ||
              label(o.grapeBodyClass ?? '') !== label(answer.grapeBodyClass ?? '') ||
              label(o.grapeCountryOfOrigin ?? o.details?.origin ?? '') !== label(answer.grapeCountryOfOrigin ?? answer.details?.origin ?? '');
            expect(differs, `${tag}: ${o.name} matches every fact of ${answer.name}`).toBe(true);
          }
        } else {
          // Recover the grape/country from the prompt wording.
          const grapePrefixes = ['Which of these regions is known for ', 'Which of these styles features '];
          const originPrefix = 'Which of these styles originates in ';
          const gp = grapePrefixes.find(p => q.prompt.startsWith(p));
          if (gp) {
            const key = label(q.prompt.slice(gp.length, -1));
            for (const id of q.optionIDs) {
              if (id === q.answerID) continue;
              const o = byId.get(id) as any;
              const carries = (o.details?.notableGrapes ?? []).some((g: string) => label(g) === key);
              expect(carries, `${tag}: ${o.name} also names it`).toBe(false);
            }
          } else if (q.prompt.startsWith(originPrefix)) {
            const key = label(q.prompt.slice(originPrefix.length, -1));
            for (const id of q.optionIDs) {
              if (id === q.answerID) continue;
              const o = byId.get(id) as any;
              expect(label(o.details?.origin ?? '') !== key, `${tag}: ${o.name} also originates there`).toBe(true);
            }
          }
        }
      }
    }
  });

  it('is deterministic — same slot, same question', () => {
    for (let seed = 0; seed < 100; seed += 7) {
      for (let n = 0; n < DEFAULT_LENGTH; n++) {
        expect(quizQuestion(all, n, seed, 'ENTHUSIAST')).toEqual(quizQuestion(all, n, seed, 'ENTHUSIAST'));
      }
    }
  });

  it('consecutive questions differ', () => {
    let repeats = 0;
    for (let seed = 0; seed < 100; seed += 11) {
      for (let n = 0; n < DEFAULT_LENGTH - 1; n++) {
        const a = quizQuestion(all, n, seed, 'ENTHUSIAST');
        const b = quizQuestion(all, n + 1, seed, 'ENTHUSIAST');
        if (JSON.stringify(a) === JSON.stringify(b)) repeats++;
      }
    }
    expect(repeats).toBe(0);
  });
});

describe('quiz tiers', () => {
  it('every tier fills every slot of every session', () => {
    for (const tier of QUIZ_TIERS) {
      for (let seed = -20; seed < 160; seed += 12) {
        for (let n = 0; n < DEFAULT_LENGTH; n++) {
          expect(quizQuestion(all, n, seed, tier), `${tier} seed ${seed} q${n}`).not.toBeNull();
        }
      }
    }
  });

  it('grape answers respect the tier rarity band', () => {
    const bands: [QuizTier, Set<string>][] = [
      ['NOVICE', new Set(['NOBLE', 'COMMON'])],
      ['SOMMELIER', new Set(['UNCOMMON', 'RARE', 'GODFORSAKEN'])],
    ];
    for (let seed = 0; seed < 200; seed += 7) {
      for (let n = 0; n < DEFAULT_LENGTH; n++) {
        for (const [tier, allowed] of bands) {
          const q = quizQuestion(all, n, seed, tier);
          if (!q || q.kind !== 'grapes') continue;
          const a = byId.get(q.answerID) as any;
          expect(allowed.has(a.rarity), `${tier}: ${a.name} is ${a.rarity}`).toBe(true);
        }
      }
    }
  });

  it('novice region answers name at least two resolvable grapes', () => {
    const grapeKeys = new Set(all.filter(e => e.category === 'GRAPES').map(e => label(e.name)));
    for (let seed = 0; seed < 200; seed += 7) {
      for (let n = 0; n < DEFAULT_LENGTH; n++) {
        const q = quizQuestion(all, n, seed, 'NOVICE');
        if (!q || q.kind !== 'region') continue;
        const a = byId.get(q.answerID) as any;
        const resolvable = (a.details?.notableGrapes ?? []).filter((g: string) => grapeKeys.has(label(g)));
        expect(resolvable.length, `novice region ${a.name}`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('quiz session', () => {
  it('a fresh session starts clean', () => {
    const s = newSession(3);
    expect(s.index).toBe(0);
    expect(s.correct).toBe(0);
    expect(s.chosenID).toBeNull();
    expect(isAnswered(s)).toBe(false);
    expect(isComplete(s)).toBe(false);
    expect(isPassed(s)).toBe(false);
  });

  it('choosing scores rights not wrongs, first tap is final', () => {
    let s = newSession(5);
    const q = someQ(5);
    const wrong = q.optionIDs.find(i => i !== q.answerID)!;
    s = chooseAnswer(s, wrong, q);
    expect(s.correct).toBe(0);
    expect(s.chosenID).toBe(wrong);
    s = chooseAnswer(s, q.answerID, q); // ignored
    expect(s.correct).toBe(0);
    expect(s.chosenID).toBe(wrong);
  });

  it('advance requires an answer, clears it, completes at ten, then is inert', () => {
    let s = newSession(9);
    s = advance(s); // no-op unanswered
    expect(s.index).toBe(0);
    for (let n = 0; n < DEFAULT_LENGTH; n++) {
      expect(s.index).toBe(n);
      const q = quizQuestion(all, s.index, s.seed, s.tier)!;
      s = chooseAnswer(s, q.answerID, q);
      expect(isAnswered(s)).toBe(true);
      s = advance(s);
      expect(isAnswered(s)).toBe(false);
    }
    expect(isComplete(s)).toBe(true);
    expect(s.correct).toBe(DEFAULT_LENGTH);
    expect(isPassed(s)).toBe(true);
    const done = s;
    s = advance(s);
    expect(s).toEqual(done);
  });

  it('the pass mark sits at eight of ten', () => {
    for (const target of [DEFAULT_PASS - 1, DEFAULT_PASS]) {
      let s = newSession(12);
      for (let n = 0; n < DEFAULT_LENGTH; n++) {
        const q = quizQuestion(all, s.index, s.seed, s.tier)!;
        const id = n < target ? q.answerID : q.optionIDs.find(i => i !== q.answerID)!;
        s = chooseAnswer(s, id, q);
        s = advance(s);
      }
      expect(s.correct).toBe(target);
      expect(isPassed(s)).toBe(target === DEFAULT_PASS);
    }
  });

  it('a custom-length session grades on its own shape (daily 5/4)', () => {
    for (const target of [3, 4]) {
      let s = newSession(17, 'ENTHUSIAST', 5, 4);
      for (let n = 0; n < 5; n++) {
        expect(isComplete(s)).toBe(false);
        const q = quizQuestion(all, s.index, s.seed, s.tier)!;
        const id = n < target ? q.answerID : q.optionIDs.find(i => i !== q.answerID)!;
        s = chooseAnswer(s, id, q);
        s = advance(s);
      }
      expect(isComplete(s)).toBe(true);
      expect(isPassed(s)).toBe(target >= 4);
    }
  });

  it('retry starts a different paper from scratch, keeping shape and tier', () => {
    const s = newSession(9, 'NOVICE', 5, 4);
    const next = retrySession(s);
    expect(next.seed).not.toBe(s.seed);
    expect(next.index).toBe(0);
    expect(next.correct).toBe(0);
    expect(next.chosenID).toBeNull();
    expect(next.length).toBe(5);
    expect(next.passMark).toBe(4);
    expect(next.tier).toBe('NOVICE');
  });
});

describe('quiz progress ladder', () => {
  beforeEach(() => localStorage.clear());

  it('a fresh ladder opens at novice only', () => {
    expect(highestUnlocked()).toBe('NOVICE');
    expect(isTierUnlocked('NOVICE')).toBe(true);
    expect(isTierUnlocked('ENTHUSIAST')).toBe(false);
    expect(isTierUnlocked('SOMMELIER')).toBe(false);
  });

  it('passes climb the ladder one rung at a time; repeats and the top open nothing', () => {
    expect(recordTierPass('NOVICE')).toBe('ENTHUSIAST');
    expect(isTierUnlocked('ENTHUSIAST')).toBe(true);
    expect(isTierUnlocked('SOMMELIER')).toBe(false);
    expect(recordTierPass('NOVICE')).toBeNull();
    expect(recordTierPass('ENTHUSIAST')).toBe('SOMMELIER');
    expect(isTierUnlocked('SOMMELIER')).toBe(true);
    expect(recordTierPass('SOMMELIER')).toBeNull();
  });

  it('unlocks survive a reload (localStorage)', () => {
    recordTierPass('NOVICE');
    expect(highestUnlocked()).toBe('ENTHUSIAST');
  });
});

// Determinism guard: pins the generated paper for fixed seeds so a refactor
// can't silently drift the daily challenge away from what shipped.
//
// Re-pinned 0.7.4. These are a *refactor* guard, not a data guard: the picker
// draws from the whole catalog, so growing it legitimately deals a different
// paper. Both seeds now deal several of the 0.7.4 entries (G148, G156, G161,
// G166, R117-R122), which is the tell that the change is the catalog rather
// than the algorithm. Regenerate deliberately, never by pasting a failure.
describe('quiz determinism golden', () => {
  const GOLDEN: Record<string, ({ k: string; a: string; o: string[] } | null)[]> = {
    '777': [
      { k: 'grapes', a: 'G106', o: ['G148', 'G106', 'G166', 'G013'] },
      { k: 'region', a: 'R035', o: ['R035', 'R088', 'R105', 'R122'] },
      { k: 'style', a: 'S030', o: ['S026', 'S013', 'S032', 'S030'] },
      { k: 'grapes', a: 'G083', o: ['G047', 'G064', 'G083', 'G085'] },
      { k: 'region', a: 'R100', o: ['R027', 'R100', 'R044', 'R061'] },
      { k: 'style', a: 'S009', o: ['S009', 'S025', 'S015', 'S003'] },
      { k: 'grapes', a: 'G007', o: ['G080', 'G097', 'G114', 'G007'] },
      { k: 'region', a: 'R110', o: ['R067', 'R085', 'R110', 'R103'] },
      { k: 'style', a: 'S030', o: ['S020', 'S030', 'S007', 'S024'] },
      { k: 'grapes', a: 'G008', o: ['G008', 'G023', 'G042', 'G063'] },
    ],
    '-13': [
      { k: 'style', a: 'S004', o: ['S019', 'S006', 'S023', 'S004'] },
      { k: 'grapes', a: 'G012', o: ['G091', 'G108', 'G012', 'G125'] },
      { k: 'region', a: 'R023', o: ['R083', 'R023', 'R100', 'R117'] },
      { k: 'style', a: 'S015', o: ['S015', 'S016', 'S002', 'S020'] },
      { k: 'grapes', a: 'G117', o: ['G118', 'G138', 'G156', 'G117'] },
      { k: 'region', a: 'R049', o: ['R101', 'R118', 'R049', 'R011'] },
      { k: 'style', a: 'S024', o: ['S012', 'S024', 'S030', 'S016'] },
      { k: 'grapes', a: 'G017', o: ['G017', 'G161', 'G006', 'G024'] },
      { k: 'region', a: 'R022', o: ['R119', 'R012', 'R030', 'R022'] },
      { k: 'style', a: 'S011', o: ['S006', 'S025', 'S011', 'S012'] },
    ],
  };

  for (const [seed, expected] of Object.entries(GOLDEN)) {
    it(`seed ${seed} reproduces its paper`, () => {
      for (let n = 0; n < expected.length; n++) {
        const q = quizQuestion(all, n, Number(seed), 'ENTHUSIAST');
        const g = expected[n]!;
        expect({ k: q!.kind, a: q!.answerID, o: q!.optionIDs }).toEqual(g);
      }
    });
  }
});
