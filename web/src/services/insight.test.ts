import { describe, expect, it } from 'vitest';
import { getAllEntries } from './wineData';
import { WineEntry, isGrapeEntry, isStyleEntry } from '@/shared/types';
import { normalizeLabel } from '@/shared/services/entryUtils';
import { buildProfile, buildTriedIndex } from './recommendations';
import {
  INSIGHT_DEPTHS,
  INSIGHT_LINE_KINDS,
  InsightPanel,
  buildInsightPanel,
  deeperDepth,
  depthRank,
  depthThreshold,
  earnedDepth,
  lineDepth,
  panelIsEmpty,
} from './insight';

/**
 * Ported from `vinodex-ios/Tests/VinodexCoreTests/InsightTests.swift` — the
 * panel half, closing the v6#21 tail. The recommendation-engine half already
 * lives in `recommendations.test.ts`.
 */

const all = getAllEntries();
const grapes = all.filter(isGrapeEntry);
const triedIds = (n: number) => grapes.slice(0, n).map(g => g.id);

const panel = (entry: WineEntry, tried: string[], triedDays: Record<string, number> = {}, today = 100): InsightPanel => {
  const index = buildTriedIndex(all, tried);
  return buildInsightPanel(entry, index, buildProfile(index), all, triedDays, today);
};

describe('the depth ladder', () => {
  it('thresholds ascend and start at zero', () => {
    expect(depthThreshold('teaser')).toBe(0);
    for (let i = 1; i < INSIGHT_DEPTHS.length; i++) {
      expect(depthThreshold(INSIGHT_DEPTHS[i]!)).toBeGreaterThan(depthThreshold(INSIGHT_DEPTHS[i - 1]!));
    }
    expect(deeperDepth('complete')).toBe(null);
  });

  it('depth is earned by the tried count, inclusive at the threshold', () => {
    expect(earnedDepth(0)).toBe('teaser');
    expect(earnedDepth(1)).toBe('first');
    expect(earnedDepth(4)).toBe('first');
    expect(earnedDepth(5)).toBe('shallow');
    // Lower bounds approached from below as well as from above.
    expect(earnedDepth(14)).toBe('shallow');
    expect(earnedDepth(15)).toBe('deep');
    expect(earnedDepth(39)).toBe('deep');
    expect(earnedDepth(40)).toBe('complete');
    expect(earnedDepth(500)).toBe('complete');
  });
});

