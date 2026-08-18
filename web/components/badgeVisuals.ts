import { BadgeId } from '../src/services/passport';

/**
 * The stamp tints, read by the passport's grid and the unlock prompt alike.
 *
 * The glyph half of this table retired when the drawn stamps arrived (v6#2):
 * `StampArt` draws the real thing now, so six lucide icons were being
 * imported and never rendered.
 */

export const BADGE_TINT: Record<BadgeId, string> = {
  firstSip: '#ef4444',
  tenBottles: '#3b82f6',
  allNoble: '#eab308',
  regionComplete: '#22c55e',
  streakWeek: '#f97316',
  sommelier: '#a855f7',
};
