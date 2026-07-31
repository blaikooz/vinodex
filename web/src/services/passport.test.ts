import { describe, it, expect } from 'vitest';
import { buildWineEntries } from '@/shared/constants';
import { normalizeLabel } from '@/shared/services/entryUtils';
import type { WineEntry } from '@/shared/types';
import { computePassport } from './passport';
import type { Badge } from './passport';
import type { QuizTier } from './quiz';

const all = buildWineEntries() as WineEntry[];
const allGrapes = all.filter(e => e.category === 'GRAPES') as any[];
const label = normalizeLabel;
const compute = (tried: string[], bestStreak = 0, highestTier: QuizTier = 'NOVICE') =>
  computePassport(tried, all, bestStreak, highestTier);
const badge = (id: string, p: { badges: Badge[] }) => p.badges.find(b => b.id === id)?.earned ?? false;

// Mirrors PassportTests.swift.
describe('passport', () => {
  it('an empty shelf is an empty passport with every stamp waiting', () => {
    const p = compute([]);
    expect(p.triedGrapes).toBe(0);
    expect(p.triedStyles).toBe(0);
    expect(p.countries).toBe(0);
    expect(p.continents.length).toBe(0);
    expect(p.badges.length).toBe(6);
    expect(p.badges.every(b => !b.earned)).toBe(true);
  });

  it('totals come from the database, not the shelf', () => {
    const p = compute([]);
    expect(p.totalGrapes).toBe(allGrapes.length);
    expect(p.totalStyles).toBe(all.filter(e => e.category === 'STYLES').length);
    expect(p.colorTotals.red + p.colorTotals.white).toBe(allGrapes.length);
    expect(Object.values(p.rarityTotals).reduce((a, b) => a + b, 0)).toBe(allGrapes.length);
  });

  it('counts split by colour and rarity and add back up', () => {
    const tried = allGrapes.slice(0, 12).map(g => g.id);
    const p = compute(tried);
    expect(p.triedGrapes).toBe(12);
    expect(p.byColor.red + p.byColor.white).toBe(12);
    expect(Object.values(p.byRarity).reduce((a, b) => a + b, 0)).toBe(12);
  });

  it('unresolvable ids are ignored', () => {
    const p = compute(['NOT_REAL', allGrapes[0].id]);
    expect(p.triedGrapes).toBe(1);
  });

  it('countries fold case-insensitively — a sibling adds no new stamp', () => {
    const grape = allGrapes.find(g => g.grapeCountryOfOrigin) ?? allGrapes[0];
    const one = compute([grape.id]);
    expect(one.countries).toBeGreaterThanOrEqual(1);
    const key = label(grape.grapeCountryOfOrigin ?? '');
    const sibling = allGrapes.find(g => g.id !== grape.id && label(g.grapeCountryOfOrigin ?? '') === key);
    if (sibling) expect(compute([grape.id, sibling.id]).countries).toBe(one.countries);
  });

  it('the first sip and ten bottles stamps track the count', () => {
    expect(badge('firstSip', compute([allGrapes[0].id]))).toBe(true);
    expect(badge('tenBottles', compute([allGrapes[0].id]))).toBe(false);
    expect(badge('tenBottles', compute(allGrapes.slice(0, 10).map(g => g.id)))).toBe(true);
  });

  it('all noble is earned by exactly the noble set', () => {
    const nobles = allGrapes.filter(g => g.rarity === 'NOBLE');
    expect(nobles.length).toBeGreaterThan(0);
    expect(badge('allNoble', compute(nobles.slice(0, -1).map(g => g.id)))).toBe(false);
    expect(badge('allNoble', compute(nobles.map(g => g.id)))).toBe(true);
  });

  it('completing one region\'s notable grapes earns the stamp', () => {
    const byKey = new Map<string, string>();
    for (const g of allGrapes) if (!byKey.has(label(g.name))) byKey.set(label(g.name), g.id);
    const region = all
      .filter(e => e.category === 'REGIONS')
      .find(r => ((r as any).details?.notableGrapes ?? []).some((n: string) => byKey.has(label(n)))) as any;
    expect(region).toBeTruthy();
    const tried = (region.details.notableGrapes as string[]).map(n => byKey.get(label(n))).filter(Boolean) as string[];
    expect(badge('regionComplete', compute(tried))).toBe(true);
  });

  it('the streak and tier stamps read their inputs', () => {
    expect(badge('streakWeek', compute([], 7))).toBe(true);
    expect(badge('streakWeek', compute([], 6))).toBe(false);
    expect(badge('sommelier', compute([], 0, 'SOMMELIER'))).toBe(true);
    expect(badge('sommelier', compute([], 0, 'ENTHUSIAST'))).toBe(false);
  });
});
