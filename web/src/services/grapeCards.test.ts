import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAPE_CARDS } from '@/shared/data/grapeCards';
import { GRAPES } from '@/shared/data/grapes';

/**
 * The authored-bar merge in `shared/data/grapeCards.ts` (v7#C3).
 *
 * The 0.2.2 catalogue batch moved `colorIntensity` and `aromatics` from a
 * derivation over prose to values a human wrote down, and left the other three
 * bars deriving as before. That makes the join between the two a *merge*, and
 * the merge has one way to go wrong that no data currently exposes:
 *
 *     colorIntensity: authored.colorIntensity ?? (type === 'red' ? 4 : 2)
 *
 * With `||` instead of `??`, an authored **0** — a legal value on every one of
 * these bars — would be discarded and silently replaced by the derivation. No
 * grape authors 0 today, so the bug would ship green and surface the first
 * time somebody wrote one down. It is precisely the kind of thing a later
 * "simplification" undoes, which is why it is pinned rather than trusted.
 *
 * Two assertions, because neither is sufficient alone. The behavioural one
 * proves the authored values genuinely win over the derivation *today*; the
 * source one proves they would still win at 0, which no dataset can currently
 * demonstrate. `shared/` is a mirror and is read here, never written.
 */

const SOURCE = resolve(process.cwd(), 'shared/data/grapeCards.ts');

/** The five lines inside `characteristics: { ... }`. */
const mergeBlock = (): string => {
  const src = readFileSync(SOURCE, 'utf8');
  const start = src.indexOf('characteristics: {');
  expect(start, 'the characteristics merge block has moved or been renamed').toBeGreaterThan(-1);
  const end = src.indexOf('},', start);
  expect(end, 'the characteristics merge block is unterminated').toBeGreaterThan(start);
  return src.slice(start, end);
};

describe('the authored-bar merge', () => {
  it('falls back with ?? so an authored 0 survives, never with ||', () => {
    const block = mergeBlock();
    const lines = block
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('tannin:') || l.startsWith('acid:') || l.startsWith('colorIntensity:') || l.startsWith('aromatics:') || l.startsWith('body:'));

    // All five bars, so a bar added later cannot slip past unexamined.
    expect(lines.length, `found ${lines.length} bar lines, expected 5`).toBe(5);
    for (const line of lines) {
      const bar = line.slice(0, line.indexOf(':'));
      // The *merge operator* specifically, not "the line contains ??". A plain
      // substring check is both too weak (`a || b ?? c` would pass) and too
      // strong: `aromatics`' own fallback legitimately contains a `||` in
      // `tastingProfile.length || 1`, which is a default for an empty array
      // and has nothing to do with the merge. A literal prefix is exact, and
      // avoids escaping `.` and `??` into a regex that quietly means something
      // else.
      const prefix = `${bar}: authored.${bar} ?? `;
      expect(line.startsWith(prefix), `"${line}" must merge as \`${prefix}…\``).toBe(true);
    }
  });

  /**
   * The authored values are actually reaching the cards.
   *
   * Chosen so the derivation and the authored value **disagree**: under
   * `type === 'red' ? 4 : 2` every one of these would read 4 or 2, so each case
   * fails if the merge stops preferring the authored side.
   */
  it('prefers the authored value over the derivation it replaced', () => {
    const derived = (type: 'red' | 'white') => (type === 'red' ? 4 : 2);
    const cases: [string, number][] = [
      ['Alicante Bouschet', 5], // teinturier: derivation says 4
      ['Saperavi', 5],
      ['Pinot Noir', 2], // pale red: derivation says 4
      ['Poulsard', 1],
      ['Trebbiano', 1], // neutral white: derivation says 2
    ];
    for (const [name, expected] of cases) {
      const card = GRAPE_CARDS.find(c => c.name === name);
      expect(card, `${name} is missing`).toBeDefined();
      expect(card!.characteristics.colorIntensity, `${name} colorIntensity`).toBe(expected);
      expect(
        card!.characteristics.colorIntensity,
        `${name} fell back to the derivation`,
      ).not.toBe(derived(card!.type));
    }
  });

  /**
   * The arrangement the field's doc comment describes: two bars fully authored
   * across the catalogue, three still deriving. `Partial` is load-bearing — the
   * remaining three can move over one at a time without a flag day — so this
   * pins which side of the line each bar is on rather than assuming all five
   * migrated.
   */
  it('authors exactly the two bars that carried no information, on every grape', () => {
    expect(GRAPES.length).toBe(177);
    const authoredKeys = new Set<string>();
    let withAuthored = 0;
    for (const g of GRAPES) {
      if (!g.characteristics) continue;
      withAuthored += 1;
      for (const k of Object.keys(g.characteristics)) authoredKeys.add(k);
    }
    expect(withAuthored, 'every grape should author its bars').toBe(177);
    expect([...authoredKeys].sort()).toEqual(['aromatics', 'colorIntensity']);
  });
});
