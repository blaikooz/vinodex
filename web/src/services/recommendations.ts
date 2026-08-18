import { GrapeEntry, StyleEntry, WineEntry, isGrapeEntry, isStyleEntry } from '@/shared/types';
import { normalizeLabel } from '@/shared/services/entryUtils';
import { isTastable } from './wineData';
import { shelfIds } from './bookmarks';

/**
 * The palate profile and the "You might like…" ranking, ported from the
 * recommendation half of `vinodex-ios/Sources/VinodexCore/Insight.swift`
 * (0.8.9b C1, 0.8.91 B3) — v6#15.
 *
 * **Derived, never authored, and nothing here is persisted.** A profile is a
 * *function* of the tried shelf, and the shelf already persists; caching it
 * would mean a second thing to invalidate on every tasting. Building it is a
 * few hundred map inserts over an array already in memory.
 *
 * **Ties break by name, everywhere.** A panel that reordered itself on a
 * re-render would read as a bug, and a test that passed nine times in ten is
 * worse than no test.
 *
 * The insight *panel* (depth ladder, per-entry lines) is the rest of
 * `Insight.swift` and rides the passport port (v6#21); this module is only
 * the engine the YOU MIGHT LIKE strip and screen need.
 */

/** The tried shelf, answered against the catalog — `DiscoveryIndex`, slimmed. */
export interface TriedIndex {
  triedGrapes: GrapeEntry[];
  triedStyles: StyleEntry[];
  triedIDs: Set<string>;
  /** Folded names of every grape in the catalog. */
  allGrapeKeys: Set<string>;
  /** Folded names of the tried grapes. */
  triedGrapeKeys: Set<string>;
  /** Grapes + styles — the entries a recommendation may name. */
  tastable: WineEntry[];
}

export const buildTriedIndex = (
  all: WineEntry[],
  triedIds: string[] = shelfIds('tried'),
): TriedIndex => {
  const tried = new Set(triedIds);
  const triedGrapes = all.filter((e): e is GrapeEntry => isGrapeEntry(e) && tried.has(e.id));
  const triedStyles = all.filter((e): e is StyleEntry => isStyleEntry(e) && tried.has(e.id));
  return {
    triedGrapes,
    triedStyles,
    triedIDs: tried,
    allGrapeKeys: new Set(all.filter(isGrapeEntry).map(e => normalizeLabel(e.name))),
    triedGrapeKeys: new Set(triedGrapes.map(e => normalizeLabel(e.name))),
    tastable: all.filter(isTastable),
  };
};

export interface PalateProfile {
  /** Folded note key → weight, 0…1 with the most-drunk note at 1. */
  noteWeights: Record<string, number>;
  /** The most-drunk notes as the catalog spells them, strongest first. */
  topNotes: string[];
  /** Share of tried grapes that are red, 0…1. */
  redShare: number;
  /** Means of the tried grapes' four stat bars, 0…5. */
  meanBody: number;
  meanAcid: number;
  meanTannin: number;
  meanAromatics: number;
  countryWeights: Record<string, number>;
  topCountries: string[];
  /** Tastings the profile was built from — grapes plus styles. */
  sampleSize: number;
}

/** Below this the profile exists but says nothing worth printing. */
export const MEANINGFUL_SAMPLE = 3;

/**
 * Below a coin-flip's worth of agreement, "you might like this" is a guess
 * wearing a number.
 */
export const RECOMMENDATION_FLOOR = 55;

/**
 * How many the passport's strip shows before SHOW ALL (0.8.91, B3). Here
 * rather than in the view because the whole point of a capped strip is that a
 * *different* screen shows the rest.
 */
export const RECOMMENDATION_STRIP = 5;

const normalized = (counts: Map<string, number>): Record<string, number> => {
  let peak = 0;
  for (const v of counts.values()) peak = Math.max(peak, v);
  if (peak === 0) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of counts) out[k] = v / peak;
  return out;
};

const ranked = (weights: Record<string, number>, names: Map<string, string>): string[] =>
  Object.entries(weights)
    .sort((a, b) => (a[1] === b[1] ? (a[0] < b[0] ? -1 : 1) : b[1] - a[1]))
    .map(([k]) => names.get(k))
    .filter((n): n is string => !!n);

