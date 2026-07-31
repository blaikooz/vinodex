import { WineEntry } from '@/shared/types';
import { normalizeLabel } from '@/shared/services/entryUtils';

/**
 * The tasting quiz engine, ported from
 * `vinodex-ios/Sources/VinodexCore/TastingQuiz.swift`.
 *
 * Everything is deterministic and integer-seeded, so the same seed produces the
 * same paper — the daily challenge relies on that. The RNG is reproduced
 * byte-for-byte from the Swift (non-negative `mod`, prime strides, id-ascending
 * ordering) so a web run and an iOS run off one seed would match.
 */

export type QuizKind = 'grapes' | 'region' | 'style';
export type QuizTier = 'NOVICE' | 'ENTHUSIAST' | 'SOMMELIER';
export const QUIZ_TIERS: QuizTier[] = ['NOVICE', 'ENTHUSIAST', 'SOMMELIER'];
export const tierRank = (t: QuizTier): number => QUIZ_TIERS.indexOf(t);
export const tierNext = (t: QuizTier): QuizTier | null => QUIZ_TIERS[tierRank(t) + 1] ?? null;

const KIND_TOPIC: Record<QuizKind, string> = { grapes: 'GRAPES', region: 'REGIONS', style: 'STYLES' };
export const kindTopic = (k: QuizKind): string => KIND_TOPIC[k];

export interface QuizQuestion {
  kind: QuizKind;
  prompt: string;
  optionIDs: string[]; // exactly 4
  answerID: string;
}

export interface QuizSession {
  seed: number;
  length: number;
  passMark: number;
  tier: QuizTier;
  index: number;
  correct: number;
  chosenID: string | null;
}

export const DEFAULT_LENGTH = 10;
export const DEFAULT_PASS = 8;
const OPTION_COUNT = 4;
const KINDS: QuizKind[] = ['grapes', 'region', 'style'];

/** Non-negative modulo — matches Swift's `mod`. Load-bearing for every index. */
function mod(value: number, count: number): number {
  if (count <= 0) return 0;
  return ((value % count) + count) % count;
}

const label = normalizeLabel;

// --- entry accessors (the generator only touches these) ---------------------
const byId = (a: WineEntry, b: WineEntry) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const inCat = (all: WineEntry[], cat: string) => all.filter(e => e.category === cat).slice().sort(byId);
const gType = (e: any): string => String(e.grapeType ?? '');
const gBody = (e: any): string => String(e.grapeBodyClass ?? '');
const gCountry = (e: any): string => String(e.grapeCountryOfOrigin ?? e.details?.origin ?? '');
const rarityOf = (e: any): string | undefined => (e.rarity ? String(e.rarity) : undefined);
const notableOf = (e: any): string[] => (Array.isArray(e.details?.notableGrapes) ? e.details.notableGrapes : []);
const originOf = (e: any): string => String(e.details?.origin ?? '');
const nameOf = (e: WineEntry): string => e.name;

// --- tier answer-eligibility (answer pool only; distractors never filtered) --
type Pred = (e: WineEntry) => boolean;

function grapeEligible(tier: QuizTier): Pred {
  return e => {
    const r = rarityOf(e);
    if (tier === 'NOVICE') return r === 'NOBLE' || r === 'COMMON';
    if (tier === 'SOMMELIER') return r === 'UNCOMMON' || r === 'RARE' || r === 'GODFORSAKEN';
    return true;
  };
}
function styleEligible(tier: QuizTier): Pred {
  return e => {
    const r = rarityOf(e);
    if (tier === 'NOVICE') return r == null || r === 'NOBLE' || r === 'COMMON';
    if (tier === 'SOMMELIER') return r === 'UNCOMMON' || r === 'RARE' || r === 'GODFORSAKEN';
    return true;
  };
}
function regionEligible(tier: QuizTier, grapeKeys: Set<string>): Pred {
  if (tier !== 'NOVICE') return () => true;
  return r => notableOf(r).filter(n => grapeKeys.has(label(n))).length >= 2;
}

