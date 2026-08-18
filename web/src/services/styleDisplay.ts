import { getWineTypeChipColors, type ChipColorStyle } from '@/shared/services/chipColors';
import { getStylePalette, isLightColor } from './colorHelpers';

export type StyleClassType = 'STYLE' | 'METHOD' | 'ORIGIN' | 'TYPE' | 'BLEND';

export const normalizeTypeClass = (type?: string): string => {
  if (!type) return '';
  if (/light/i.test(type)) return 'Light';
  if (/medium[- ]?full/i.test(type)) return 'Medium Full';
  if (/medium/i.test(type)) return 'Medium';
  if (/full/i.test(type)) return 'Full';
  if (/aromatic/i.test(type)) return 'Aromatic';
  if (/sweet/i.test(type)) return 'Sweet';
  return 'Medium';
};

export const getStyleClassTileColors = (type?: StyleClassType): ChipColorStyle => {
  switch (type) {
    case 'METHOD': return { bg: '#312e81', border: '#a855f7', text: '#ede9fe' };
    case 'ORIGIN': return { bg: '#7c2d12', border: '#f59e0b', text: '#ffedd5' };
    case 'TYPE': return { bg: '#0f172a', border: '#38bdf8', text: '#e0f2fe' };
    case 'BLEND': return { bg: '#1c1343', border: '#f97316', text: '#fee2e2' };
    case 'STYLE':
    default: return { bg: '#1f2937', border: '#22c55e', text: '#bbf7d0' };
  }
};

export const getStyleColorTileColors = (type?: string): ChipColorStyle => {
  switch (type) {
    case 'RED': return { bg: '#4A0E0E', border: '#8B0000', text: '#ffe4e6' };
    case 'WHITE': return { bg: '#FAFAD2', border: '#DAA520', text: '#2d1b00' };
    case 'ROSE': return { bg: '#4b1f2f', border: '#f9a8d4', text: '#ffe4e6' };
    case 'ORANGE': return { bg: '#4a2a0a', border: '#fb923c', text: '#ffedd5' };
    case 'DUAL': return { bg: '#4b0c2c', border: '#f472b6', text: '#ffe4f5' };
    default: return { bg: '#1f2937', border: '#22d3ee', text: '#cffafe' };
  }
};

export const getWineTypeTileColors = (wineType?: string): ChipColorStyle => {
  const palette = getStylePalette(wineType);
  if (palette) {
    const textColor = isLightColor(palette.primary) ? palette.secondary : '#ffffff';
    return { bg: palette.primary, border: palette.secondary, text: textColor };
  }
  return getWineTypeChipColors(wineType);
};