export const buildProfile = (index: TriedIndex): PalateProfile => {
  // Sorted by id so the display spellings picked below are the same on every
  // run — see the module note on ties.
  const grapes = [...index.triedGrapes].sort((a, b) => (a.id < b.id ? -1 : 1));
  const styles = [...index.triedStyles].sort((a, b) => (a.id < b.id ? -1 : 1));
  const sampleSize = grapes.length + styles.length;

  const noteCounts = new Map<string, number>();
  const noteNames = new Map<string, string>();
  const allNotes = [...grapes.flatMap(g => g.tastingProfile ?? []), ...styles.flatMap(s => s.tastingProfile ?? [])];
  for (const note of allNotes) {
    const key = normalizeLabel(note.note);
    if (!key) continue;
    noteCounts.set(key, (noteCounts.get(key) ?? 0) + 1);
    if (!noteNames.has(key)) noteNames.set(key, note.note);
  }
  const noteWeights = normalized(noteCounts);

  const countryCounts = new Map<string, number>();
  const countryNames = new Map<string, string>();
  for (const grape of grapes) {
    const key = normalizeLabel(grape.grapeCountryOfOrigin);
    if (!key) continue;
    countryCounts.set(key, (countryCounts.get(key) ?? 0) + 1);
    if (!countryNames.has(key)) countryNames.set(key, grape.grapeCountryOfOrigin);
  }
  const countryWeights = normalized(countryCounts);

  let redShare = 0;
  let meanBody = 0;
  let meanAcid = 0;
  let meanTannin = 0;
  let meanAromatics = 0;
  if (grapes.length > 0) {
    const n = grapes.length;
    redShare = grapes.filter(g => g.grapeType === 'red').length / n;
    meanBody = grapes.reduce((s, g) => s + g.grapeCharacteristics.body, 0) / n;
    meanAcid = grapes.reduce((s, g) => s + g.grapeCharacteristics.acid, 0) / n;
    meanTannin = grapes.reduce((s, g) => s + g.grapeCharacteristics.tannin, 0) / n;
    meanAromatics = grapes.reduce((s, g) => s + g.grapeCharacteristics.aromatics, 0) / n;
  }

  return {
    noteWeights,
    topNotes: ranked(noteWeights, noteNames),
    redShare,
    meanBody,
    meanAcid,
    meanTannin,
    meanAromatics,
    countryWeights,
    topCountries: ranked(countryWeights, countryNames),
    sampleSize,
  };
};

const percent = (value: number): number => Math.min(100, Math.max(0, Math.round(value * 100)));

/**
 * How much this entry looks like what you drink, 0…100 — or null when the
 * question does not apply. **Null is a real answer and there are three of
 * them:** an empty profile has nothing to compare against; regions, flavours
 * and continents are not things you drink; and an entry with no tasting notes
 * cannot be scored on the axis that carries most of the weight. Returning 0
 * would print "Palate match 0%" — a confident statement that you would hate
 * it — for what is actually an absence of data.
 *
 * The weights are a product decision and this is the only place they appear.
 */
export const matchFor = (profile: PalateProfile, index: TriedIndex, entry: WineEntry): number | null => {
  if (profile.sampleSize <= 0) return null;
  const notes = (isGrapeEntry(entry) || isStyleEntry(entry) ? entry.tastingProfile : undefined) ?? [];
  if (notes.length === 0) return null;

  const noteScore =
    notes.reduce((s, n) => s + (profile.noteWeights[normalizeLabel(n.note)] ?? 0), 0) / notes.length;

  if (isGrapeEntry(entry)) {
    const c = entry.grapeCharacteristics;
    // Mean absolute distance across the four authored bars, over their 0…5
    // range. COLOR INTENSITY is left out: it describes the liquid, not a
    // preference.
    const distance =
      (Math.abs(c.body - profile.meanBody) +
        Math.abs(c.acid - profile.meanAcid) +
        Math.abs(c.tannin - profile.meanTannin) +
        Math.abs(c.aromatics - profile.meanAromatics)) / 4;
    const statScore = Math.max(0, 1 - distance / 5);
    const colorScore = entry.grapeType === 'red' ? profile.redShare : 1 - profile.redShare;
    return percent(0.55 * noteScore + 0.25 * statScore + 0.2 * colorScore);
  }

  if (isStyleEntry(entry)) {
    // Styles have no stat bars and no colour of their own, so that third of
    // the score goes to something a style does have: how many of its notable
    // grapes you have already tried.
    const roster = (entry.details.notableGrapes ?? [])
      .map(g => normalizeLabel(g))
      .filter(k => index.allGrapeKeys.has(k));
    const overlap =
      roster.length === 0 ? 0 : roster.filter(k => index.triedGrapeKeys.has(k)).length / roster.length;
    return percent(0.7 * noteScore + 0.3 * overlap);
  }

  return null;
};

/**
 * Untried grapes and styles that score well against the profile, best first,
 * ties broken by name. Returns empty rather than filler when the profile is
 * thin — a recommendation drawn from two tastings is a coincidence, and an
 * empty shelf is an honest answer the panel can render as a nudge to try more.
 */
export const recommendations = (
  profile: PalateProfile,
  index: TriedIndex,
  limit: number = 6,
): WineEntry[] => {
  if (profile.sampleSize < MEANINGFUL_SAMPLE || limit <= 0) return [];
  return index.tastable
    .filter(e => !index.triedIDs.has(e.id))
    .map(entry => ({ entry, score: matchFor(profile, index, entry) }))
    .filter((x): x is { entry: WineEntry; score: number } => x.score !== null && x.score >= RECOMMENDATION_FLOOR)
    .sort((a, b) => (a.score === b.score ? (a.entry.name < b.entry.name ? -1 : 1) : b.score - a.score))
    .slice(0, limit)
    .map(x => x.entry);
};

/**
 * Everything above the floor, uncapped — what SHOW ALL opens. The same ranking
 * with the cap taken off rather than a second query, so the strip is provably
 * the head of this list.
 */
export const allRecommendations = (profile: PalateProfile, index: TriedIndex): WineEntry[] =>
  recommendations(profile, index, Number.MAX_SAFE_INTEGER);
