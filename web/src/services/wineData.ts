import { GrapeCard, GrapeEntry, WineEntry, isGrapeEntry } from '@/shared/types';

let cachedEntries: WineEntry[] | null = null;
let inFlight: Promise<WineEntry[]> | null = null;

/// Web port of Swift `WineEntry.isTastable`: only grapes and styles are things
/// you can actually put in a glass, so only they earn a place on the WANT/TRIED
/// shelves. Staged here for the Phase B collection work; keeping it in the web
/// service layer (not shared/types.ts) leaves shared/ a clean mirror of iOS.
export const isTastable = (entry: WineEntry): boolean =>
  entry.category === 'GRAPES' || entry.category === 'STYLES';

const canonicalizeGrapeName = (value: string) =>
  /^syrah\s*\/\s*shiraz$/i.test(value.trim()) ? 'Syrah' : value;

const deriveGrapeCard = (entry: GrapeEntry): GrapeCard => {
  const fallbackCard = entry.grapeCard;
  return {
    id: entry.id,
    name: canonicalizeGrapeName(entry.name),
    type: entry.grapeType,
    style: entry.grapeStyle,
    styleId: fallbackCard?.styleId,
    countryOfOrigin: entry.grapeCountryOfOrigin || entry.details.origin || fallbackCard?.countryOfOrigin || 'Unknown',
    alternateNames: (entry.grapeAlternateNames.length > 0
      ? entry.grapeAlternateNames
      : entry.details.synonyms.length > 0
        ? entry.details.synonyms
        : fallbackCard?.alternateNames || []
    ).map(canonicalizeGrapeName),
    rarityTier: entry.grapeRarityTier || fallbackCard?.rarityTier || 'uncommon',
    evolutionLine: fallbackCard?.evolutionLine,
    signatureMove: fallbackCard?.signatureMove,
    discoveryYear: fallbackCard?.discoveryYear,
    regionAffinity: fallbackCard?.regionAffinity,
    characteristics: entry.grapeCharacteristics,
    tastingProfile: fallbackCard?.tastingProfile || entry.tags || [],
    notableRegions: entry.grapeNotableRegions.length > 0
      ? entry.grapeNotableRegions
      : entry.details.keyRegions.length > 0
        ? entry.details.keyRegions
        : fallbackCard?.notableRegions || [],
    info: entry.description,
  };
};

function canonicalizeEntry<T extends WineEntry>(entry: T): T {
  const next = { ...entry, name: canonicalizeGrapeName(entry.name) };
  const detailsBag = next.details as { notableGrapes?: string[]; synonyms?: string[] };
  const updatedDetails: { notableGrapes?: string[]; synonyms?: string[] } = {};

  if ('notableGrapes' in next.details && detailsBag.notableGrapes) {
    updatedDetails.notableGrapes = detailsBag.notableGrapes.map(canonicalizeGrapeName);
  }
  if ('synonyms' in next.details && detailsBag.synonyms) {
    updatedDetails.synonyms = detailsBag.synonyms.map(canonicalizeGrapeName);
  }

  const merged = {
    ...next,
    details: { ...next.details, ...updatedDetails },
  } as T;

  if (isGrapeEntry(merged)) {
    return {
      ...merged,
      grapeAlternateNames: merged.grapeAlternateNames.map(canonicalizeGrapeName),
      grapeCard: deriveGrapeCard(merged),
    } as T;
  }

  return merged;
}

const canonicalizeEntries = (entries: WineEntry[]) => entries.map(canonicalizeEntry);

/**
 * The canonicalized catalogue, synchronously — **after** {@link loadAllEntries}
 * has resolved once. Every dex screen renders behind that gate (`App` holds
 * the dex routes back until the catalogue is in), so a dex component may call
 * this freely; the throw is for the case the gate was bypassed, and it names
 * the fix rather than returning an empty list that would render as "no data".
 *
 * **Why not just build it here (v0.6.31, Phase 6 LCP).** `@/shared/constants`
 * pulls every grape, region, country and style table -- ~300 KB of source --
 * and a static import put all of it in the first chunk of every route, the
 * studio landing included. The landing never reads an entry. The table now
 * arrives by dynamic import, as its own chunk, only when a dex route asks.
 */
export function getAllEntries(): WineEntry[] {
  if (!cachedEntries) {
    throw new Error('wineData: the catalogue is not loaded yet -- await loadAllEntries() (App gates the dex routes on it) before calling getAllEntries()');
  }
  return cachedEntries;
}

/** The catalogue if it has been loaded, else `null`. Never triggers a load. */
export const peekEntries = (): WineEntry[] | null => cachedEntries;

/**
 * Load the catalogue: one dynamic import of the shared tables, canonicalized
 * once, cached for the life of the page. Concurrent callers share the flight.
 */
export function loadAllEntries(): Promise<WineEntry[]> {
  // Not `async`: an async wrapper would hand every caller its own promise,
  // and "concurrent callers share the flight" is a claim the test checks.
  if (cachedEntries) return Promise.resolve(cachedEntries);
  if (inFlight) return inFlight;

  inFlight = import('@/shared/constants')
    .then(({ buildWineEntries }) => {
      // `buildWineEntries()` replaced the pre-built `WINE_ENTRIES` array in
      // the v0.9.x shared master (iOS selects subsets via `EntrySelection`;
      // the web always wants everything). Built once here -- this module is
      // the cache.
      cachedEntries = canonicalizeEntries(buildWineEntries());
      return cachedEntries;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function findEntryById(id: string): WineEntry | undefined {
  return getAllEntries().find((entry) => entry.id === id);
}
