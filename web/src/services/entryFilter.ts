import { WineEntry, EntryCategory, isGrapeEntry, isRegionEntry, isStyleEntry } from '@/shared/types';
import { getColorType, normalizeLabel } from '@/shared/services/entryUtils';
import { getGrapeBodyFilterValue, getGrapeColorLabel, getGrapeBodyLabel } from './grapeDisplay';

/**
 * The listing predicate: category scoping, the search bar, and the nine filter
 * modes the scan screens navigate with.
 *
 * Extracted from `EncyclopediaList.tsx`, where it was a ~120-line `useMemo`
 * closing over eight component locals. iOS keeps the same logic in
 * `vinodex-ios/Sources/VinodexCore/EntryFilter.swift` — a core module with its
 * own test suite — while the web had it inside a view, which is why
 * `FilterTests.swift` says it "exercises the ported EncyclopediaList.tsx filter
 * predicate" and yet nothing on this side could run those cases. Moving it here
 * is what makes them portable; the component now calls `filterEntries` and
 * keeps only the input state.
 *
 * The extraction is behaviour-preserving with one deliberate exception, marked
 * below: the search bar is now diacritic-insensitive, which it was not.
 */

export type FilterMode =
  | 'REGION'
  | 'TYPE'
  | 'TASTING'
  | 'SOIL'
  | 'ORIGIN'
  | 'STATE'
  | 'RARITY'
  | 'SYSTEM'
  | 'CLIMATE'
  | null;

export interface EntryQuery {
  category: EntryCategory;
  filterMode?: FilterMode;
  filterValue?: string | string[] | null;
  search?: string;
}

/** The states the USA gate opens onto; also the set a STATE row is allowed from. */
export const US_STATES = ['California', 'New York', 'Oregon', 'Virginia', 'Washington'];

/** Appellation systems per country, for the synthesised country rows. */
const COUNTRY_SYSTEMS: Record<string, string[]> = {
  France: ['AOC', 'IGP'],
  Italy: ['DOC', 'DOCG', 'IGT'],
  Spain: ['DO', 'DOCa'],
  Germany: ['QbA', 'GG'],
  Portugal: ['DOC', 'VR'],
  Hungary: ['PDO', 'PGI'],
  Austria: ['DAC'],
  Greece: ['PDO', 'PGI'],
  USA: ['AVA'],
  Canada: ['VQA'],
  Argentina: ['DOC'],
  Chile: ['DO'],
  Uruguay: ['DO'],
  Australia: ['GI'],
  'New Zealand': ['GI'],
  'South Africa': ['WO'],
  China: ['GI'],
  Japan: ['GI'],
  India: ['GI'],
  Georgia: ['PDO'],
};

