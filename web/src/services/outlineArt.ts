import { normalizeLabel } from '@/shared/services/entryUtils';

/**
 * The drawn country/state outlines (`/art/class/outline-*.png`, v0.5.7
 * ClassArt) keyed by normalized place name — one list, read by the entry
 * visuals on screen and by the share-card manifest off it (v0.6.24). It
 * lived inside `entryIconVisuals.tsx` until the cards needed the same
 * answer from a script that must not pull React in.
 */
export const OUTLINE_ART_KEYS: readonly string[] = [
  'france', 'germany', 'italy', 'greece', 'portugal', 'spain', 'hungary', 'austria',
  'croatia', 'california', 'oregon', 'washington', 'new york', 'georgia', 'switzerland',
  'romania', 'south africa', 'morocco', 'usa', 'canada', 'argentina', 'chile', 'uruguay',
  'new zealand', 'australia', 'japan', 'china', 'india',
];

const OUTLINE_ART: Record<string, string> = Object.fromEntries(
  OUTLINE_ART_KEYS.map(k => [k, `outline-${k.replace(/ /g, '-')}`]),
);

export const normalizeCountryKey = (origin: string): string => normalizeLabel(origin).trim();

export const outlineStemFor = (name?: string): string | undefined =>
  name ? OUTLINE_ART[normalizeCountryKey(name)] : undefined;
