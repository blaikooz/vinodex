import { beforeEach, describe, expect, it } from 'vitest';
import {
  PASSPORT_TIERS,
  TIER_LADDER,
  nextTier,
  tierFor,
  tierFromStorage,
  tierProgress,
} from './passportTier';
import {
  SEEN_TIER_KEY,
  announceBadges,
  announceTier,
  needsSeeding,
  seedIfNeeded,
  seenBadges,
} from './passportProgress';
import { Badge } from './passport';

/**
 * Ported from the ladder/announce cases of
 * `vinodex-ios/Tests/VinodexCoreTests/` PassportProgression coverage
 * (v6#17/#21). The thresholds are additionally the numbers the pending
 * bundle's RANK card carries — a drift here breaks both.
 */

const badge = (id: string, earned = true): Badge => ({ id, title: id.toUpperCase(), blurb: '', earned }) as Badge;

describe('the rank ladder', () => {
  it('carries the five rungs at the five thresholds', () => {
    const byName = Object.fromEntries(TIER_LADDER.map(t => [t.name, t.threshold]));
    expect(byName).toEqual({ APPRENTICE: 5, MASTER: 25, GRANDMASTER: 100, LEGENDARY: 250, 'WINE MONK': 400 });
  });

  it('thresholds ascend and are distinct along the ladder', () => {
    for (let i = 1; i < TIER_LADDER.length; i++) {
      expect(TIER_LADDER[i]!.threshold).toBeGreaterThan(TIER_LADDER[i - 1]!.threshold);
    }
  });

  it('declaration order is storage — APPRENTICE is appended, index 4', () => {
    expect(PASSPORT_TIERS[0]!.name).toBe('MASTER');
    expect(PASSPORT_TIERS[0]!.storageIndex).toBe(0);
    expect(PASSPORT_TIERS[4]!.name).toBe('APPRENTICE');
    expect(PASSPORT_TIERS[4]!.storageIndex).toBe(4);
    expect(tierFromStorage(3)?.name).toBe('WINE MONK');
    expect(tierFromStorage(99)).toBe(null);
  });

  it('a rung is held inclusively at its threshold', () => {
    expect(tierFor(4)).toBe(null);
    expect(tierFor(5)?.name).toBe('APPRENTICE');
    expect(tierFor(24)?.name).toBe('APPRENTICE');
    expect(tierFor(25)?.name).toBe('MASTER');
    expect(tierFor(400)?.name).toBe('WINE MONK');
    expect(nextTier(tierFor(400))).toBe(null);
  });

  it('progress measures from the held floor, never from zero', () => {
    // 30 tastings: MASTER (25) held, GRANDMASTER (100) next — 5/75 in.
    const p = tierProgress(30);
    expect(p.held?.name).toBe('MASTER');
    expect(p.next?.name).toBe('GRANDMASTER');
    expect(p.fraction).toBeCloseTo(5 / 75);
    expect(tierProgress(0).fraction).toBe(0);
    expect(tierProgress(500).fraction).toBe(1);
  });
});

describe('the announce ledgers', () => {
  beforeEach(() => localStorage.clear());

  it('a badge celebrates once — announced by the act of asking', () => {
    const first = announceBadges([badge('firstSip'), badge('tenBottles', false)]);
    expect(first.map(b => b.id)).toEqual(['firstSip']);
    expect(announceBadges([badge('firstSip')])).toEqual([]);
    expect(seenBadges().has('firstSip')).toBe(true);
  });

  it('a rung celebrates the tier now held, once, by threshold', () => {
    expect(announceTier(3)).toBe(null);
    // Exact crossing: the threshold itself is inclusive.
    expect(announceTier(5)?.name).toBe('APPRENTICE');
    localStorage.clear();
    expect(announceTier(6)?.name).toBe('APPRENTICE');
    expect(announceTier(7)).toBe(null);
    // A jump celebrates the held rung, not each one passed.
    expect(announceTier(120)?.name).toBe('GRANDMASTER');
    expect(localStorage.getItem(SEEN_TIER_KEY)).toBe('1');
  });

  it('WINE MONK seen means APPRENTICE never re-announces — threshold, not index', () => {
    // Stored index 3 is WINE MONK (threshold 400); raw index comparison
    // would call APPRENTICE (index 4) higher. It is not.
    localStorage.setItem(SEEN_TIER_KEY, '3');
    expect(announceTier(10)).toBe(null);
  });

  it('an unknown stored index repeats a card rather than inventing a demotion', () => {
    localStorage.setItem(SEEN_TIER_KEY, '77');
    expect(announceTier(30)?.name).toBe('MASTER');
    // The announce also repairs the store: the alien index is overwritten
    // with MASTER's declaration index, so the repeat happens once.
    expect(localStorage.getItem(SEEN_TIER_KEY)).toBe('0');
  });

  it('seeding marks what is already earned without returning it, per-ledger', () => {
    expect(needsSeeding()).toBe(true);
    seedIfNeeded(() => [badge('firstSip')], () => 30);
    expect(needsSeeding()).toBe(false);
    expect(announceBadges([badge('firstSip')])).toEqual([]);
    expect(announceTier(30)).toBe(null);
    // Fresh progress after the seed still announces.
    expect(announceTier(120)?.name).toBe('GRANDMASTER');
  });

  it('seeded-to-empty and never-seeded are different states', () => {
    seedIfNeeded(() => [], () => 0);
    expect(needsSeeding()).toBe(false);
    // The seed recorded nothing, but the flags say it ran — so a first badge
    // after seeding still celebrates.
    expect(announceBadges([badge('firstSip')]).length).toBe(1);
  });
});
