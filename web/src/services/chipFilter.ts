import { WineEntry } from '@/shared/types';
import { normalizeLabel } from '@/shared/services/entryUtils';

/**
 * The faceted database filter, ported from
 * `vinodex-ios/Sources/VinodexCore/ChipFilter.swift`.
 *
 * OR within a facet, AND across facets. An entry that cannot carry a selected
 * facet fails it (picking a COLOUR chip drops every non-grape — intentional).
 * The model is a plain map of facet → chosen values; the screen holds it in
 * state and persists it through the screen-state store for Back survival.
 */

export type ChipFacet = 'category' | 'color' | 'body' | 'rarity' | 'climate' | 'country';
export const CHIP_FACETS: ChipFacet[] = ['category', 'color', 'body', 'rarity', 'climate', 'country'];

export const FACET_TITLE: Record<ChipFacet, string> = {
  category: 'TYPE',
  color: 'COLOUR',
  body: 'BODY',
  rarity: 'RARITY',
  climate: 'CLIMATE',
  country: 'COUNTRY',
};
export const FACET_NOTE: Record<ChipFacet, string> = {
  category: 'Which tables to search.',
  color: 'Grapes only — everything else drops out.',
  body: 'Grapes only.',
  rarity: 'Grapes and styles carry a rarity.',
  climate: 'Regions only.',
  country: 'Anything with an origin — flavors drop out.',
};

/** The synthetic category chip that surfaces country pages (never matches an entry). */
export const COUNTRIES_VALUE = 'COUNTRIES';

export interface ChipOption {
  facet: ChipFacet;
  value: string; // stored/compared
  label: string; // displayed
}

export type ChipFilter = Partial<Record<ChipFacet, string[]>>;

const label = normalizeLabel;

const entryOrigin = (e: any): string => String(e.grapeCountryOfOrigin ?? e.details?.origin ?? '');

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
function satisfies(entry: WineEntry, facet: ChipFacet, chosen: string[]): boolean {
  const e = entry as any;
  switch (facet) {
    case 'category':
      return chosen.includes(entry.category);
    case 'color':
      return entry.category === 'GRAPES' && chosen.includes(String(e.grapeType ?? ''));
    case 'body': {
      if (entry.category !== 'GRAPES') return false;
      const b = label(String(e.grapeBodyClass ?? ''));
      return chosen.some(v => label(v) === b);
    }
    case 'rarity':
      return e.rarity != null && chosen.includes(String(e.rarity));
    case 'climate':
      return e.climate != null && chosen.includes(String(e.climate));
    case 'country': {
      const o = entryOrigin(e);
      if (o === '') return false;
      const ok = label(o);
      return chosen.some(v => label(v) === ok);
    }
  }
}

export function matches(filter: ChipFilter, entry: WineEntry): boolean {
  for (const facet of CHIP_FACETS) {
    const chosen = filter[facet];
    if (!chosen || chosen.length === 0) continue;
    if (!satisfies(entry, facet, chosen)) return false;
  }
  return true;
}

/** Entries matching the filter, sorted by name (case-insensitive). */
export function matchingEntries(filter: ChipFilter, all: WineEntry[]): WineEntry[] {
  return all.filter(e => matches(filter, e)).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}

/** The result count the filter WOULD produce if this chip were toggled. */
export function countWithChip(filter: ChipFilter, o: ChipOption, all: WineEntry[]): number {
  const toggled = toggleOption(filter, o);
  return all.reduce((n, e) => n + (matches(toggled, e) ? 1 : 0), 0);
}

// --- option lists (derived from the dataset) --------------------------------
const RARITY_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'NOBLE', 'GODFORSAKEN'];
const CATEGORY_ORDER = ['GRAPES', 'REGIONS', 'STYLES', 'FLAVORS', 'CONTINENTS'];

export function searchableCountries(all: WineEntry[]): string[] {
  const seen = new Map<string, string>();
  for (const e of all) {
    const o = entryOrigin(e as any);
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
      const present = new Set(all.map(e => e.category));
      const cats = CATEGORY_ORDER.filter(c => present.has(c as any));
      return [...cats.map(c => opt(c, c)), opt(COUNTRIES_VALUE, 'COUNTRIES')];
    }
    case 'color':
      return [opt('red', 'RED'), opt('white', 'WHITE')];
    case 'body': {
      const seen = new Map<string, string>();
      for (const e of all) {
        if (e.category === 'GRAPES') {
          const b = String((e as any).grapeBodyClass ?? '');
          if (b) seen.set(label(b), b);
        }
      }
      return Array.from(seen.values())
        .sort((a, b) => a.localeCompare(b))
        .map(b => opt(b, b.toUpperCase()));
    }
    case 'rarity': {
      const present = new Set<string>();
      for (const e of all) if ((e as any).rarity) present.add(String((e as any).rarity));
      return RARITY_ORDER.filter(r => present.has(r)).map(r => opt(r, r));
    }
    case 'climate': {
      const present = new Set<string>();
      for (const e of all) if ((e as any).climate) present.add(String((e as any).climate));
      return Array.from(present)
        .sort()
        .map(c => opt(c, c.toUpperCase()));
    }
    case 'country':
      return searchableCountries(all).map(c => opt(c, c.toUpperCase()));
  }
}
