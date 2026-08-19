import {
  WineEntry,
  isFlavorEntry,
  isGrapeEntry,
  isRegionEntry,
  isStyleEntry,
} from '@/shared/types';
import { entryOrigin } from './entryOrigin';
import { normalizeLabel, getStyleClassType, getStyleColorType } from '@/shared/services/entryUtils';
import { shelfIds } from './bookmarks';

/**
 * The faceted database filter, ported from
 * `vinodex-ios/Sources/VinodexCore/ChipFilter.swift`.
 *
 * OR within a facet, AND across facets. An entry that cannot carry a selected
 * facet fails it (picking a COLOUR chip drops every non-grape — intentional).
 * The model is a plain map of facet → chosen values; the screen holds it in
 * state and persists it through the screen-state store for Back survival.
 */

export type ChipFacet =
  | 'category' | 'color' | 'body' | 'grapeStyle' | 'rarity' | 'climate' | 'country'
  | 'styleClass' | 'styleColor' | 'flavorClass' | 'flavorSubclass' | 'shelf';
export const CHIP_FACETS: ChipFacet[] = [
  'category', 'color', 'body', 'grapeStyle', 'rarity', 'climate', 'country',
  'styleClass', 'styleColor', 'flavorClass', 'flavorSubclass', 'shelf',
];

export const FACET_TITLE: Record<ChipFacet, string> = {
  category: 'TYPE',
  color: 'COLOUR',
  body: 'BODY',
  grapeStyle: 'STYLE',
  rarity: 'RARITY',
  climate: 'CLIMATE',
  country: 'COUNTRY',
  styleClass: 'STYLE CLASS',
  styleColor: 'IN THE GLASS',
  flavorClass: 'TASTE',
  flavorSubclass: 'FLAVOUR FAMILY',
  shelf: 'SHELF',
};
export const FACET_NOTE: Record<ChipFacet, string> = {
  category: 'Which tables to search.',
  color: 'Grapes only — everything else drops out.',
  body: 'Grapes only.',
  grapeStyle: 'Grapes only — the kind of wine the grape makes.',
  rarity: 'Grapes and styles carry a rarity.',
  climate: 'Regions only.',
  country: 'Anything with an origin — flavors drop out.',
  styleClass: 'Styles only — how the style is defined.',
  styleColor: 'Styles only — the colour in the glass.',
  flavorClass: 'Flavours only — the basic taste.',
  flavorSubclass: 'Flavours only — the flavour family.',
  shelf: 'Your own three shelves — filters on what you have collected.',
};

/**
 * Shelf membership is the one facet that is not a property of the catalogue —
 * it is a fact about the player, held in the bookmark store. iOS threads the
 * membership into `matches` as a parameter (0.8.91, B1); the web mirrors that
 * with a snapshot so a match sweep reads the shelves once, not once per entry.
 */
export interface ShelfSnapshot {
  saved: Set<string>;
  wantToTry: Set<string>;
  tried: Set<string>;
}
export function shelfSnapshot(): ShelfSnapshot {
  return {
    saved: new Set(shelfIds('saved')),
    wantToTry: new Set(shelfIds('wantToTry')),
    tried: new Set(shelfIds('tried')),
  };
}

/** The synthetic category chip that surfaces country pages (never matches an entry). */
export const COUNTRIES_VALUE = 'COUNTRIES';

export interface ChipOption {
  facet: ChipFacet;
  value: string; // stored/compared
  label: string; // displayed
}

export type ChipFilter = Partial<Record<ChipFacet, string[]>>;

const label = normalizeLabel;

// `entryOrigin` is imported — one accessor for the whole app since L1. This
// module's copy used `||` where the pre-narrowing code used `??`, which is a
// different function on an empty-string field.

/** RARITY is declared on GRAPES and STYLES and nowhere else. */
const entryRarity = (e: WineEntry): string | undefined =>
  (isGrapeEntry(e) || isStyleEntry(e)) && e.rarity != null ? String(e.rarity) : undefined;

/** CLIMATE is a REGIONS field. */
const entryClimate = (e: WineEntry): string | undefined =>
  isRegionEntry(e) && e.climate != null ? String(e.climate) : undefined;

/**
 * A `ChipFilter` read back from session storage (W15).
 *
 * Returns `{}` rather than null on anything unrecognised - an empty filter is
 * this type's own identity value and is what a fresh screen starts from, so
 * there is no second "absent" state for a caller to handle. Unknown facets and
 * non-string values are dropped individually rather than failing the whole
 * object: a filter is a bag of independent choices, and losing one stale facet
 * is better than losing the four the user still wants.
 */