const ALL: Pred = () => true;

// --- assemble: the critical RNG ---------------------------------------------
function assemble(kind: QuizKind, prompt: string, matching: WineEntry[], others: WineEntry[], seed: number): QuizQuestion | null {
  if (matching.length === 0 || others.length < OPTION_COUNT - 1) return null;
  const answer = matching[mod(seed, matching.length)]!;
  const distractors: WineEntry[] = [];
  let cursor = mod(seed, others.length);
  while (distractors.length < OPTION_COUNT - 1) {
    const candidate = others[cursor % others.length]!;
    if (candidate.id !== answer.id && !distractors.some(d => d.id === candidate.id)) {
      distractors.push(candidate);
    }
    cursor += 17;
    if (cursor > others.length * 4) return null;
  }
  const ids = distractors.map(d => d.id);
  ids.splice(mod(seed, OPTION_COUNT), 0, answer.id);
  return { kind, prompt, optionIDs: ids, answerID: answer.id };
}

// --- per-kind generators ----------------------------------------------------
function grapeQuestion(all: WineEntry[], seed: number, eligible: Pred): QuizQuestion | null {
  const grapes = inCat(all, 'GRAPES');
  const candidates = grapes.filter(g => gBody(g) !== '' && gCountry(g) !== '' && eligible(g));
  if (candidates.length === 0) return null;
  for (let step = 0; step < candidates.length; step++) {
    const answer = candidates[mod(seed + step, candidates.length)]!;
    const bodyKey = label(gBody(answer));
    const countryKey = label(gCountry(answer));
    const matching = grapes.filter(
      g => eligible(g) && gType(g) === gType(answer) && label(gBody(g)) === bodyKey && label(gCountry(g)) === countryKey,
    );
    const others = grapes.filter(
      g =>
        gType(g) !== gType(answer) ||
        (gBody(g) !== '' && label(gBody(g)) !== bodyKey) ||
        (gCountry(g) !== '' && label(gCountry(g)) !== countryKey),
    );
    const prompt = `Which of these grapes is a ${gBody(answer).toUpperCase()}-BODIED ${gType(answer).toUpperCase()} from ${gCountry(answer).toUpperCase()}?`;
    const q = assemble('grapes', prompt, matching, others, seed);
    if (q) return q;
  }
  return null;
}

/** Unique notable-grape names across a category's entries, resolving to real grapes. */
function grapeNamesFrom(entries: WineEntry[], grapeKeys: Set<string>): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    for (const n of notableOf(e)) {
      const key = label(n);
      if (grapeKeys.has(key) && !seen.has(key)) {
        seen.add(key);
        names.push(n);
      }
    }
  }
  names.sort();
  return names;
}

function regionQuestion(all: WineEntry[], seed: number, eligible: Pred, grapeKeys: Set<string>): QuizQuestion | null {
  const regions = inCat(all, 'REGIONS');
  const names = grapeNamesFrom(regions, grapeKeys);
  if (names.length === 0) return null;
  for (let step = 0; step < names.length; step++) {
    const name = names[mod(seed + step, names.length)]!;
    const key = label(name);
    const matching = regions.filter(r => eligible(r) && notableOf(r).some(g => label(g) === key));
    const others = regions.filter(r => !notableOf(r).some(g => label(g) === key));
    const q = assemble('region', `Which of these regions is known for ${name.toUpperCase()}?`, matching, others, seed);
    if (q) return q;
  }
  return null;
}

