import { EntryCategory, GrapeBodyClass, TastingNote, WineEntry } from './types.ts';
import { GRAPES as LEGACY_GRAPES } from './data/grapes.ts';
import { REGIONS } from './data/regions.ts';
import { STYLES } from './data/styles.ts';
import { GRAPE_CARDS } from './data/grapeCards.ts';
import { CONTINENTS } from './data/continents.ts';
import { COUNTRIES } from './data/countries.ts';
import {
  FLAVOR_CLASS_COLORS,
  categorizeFlavor,
  categorizeFlavorSubclass,
  type FlavorClass,
} from './src/services/entryUtils';

// Re-export individual collections
export { GRAPES as GRAPES_LEGACY } from './data/grapes.ts';
export { REGIONS } from './data/regions.ts';
export { STYLES } from './data/styles.ts';
export { GRAPE_CARDS } from './data/grapeCards.ts';
export { CONTINENTS } from './data/continents.ts';
export { COUNTRIES } from './data/countries.ts';

const canonicalizeGrapeName = (value: string) =>
  /^syrah\s*\/\s*shiraz$/i.test(value.trim()) ? 'Syrah' : value;

const normalizeText = (value?: string) => (value || '').trim().toLowerCase();

const getGrapeBodyClass = (...values: Array<string | undefined>): GrapeBodyClass => {
  for (const value of values) {
    const text = normalizeText(value)
      .replace(/-bodied/g, '')
      .replace(/body/g, '')
      .replace(/red|white|rose|ros\u00e9|orange|sparkling|aromatic|sweet/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) continue;
    if (text.includes('medium full') || text.includes('full medium')) return 'Medium-Full';
    if (text.includes('light medium') || text.includes('medium light')) return 'Light-Medium';
    if (text.includes('full')) return 'Full';
    if (text.includes('medium')) return 'Medium';
    if (text.includes('light')) return 'Light';
  }

  return 'Medium';
};

const legacyColorMap: Record<string, { color: string; icon?: string; tastingProfile?: WineEntry['tastingProfile']; wineType?: string }> =
  LEGACY_GRAPES.reduce((acc, g) => {
    acc[g.id] = { color: g.color, icon: g.icon, tastingProfile: g.tastingProfile, wineType: g.wineType };
    return acc;
  }, {} as Record<string, { color: string; icon?: string; tastingProfile?: WineEntry['tastingProfile']; wineType?: string }>);

const GRAPE_ENTRIES: WineEntry[] = GRAPE_CARDS.map((card) => {
  const legacy = legacyColorMap[card.id];
  const bodyClass = getGrapeBodyClass(legacy?.wineType, card.style, LEGACY_GRAPES.find((grape) => grape.id === card.id)?.details.body);
  const rarityMap: Record<string, WineEntry['rarity']> = {
    common: 'COMMON',
    uncommon: 'UNCOMMON',
    rare: 'RARE',
    epic: 'RARE',
    noble: 'NOBLE',
  };
  return {
    id: card.id,
    name: canonicalizeGrapeName(card.name),
    description: card.info,
    category: 'GRAPES',
    tags: card.tastingProfile,
    color: legacy?.color || '#722F37',
    icon: legacy?.icon || 'grape',
    wineType: card.style,
    grapeType: card.type,
    grapeStyle: card.style,
    grapeBodyClass: bodyClass,
    grapeCharacteristics: card.characteristics,
    grapeAlternateNames: card.alternateNames.map(canonicalizeGrapeName),
    grapeNotableRegions: card.notableRegions,
    grapeCountryOfOrigin: card.countryOfOrigin,
    grapeRarityTier: card.rarityTier,
    tastingProfile: legacy?.tastingProfile,
    grapeCard: card,
    rarity: rarityMap[card.rarityTier] || 'UNCOMMON',
    details: {
      origin: card.countryOfOrigin,
      synonyms: card.alternateNames.map(canonicalizeGrapeName),
      keyRegions: card.notableRegions,
      body: bodyClass,
    }
  };
});

const TASTING_NOTE_ICON_KEYS: TastingNote['icon'][] = [
  'circle',
  'triangle',
  'leaf',
  'cloud',
  'sun',
  'mountain',
  'sparkles',
  'flame',
  'droplet',
  'shield',
  'flower',
  'fruit',
  'herb',
  'spice',
  'mineral',
  'oak',
  'smoke',
  'stone',
  'tropical',
  'flag',
  'honey',
  'nut',
  'default',
];