export function parseFilter(raw: string | null | undefined): ChipFilter {
  if (!raw) return {};
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return {};
  const o = v as Record<string, unknown>;
  const out: ChipFilter = {};
  for (const facet of CHIP_FACETS) {
    const chosen = o[facet];
    if (!Array.isArray(chosen)) continue;
    const values = chosen.filter((x): x is string => typeof x === 'string');
    if (values.length > 0) out[facet] = values;
  }
  return out;
}

// --- model ops (pure) -------------------------------------------------------
export function isOn(filter: ChipFilter, o: ChipOption): boolean {
  return (filter[o.facet] ?? []).includes(o.value);
}

export function toggleOption(filter: ChipFilter, o: ChipOption): ChipFilter {
  const next: ChipFilter = { ...filter };
  const set = new Set(next[o.facet] ?? []);
  if (set.has(o.value)) set.delete(o.value);
  else set.add(o.value);
  if (set.size === 0) delete next[o.facet];
  else next[o.facet] = Array.from(set);
  return next;
}

export function filterCount(filter: ChipFilter): number {
  return CHIP_FACETS.reduce((n, f) => n + (filter[f]?.length ?? 0), 0);
}
export function filterIsEmpty(filter: ChipFilter): boolean {
  return filterCount(filter) === 0;
}
export function includesCountries(filter: ChipFilter): boolean {
  return (filter.category ?? []).includes(COUNTRIES_VALUE);
}

// --- matching ---------------------------------------------------------------
function satisfies(entry: WineEntry, facet: ChipFacet, chosen: string[], snap: ShelfSnapshot): boolean {
  switch (facet) {
    case 'category':
      return chosen.includes(entry.category);
    case 'color':
      return isGrapeEntry(entry) && chosen.includes(entry.grapeType ?? '');
    case 'body': {
      if (!isGrapeEntry(entry)) return false;
      const b = label(entry.grapeBodyClass ?? '');
      return chosen.some(v => label(v) === b);
    }
    case 'grapeStyle':
      return isGrapeEntry(entry) && chosen.includes(entry.grapeStyle ?? '');
    case 'rarity': {
      const r = entryRarity(entry);
      return r != null && chosen.includes(r);
    }
    case 'climate': {
      const c = entryClimate(entry);
      return c != null && chosen.includes(c);
    }
    case 'country': {
      const o = entryOrigin(entry);
      if (o === '') return false;
      const ok = label(o);
      return chosen.some(v => label(v) === ok);
    }
    case 'styleClass':
      return isStyleEntry(entry) && chosen.includes(getStyleClassType(entry.name, entry.details.classification));
    case 'styleColor':
      return isStyleEntry(entry) && chosen.includes(getStyleColorType(entry.name));
    case 'flavorClass':
      return isFlavorEntry(entry) && chosen.includes(entry.details.classification ?? '');
    case 'flavorSubclass':
      return isFlavorEntry(entry) && chosen.includes(entry.details.subclass ?? '');
    case 'shelf':
      return chosen.some(s => snap[s as keyof ShelfSnapshot]?.has(entry.id) ?? false);
  }
}

/**
 * `shelfSnapshot()`, so the three entry points agree (L4). They disagreed:
 * this one defaulted to an empty snapshot while `matchingEntries` and
 * `countWithChip` defaulted to a live read, so calling `matches` directly
 * silently answered "on no shelf" for every entry and the SHELF facet
 * matched nothing. Every caller in the app passes a snapshot explicitly; the
 * default is what a new caller inherits, and it should be the truthful one.
 * (The empty-snapshot constant went with the disagreement.)
 */
export function matches(filter: ChipFilter, entry: WineEntry, snap: ShelfSnapshot = shelfSnapshot()): boolean {
  for (const facet of CHIP_FACETS) {
    const chosen = filter[facet];
    if (!chosen || chosen.length === 0) continue;
    if (!satisfies(entry, facet, chosen, snap)) return false;
  }
  return true;
}

/** Entries matching the filter, sorted by name (case-insensitive). */
export function matchingEntries(filter: ChipFilter, all: WineEntry[], snap: ShelfSnapshot = shelfSnapshot()): WineEntry[] {
  return all.filter(e => matches(filter, e, snap)).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}

/** The result count the filter WOULD produce if this chip were toggled. */
export function countWithChip(filter: ChipFilter, o: ChipOption, all: WineEntry[], snap: ShelfSnapshot = shelfSnapshot()): number {
  const toggled = toggleOption(filter, o);
  return all.reduce((n, e) => n + (matches(toggled, e, snap) ? 1 : 0), 0);
}

