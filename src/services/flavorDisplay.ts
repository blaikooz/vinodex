import type { ChipColorStyle } from './chipColors';

// Tile-level (darker, higher contrast) color palettes for flavor entries.
// Distinct from chipColors.getFlavorClassChipColors which is for inline chips.

export const getFlavorClassTileColors = (cls?: string): ChipColorStyle => {
  switch (cls?.toUpperCase()) {
    case 'SWEET': return { bg: '#451a03', border: '#b45309', text: '#fffbeb' };
    case 'SOUR': return { bg: '#052e16', border: '#16a34a', text: '#dcfce7' };
    case 'SALTY': return { bg: '#0c4a6e', border: '#0ea5e9', text: '#e0f2fe' };
    case 'BITTER': return { bg: '#312e81', border: '#6d28d9', text: '#ede9fe' };
    case 'UMAMI': return { bg: '#0f766e', border: '#0d9488', text: '#e0f2f1' };
    default: return { bg: '#1f2937', border: '#4b5563', text: '#e5e7eb' };
  }
};

export const getFlavorSubclassTileColors = (sub?: string): ChipColorStyle => {
  switch (sub?.toUpperCase()) {
    case 'CITRUS': return { bg: '#9a3412', border: '#f97316', text: '#fff7ed' };
    case 'ORCHARD_FRUIT': return { bg: '#3f6212', border: '#84cc16', text: '#ecfccb' };
    case 'STONE_FRUIT': return { bg: '#b45309', border: '#fb923c', text: '#fff7ed' };
    case 'TROPICAL': return { bg: '#a16207', border: '#eab308', text: '#fef9c3' };
    case 'RED_FRUIT': return { bg: '#7f1d1d', border: '#ef4444', text: '#fee2e2' };
    case 'DARK_FRUIT': return { bg: '#581c87', border: '#8b5cf6', text: '#f3e8ff' };
    case 'BERRY': return { bg: '#701a3c', border: '#e11d48', text: '#ffe4e6' };
    case 'HERBAL': return { bg: '#065f46', border: '#34d399', text: '#d1fae5' };
    case 'VEGETAL': return { bg: '#14532d', border: '#22c55e', text: '#dcfce7' };
    case 'SPICE': return { bg: '#78350f', border: '#d97706', text: '#ffedd5' };
    case 'BAKING': return { bg: '#4b2e12', border: '#c08457', text: '#f6e7d0' };
    case 'FLORAL': return { bg: '#831843', border: '#ec4899', text: '#fce7f3' };
    case 'EARTH': return { bg: '#292524', border: '#78716c', text: '#f5f5f4' };
    case 'WOOD': return { bg: '#4b3621', border: '#8b5a2b', text: '#f3e8d2' };
    case 'MARINE': return { bg: '#0c4a6e', border: '#0ea5e9', text: '#e0f2fe' };
    case 'WAX': return { bg: '#713f12', border: '#f59e0b', text: '#fff7ed' };
    case 'NUT': return { bg: '#6b4e16', border: '#eab308', text: '#fef9c3' };
    default: return { bg: '#1f2937', border: '#4b5563', text: '#e5e7eb' };
  }
};
