import { GrapeEntry, WineEntry, isGrapeEntry, isRegionEntry, isStyleEntry } from '@/shared/types';
import { normalizeLabel } from '@/shared/services/entryUtils';
import { PalateProfile, TriedIndex, matchFor } from './recommendations';
import { dayIndex } from './dailyPick';

/**
 * The INSIGHT panel — what the tried set says about this entry. Ported from
 * the panel half of `vinodex-ios/Sources/VinodexCore/Insight.swift`
 * (0.8.9b, B1/B2) — the open tail of v6#21, now closed.
 *
 * **The panel deepens with the tried count, and the thresholds live here**
 * for the reason every other rule does: "the palate match appeared after two
 * tastings" is a product bug a test can catch and a screenshot cannot. The
 * ordering is by *reliability*, not by how impressive the line sounds: a
 * palate match computed from four grapes is arithmetic performed on noise,
 * so it waits; a region roster is a true statement at one tasting and shows
 * immediately.
 *
 * **What is not here, and why:** the spec's "pairings weighted to your
 * history" line — the catalog carries no food-pairing data, and inventing
 * pairings from flavour notes would be exactly the plausible-but-wrong
 * output the characteristics bars refuse to produce.
 */

export type InsightDepth = 'teaser' | 'first' | 'shallow' | 'deep' | 'complete';

export const INSIGHT_DEPTHS: InsightDepth[] = ['teaser', 'first', 'shallow', 'deep', 'complete'];

/** Tried entries needed. Ascending, asserted in the tests. */
export const depthThreshold = (depth: InsightDepth): number => {
  switch (depth) {
    case 'teaser':
      return 0;
    case 'first':
      return 1;
    case 'shallow':
      return 5;
    case 'deep':
      return 15;
    case 'complete':
      return 40;
  }
};

export const depthRank = (depth: InsightDepth): number => INSIGHT_DEPTHS.indexOf(depth);

export const earnedDepth = (count: number): InsightDepth => {
  let held: InsightDepth = 'teaser';
  for (const depth of INSIGHT_DEPTHS) if (count >= depthThreshold(depth)) held = depth;
  return held;
};

/** The depth above, or null at the top. */
export const deeperDepth = (depth: InsightDepth): InsightDepth | null =>
  INSIGHT_DEPTHS[depthRank(depth) + 1] ?? null;

/**
 * One derived sentence. **At most one line per kind** — which is what makes
 * the kind a safe key and stops the panel printing two region rosters.
 */
export type InsightLineKind =
  | 'tried'
  | 'regionProgress'
  | 'grapeRoster'
  | 'countryProgress'
  | 'similarTried'
  | 'palateMatch'
  | 'rarityProgress';

/** In draw order. */
export const INSIGHT_LINE_KINDS: InsightLineKind[] = [
  'tried',
  'regionProgress',
  'grapeRoster',
  'countryProgress',
  'similarTried',
  'palateMatch',
  'rarityProgress',
];

/** The depth at which each kind unlocks. */
export const lineDepth = (kind: InsightLineKind): InsightDepth => {
  switch (kind) {
    case 'tried':
    case 'regionProgress':
    case 'grapeRoster':
      return 'first';
    case 'countryProgress':
    case 'similarTried':
      return 'shallow';
    case 'palateMatch':
      return 'deep';
    case 'rarityProgress':
      return 'complete';
  }
};

export interface InsightLine {
  kind: InsightLineKind;
  text: string;
}

export interface InsightPanel {
  depth: InsightDepth;
  /** In `INSIGHT_LINE_KINDS` order, which is the order they are drawn. */
  lines: InsightLine[];
  /** The pre-first-tasting copy, and null once anything has been tried. */
  teaser: string | null;
  /** The next depth and how many more tastings reach it — null at the top. */
  nextDepth: InsightDepth | null;
  toNextDepth: number;
}

export const panelIsEmpty = (p: InsightPanel): boolean => p.lines.length === 0 && p.teaser === null;

const INSIGHT_TEASER =
  'Mark a grape or style TRIED and this panel starts reading your palate back to you.';

// ---------------------------------------------------------------------------
// Individual lines
// ---------------------------------------------------------------------------

const triedLine = (
  entry: WineEntry,
  index: TriedIndex,
  triedDays: Record<string, number>,
  today: number,
): string | null => {
  // Grapes and styles only, as iOS asks (`Insight.swift` triedLine): a region
  // or flavour id on the tried shelf is not something you drank, and only a
  // restored or legacy shelf can carry one — the TRIED control is gated on
  // `isTastable`. Answering "Tried today." for one would be the panel
  // asserting a tasting that never happened.
  const isTastableEntry = isGrapeEntry(entry) || isStyleEntry(entry);
  if (!isTastableEntry || !index.triedIDs.has(entry.id)) return null;
  const day = triedDays[entry.id];
  // A day in the future is a clock that moved, not a negative age.
  if (day === undefined || day > today) return 'On your tried shelf.';
  const days = today - day;
  if (days === 0) return 'Tried today.';
  if (days === 1) return 'Tried yesterday.';
  return `Tried ${days} days ago.`;
};

