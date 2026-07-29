import { WineEntry } from '@/shared/types';
import { normalizeLabel } from '@/shared/services/entryUtils';

/**
 * The six continents, and where their globe markers are pinned.
 *
 * Ported from the `Continent` enum in
 * `vinodex-ios/Sources/VinodexCore/WineDatabase.swift`, which fixed a bug that
 * originated here and names this file while doing it:
 *
 * > These are continent centroids, not wine regions. The values ported from
 * > `RetroGlobeScreen.tsx` were the latter — North America sat on San
 * > Francisco, Africa on Cape Town, South America on Santiago — so markers hung
 * > off the edge of the landmass they label, and no uniform nudge could fix
 * > them because each was wrong by a different amount.
 *
 * The web was still pinning North America to (38, -122) — San Francisco — and
 * Africa to (-33, 20) — Cape Town. These are iOS's corrected values.
 *
 * Four carry a deliberate offset *from* the true centroid. The marker label is
 * a box centred on its point, so a centroid-accurate pin puts half the box over
 * the landmass's northern half; biasing south and away from the limb the
 * continent trails toward seats the box on the body of the landmass instead of
 * across its top edge. Those offsets were judged on the iOS device against its
 * own label geometry — the web's renderer is not identical, so they are a much
 * better starting point than city coordinates rather than a final answer.
 */

export type ContinentKey =
  | 'NORTH_AMERICA'
  | 'SOUTH_AMERICA'
  | 'EUROPE'
  | 'AFRICA'
  | 'ASIA'
  | 'OCEANIA';

export const CONTINENT_KEYS: ContinentKey[] = [
  'NORTH_AMERICA',
  'SOUTH_AMERICA',
  'EUROPE',
  'AFRICA',
  'ASIA',
  'OCEANIA',
];

export interface LatLng {
  lat: number;
  lng: number;
}

/** Where each marker is pinned. Commented values are the true centroid. */
export const CONTINENT_COORDINATES: Record<ContinentKey, LatLng> = {
  NORTH_AMERICA: { lat: 37, lng: -108 }, // down + left, off (45, -100)
  SOUTH_AMERICA: { lat: -23, lng: -68 }, // down + left, off (-15, -60)
  EUROPE: { lat: 50, lng: 15 },
  AFRICA: { lat: -6, lng: 12 }, // down + left, off (2, 20)
  ASIA: { lat: 37, lng: 100 }, // down + right, off (45, 90)
  OCEANIA: { lat: -25, lng: 135 },
};

/**
 * Box each pin must fall inside, so a bad edit is caught by a test rather than
 * by squinting at the globe on a phone. Straight from `coordinateBounds`.
 */
export const CONTINENT_BOUNDS: Record<ContinentKey, { lat: [number, number]; lng: [number, number] }> = {
  NORTH_AMERICA: { lat: [25, 70], lng: [-130, -60] },
  SOUTH_AMERICA: { lat: [-40, 10], lng: [-80, -35] },
  EUROPE: { lat: [40, 65], lng: [-10, 40] },
  AFRICA: { lat: [-30, 30], lng: [-15, 50] },
  ASIA: { lat: [20, 65], lng: [45, 140] },
  OCEANIA: { lat: [-40, -10], lng: [115, 155] },
};

/** The dataset id a continent key resolves to. */
export const continentEntryId = (key: ContinentKey): string => `CONT_${key}`;

export function continentEntry(entries: WineEntry[], key: ContinentKey): WineEntry | undefined {
  return entries.find(e => e.id === continentEntryId(key));
}

/** The countries a continent lists, from its entry's `keyRegions`. */
export function countriesIn(entries: WineEntry[], key: ContinentKey): string[] {
  const entry = continentEntry(entries, key);
  return (entry?.details as { keyRegions?: string[] } | undefined)?.keyRegions ?? [];
}

/**
 * Whether a country has any region in the dataset — what makes its row
 * tappable rather than greyed and inert.
 *
 * Case-insensitive, because continent country lists and region origins are both
 * hand-authored strings.
 */
export function hasRegionsInCountry(entries: WineEntry[], country: string): boolean {
  const key = normalizeLabel(country).trim();
  if (!key) return false;
  return entries.some(
    e =>
      e.category === 'REGIONS' &&
      normalizeLabel((e.details as { origin?: string }).origin ?? '').trim() === key,
  );
}

/** Every region reachable from a continent, through its country list. */
export function regionsIn(entries: WineEntry[], key: ContinentKey): WineEntry[] {
  const countries = new Set(countriesIn(entries, key).map(c => normalizeLabel(c).trim()));
  return entries
    .filter(
      e =>
        e.category === 'REGIONS' &&
        countries.has(normalizeLabel((e.details as { origin?: string }).origin ?? '').trim()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}
