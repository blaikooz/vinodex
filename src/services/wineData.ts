import { GrapeCard, GrapeEntry, WineEntry, isGrapeEntry } from '../../types';
import { WINE_ENTRIES } from '../../constants';

let cachedEntries: WineEntry[] | null = null;
let inFlight: Promise<WineEntry[]> | null = null;

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
 * Synchronously return the canonicalized wine entries. The first call performs
 * canonicalization; subsequent calls return the cached array.
 */
export function getAllEntries(): WineEntry[] {
  if (!cachedEntries) {
    cachedEntries = canonicalizeEntries(WINE_ENTRIES);
  }
  return cachedEntries;
}

/**
 * Async wrapper around {@link getAllEntries}. Kept so existing async call sites
 * (e.g. EncyclopediaList) don't have to change.
 */
export async function loadAllEntries(): Promise<WineEntry[]> {
  if (cachedEntries) return cachedEntries;
  if (inFlight) return inFlight;

  inFlight = Promise.resolve().then(() => getAllEntries()).finally(() => {
    inFlight = null;
  });

  return inFlight;
}

export function findEntryById(id: string): WineEntry | undefined {
  return getAllEntries().find((entry) => entry.id === id);
}