export const normalizeTerm = (value: string): string =>
  normalizeLabel(value)
    .replace(/[_\-/(),.;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Whole-term match, so "Italy" does not match "Italy-Slovenia border" by prefix. */
export const matchesWholeTerm = (candidate: string, term: string): boolean => {
  const c = normalizeTerm(candidate);
  const t = normalizeTerm(term);
  if (!c || !t) return false;
  if (c === t) return true;
  return ` ${c} `.includes(` ${t} `);
};

/**
 * Substring match for the search bar.
 *
 * THE ONE BEHAVIOURAL CHANGE in this extraction. The inline version compared
 * `.toLowerCase()` on both sides, so "albarino" did not find Albariño and
 * "rias" did not find Rías Baixas — you had to type the accent to reach an
 * entry whose whole distinguishing feature is that it has one. iOS folds
 * diacritics here and `FilterTests.diacritics` asserts exactly those two names,
 * so the web was the odd one out. `normalizeLabel` already lowercases and
 * strips combining marks; it simply was not being applied to the search path.
 */
export const matchesSearchTerm = (candidate: string, term: string): boolean =>
  normalizeLabel(candidate).includes(normalizeLabel(term));

export function matchesGrapeTypeFilter(entry: WineEntry, filter: string): boolean {
  if (!isGrapeEntry(entry)) return false;

  const normalizedFilter = normalizeLabel(filter);
  const legacyType = normalizeLabel(entry.grapeStyle || entry.grapeCard?.style || entry.wineType || '');
  if (legacyType && legacyType === normalizedFilter) return true;

  const grapeColor = normalizeLabel(getGrapeColorLabel(entry));
  if (grapeColor === normalizedFilter) return true;

  const grapeBodyFilter = normalizeLabel(
    getGrapeBodyFilterValue(getGrapeBodyLabel(entry), getGrapeColorLabel(entry)),
  );
  return grapeBodyFilter === normalizedFilter;
}

const detailString = (e: WineEntry, field: string): string | undefined => {
  const v = (e.details as unknown as Record<string, unknown>)[field];
  return typeof v === 'string' ? v : undefined;
};

/**
 * Which categories a listing draws from. MASTER_SEARCH spans everything;
 * WORLD_SEARCH is places only; anything else is itself.
 */
export function allowedCategoriesFor(category: EntryCategory): string[] {
  if (category === 'MASTER_SEARCH') {
    return ['GRAPES', 'REGIONS', 'STYLES', 'FLAVORS', 'COUNTRY_GATE', 'CONTINENTS'];
  }
  if (category === 'WORLD_SEARCH') return ['REGIONS', 'COUNTRY_GATE', 'CONTINENTS'];
  // MASTER_SEARCH is handled above, so `category` is its own effective value.
  return [category];
}

/** Whether a listing shows the search field at all. */
export function showsSearchBar(category: EntryCategory): boolean {
  const effective = category === 'MASTER_SEARCH' ? 'GRAPES' : category;
  return (
    category === 'MASTER_SEARCH' ||
    category === 'WORLD_SEARCH' ||
    effective === 'GRAPES' ||
    effective === 'STYLES' ||
    effective === 'FLAVORS'
  );
}

/**
 * The country rows behind the USA gate and the continent country lists.
 *
 * Synthesised rather than looked up: these are navigation affordances, not
 * dataset entries, and giving them ids keeps `EntryTile` able to render them
 * like anything else.
 */
function countryRows(names: string[]): WineEntry[] {
  return names.map((ct, idx) => ({
    id: `CT-${idx}`,
    name: ct,
    description: `Regions within ${ct}`,
    category: 'COUNTRY_GATE',
    tags: COUNTRY_SYSTEMS[ct] || ['SYSTEM'],
    color: '#0ea5e9',
    icon: 'flag',
    details: { origin: ct },
  })) as WineEntry[];
}

export function filterEntries(entries: WineEntry[], query: EntryQuery): WineEntry[] {
  const { category, filterMode = null, filterValue = null, search = '' } = query;

  if (category === 'COUNTRY_GATE') {
    const items = Array.isArray(filterValue) ? (filterValue as string[]) : [];
    if (filterMode === 'STATE') {
      return entries
        .filter(
          entry =>
            entry.category === 'COUNTRY_GATE' &&
            entry.details.classification?.toUpperCase() === 'STATE' &&
            items.includes(entry.name),
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return countryRows(items);
  }

  const effectiveCategory = category === 'MASTER_SEARCH' ? 'GRAPES' : category;
  const allowedCategories = allowedCategoriesFor(category);
  const searchApplies = showsSearchBar(category);

  return entries
    .filter(e => {
      // 1. Category
      const matchesCategory =
        allowedCategories.includes(e.category) &&
        !(
          e.category === 'COUNTRY_GATE' &&
          e.details.classification?.toUpperCase() === 'STATE' &&
          !US_STATES.includes(e.name)
        );

      const bag = e.details as {
        origin?: string;
        state?: string;
        classification?: string;
        keyRegions?: string[];
        synonyms?: string[];
      };

      // 2. Search
      const matchesSearch =
        !searchApplies ||
        matchesSearchTerm(e.name, search) ||
        matchesSearchTerm(e.description, search) ||
        matchesSearchTerm(bag.origin || '', search) ||
        matchesSearchTerm(bag.state || '', search) ||
        matchesSearchTerm(bag.classification || '', search) ||
        (bag.keyRegions || []).some(r => matchesSearchTerm(r, search)) ||
        (bag.synonyms || []).some(s => matchesSearchTerm(s, search)) ||
        e.tags.some(t => matchesSearchTerm(t, search));

      // 3. The active scan filter
      let matchesFilter = true;

      const eOrigin = detailString(e, 'origin');
      const eClassification = detailString(e, 'classification');
      const eSoilType = detailString(e, 'soilType');
      const eState = detailString(e, 'state');
      const eGrape = isGrapeEntry(e) ? e : null;
      const eStyle = isStyleEntry(e) ? e : null;
      const eRegion = isRegionEntry(e) ? e : null;
      const eTastingProfile = eGrape?.tastingProfile ?? eStyle?.tastingProfile;
      const eRarity = eGrape
        ? eGrape.rarity || eGrape.grapeRarityTier?.toUpperCase() || eGrape.grapeCard?.rarityTier?.toUpperCase()
        : eStyle
          ? eStyle.rarity
          : undefined;
      const eClimate = eRegion?.climate;

      if (filterMode === 'REGION' && Array.isArray(filterValue)) {
        matchesFilter = (filterValue as string[]).some(
          keyword =>
            (!!eOrigin && eOrigin.toLowerCase().includes(keyword.toLowerCase())) ||
            e.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase())) ||
            e.name.toLowerCase().includes(keyword.toLowerCase()),
        );
      } else if (filterMode === 'TYPE' && typeof filterValue === 'string') {
        const grapeStyleSource = isGrapeEntry(e) ? e.grapeStyle || e.grapeCard?.style || e.wineType : undefined;
        const typeMatch =
          matchesGrapeTypeFilter(e, filterValue) ||
          (!!grapeStyleSource && normalizeLabel(grapeStyleSource) === normalizeLabel(filterValue));
        const styleColorMatch =
          effectiveCategory === 'STYLES' && normalizeLabel(getColorType(e.name)) === normalizeLabel(filterValue);
        matchesFilter = typeMatch || styleColorMatch;
      } else if (filterMode === 'TASTING' && typeof filterValue === 'string') {
        matchesFilter =
          (!!eTastingProfile && eTastingProfile.some(n => n.note.toLowerCase() === filterValue.toLowerCase())) ||
          (!!eClassification && eClassification.toLowerCase() === filterValue.toLowerCase());
      } else if (filterMode === 'SOIL' && typeof filterValue === 'string') {
        matchesFilter = !!eSoilType && eSoilType.toLowerCase().includes(filterValue.toLowerCase());
      } else if (filterMode === 'ORIGIN' && typeof filterValue === 'string') {
        matchesFilter =
          (!!eOrigin && matchesWholeTerm(eOrigin, filterValue)) ||
          e.tags.some(t => matchesWholeTerm(t, filterValue));
      } else if (filterMode === 'STATE' && typeof filterValue === 'string') {
        matchesFilter = (eOrigin || '').toUpperCase() === 'USA' && eState === filterValue;
      } else if (filterMode === 'SYSTEM' && typeof filterValue === 'string') {
        matchesFilter = !!eClassification && eClassification.toLowerCase() === filterValue.toLowerCase();
      } else if (filterMode === 'RARITY' && typeof filterValue === 'string') {
        matchesFilter = eRarity === filterValue;
      } else if (filterMode === 'CLIMATE' && typeof filterValue === 'string') {
        matchesFilter = !!eClimate && eClimate.toLowerCase() === filterValue.toLowerCase();
      }

      return matchesCategory && matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Cross-link resolution by name, case- and diacritic-insensitively.
 *
 * Ported from `WineDatabase.entry(named:)`. A name with no entry returns
 * undefined rather than a near-match, so the detail screen renders it as a
 * plain label instead of a dead button.
 */
export function entryNamed(
  entries: WineEntry[],
  name: string,
  category?: EntryCategory,
): WineEntry | undefined {
  const key = normalizeLabel(name).trim();
  if (!key) return undefined;
  return entries.find(
    e => normalizeLabel(e.name).trim() === key && (!category || e.category === category),
  );
}
