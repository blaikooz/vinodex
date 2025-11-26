import { WineEntry } from './types';
import { GRAPES as LEGACY_GRAPES } from './data/grapes';
import { REGIONS } from './data/regions';
import { STYLES } from './data/styles';
import { GRAPE_CARDS } from './data/grapeCards';

// Re-export individual collections
export { GRAPES as GRAPES_LEGACY } from './data/grapes';
export { REGIONS } from './data/regions';
export { STYLES } from './data/styles';
export { GRAPE_CARDS } from './data/grapeCards';

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

const FLAVOR_CLASS_COLORS: Record<FlavorClass, { color: string; icon: string; border: string; text: string }> = {
  SWEET: { color: '#f59e0b', icon: 'sparkles', border: '#b45309', text: '#fffbeb' },
  SOUR: { color: '#22c55e', icon: 'citrus', border: '#15803d', text: '#ecfdf3' },
  SALTY: { color: '#38bdf8', icon: 'droplet', border: '#0ea5e9', text: '#e0f2fe' },
  BITTER: { color: '#8b5cf6', icon: 'triangle', border: '#6d28d9', text: '#f3e8ff' },
  UMAMI: { color: '#14b8a6', icon: 'leaf', border: '#0d9488', text: '#e0f2f1' },
};

const categorizeFlavor = (note: string): FlavorClass => {
  const n = note.toLowerCase();
  const sweet = ['honey', 'vanilla', 'caramel', 'chocolate', 'sweet', 'jam', 'berry', 'plum', 'fruit', 'cand', 'mango', 'peach', 'apple', 'pear'];
  const sour = ['lemon', 'lime', 'citrus', 'grapefruit', 'tart', 'acid', 'sour'];
  const salty = ['saline', 'salt', 'brine', 'sea', 'ocean'];
  const bitter = ['cocoa', 'coffee', 'espresso', 'pepper', 'spice', 'graphite', 'tannin', 'tar'];
  if (sweet.some(k => n.includes(k))) return 'SWEET';
  if (sour.some(k => n.includes(k))) return 'SOUR';
  if (salty.some(k => n.includes(k))) return 'SALTY';
  if (bitter.some(k => n.includes(k))) return 'BITTER';
  return 'UMAMI';
};

const buildFlavorEntries = (grapeEntries: WineEntry[]): WineEntry[] => {
  const flavorMap = new Map<string, { note: string; icon: string; color?: string; grapes: string[]; cls: FlavorClass }>();

  grapeEntries.forEach((entry) => {
    (entry.tastingProfile || []).forEach((flavor) => {
      const key = flavor.note.trim().toLowerCase();
      if (!key) return;
      const cls = categorizeFlavor(flavor.note);
      if (!flavorMap.has(key)) {
        flavorMap.set(key, { note: flavor.note, icon: flavor.icon || FLAVOR_CLASS_COLORS[cls].icon, color: flavor.color, grapes: [], cls });
      }
      flavorMap.get(key)!.grapes.push(entry.name);
    });
  });

  const flavorEntries: WineEntry[] = [];
  const flavorValues = Array.from(flavorMap.values());

  flavorMap.forEach((flavor, idx) => {
    const clsColors = FLAVOR_CLASS_COLORS[flavor.cls];
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
      description: `${flavor.note} is a ${flavor.cls.toLowerCase()} leaning flavor often found in wines.`,
      category: 'FLAVORS',
      tags: [flavor.cls],
      color: clsColors.color,
      icon: flavor.icon,
      tastingProfile: [
        { note: flavor.note, icon: flavor.icon as any, color: flavor.color || clsColors.border },
        ...related,
      ],
      details: {
        classification: flavor.cls,
        notableGrapes: flavor.grapes.slice(0, 8),
      },
    });
  });

  return flavorEntries;
};

// Combined wine entries for the app
export const WINE_ENTRIES: WineEntry[] = [
  ...GRAPE_ENTRIES,
  ...REGIONS,
  ...STYLES,
  ...buildFlavorEntries(GRAPE_ENTRIES),
];
