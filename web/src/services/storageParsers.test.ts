import { describe, expect, it } from 'vitest';
import { parseRun, newRun } from './examPaper';
import { parseSession } from './quiz';
import { parseFilter } from './chipFilter';

/**
 * The three session-storage reads that used to be casts (W15).
 *
 * `JSON.parse(raw) as T` is a claim, not a check. sessionStorage is
 * user-writable, a half-written value survives a crash, and the shapes move
 * whenever their modules do — so each cast turned a storage problem into a
 * `TypeError` several renders later, inside a component, with a stack naming
 * the render rather than the storage.
 *
 * These suites are mostly about the **hostile inputs**, because the happy path
 * was never the risk. Every case here is something a real browser can hand
 * back: a truncated write, a value from an older build, a hand-edited devtools
 * entry, `"null"`, an array where an object belongs.
 */

describe('parseRun (exam)', () => {
  const good = newRun(1234, 'intermediate');

  it('round-trips a real run', () => {
    expect(parseRun(JSON.stringify(good))).toEqual(good);
  });

  it('returns null for absent storage', () => {
    expect(parseRun(null)).toBeNull();
    expect(parseRun(undefined)).toBeNull();
    expect(parseRun('')).toBeNull();
  });

  it('returns null for a truncated write', () => {
    const raw = JSON.stringify(good);
    expect(parseRun(raw.slice(0, raw.length - 12))).toBeNull();
  });

  it('returns null for JSON that is not an object', () => {
    expect(parseRun('null')).toBeNull();
    expect(parseRun('42')).toBeNull();
    expect(parseRun('"a string"')).toBeNull();
  });

  it('rejects a tier this build does not know', () => {
    // The exact shape a downgrade produces: valid JSON, valid everything else,
    // one enum member that has since been renamed.
    expect(parseRun(JSON.stringify({ ...good, tier: 'expert' }))).toBeNull();
  });

  it('rejects non-finite and wrong-typed numbers', () => {
    expect(parseRun(JSON.stringify({ ...good, seed: 'x' }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...good, index: null }))).toBeNull();
    // NaN serialises as `null`, which is exactly how a corrupt seed arrives.
    expect(parseRun('{"seed":null}')).toBeNull();
  });

  it('rejects a marks array that is not all booleans', () => {
    expect(parseRun(JSON.stringify({ ...good, marks: [true, 1, false] }))).toBeNull();
  });

  it('rejects an unknown answer kind but accepts a null answer', () => {
    expect(parseRun(JSON.stringify({ ...good, answer: { kind: 'freeform' } }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...good, answer: null }))).toEqual({ ...good, answer: null });
  });
});

describe('parseSession (daily quiz)', () => {
  const good = {
    seed: 7,
    length: 10,
    passMark: 7,
    tier: 'NOVICE' as const,
    index: 3,
    correct: 2,
    chosenID: 'G001',
  };

  it('round-trips a real session', () => {
    expect(parseSession(JSON.stringify(good))).toEqual(good);
  });

  it('accepts a null chosenID — the unanswered state', () => {
    expect(parseSession(JSON.stringify({ ...good, chosenID: null, marks: [] }))).toEqual({ ...good, chosenID: null, marks: [] });
  });

  it('returns null for garbage, a wrong tier, and a wrong-typed chosenID', () => {
    expect(parseSession('not json at all')).toBeNull();
    expect(parseSession(JSON.stringify({ ...good, tier: 'MASTER' }))).toBeNull();
    expect(parseSession(JSON.stringify({ ...good, chosenID: 12 }))).toBeNull();
  });

  it('returns null when a required number is missing', () => {
    const { correct: _correct, ...missing } = good;
    expect(parseSession(JSON.stringify(missing))).toBeNull();
  });
});

describe('parseFilter (chip filter)', () => {
  it('round-trips a real filter', () => {
    const good = { category: ['GRAPES'], color: ['red'] };
    expect(parseFilter(JSON.stringify(good))).toEqual(good);
  });

  it('falls back to the empty filter rather than to null', () => {
    // An empty filter is this type's own identity value, so there is no
    // second "absent" state for a caller to handle.
    expect(parseFilter(null)).toEqual({});
    expect(parseFilter('nonsense')).toEqual({});
    expect(parseFilter('[]')).toEqual({});
    expect(parseFilter('null')).toEqual({});
  });

  it('drops one stale facet without losing the rest', () => {
    // The whole reason this one degrades per-facet: a filter is a bag of
    // independent choices, and losing a renamed facet should not cost the
    // four the user still wants.
    const parsed = parseFilter(JSON.stringify({
      category: ['GRAPES'],
      unknownFacet: ['whatever'],
      color: ['red'],
    }));
    expect(parsed).toEqual({ category: ['GRAPES'], color: ['red'] });
  });

  it('drops non-string values inside a facet, and empty facets entirely', () => {
    expect(parseFilter(JSON.stringify({ color: ['red', 7, null, 'white'] })))
      .toEqual({ color: ['red', 'white'] });
    expect(parseFilter(JSON.stringify({ color: [], category: ['STYLES'] })))
      .toEqual({ category: ['STYLES'] });
    expect(parseFilter(JSON.stringify({ color: 'red' }))).toEqual({});
  });
});
