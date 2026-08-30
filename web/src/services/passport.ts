import {
  WineEntry,
  isGrapeEntry,
  isRegionEntry,
  isStyleEntry,
} from '@/shared/types';
import { entryOrigin } from './entryOrigin';
import { normalizeLabel } from '@/shared/services/entryUtils';
import { CONTINENTS } from '@/shared/data/continents';
import { dayIndex } from './dailyPick';
import { QuizTier } from './quiz';

/**
 * The taster's passport — a pure computed snapshot over the TRIED shelf, ported
 * from `vinodex-ios/Sources/VinodexCore/Passport.swift`. No persistence of its
 * own; it reads the tried ids, the dataset, the best streak and the highest
 * unlocked quiz tier.
 */

/** One column of the activity graph: a `dayIndex` and what it collected. */
export interface PassportActivityDay {
  day: number;
  count: number;
}

/**
 * How many days the activity graph shows. One week (iOS 0.8.91 E1, down from
 * thirty): seven columns are wide enough to read *individually*, which is
 * the difference between "did I taste anything yesterday" and "the month
 * looks busy-ish". Nothing downstream depends on the number.
 */
export const ACTIVITY_SPAN = 7;

/**
 * The last `span` days as one column each, oldest first (iOS 0.7.1 D1).
 * Pure, taking `today` rather than reading the clock, so the series is
 * testable without freezing time. Days after today are impossible and days
 * before the window are off the left edge; both are dropped rather than
 * clamped, which would put a spike on the chart's edge no day earned.
 */
export function activitySeries(log: Record<string, number>, today: number, span: number = ACTIVITY_SPAN): PassportActivityDay[] {
  if (span <= 0) return [];
  const first = today - span + 1;
  const counts = new Map<number, number>();
  for (const day of Object.values(log)) {
    if (day >= first && day <= today) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return Array.from({ length: span }, (_, i) => ({ day: first + i, count: counts.get(first + i) ?? 0 }));
}

export type BadgeId =
  | 'firstSip' | 'tenBottles' | 'allNoble' | 'regionComplete' | 'streakWeek' | 'sommelier'
  | 'allGrapes' | 'allStyles';

export interface Badge {
  id: BadgeId;
  title: string;
  blurb: string;
  earned: boolean;
}

export interface Passport {
  triedGrapes: number;
  totalGrapes: number;
  triedStyles: number;
  totalStyles: number;
  /**
   * Catalog-resolved tastings — grapes + styles, dead ids dropped (review
   * M4, mirroring iOS `Passport.triedTotal`). **This, never the raw shelf
   * length, is what the rank ladder counts**: a data batch that retires a
   * tried entry must move the rank the same way it moves every other count
   * on the page.
   */
  triedTotal: number;
  byColor: { red: number; white: number };
  colorTotals: { red: number; white: number };
  byRarity: Record<string, number>;
  rarityTotals: Record<string, number>;
  countries: number;
  continents: string[];
  badges: Badge[];
  /** One column per day, oldest first, quiet days included -- a gap is information. */
  activity: PassportActivityDay[];
}

const label = normalizeLabel;
const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'NOBLE', 'GODFORSAKEN'];
// Where an entry is from — one accessor for the whole app since L1. This
// module had its own, which omitted the grape's fallback to `details.origin`
// that its two siblings kept.
const originOf = entryOrigin;

