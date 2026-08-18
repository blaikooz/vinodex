import { describe, expect, it } from 'vitest';
import { getAllEntries } from './wineData';
import { isGrapeEntry, isStyleEntry } from '@/shared/types';
import {
  MEANINGFUL_SAMPLE,
  RECOMMENDATION_FLOOR,
  RECOMMENDATION_STRIP,
  allRecommendations,
  buildProfile,
  buildTriedIndex,
  matchFor,
  recommendations,
} from './recommendations';

/**
 * Ported from the recommendation-engine cases of
 * `vinodex-ios/Tests/VinodexCoreTests/InsightTests.swift` (emptyProfile,
 * referenceEntriesAreQuiet, deterministic, recommendationsAreTheHead). The
 * insight *panel* cases (depth ladder, per-entry lines) stay unported until
 * the passport deepens (v6#21) — the panel does not exist here yet.
 */

const all = getAllEntries();
const someGrapes = all.filter(isGrapeEntry).slice(0, 8);
const triedIds = someGrapes.map(g => g.id);

describe('palate profile', () => {
  it('an empty profile scores nothing and recommends nothing', () => {
    const index = buildTriedIndex(all, []);
    const profile = buildProfile(index);
    expect(profile.sampleSize).toBe(0);
    const grape = all.find(isGrapeEntry)!;
    expect(matchFor(profile, index, grape)).toBe(null);
    expect(recommendations(profile, index)).toEqual([]);
  });

  it('below the meaningful sample it stays silent', () => {
    const index = buildTriedIndex(all, triedIds.slice(0, MEANINGFUL_SAMPLE - 1));
    const profile = buildProfile(index);
    expect(recommendations(profile, index)).toEqual([]);
  });

  it('regions, flavours and continents get no derived percentage', () => {
    const index = buildTriedIndex(all, triedIds);
    const profile = buildProfile(index);
    for (const category of ['REGIONS', 'FLAVORS', 'CONTINENTS'] as const) {
      const entry = all.find(e => e.category === category)!;
      expect(matchFor(profile, index, entry), `${category} scored`).toBe(null);
    }
  });

  it('the same shelf produces the same ranking every time', () => {
    const index = buildTriedIndex(all, triedIds);
    const profile = buildProfile(index);
    const a = allRecommendations(profile, index).map(e => e.id);
    const b = allRecommendations(buildProfile(buildTriedIndex(all, triedIds)), index).map(e => e.id);
    expect(a).toEqual(b);
  });

  it('the strip is provably the head of the full list', () => {
    const index = buildTriedIndex(all, triedIds);
    const profile = buildProfile(index);
    const strip = recommendations(profile, index, RECOMMENDATION_STRIP).map(e => e.id);
    const full = allRecommendations(profile, index).map(e => e.id);
    expect(strip).toEqual(full.slice(0, strip.length));
  });

  it('never recommends a tried entry, and everything clears the floor', () => {
    const index = buildTriedIndex(all, triedIds);
    const profile = buildProfile(index);
    for (const pick of allRecommendations(profile, index)) {
      expect(index.triedIDs.has(pick.id), `${pick.name} already tried`).toBe(false);
      expect(isGrapeEntry(pick) || isStyleEntry(pick), `${pick.name} not tastable`).toBe(true);
      const score = matchFor(profile, index, pick);
      expect(score).not.toBe(null);
      expect(score!).toBeGreaterThanOrEqual(RECOMMENDATION_FLOOR);
    }
  });

  it('a rich shelf produces at least one recommendation', () => {
    // Eight varied grapes give the profile enough to say something; if this
    // ever goes empty the floor or the weights drifted.
    const index = buildTriedIndex(all, triedIds);
    const profile = buildProfile(index);
    expect(allRecommendations(profile, index).length).toBeGreaterThan(0);
  });

  it('note weights peak at 1 and the top note leads the ranking', () => {
    const index = buildTriedIndex(all, triedIds);
    const profile = buildProfile(index);
    const weights = Object.values(profile.noteWeights);
    expect(Math.max(...weights)).toBe(1);
    expect(profile.topNotes.length).toBeGreaterThan(0);
  });
});
