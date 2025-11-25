// Wine Color Palette (10 colors)
export const WINE_COLORS = {
  deepBordeaux: '#722F37',
  rubyRed: '#9B2335',
  burgundy: '#800020',
  merlot: '#73343A',
  rose: '#C48B8B',
  blush: '#D4A5A5',
  golden: '#C9A227',
  champagne: '#D4B896',
  amber: '#C67530',
  mahogany: '#5D3A1A',
};

// Array of wine colors for cycling through entries
export const WINE_COLOR_ARRAY = [
  WINE_COLORS.deepBordeaux,
  WINE_COLORS.rubyRed,
  WINE_COLORS.burgundy,
  WINE_COLORS.merlot,
  WINE_COLORS.rose,
  WINE_COLORS.blush,
  WINE_COLORS.golden,
  WINE_COLORS.champagne,
  WINE_COLORS.amber,
  WINE_COLORS.mahogany,
];

// Get a wine color based on entry id for consistent coloring
export function getWineColor(id: string): string {
  // Generate a hash from the id to get consistent color
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % WINE_COLOR_ARRAY.length;
  return WINE_COLOR_ARRAY[index];
}
