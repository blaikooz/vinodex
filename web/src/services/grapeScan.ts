import { WineEntry, isFlavorEntry, isGrapeEntry } from '@/shared/types';
import { normalizeLabel } from '@/shared/services/entryUtils';

/**
 * The scanner: a handful of questions about the glass in front of you, then a
 * deduction.
 *
 * Ported from `vinodex-ios/Sources/VinodexCore/GrapeScan.swift`.
 */

export type GrapeColor = 'red' | 'white';

/**
 * What the scanner has been told so far.
 *
 * Every field is optional because the game is skippable at each step — "I don't
 * know" is a first-class answer, and the reveal has to work from none, some or
 * all of it. Empty criteria match every grape, which is correct: you told it
 * nothing, so nothing is excluded.
 */
export interface GrapeScanCriteria {
  color?: GrapeColor;
  body?: string;
  country?: string;
  /** Ids of chosen flavour entries, capped at `FLAVOR_LIMIT`. */
  flavorIds: string[];
}

/**
 * Ceiling on the flavour basket. Three specific notes already narrow the grape
 * list to a handful, and a fourth reliably produces nothing — because the
 * flavours are ANDed, not ORed (see `grapesMatching`).
 */
export const FLAVOR_LIMIT = 3;

export const emptyCriteria = (): GrapeScanCriteria => ({ flavorIds: [] });

export const criteriaAreEmpty = (c: GrapeScanCriteria): boolean =>
  !c.color && !c.body && !c.country && c.flavorIds.length === 0;

export const flavorsAreFull = (c: GrapeScanCriteria): boolean =>
  c.flavorIds.length >= FLAVOR_LIMIT;

/** Adds or removes a flavour, refusing to exceed the cap. */
export function toggleFlavor(c: GrapeScanCriteria, id: string): GrapeScanCriteria {
  if (c.flavorIds.includes(id)) {
    return { ...c, flavorIds: c.flavorIds.filter(f => f !== id) };
  }
  if (flavorsAreFull(c)) return c;
  return { ...c, flavorIds: [...c.flavorIds, id] };
}

/** Whole-term match, so "Italy" does not match "Italy-Slovenia border" by prefix. */
const matchesWholeTerm = (candidate: string, term: string): boolean => {
  const c = normalizeLabel(candidate).replace(/[_\-/(),.;]+/g, ' ').replace(/\s+/g, ' ').trim();
  const t = normalizeLabel(term).replace(/[_\-/(),.;]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!c || !t) return false;
  if (c === t) return true;
  return ` ${c} `.includes(` ${t} `);
};

/**
 * Whether one grape carries one flavour.
 *
 * Checked both ways round on purpose. The generated link runs flavour → grape
 * (`notableGrapes` is how flavours are derived in the first place), but a
 * grape's own `tastingProfile` names its notes as free text, and the two do not
 * agree for every pair. Either direction counts.
 */
export function grapeCarriesFlavor(grape: WineEntry, flavor: WineEntry): boolean {
  const grapeKey = normalizeLabel(grape.name);
  const flavorNotableGrapes = isFlavorEntry(flavor) ? flavor.details.notableGrapes ?? [] : [];
  if (flavorNotableGrapes.some(n => normalizeLabel(n) === grapeKey)) return true;

  const flavorKey = normalizeLabel(flavor.name);
  const profile = isGrapeEntry(grape) ? grape.tastingProfile ?? [] : [];
  return profile.some(n => normalizeLabel(n.note) === flavorKey);
}

/**
 * Grapes satisfying every criterion given.
 *
 * The flavours are ANDed: picking Blackcurrant *and* Cedar means "a grape that
 * shows both", which is how anyone describing a wine in front of them would
 * mean it.
 */
export function grapesMatching(entries: WineEntry[], criteria: GrapeScanCriteria): WineEntry[] {
  const flavors = criteria.flavorIds
    .map(id => entries.find(e => e.id === id))
    .filter((e): e is WineEntry => !!e);

  return entries
    .filter(candidate => {
      if (!isGrapeEntry(candidate)) return false;

      if (criteria.color && candidate.grapeType !== criteria.color) return false;

      if (criteria.body && normalizeLabel(candidate.grapeBodyClass) !== normalizeLabel(criteria.body)) {
        return false;
      }

      if (criteria.country && !matchesWholeTerm(candidate.grapeCountryOfOrigin ?? '', criteria.country)) {
        return false;
      }

      return flavors.every(f => grapeCarriesFlavor(candidate, f));
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

/**
 * Distinct values of some field, most common first, ties broken alphabetically
 * so the order is stable between builds.
 */
function counted(entries: WineEntry[], key: (e: WineEntry) => string | undefined): string[] {
  const tally = new Map<string, number>();
  for (const entry of entries) {
    const value = key(entry);
    if (!value) continue;
    tally.set(value, (tally.get(value) ?? 0) + 1);
  }
  return [...tally.entries()]
    .sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]))
    .map(([value]) => value);
}

/**
 * The body classes the data actually carries, rather than a hardcoded list.
 *
 * The Swift original closes this to Light/Medium/Full, on the grounds that the
 * data holds exactly those three and a fourth chip would be a dead end. The web
 * `GrapeBodyClass` type is wider (it also allows Light-Medium and Medium-Full),
 * so deriving from the data keeps the same guarantee — every chip offered has
 * grapes behind it — without betting on which of the five are populated.
 */
export const bodyClassesInData = (entries: WineEntry[]): string[] =>
  counted(entries.filter(isGrapeEntry), e => (isGrapeEntry(e) ? e.grapeBodyClass : undefined));

export const countriesInData = (entries: WineEntry[]): string[] =>
  counted(entries.filter(isGrapeEntry), e => (isGrapeEntry(e) ? e.grapeCountryOfOrigin : undefined))
    .sort((a, b) => a.localeCompare(b));

/** The flavour classes present in the data, in descending size. */
export const flavorClasses = (entries: WineEntry[]): string[] =>
  counted(entries, e => (isFlavorEntry(e) ? e.details.classification : undefined));

/** Flavour entries under one class, for the scanner's flavour tiles. */
export function flavorsInClass(entries: WineEntry[], classification: string): WineEntry[] {
  return entries
    .filter(e => isFlavorEntry(e) && normalizeLabel(e.details.classification ?? '') === normalizeLabel(classification))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
