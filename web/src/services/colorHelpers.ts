import { STYLE_TONE_PALETTE, StyleColorKey, StyleColorPair } from '@/shared/stylePalette';

/**
 * Colour helpers the web owns.
 *
 * These lived in `shared/services/colorUtils.ts` and `shared/stylePalette.ts`
 * until the v0.9.x master cleanup stripped exports the iOS side no longer
 * reads (`isLightColor`, `darkenHex`, `getStylePalette`). The web still reads
 * all three, so they move here — web-only code lives web-side; `shared/` is a
 * mirror and never edited (v6#1 repair, IOS-PARITY-v6.md).
 *
 * The implementations are byte-for-byte the pre-sync shared versions, so no
 * rendered colour changes.
 */

export const isLightColor = (hex: string): boolean => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160;
};

export const darkenHex = (hex: string, amount = 0.35): string => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const toChannel = (start: number) => {
    const channel = parseInt(clean.substring(start, start + 2), 16);
    const darkened = Math.max(0, Math.min(255, Math.round(channel * (1 - amount))));
    return darkened.toString(16).padStart(2, '0');
  };
  return `#${toChannel(0)}${toChannel(2)}${toChannel(4)}`;
};

const normalizeStyleKey = (style?: string): StyleColorKey | undefined => {
  if (!style) return undefined;
  const t = style.toLowerCase();
  if (t.includes('full-body red') || t.includes('full body red') || t.includes('full-bodied red') || t.includes('full bodied red')) return 'full-bodied red';
  if (t.includes('bright red')) return 'bright red';
  if (t.includes('light-body red') || t.includes('light body red') || t.includes('light-bodied red') || t.includes('light bodied red')) return 'light-bodied red';
  if (t.includes('dark red')) return 'dark red';
  if (t.includes('medium-body red') || t.includes('medium body red') || t.includes('medium-bodied red') || t.includes('medium bodied red')) return 'medium-bodied red';
  if (t.includes('pink') || t.includes('rosé') || t.includes('rose')) return 'rosé';
  if (t.includes('light-body white') || t.includes('light body white') || t.includes('light-bodied white') || t.includes('light bodied white')) return 'light-bodied white';
  if (t.includes('aromatic white')) return 'aromatic white';
  if (t.includes('high-acid white') || t.includes('high acid white')) return 'high-acid white';
  if (t.includes('full-body white') || t.includes('full body white') || t.includes('full-bodied white') || t.includes('full bodied white')) return 'full-bodied white';
  if (t.includes('sweet white')) return 'sweet white';
  if (t.includes('medium-body white') || t.includes('medium body white') || t.includes('medium-bodied white') || t.includes('medium bodied white')) return 'medium-bodied white';
  return undefined;
};

export const getStylePalette = (style?: string): StyleColorPair | undefined => {
  const key = normalizeStyleKey(style);
  if (!key) return undefined;
  return STYLE_TONE_PALETTE[key];
};
