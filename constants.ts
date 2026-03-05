import { EntryCategory, WineEntry } from './types.ts';
import { GRAPES as LEGACY_GRAPES } from './data/grapes.ts';
import { REGIONS } from './data/regions.ts';
import { STYLES } from './data/styles.ts';
import { GRAPE_CARDS } from './data/grapeCards.ts';

// Re-export individual collections
export { GRAPES as GRAPES_LEGACY } from './data/grapes.ts';
export { REGIONS } from './data/regions.ts';
export { STYLES } from './data/styles.ts';
export { GRAPE_CARDS } from './data/grapeCards.ts';

const legacyColorMap: Record<string, { color: string; icon?: string; tastingProfile?: WineEntry['tastingProfile']; wineType?: string }> =
  LEGACY_GRAPES.reduce((acc, g) => {
    acc[g.id] = { color: g.color, icon: g.icon, tastingProfile: g.tastingProfile, wineType: g.wineType };
    return acc;
  }, {} as Record<string, { color: string; icon?: string; tastingProfile?: WineEntry['tastingProfile']; wineType?: string }>);

const GRAPE_ENTRIES: WineEntry[] = GRAPE_CARDS.map((card) => {
  const legacy = legacyColorMap[card.id];
  const rarityMap: Record<string, WineEntry['rarity']> = {
    common: 'COMMON',
    uncommon: 'UNCOMMON',
    rare: 'RARE',
    epic: 'RARE',
    noble: 'NOBLE',
  };
  return {
    id: card.id,
    name: card.name,
    description: card.info,
    category: 'GRAPES',
    tags: card.tastingProfile,
    color: legacy?.color || '#722F37',
    icon: legacy?.icon || 'grape',
    wineType: card.style,
    tastingProfile: legacy?.tastingProfile,
    grapeCard: card,
    rarity: rarityMap[card.rarityTier] || 'UNCOMMON',
    details: {
      origin: card.countryOfOrigin,
      synonyms: card.alternateNames,
      keyRegions: card.notableRegions,
      body: card.style,
    }
  };
});

type FlavorClass = 'SWEET' | 'SOUR' | 'SALTY' | 'BITTER' | 'UMAMI';

const FLAVOR_SUBCLASS_KEYWORDS: { id: string; keywords: string[] }[] = [
  { id: 'CITRUS', keywords: ['lemon', 'lime', 'grapefruit', 'citrus', 'orange', 'tangerine', 'yuzu'] },
  { id: 'BERRY', keywords: ['berry', 'berries', 'mixed berry', 'jammy', 'strawberry', 'raspberry', 'blueberry', 'blackberry', 'cranberry', 'currant', 'blackcurrant', 'redcurrant', 'cassis', 'boysenberry', 'mulberry', 'black fruit', 'blue fruit'] },
  { id: 'ORCHARD_FRUIT', keywords: ['apple', 'pear', 'quince', 'gooseberry'] },
  { id: 'STONE_FRUIT', keywords: ['peach', 'apricot', 'nectarine'] },
  { id: 'TROPICAL', keywords: ['pineapple', 'mango', 'papaya', 'banana', 'lychee'] },
  { id: 'RED_FRUIT', keywords: ['cherry', 'pomegranate', 'red fruit'] },
  { id: 'DARK_FRUIT', keywords: ['plum', 'dark fruit'] },
  { id: 'HERBAL', keywords: ['herb', 'herbal', 'mint', 'eucalyptus', 'tea', 'sage', 'fennel', 'dill', 'basil', 'thyme', 'oregano'] },
  { id: 'VEGETAL', keywords: ['bell pepper', 'peppercorn', 'tomato', 'green pepper', 'jalapeño', 'jalapeno'] },
  { id: 'SPICE', keywords: ['pepper', 'spice', 'cinnamon', 'clove', 'ginger', 'anise', 'licorice', 'tobacco'] },
  { id: 'BAKING', keywords: ['vanilla', 'cocoa', 'chocolate', 'caramel', 'coffee', 'espresso', 'butter'] },
  { id: 'FLORAL', keywords: ['rose', 'violet', 'jasmine', 'blossom', 'honeysuckle', 'lilac', 'flower'] },
  { id: 'EARTH', keywords: ['earth', 'earthy', 'mushroom', 'forest', 'soil', 'truffle', 'graphite', 'mineral', 'chalk', 'smoke', 'tar', 'petrol'] },
  { id: 'WOOD', keywords: ['oak', 'cedar', 'wood', 'woodsy', 'sandalwood', 'sawdust', 'barrel'] },
  { id: 'MARINE', keywords: ['saline', 'salt', 'sea', 'ocean', 'brine'] },
  { id: 'WAX', keywords: ['honey', 'beeswax', 'lanolin', 'wax'] },
  { id: 'NUT', keywords: ['almond', 'hazelnut', 'walnut', 'marzipan', 'nut'] },
];