// `triedDays` and `today` are defaulted (iOS 0.7.1 D1) so the twenty-odd
// call sites that only need the badges do not all grow two arguments.
export function computePassport(
  triedIds: string[],
  all: WineEntry[],
  bestStreak: number,
  highestTier: QuizTier,
  triedDays: Record<string, number> = {},
  today: number = dayIndex(),
): Passport {
  const byId = new Map(all.map(e => [e.id, e]));
  const tried = triedIds.map(id => byId.get(id)).filter((e): e is WineEntry => !!e);
  const allGrapes = all.filter(isGrapeEntry);
  const triedGrapesList = tried.filter(isGrapeEntry);
  const triedStylesList = tried.filter(isStyleEntry);

  const byColor = { red: 0, white: 0 };
  const colorTotals = { red: 0, white: 0 };
  const byRarity: Record<string, number> = {};
  const rarityTotals: Record<string, number> = {};
  for (const r of RARITIES) {
    byRarity[r] = 0;
    rarityTotals[r] = 0;
  }
  for (const g of allGrapes) {
    if (g.grapeType === 'red') colorTotals.red += 1;
    else if (g.grapeType === 'white') colorTotals.white += 1;
    if (g.rarity && g.rarity in rarityTotals) rarityTotals[g.rarity] = (rarityTotals[g.rarity] ?? 0) + 1;
  }
  for (const g of triedGrapesList) {
    if (g.grapeType === 'red') byColor.red += 1;
    else if (g.grapeType === 'white') byColor.white += 1;
    if (g.rarity && g.rarity in byRarity) byRarity[g.rarity] = (byRarity[g.rarity] ?? 0) + 1;
  }

  const originKeys = new Set<string>();
  for (const e of tried) {
    const o = originOf(e);
    if (o) originKeys.add(label(o));
  }
  const continents = CONTINENTS.filter(c =>
    (c.details.keyRegions ?? []).some(country => originKeys.has(label(country))),
  ).map(c => c.name);

  // Badge inputs.
  const triedGrapeKeys = new Set(triedGrapesList.map(g => label(g.name)));
  const allGrapeKeys = new Set(allGrapes.map(g => label(g.name)));
  const triedCount = triedGrapesList.length + triedStylesList.length;

  // The two completions (iOS 0.8.6 C6, web v0.6.40): grapes by name key,
  // styles by id -- the same comparisons iOS's Discovery index makes -- and
  // both guarded non-empty so an empty catalog earns nothing.
  const allStylesList = all.filter(isStyleEntry);
  const triedStyleIds = new Set(triedStylesList.map(st => st.id));
  const allGrapesTried = allGrapes.length > 0 && allGrapes.every(g => triedGrapeKeys.has(label(g.name)));
  const allStylesTried = allStylesList.length > 0 && allStylesList.every(st => triedStyleIds.has(st.id));

  const nobleGrapes = allGrapes.filter(g => g.rarity === 'NOBLE');
  const allNoble = nobleGrapes.length > 0 && nobleGrapes.every(g => triedGrapeKeys.has(label(g.name)));

  const regionComplete = all
    .filter(isRegionEntry)
    .some(r => {
      const req = (r.details.notableGrapes ?? [])
        .map(label)
        .filter(k => allGrapeKeys.has(k));
      return req.length > 0 && req.every(k => triedGrapeKeys.has(k));
    });

  const badges: Badge[] = [
    { id: 'firstSip', title: 'FIRST SIP', blurb: 'Mark your first grape or style as tried.', earned: triedCount >= 1 },
    { id: 'tenBottles', title: 'TEN BOTTLES', blurb: 'Ten tastings on the shelf.', earned: triedCount >= 10 },
    { id: 'allNoble', title: 'ALL NOBLE', blurb: 'Every noble grape, tried.', earned: allNoble },
    { id: 'regionComplete', title: 'REGION COMPLETE', blurb: 'Every notable grape of one region, tried.', earned: regionComplete },
    { id: 'streakWeek', title: 'STREAK WEEK', blurb: 'A seven-day daily challenge streak.', earned: bestStreak >= 7 },
    { id: 'sommelier', title: 'SOMMELIER', blurb: "The quiz's top tier, unlocked.", earned: highestTier === 'SOMMELIER' },
    // Appended, not inserted (iOS 0.8.6 C6): the array's order is the order
    // the grid draws and the unlock queue announces in, and appending keeps
    // everyone's seen-badge ids meaning what they meant.
    { id: 'allGrapes', title: 'TRIED ALL GRAPES', blurb: 'Every grape in the catalog, tried.', earned: allGrapesTried },
    { id: 'allStyles', title: 'TRIED ALL STYLES', blurb: 'Every style in the catalog, tried.', earned: allStylesTried },
  ];

  return {
    activity: activitySeries(triedDays, today),
    triedGrapes: triedGrapesList.length,
    totalGrapes: allGrapes.length,
    triedStyles: triedStylesList.length,
    totalStyles: all.filter(e => e.category === 'STYLES').length,
    triedTotal: triedGrapesList.length + triedStylesList.length,
    byColor,
    colorTotals,
    byRarity,
    rarityTotals,
    countries: originKeys.size,
    continents,
    badges,
  };
}