const sanitizeTastingNoteIcon = (icon?: string): TastingNote['icon'] =>
  icon && TASTING_NOTE_ICON_KEYS.includes(icon as TastingNote['icon'])
    ? (icon as TastingNote['icon'])
    : 'default';

const formatSubclassLabel = (subclass: string) => subclass.split('_').map(part => part.charAt(0) + part.slice(1).toLowerCase()).join(' ');

const buildFlavorEntries = (grapeEntries: WineEntry[]): WineEntry[] => {
  const flavorMap = new Map<string, { note: string; icon: string; color?: string; grapes: string[]; cls: FlavorClass; subclass: string }>();

  grapeEntries.forEach((entry) => {
    (entry.tastingProfile || []).forEach((flavor) => {
      const key = flavor.note.trim().toLowerCase();
      if (!key) return;
      const subclass = categorizeFlavorSubclass(flavor.note);
      const cls = categorizeFlavor(flavor.note, subclass);
      if (!flavorMap.has(key)) {
        flavorMap.set(key, { note: flavor.note, icon: flavor.icon || FLAVOR_CLASS_COLORS[cls].icon, color: flavor.color, grapes: [], cls, subclass });
      }
      flavorMap.get(key)!.grapes.push(entry.name);
    });
  });

  const flavorEntries: WineEntry[] = [];
  const flavorValues = Array.from(flavorMap.values());

  flavorMap.forEach((flavor, idx) => {
    const clsColors = FLAVOR_CLASS_COLORS[flavor.cls];
    const subclass = flavor.subclass || categorizeFlavorSubclass(flavor.note);
    const subclassLabel = formatSubclassLabel(subclass);
    const related = flavorValues
      .filter(f => f.cls === flavor.cls && f.note.toLowerCase() !== flavor.note.toLowerCase())
      .slice(0, 3)
      .map((f) => ({
        note: f.note,
        icon: 'default' as const,
        color: clsColors.border,
      }));

    flavorEntries.push({
      id: `FLAVOR-${idx + 1}`,
      name: flavor.note,
      description: `${flavor.note} is a ${subclassLabel.toLowerCase()} nuance with a ${flavor.cls.toLowerCase()} lean often found in wines.`,
      category: 'FLAVORS',
      tags: [flavor.cls, subclass],
      color: clsColors.color,
      icon: flavor.icon,
      tastingProfile: [
        { note: flavor.note, icon: sanitizeTastingNoteIcon(flavor.icon), color: flavor.color || clsColors.border },
        ...related,
      ],
      details: {
        classification: flavor.cls,
        subclass,
        notableGrapes: flavor.grapes.slice(0, 8),
      },
    });
  });

  return flavorEntries;
};

const CATEGORY_CALLBACKS: Partial<Record<EntryCategory, { icon: string; tile: string }>> = {
  GRAPES: { icon: 'grape', tile: 'grape' },
  REGIONS: { icon: 'region', tile: 'region' },
  STYLES: { icon: 'style', tile: 'style' },
  FLAVORS: { icon: 'flavor', tile: 'flavor' },
  CONTINENTS: { icon: 'globe', tile: 'globe' },
  COUNTRY_GATE: { icon: 'flag', tile: 'globe' },
};

const applyCategoryCallbacks = (entry: WineEntry): WineEntry => {
  const callbacks = CATEGORY_CALLBACKS[entry.category];
  if (!callbacks) return entry;
  return {
    ...entry,
    iconCallback: entry.iconCallback ?? callbacks.icon,
    tileCallback: entry.tileCallback ?? callbacks.tile,
  };
};

// Combined wine entries for the app
export const WINE_ENTRIES: WineEntry[] = [
  ...GRAPE_ENTRIES,
  ...REGIONS,
  ...STYLES,
  ...buildFlavorEntries(GRAPE_ENTRIES),
  ...CONTINENTS,
  ...COUNTRIES,
].map((entry) => applyCategoryCallbacks({
  ...entry,
  name: canonicalizeGrapeName(entry.name),
  details: {
    ...entry.details,
    notableGrapes: entry.details.notableGrapes?.map(canonicalizeGrapeName),
    synonyms: entry.details.synonyms?.map(canonicalizeGrapeName),
  },
}));

// Re-export shared helpers so existing consumers keep importing from `./constants`.
export { FLAVOR_CLASS_COLORS, categorizeFlavor, categorizeFlavorSubclass };