describe('the panel', () => {
  it('an empty shelf gets the teaser and no derived lines', () => {
    const p = panel(grapes[5]!, []);
    expect(p.depth).toBe('teaser');
    expect(p.lines).toEqual([]);
    expect(p.teaser).toBeTruthy();
    expect(panelIsEmpty(p)).toBe(false);
    expect(p.nextDepth).toBe('first');
    expect(p.toNextDepth).toBe(1);
  });

  it('never loses a line as the shelf grows', () => {
    const entry = grapes[50]!;
    let previous = new Set<string>();
    for (const n of [1, 5, 15, 40]) {
      const kinds = new Set(panel(entry, triedIds(n)).lines.map(l => l.kind as string));
      for (const kind of previous) expect(kinds.has(kind), `${kind} lost at ${n} tastings`).toBe(true);
      previous = kinds;
    }
  });

  it('no line appears before the depth it is declared at', () => {
    for (const n of [1, 5, 15, 40]) {
      const depth = earnedDepth(n);
      for (const entry of [grapes[10]!, all.find(isStyleEntry)!]) {
        for (const line of panel(entry, triedIds(n)).lines) {
          expect(
            depthRank(lineDepth(line.kind)) <= depthRank(depth),
            `${line.kind} at ${n} tastings`,
          ).toBe(true);
        }
      }
    }
  });

  it('a panel holds at most one line of each kind, in kind order', () => {
    const p = panel(grapes[0]!, triedIds(40));
    const kinds = p.lines.map(l => l.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    const order = kinds.map(k => INSIGHT_LINE_KINDS.indexOf(k));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('regions, flavours and continents get no derived percentage', () => {
    // Regions included, as iOS asserts: they are not things you drink, so a
    // palate match on one would be a category error.
    const tried = triedIds(20);
    for (const category of ['REGIONS', 'FLAVORS', 'CONTINENTS'] as const) {
      const entry = all.find(e => e.category === category)!;
      const p = panel(entry, tried);
      expect(p.lines.some(l => l.kind === 'palateMatch'), category).toBe(false);
    }
  });

  it('a roster line counts tried over resolvable, never over authored', () => {
    const tried = triedIds(80);
    const index = buildTriedIndex(all, tried);
    for (const style of all.filter(isStyleEntry)) {
      const line = panel(style, tried).lines.find(l => l.kind === 'grapeRoster');
      if (!line) continue;
      const resolvable = new Set(
        (style.details.notableGrapes ?? [])
          .map(g => normalizeLabel(g))
          .filter(k => index.allGrapeKeys.has(k)),
      );
      expect(resolvable.size).toBeGreaterThan(0);
      expect(line.text).toContain(`of ${resolvable.size} grapes behind`);
    }
  });

  it('nothing resolvable means no roster line', () => {
    // A roster of zero resolvable grapes is not a roster: "0 of 0" would be a
    // completion nobody can reach.
    const tried = triedIds(80);
    const index = buildTriedIndex(all, tried);
    let exercised = 0;
    for (const style of all.filter(isStyleEntry)) {
      const resolvable = (style.details.notableGrapes ?? [])
        .map(g => normalizeLabel(g))
        .filter(k => index.allGrapeKeys.has(k));
      if (resolvable.length > 0) continue;
      exercised += 1;
      expect(panel(style, tried).lines.some(l => l.kind === 'grapeRoster'), style.name).toBe(false);
    }
    // A synthetic style guarantees the rule is exercised even when every
    // shipped style resolves at least one grape.
    const ghost = {
      ...(all.find(isStyleEntry) as object),
      id: 'S-GHOST',
      name: 'Ghost Style',
      details: { ...(all.find(isStyleEntry)!.details), notableGrapes: ['Nothing Anybody Grows'] },
    } as WineEntry;
    const withGhost = [...all, ghost];
    const ghostIndex = buildTriedIndex(withGhost, tried);
    const ghostPanel = buildInsightPanel(ghost, ghostIndex, buildProfile(ghostIndex), withGhost, {}, 100);
    expect(ghostPanel.lines.some(l => l.kind === 'grapeRoster')).toBe(false);
    expect(exercised + 1).toBeGreaterThan(0);
  });

  it('a region or flavour id on a legacy shelf never prints a tasting', () => {
    // Unreachable through the UI (TRIED is gated on tastable) but reachable
    // from a restored or legacy shelf — iOS asks grapes-and-styles only.
    const region = all.find(e => e.category === 'REGIONS')!;
    const tried = [region.id, ...triedIds(5)];
    const p = panel(region, tried, { [region.id]: 100 }, 100);
    expect(p.lines.some(l => l.kind === 'tried')).toBe(false);
  });

  it('a tried entry says when, and an untried one says nothing', () => {
    const entry = grapes[0]!;
    const tried = [entry.id, ...triedIds(3).filter(id => id !== entry.id)];
    expect(panel(entry, tried, { [entry.id]: 100 }, 100).lines.find(l => l.kind === 'tried')?.text).toBe('Tried today.');
    expect(panel(entry, tried, { [entry.id]: 99 }, 100).lines.find(l => l.kind === 'tried')?.text).toBe('Tried yesterday.');
    expect(panel(entry, tried, { [entry.id]: 90 }, 100).lines.find(l => l.kind === 'tried')?.text).toBe('Tried 10 days ago.');
    // No recorded day, and a day in the future, both degrade honestly.
    expect(panel(entry, tried, {}, 100).lines.find(l => l.kind === 'tried')?.text).toBe('On your tried shelf.');
    expect(panel(entry, tried, { [entry.id]: 200 }, 100).lines.find(l => l.kind === 'tried')?.text).toBe('On your tried shelf.');
    const untried = grapes.find(g => !tried.includes(g.id))!;
    expect(panel(untried, tried).lines.some(l => l.kind === 'tried')).toBe(false);
  });

  it('similar-to never names the entry itself and requires real overlap', () => {
    const entry = grapes[0]!;
    const p = panel(entry, [entry.id, ...triedIds(10).filter(id => id !== entry.id)]);
    const similar = p.lines.find(l => l.kind === 'similarTried');
    if (similar) expect(similar.text).not.toContain(`Similar to ${entry.name},`);
  });

  it('the same shelf produces the same panel every time', () => {
    const entry = grapes[7]!;
    const a = panel(entry, triedIds(20));
    const b = panel(entry, triedIds(20));
    expect(a).toEqual(b);
  });

  it('a rarity line names the entry-s own band and counts within it', () => {
    const entry = grapes[0]!;
    const p = panel(entry, triedIds(40));
    const line = p.lines.find(l => l.kind === 'rarityProgress');
    expect(line).toBeTruthy();
    expect(line!.text).toContain(`${entry.rarity} grapes.`);
  });
});