const FLAVOR_CLASS_COLORS: Record<FlavorClass, { color: string; icon: string; border: string; text: string }> = {
  SWEET: { color: '#f59e0b', icon: 'sparkles', border: '#b45309', text: '#fffbeb' },
  SOUR: { color: '#22c55e', icon: 'citrus', border: '#15803d', text: '#ecfdf3' },
  SALTY: { color: '#38bdf8', icon: 'droplet', border: '#0ea5e9', text: '#e0f2fe' },
  BITTER: { color: '#8b5cf6', icon: 'triangle', border: '#6d28d9', text: '#f3e8ff' },
  UMAMI: { color: '#14b8a6', icon: 'leaf', border: '#0d9488', text: '#e0f2f1' },
};

const SUBCLASS_TO_CLASS: Record<string, FlavorClass> = {
  CITRUS: 'SOUR',
  ORCHARD_FRUIT: 'SWEET',
  STONE_FRUIT: 'SWEET',
  TROPICAL: 'SWEET',
  RED_FRUIT: 'SWEET',
  DARK_FRUIT: 'SWEET',
  BERRY: 'SWEET',
  MARINE: 'SALTY',
  SPICE: 'BITTER',
  BAKING: 'SWEET',
  VEGETAL: 'UMAMI',
  HERBAL: 'UMAMI',
  EARTH: 'UMAMI',
  WOOD: 'UMAMI',
  WAX: 'UMAMI',
  NUT: 'UMAMI',
  FLORAL: 'UMAMI',
};

const categorizeFlavor = (note: string, subclassHint?: string): FlavorClass => {
  const n = note.toLowerCase();
  if (subclassHint) {
    const mapped = SUBCLASS_TO_CLASS[subclassHint.toUpperCase()];
    if (mapped) return mapped;
  }
  const sweet = ['honey', 'vanilla', 'caramel', 'chocolate', 'sweet', 'jam', 'berry', 'plum', 'fruit', 'cand', 'mango', 'peach', 'apple', 'pear', 'fig', 'apricot', 'raisin', 'banana', 'cinnamon', 'butter', 'jammy'];
  const sour = ['lemon', 'lime', 'citrus', 'grapefruit', 'tart', 'acid', 'sour', 'tangerine', 'orange', 'yuzu'];
  const salty = ['saline', 'salt', 'brine', 'sea', 'ocean', 'sea salt'];
  const bitter = ['cocoa', 'coffee', 'espresso', 'pepper', 'spice', 'graphite', 'tannin', 'tar', 'black tea', 'tea'];
  if (sweet.some(k => n.includes(k))) return 'SWEET';
  if (sour.some(k => n.includes(k))) return 'SOUR';
  if (salty.some(k => n.includes(k))) return 'SALTY';
  if (bitter.some(k => n.includes(k))) return 'BITTER';
  return 'UMAMI';
};

const categorizeFlavorSubclass = (note: string): string => {
  const lower = note.toLowerCase();
  const match = FLAVOR_SUBCLASS_KEYWORDS.find(({ keywords }) => keywords.some(k => lower.includes(k)));
  return match ? match.id : 'FLAVOR';
};

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
        { note: flavor.note, icon: flavor.icon as any, color: flavor.color || clsColors.border },
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
].map(applyCategoryCallbacks);