function styleQuestion(all: WineEntry[], seed: number, eligible: Pred, grapeKeys: Set<string>): QuizQuestion | null {
  const styles = inCat(all, 'STYLES');
  const names = grapeNamesFrom(styles, grapeKeys);
  for (let step = 0; step < names.length; step++) {
    const name = names[mod(seed + step, names.length)]!;
    const key = label(name);
    const matching = styles.filter(s => eligible(s) && notableOf(s).some(g => label(g) === key));
    const others = styles.filter(s => !notableOf(s).some(g => label(g) === key));
    const q = assemble('style', `Which of these styles features ${name.toUpperCase()}?`, matching, others, seed);
    if (q) return q;
  }
  // Origin fallback.
  const countries: string[] = [];
  for (const s of styles) {
    const o = originOf(s);
    if (o !== '' && !countries.includes(o)) countries.push(o);
  }
  countries.sort();
  for (let step = 0; step < countries.length; step++) {
    const country = countries[mod(seed + step, countries.length)]!;
    const key = label(country);
    const matching = styles.filter(s => eligible(s) && label(originOf(s)) === key);
    const others = styles.filter(s => {
      const a = label(originOf(s));
      return a !== '' && a !== key;
    });
    const q = assemble('style', `Which of these styles originates in ${country.toUpperCase()}?`, matching, others, seed);
    if (q) return q;
  }
  return null;
}

/** The one public generator: derive question N of a session, live. */
export function quizQuestion(all: WineEntry[], number: number, sessionSeed: number, tier: QuizTier): QuizQuestion | null {
  const grapeKeys = new Set(inCat(all, 'GRAPES').map(g => label(nameOf(g))));
  const seed = sessionSeed + number * 7919;
  const start = mod(sessionSeed + number, 3);
  for (let step = 0; step < 3; step++) {
    const kind = KINDS[(start + step) % 3]!;
    let q: QuizQuestion | null = null;
    if (kind === 'grapes') q = grapeQuestion(all, seed, grapeEligible(tier)) ?? grapeQuestion(all, seed, ALL);
    else if (kind === 'region')
      q = regionQuestion(all, seed, regionEligible(tier, grapeKeys), grapeKeys) ?? regionQuestion(all, seed, ALL, grapeKeys);
    else q = styleQuestion(all, seed, styleEligible(tier), grapeKeys) ?? styleQuestion(all, seed, ALL, grapeKeys);
    if (q) return q;
  }
  return null;
}

// --- session helpers (pure; return new sessions) ----------------------------
export function newSession(seed: number, tier: QuizTier = 'ENTHUSIAST', length = DEFAULT_LENGTH, passMark = DEFAULT_PASS): QuizSession {
  return { seed, length, passMark, tier, index: 0, correct: 0, chosenID: null };
}
export const isComplete = (s: QuizSession): boolean => s.index >= s.length;
export const isPassed = (s: QuizSession): boolean => s.correct >= s.passMark;
export const isAnswered = (s: QuizSession): boolean => s.chosenID !== null;

export function chooseAnswer(s: QuizSession, id: string, q: QuizQuestion): QuizSession {
  if (s.chosenID !== null || isComplete(s)) return s;
  return { ...s, chosenID: id, correct: q.answerID === id ? s.correct + 1 : s.correct };
}
export function advance(s: QuizSession): QuizSession {
  if (s.chosenID === null || isComplete(s)) return s;
  return { ...s, chosenID: null, index: s.index + 1 };
}
export function retrySession(s: QuizSession): QuizSession {
  return newSession(s.seed + 7919, s.tier, s.length, s.passMark);
}

// --- QuizProgress: persisted tier unlocks -----------------------------------
const PROGRESS_KEY = 'quizTierUnlocked';

export function highestUnlocked(): QuizTier {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (raw && (QUIZ_TIERS as string[]).includes(raw)) return raw as QuizTier;
  } catch {
    /* ignore */
  }
  return 'NOVICE';
}
export function isTierUnlocked(tier: QuizTier): boolean {
  return tierRank(tier) <= tierRank(highestUnlocked());
}
/** Record passing a tier's paper; unlocks + returns the next tier, or null. */
export function recordTierPass(tier: QuizTier): QuizTier | null {
  const next = tierNext(tier);
  if (next && tierRank(next) > tierRank(highestUnlocked())) {
    try {
      window.localStorage.setItem(PROGRESS_KEY, next);
    } catch {
      /* ignore */
    }
    return next;
  }
  return null;
}