/**
 * Tried and total over an entry's `notableGrapes`, counting only the ones
 * that resolve to a grape the catalog holds — an unresolvable name is not a
 * grape anybody can go and try, and counting it would make the roster
 * permanently incompletable. Null when nothing resolves.
 */
const roster = (entry: WineEntry, index: TriedIndex): { tried: number; total: number } | null => {
  const notable: string[] =
    (isRegionEntry(entry) || isStyleEntry(entry) ? entry.details.notableGrapes : undefined) ?? [];
  const resolvable = new Set(notable.map(g => normalizeLabel(g)).filter(k => index.allGrapeKeys.has(k)));
  if (resolvable.size === 0) return null;
  let tried = 0;
  for (const key of resolvable) if (index.triedGrapeKeys.has(key)) tried += 1;
  return { tried, total: resolvable.size };
};

/**
 * "You've tried 3 of 6 Piedmont grapes." For a region that is its own
 * roster; for a grape or style, the first key region that resolves to a
 * catalog entry — first rather than best, because the leading authored
 * region is the one the entry is known for.
 */
const regionLine = (
  entry: WineEntry,
  index: TriedIndex,
  regionsByName: Map<string, WineEntry>,
): string | null => {
  let region: WineEntry | null = null;
  if (isRegionEntry(entry)) {
    region = entry;
  } else if (isGrapeEntry(entry)) {
    for (const name of [...entry.grapeNotableRegions, ...entry.details.keyRegions]) {
      const found = regionsByName.get(normalizeLabel(name));
      if (found) {
        region = found;
        break;
      }
    }
  } else if (isStyleEntry(entry)) {
    for (const name of entry.details.keyRegions) {
      const found = regionsByName.get(normalizeLabel(name));
      if (found) {
        region = found;
        break;
      }
    }
  }
  if (!region) return null;
  const r = roster(region, index);
  if (!r) return null;
  return `You've tried ${r.tried} of ${r.total} ${region.name} grapes.`;
};

/** A style's own grape roster — regions are covered by `regionLine`, and
 *  printing both for a region would be the same sentence twice. */
const rosterLine = (entry: WineEntry, index: TriedIndex): string | null => {
  if (!isStyleEntry(entry)) return null;
  const r = roster(entry, index);
  if (!r) return null;
  return `You've tried ${r.tried} of ${r.total} grapes behind ${entry.name}.`;
};

/**
 * "You've tried 12 of 34 grapes from Italy." A preposition rather than an
 * adjective on purpose: "Italy" to "Italian" is a lookup table nobody has
 * written and that gets New Zealand wrong.
 */
const countryLine = (
  entry: WineEntry,
  index: TriedIndex,
  grapesByCountry: Map<string, GrapeEntry[]>,
): string | null => {
  const country = isGrapeEntry(entry)
    ? entry.grapeCountryOfOrigin
    : isRegionEntry(entry) || isStyleEntry(entry)
      ? entry.details.origin
      : null;
  if (!country) return null;
  const pool = grapesByCountry.get(normalizeLabel(country)) ?? [];
  if (pool.length <= 1) return null;
  const tried = pool.filter(g => index.triedGrapeKeys.has(normalizeLabel(g.name))).length;
  return `You've tried ${tried} of ${pool.length} grapes from ${country}.`;
};

/**
 * "Similar to Nebbiolo, which you've tried." Nearest tried grape by
 * tasting-note overlap as a Jaccard ratio, so fifteen notes do not beat four
 * purely by having more of them. Requires real overlap — two entries sharing
 * nothing are not similar, and the honest output is silence. Ties break by
 * name, per the determinism rule on the profile.
 */
/** Canonical name ordering, so accented names tie-break as Swift orders them. */
const nameOrder = (a: string, b: string): number => a.localeCompare(b, 'en');

const similarLine = (entry: WineEntry, index: TriedIndex): string | null => {
  const notes = (isGrapeEntry(entry) || isStyleEntry(entry) ? entry.tastingProfile : undefined) ?? [];
  const mine = new Set(notes.map(n => normalizeLabel(n.note)));
  if (mine.size === 0) return null;

  let best: { name: string; score: number } | null = null;
  for (const grape of index.triedGrapes) {
    if (grape.id === entry.id) continue;
    const theirs = new Set((grape.tastingProfile ?? []).map(n => normalizeLabel(n.note)));
    if (theirs.size === 0) continue;
    let shared = 0;
    for (const note of mine) if (theirs.has(note)) shared += 1;
    if (shared === 0) continue;
    const union = mine.size + theirs.size - shared;
    const score = shared / union;
    // Ties by name. `localeCompare` with a fixed locale rather than `>=`,
    // which compares UTF-16 code units and would order Gruner/Torrontes
    // differently from Swift's canonical comparison.
    if (best && (score < best.score || (score === best.score && nameOrder(grape.name, best.name) >= 0))) continue;
    best = { name: grape.name, score };
  }
  return best ? `Similar to ${best.name}, which you've tried.` : null;
};