// --- option lists (derived from the dataset) --------------------------------
const RARITY_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'NOBLE', 'GODFORSAKEN'];
const CATEGORY_ORDER = ['GRAPES', 'REGIONS', 'STYLES', 'FLAVORS', 'CONTINENTS'];
const GRAPE_STYLE_ORDER = [
  'Light-Body Red', 'Medium-Body Red', 'Full-Body Red', 'Sparkling Red',
  'Light-Body White', 'Medium-Body White', 'Full-Body White', 'Aromatic White', 'Sweet White',
];
const STYLE_CLASS_ORDER = ['ORIGIN', 'METHOD', 'TYPE', 'BLEND', 'STYLE'];
const STYLE_COLOR_ORDER = ['RED', 'WHITE', 'ROSE', 'ORANGE', 'DUAL'];
const FLAVOR_CLASS_ORDER = ['SWEET', 'SOUR', 'SALTY', 'BITTER', 'UMAMI'];

/** Distinct values a projection yields over the dataset, kept in a fixed order (extras appended, alpha). */
function orderedPresent(all: WineEntry[], project: (e: WineEntry) => string | undefined, order: string[]): string[] {
  const present = new Set<string>();
  for (const e of all) {
    const v = project(e);
    if (v) present.add(v);
  }
  const ranked = order.filter(v => present.has(v));
  const rest = Array.from(present).filter(v => !order.includes(v)).sort();
  return [...ranked, ...rest];
}

export function searchableCountries(all: WineEntry[]): string[] {
  const seen = new Map<string, string>();
  for (const e of all) {
    const o = entryOrigin(e);
    if (o) {
      const k = label(o);
      if (!seen.has(k)) seen.set(k, o);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export function facetOptions(facet: ChipFacet, all: WineEntry[]): ChipOption[] {
  const opt = (value: string, lbl: string): ChipOption => ({ facet, value, label: lbl });
  switch (facet) {
    case 'category': {
      const present = new Set<string>(all.map(e => e.category));
      const cats = CATEGORY_ORDER.filter(c => present.has(c));
      return [...cats.map(c => opt(c, c)), opt(COUNTRIES_VALUE, 'COUNTRIES')];
    }
    case 'color':
      return [opt('red', 'RED'), opt('white', 'WHITE')];
    case 'body': {
      const seen = new Map<string, string>();
      for (const e of all) {
        if (isGrapeEntry(e)) {
          const b = e.grapeBodyClass ?? '';
          if (b) seen.set(label(b), b);
        }
      }
      return Array.from(seen.values())
        .sort((a, b) => a.localeCompare(b))
        .map(b => opt(b, b.toUpperCase()));
    }
    case 'rarity': {
      const present = new Set<string>();
      for (const e of all) {
        const r = entryRarity(e);
        if (r) present.add(r);
      }
      return RARITY_ORDER.filter(r => present.has(r)).map(r => opt(r, r));
    }
    case 'climate': {
      const present = new Set<string>();
      for (const e of all) {
        const c = entryClimate(e);
        if (c) present.add(c);
      }
      return Array.from(present)
        .sort()
        .map(c => opt(c, c.toUpperCase()));
    }
    case 'country':
      return searchableCountries(all).map(c => opt(c, c.toUpperCase()));
    case 'grapeStyle':
      return orderedPresent(all, e => (e.category === 'GRAPES' ? String(e.grapeStyle ?? '') : ''), GRAPE_STYLE_ORDER)
        .map(v => opt(v, v.toUpperCase()));
    case 'styleClass':
      return orderedPresent(all, e => (e.category === 'STYLES' ? getStyleClassType(e.name, e.details?.classification) : ''), STYLE_CLASS_ORDER)
        .map(v => opt(v, v));
    case 'styleColor':
      return orderedPresent(all, e => (e.category === 'STYLES' ? getStyleColorType(e.name) : ''), STYLE_COLOR_ORDER)
        .map(v => opt(v, v));
    case 'flavorClass':
      return orderedPresent(all, e => (e.category === 'FLAVORS' ? String(e.details?.classification ?? '') : ''), FLAVOR_CLASS_ORDER)
        .map(v => opt(v, v));
    case 'flavorSubclass':
      return orderedPresent(all, e => (e.category === 'FLAVORS' ? String(e.details?.subclass ?? '') : ''), [])
        .map(v => opt(v, v.replace(/_/g, ' ')));
    case 'shelf':
      return [opt('saved', 'SAVED'), opt('wantToTry', 'WANTED'), opt('tried', 'TRIED')];
  }
}
