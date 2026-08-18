import { WineEntry } from '@/shared/types';
import { normalizeLabel } from '@/shared/services/entryUtils';
import { CONTINENTS } from '@/shared/data/continents';
import { QuizTier } from './quiz';

/**
 * The taster's passport — a pure computed snapshot over the TRIED shelf, ported
 * from `vinodex-ios/Sources/VinodexCore/Passport.swift`. No persistence of its
 * own; it reads the tried ids, the dataset, the best streak and the highest
 * unlocked quiz tier.
 */

export type BadgeId = 'firstSip' | 'tenBottles' | 'allNoble' | 'regionComplete' | 'streakWeek' | 'sommelier';

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
}

const label = normalizeLabel;
const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'NOBLE', 'GODFORSAKEN'];
const originOf = (e: any): string => String(e.grapeCountryOfOrigin ?? e.details?.origin ?? '');

export function computePassport(triedIds: string[], all: WineEntry[], bestStreak: number, highestTier: QuizTier): Passport {
  const byId = new Map(all.map(e => [e.id, e]));
  const tried = triedIds.map(id => byId.get(id)).filter((e): e is WineEntry => !!e);
  const allGrapes = all.filter(e => e.category === 'GRAPES');
  const triedGrapesList = tried.filter(e => e.category === 'GRAPES');
  const triedStylesList = tried.filter(e => e.category === 'STYLES');

  const byColor = { red: 0, white: 0 };
  const colorTotals = { red: 0, white: 0 };
  const byRarity: Record<string, number> = {};
  const rarityTotals: Record<string, number> = {};
  for (const r of RARITIES) {
    byRarity[r] = 0;
    rarityTotals[r] = 0;
  }
  for (const g of allGrapes as any[]) {
    if (g.grapeType === 'red') colorTotals.red += 1;
    else if (g.grapeType === 'white') colorTotals.white += 1;
    if (g.rarity && g.rarity in rarityTotals) rarityTotals[g.rarity] = (rarityTotals[g.rarity] ?? 0) + 1;
  }
  for (const g of triedGrapesList as any[]) {
    if (g.grapeType === 'red') byColor.red += 1;
    else if (g.grapeType === 'white') byColor.white += 1;
    if (g.rarity && g.rarity in byRarity) byRarity[g.rarity] = (byRarity[g.rarity] ?? 0) + 1;
  }

  const originKeys = new Set<string>();
  for (const e of tried) {
    const o = originOf(e as any);
    if (o) originKeys.add(label(o));
  }
  const continents = CONTINENTS.filter(c =>
    (c.details.keyRegions ?? []).some(country => originKeys.has(label(country))),
  ).map(c => c.name);

  // Badge inputs.
  const triedGrapeKeys = new Set(triedGrapesList.map(g => label(g.name)));
  const allGrapeKeys = new Set(allGrapes.map(g => label(g.name)));
  const triedCount = triedGrapesList.length + triedStylesList.length;

  const nobleGrapes = (allGrapes as any[]).filter(g => g.rarity === 'NOBLE');
  const allNoble = nobleGrapes.length > 0 && nobleGrapes.every(g => triedGrapeKeys.has(label(g.name)));

  const regionComplete = all
    .filter(e => e.category === 'REGIONS')
    .some(r => {
      const req = ((r as any).details?.notableGrapes ?? [])
        .map((n: string) => label(n))
        .filter((k: string) => allGrapeKeys.has(k));
      return req.length > 0 && req.every((k: string) => triedGrapeKeys.has(k));
    });

  const badges: Badge[] = [
    { id: 'firstSip', title: 'FIRST SIP', blurb: 'Mark your first grape or style as tried.', earned: triedCount >= 1 },
    { id: 'tenBottles', title: 'TEN BOTTLES', blurb: 'Ten tastings on the shelf.', earned: triedCount >= 10 },
    { id: 'allNoble', title: 'ALL NOBLE', blurb: 'Every noble grape, tried.', earned: allNoble },
    { id: 'regionComplete', title: 'REGION COMPLETE', blurb: 'Every notable grape of one region, tried.', earned: regionComplete },
    { id: 'streakWeek', title: 'STREAK WEEK', blurb: 'A seven-day daily challenge streak.', earned: bestStreak >= 7 },
    { id: 'sommelier', title: 'SOMMELIER', blurb: "The quiz's top tier, unlocked.", earned: highestTier === 'SOMMELIER' },
  ];

  return {
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
