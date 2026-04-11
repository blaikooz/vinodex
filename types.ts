
export type EntryCategory = 'GRAPES' | 'REGIONS' | 'STYLES' | 'FLAVORS' | 'MASTER_SEARCH' | 'WORLD_SEARCH' | 'COUNTRY_GATE' | 'CONTINENTS' | 'RETRO_GLOBE';

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'noble';

export type ClimateClass = 'maritime' | 'continental' | 'cool' | 'warm' | 'mediterranean';

export type GrapeBodyClass = 'Light' | 'Light-Medium' | 'Medium' | 'Medium-Full' | 'Full';

export interface GrapeCharacteristics {
  tannin: number;        // 0–5
  acid: number;          // 0–5
  colorIntensity: number;// 0–5
  aromatics: number;     // 0–5
  body: number;          // 0–5
}

export interface RegionAffinity {
  region: string;
  bonus: string; // e.g. "+2 Structure"
}

export interface GrapeCard {
  id: string;
  name: string;
  type: 'red' | 'white';
  style: string; // e.g., "full-bodied red"
  countryOfOrigin: string;
  alternateNames: string[];
  rarityTier: RarityTier;
  evolutionLine?: string[];
  signatureMove?: string;
  discoveryYear?: number;
  regionAffinity?: RegionAffinity[];
  characteristics: GrapeCharacteristics;
  tastingProfile: string[];
  notableRegions: string[];
  info: string;
  // cross-links
  styleId?: string;
}

export interface WineStyle {
  id: string;
  name: string;
  type: 'red' | 'white';
  description: string;
  tastingProfile?: TastingNote[];
  notableGrapes?: string[];
  keyRegions?: string[];
}

export interface TastingNote {
  note: string;
  icon: 'circle' | 'triangle' | 'leaf' | 'cloud' | 'sun' | 'mountain' | 'sparkles' | 'flame' | 'droplet' | 'shield' | 'flower' | 'fruit' | 'herb' | 'spice' | 'mineral' | 'oak' | 'smoke' | 'stone' | 'tropical' | 'flag' | 'honey' | 'nut' | 'default';
  color: string;
}

export interface WineEntry {
  id: string;
  name: string;
  description: string;
  category: EntryCategory;
  tags: string[];
  color: string; // The primary color for the card/badge
  icon?: string; // Icon identifier
  tileCallback?: string; // Optional handler key for tile interactions
  iconCallback?: string; // Optional handler key for icon interactions
  wineType?: string; // legacy
  tastingProfile?: TastingNote[];
  climate?: ClimateClass;
  climateDescription?: string;
  grapeType?: 'red' | 'white';
  grapeStyle?: string;
  grapeBodyClass?: GrapeBodyClass;
  grapeCharacteristics?: GrapeCharacteristics;
  grapeAlternateNames?: string[];
  grapeNotableRegions?: string[];
  grapeCountryOfOrigin?: string;
  grapeRarityTier?: RarityTier;
  details: {
    origin?: string;
    state?: string; // For US regions (e.g., "California", "Oregon")
    acidity?: string;
    body?: string;
    tannin?: string;
    keyRegions?: string[];
    synonyms?: string[];
    classification?: string;
    subclass?: string;
    soilType?: string;
    notableGrapes?: string[];
    appellations?: string[];
  };
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'NOBLE';
  grapeCard?: GrapeCard;
}

export interface Pairing {
  code: string;
  name: string;
  category: string;
  compatibility: string;
  intensity: string;
  reasoning: string;
  color: string;
  servingTemp: string;
  examples: string[];
}