const matchLine = (entry: WineEntry, index: TriedIndex, profile: PalateProfile): string | null => {
  const percent = matchFor(profile, index, entry);
  return percent === null ? null : `Palate match ${percent}%.`;
};

/** "You've tried 4 of 12 NOBLE grapes." Grapes only — a style's rarity is
 *  optional in the data and absent on most of them. */
const rarityLine = (
  entry: WineEntry,
  index: TriedIndex,
  grapesByRarity: Map<string, GrapeEntry[]>,
): string | null => {
  if (!isGrapeEntry(entry)) return null;
  const band = grapesByRarity.get(entry.rarity) ?? [];
  if (band.length <= 1) return null;
  const tried = band.filter(g => index.triedGrapeKeys.has(normalizeLabel(g.name))).length;
  return `You've tried ${tried} of ${band.length} ${entry.rarity} grapes.`;
};

// ---------------------------------------------------------------------------
// The panel
// ---------------------------------------------------------------------------

interface CatalogBuckets {
  regionsByName: Map<string, WineEntry>;
  grapesByCountry: Map<string, GrapeEntry[]>;
  grapesByRarity: Map<string, GrapeEntry[]>;
}

/**
 * The catalog, pre-bucketed once per array (ledger L1). iOS buckets at load
 * and its own note forbids folding per draw — "a fold per grape per draw of
 * a panel that redraws on scroll" — and this panel is rebuilt on every shelf
 * change. Keyed by array identity like `lineageIndexFor`, so the one cached
 * `getAllEntries()` array shares one set of buckets and a fixture gets its
 * own. `push` rather than a spread, which made the build quadratic.
 */
const bucketCache = new WeakMap<WineEntry[], CatalogBuckets>();

const catalogBuckets = (all: WineEntry[]): CatalogBuckets => {
  const cached = bucketCache.get(all);
  if (cached) return cached;

  const regionsByName = new Map<string, WineEntry>();
  const grapesByCountry = new Map<string, GrapeEntry[]>();
  const grapesByRarity = new Map<string, GrapeEntry[]>();
  for (const e of all) {
    if (isRegionEntry(e)) regionsByName.set(normalizeLabel(e.name), e);
    if (isGrapeEntry(e)) {
      const countryKey = normalizeLabel(e.grapeCountryOfOrigin);
      if (countryKey) {
        const bucket = grapesByCountry.get(countryKey);
        if (bucket) bucket.push(e);
        else grapesByCountry.set(countryKey, [e]);
      }
      const band = grapesByRarity.get(e.rarity);
      if (band) band.push(e);
      else grapesByRarity.set(e.rarity, [e]);
    }
  }

  const built = { regionsByName, grapesByCountry, grapesByRarity };
  bucketCache.set(all, built);
  return built;
};

/**
 * The panel for one entry. Pure and takes everything it needs — `triedDays`
 * and `today` arrive as parameters, so a test can put a tasting three days
 * in the past without freezing time.
 */
export const buildInsightPanel = (
  entry: WineEntry,
  index: TriedIndex,
  profile: PalateProfile,
  all: WineEntry[],
  triedDays: Record<string, number> = {},
  today: number = dayIndex(),
): InsightPanel => {
  const count = index.triedGrapes.length + index.triedStyles.length;
  const depth = earnedDepth(count);
  const next = deeperDepth(depth);
  const toNext = Math.max(0, (next ? depthThreshold(next) : 0) - count);

  if (depth === 'teaser') {
    return { depth, lines: [], teaser: INSIGHT_TEASER, nextDepth: next, toNextDepth: toNext };
  }

  const { regionsByName, grapesByCountry, grapesByRarity } = catalogBuckets(all);

  const lines: InsightLine[] = [];
  // The builder is a thunk, not a string: a line the depth rejects must not
  // be *computed* and thrown away — `similarLine` walks the whole tried shelf
  // and `countryLine` a country's grapes. iOS uses `@autoclosure` for exactly
  // this; a lambda invoked inside the guard is the same shape.
  const add = (kind: InsightLineKind, build: () => string | null) => {
    if (depthRank(depth) < depthRank(lineDepth(kind))) return;
    const text = build();
    if (text === null) return;
    lines.push({ kind, text });
  };

  add('tried', () => triedLine(entry, index, triedDays, today));
  add('regionProgress', () => regionLine(entry, index, regionsByName));
  add('grapeRoster', () => rosterLine(entry, index));
  add('countryProgress', () => countryLine(entry, index, grapesByCountry));
  add('similarTried', () => similarLine(entry, index));
  add('palateMatch', () => matchLine(entry, index, profile));
  add('rarityProgress', () => rarityLine(entry, index, grapesByRarity));

  // Drawn in kind order rather than append order, so a line added later in
  // this function cannot silently reorder the panel.
  lines.sort((a, b) => INSIGHT_LINE_KINDS.indexOf(a.kind) - INSIGHT_LINE_KINDS.indexOf(b.kind));

  return { depth, lines, teaser: null, nextDepth: next, toNextDepth: toNext };
};
