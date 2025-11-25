
export type EntryCategory = 'GRAPES' | 'REGIONS' | 'STYLES' | 'PAIRINGS' | 'MASTER_SEARCH';

export interface TastingNote {
  note: string;
  icon: 'circle' | 'triangle' | 'leaf' | 'cloud' | 'sun' | 'mountain' | 'sparkles' | 'flame' | 'droplet' | 'shield';
  color: string;
}

export interface WineEntry {
  id: string;
  name: string;
  description: string;
  category: EntryCategory;
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY'; // Only used for GRAPES
  tags: string[];
  color: string; // The primary color for the card/badge
  icon?: string; // Icon identifier
  wineType?: string; // e.g., "Full-Bodied Red", "Zesty White"
  tastingProfile?: TastingNote[];
  details: {
    origin?: string;
    acidity?: string;
    body?: string;
    tannin?: string;
    keyRegions?: string[];
    synonyms?: string[];
    classification?: string;
    soilType?: string;
    notableGrapes?: string[];
    appellations?: string[]; // For regions with sub-appellations or crus
  };
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
