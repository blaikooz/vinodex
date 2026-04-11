import { GrapeCard, WineEntry } from '../../types';
import { WINE_ENTRIES } from '../../constants';

let cachedEntries: WineEntry[] | null = null;
let inFlight: Promise<WineEntry[]> | null = null;

const canonicalizeGrapeName = (value: string) =>
  /^syrah\s*\/\s*shiraz$/i.test(value.trim()) ? 'Syrah' : value;

const deriveGrapeCard = (entry: WineEntry): GrapeCard | undefined => {
  if (entry.category !== 'GRAPES') return entry.grapeCard;

  const fallbackCard = entry.grapeCard;
  const canonicalType = entry.grapeType || fallbackCard?.type;
  const canonicalStyle = entry.grapeStyle || fallbackCard?.style || entry.wineType;
  const canonicalCharacteristics = entry.grapeCharacteristics || fallbackCard?.characteristics;

  if (!canonicalType || !canonicalStyle || !canonicalCharacteristics) {
    return fallbackCard;
  }

  return {
    id: entry.id,
    name: canonicalizeGrapeName(entry.name),
    type: canonicalType,
    style: canonicalStyle,
    styleId: fallbackCard?.styleId,
    countryOfOrigin: entry.grapeCountryOfOrigin || entry.details.origin || fallbackCard?.countryOfOrigin || 'Unknown',
    alternateNames: (entry.grapeAlternateNames || entry.details.synonyms || fallbackCard?.alternateNames || []).map(canonicalizeGrapeName),
    rarityTier: entry.grapeRarityTier || fallbackCard?.rarityTier || 'uncommon',
    evolutionLine: fallbackCard?.evolutionLine,
    signatureMove: fallbackCard?.signatureMove,
    discoveryYear: fallbackCard?.discoveryYear,
    regionAffinity: fallbackCard?.regionAffinity,
    characteristics: canonicalCharacteristics,
    tastingProfile: fallbackCard?.tastingProfile || entry.tags || [],
    notableRegions: entry.grapeNotableRegions || entry.details.keyRegions || fallbackCard?.notableRegions || [],
    info: entry.description,
  };
};

const canonicalizeEntry = (entry: WineEntry): WineEntry => ({
  ...entry,
  name: canonicalizeGrapeName(entry.name),
  grapeAlternateNames: entry.grapeAlternateNames?.map(canonicalizeGrapeName),
  details: {
    ...entry.details,
    notableGrapes: entry.details.notableGrapes?.map(canonicalizeGrapeName),
    synonyms: entry.details.synonyms?.map(canonicalizeGrapeName),
  },
  grapeCard: deriveGrapeCard(entry),
});

const canonicalizeEntries = (entries: WineEntry[]) => entries.map(canonicalizeEntry);

/**
 * Load all wine entries from the generated dataset. Results are cached in-memory
 * for the lifetime of the session to avoid refetching across components.
 */
export async function loadAllEntries(): Promise<WineEntry[]> {
  if (cachedEntries) return cachedEntries;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const localEntries = canonicalizeEntries(WINE_ENTRIES);
    cachedEntries = localEntries;
    return localEntries;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
