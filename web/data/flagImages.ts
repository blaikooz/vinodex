/**
 * The flag art lookup. Since v0.6.54 every served flag is first-party: the
 * 81 PNGs in `shared/pixelflags/FirstParty/`, drawn in code by the master
 * `HGapps/scripts/generate-flag-art.py` (the extension of the iOS
 * generator's 34) from official construction sheets — same 32x18 canvas and
 * slugs as the iOS bundle's set. The R74n PixelFlags copies remain in the
 * mirror's continent folders under their own license but are no longer
 * imported, so the bundle ships none of them.
 *
 * `georgia` is the country; the US state is `georgia-state`, surfaced under
 * the plain 'georgia' key only for state-page lookups (see the ambiguity
 * guard in getFlagImage) — under R74n's set the exact-match phase handed the
 * country Georgia page the state flag.
 */

interface FlagImageEntry {
  keys: string[];
  image: string;
}

interface FlagImageOptions {
  preferUsState?: boolean;
}

const normalizeFlagKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Uses the `@/` alias (repo root), like the R74n glob before it. ~300 bytes
// each, so Vite inlines them as base64 rather than emitting files — check
// the bundle, not the asset list (the 0.6.5 lesson).
const FIRSTPARTY_MODULES = import.meta.glob('@/shared/pixelflags/FirstParty/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const bySlug = new Map<string, string>();
Object.entries(FIRSTPARTY_MODULES).forEach(([path, image]) => {
  const slug = path.match(/FirstParty\/([^/]+)\.png$/)?.[1];
  if (slug) bySlug.set(slug, image);
});

const US_STATE_SLUGS = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
  'connecticut', 'delaware', 'florida', 'georgia-state', 'hawaii', 'idaho',
  'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine',
  'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi',
  'missouri', 'montana', 'nebraska', 'nevada', 'new-hampshire', 'new-jersey',
  'new-mexico', 'new-york', 'north-carolina', 'north-dakota', 'ohio',
  'oklahoma', 'oregon', 'pennsylvania', 'rhode-island', 'south-carolina',
  'south-dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia',
  'washington', 'west-virginia', 'wisconsin', 'wyoming',
];

const US_STATE_FLAG_IMAGES: FlagImageEntry[] = US_STATE_SLUGS.flatMap((slug) => {
  const image = bySlug.get(slug);
  if (!image) return [];
  const key = (slug === 'georgia-state' ? 'georgia' : slug).replace(/-/g, ' ');
  return [{ keys: [key], image }];
});

// A US state name that is also a country in the catalogue: exact matches
// resolve it to the state only when the caller asked state-first.
const AMBIGUOUS_STATE_KEYS = new Set(['georgia']);

const COUNTRY_FLAG_SLUGS: Array<[slug: string, keys: string[]]> = [
  ['argentina', ['argentina']],
  ['australia', ['australia']],
  ['austria', ['austria']],
  ['brazil', ['brazil']],
  ['bulgaria', ['bulgaria']],
  ['canada', ['canada']],
  ['chile', ['chile']],
  ['china', ['china']],
  ['croatia', ['croatia']],
  ['france', ['france']],
  ['georgia', ['georgia']],
  ['germany', ['germany']],
  ['greece', ['greece']],
  ['hungary', ['hungary']],
  ['india', ['india']],
  ['italy', ['italy']],
  ['japan', ['japan']],
  ['lebanon', ['lebanon']],
  ['mexico', ['mexico']],
  ['morocco', ['morocco']],
  ['new-zealand', ['new zealand', 'new_zealand']],
  ['portugal', ['portugal']],
  ['romania', ['romania']],
  ['slovenia', ['slovenia']],
  ['south-africa', ['south africa', 'south_africa']],
  ['spain', ['spain']],
  ['switzerland', ['switzerland']],
  ['united-kingdom', ['united kingdom', 'united_kingdom', 'uk']],
  ['uruguay', ['uruguay']],
  ['usa', ['united states', 'usa', 'us']],
  ['various', ['various']],
];

const FLAG_IMAGES: FlagImageEntry[] = COUNTRY_FLAG_SLUGS.flatMap(([slug, keys]) => {
  const image = bySlug.get(slug);
  return image ? [{ keys, image }] : [];
});

const matchesNormalizedKey = (normalizedOrigin: string, key: string) => {
  const normalizedKey = normalizeFlagKey(key);
  if (normalizedOrigin === normalizedKey) return true;
  return normalizedOrigin.includes(` ${normalizedKey} `)
    || normalizedOrigin.startsWith(`${normalizedKey} `)
    || normalizedOrigin.endsWith(` ${normalizedKey}`);
};

export const getFlagImage = (origin?: string, options?: FlagImageOptions) => {
  if (!origin) return undefined;
  const normalizedOrigin = normalizeFlagKey(origin);

  // A US state named outright is always the state, whoever asks: with
  // 'mexico' in the country list (0.6.38), the word-boundary matcher would
  // otherwise hand "New Mexico" the Mexican tricolour. Exact equality only --
  // `preferUsState` below stays the switch for looser, state-first matching.
  // Names that are both a state and a country (Georgia) stay the country
  // unless the caller asked state-first.
  const exactState = US_STATE_FLAG_IMAGES.find(({ keys }) => keys.some((key) => {
    const normalizedKey = normalizeFlagKey(key);
    if (normalizedKey !== normalizedOrigin) return false;
    return options?.preferUsState || !AMBIGUOUS_STATE_KEYS.has(normalizedKey);
  }));
  if (exactState) return exactState.image;

  if (options?.preferUsState) {
    const usStateMatch = US_STATE_FLAG_IMAGES.find(({ keys }) => keys.some((key) => matchesNormalizedKey(normalizedOrigin, key)));
    if (usStateMatch) return usStateMatch.image;
  }

  const match = FLAG_IMAGES.find(({ keys }) => keys.some((key) => matchesNormalizedKey(normalizedOrigin, key)));
  return match?.image;
};
