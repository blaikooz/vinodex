import { WineEntry } from './types';
import { GRAPES } from './data/grapes';
import { REGIONS } from './data/regions';
import { STYLES } from './data/styles';

// Re-export individual collections
export { GRAPES } from './data/grapes';
export { REGIONS } from './data/regions';
export { STYLES } from './data/styles';

// Combined wine entries for the app
export const WINE_ENTRIES: WineEntry[] = [
  ...GRAPES,
  ...REGIONS,
  ...STYLES,
];
