import { Droplet, Package, Crown, Map as MapIcon, Flame, GraduationCap } from 'lucide-react';
import { BadgeId } from '../src/services/passport';

/**
 * One table for the stamp glyphs and tints, read by the passport's grid and
 * the unlock prompt alike — two copies of a six-row lookup is the
 * parallel-copy drift the tool roster just got fixed for (M3).
 */
export const BADGE_ICON: Record<BadgeId, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
  firstSip: Droplet,
  tenBottles: Package,
  allNoble: Crown,
  regionComplete: MapIcon,
  streakWeek: Flame,
  sommelier: GraduationCap,
};

export const BADGE_TINT: Record<BadgeId, string> = {
  firstSip: '#ef4444',
  tenBottles: '#3b82f6',
  allNoble: '#eab308',
  regionComplete: '#22c55e',
  streakWeek: '#f97316',
  sommelier: '#a855f7',
};
