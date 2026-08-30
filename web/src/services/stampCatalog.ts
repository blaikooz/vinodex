import type { BadgeId } from './passport';

/**
 * The stamp series, as a series (v10#2, v0.6.26) — ported from
 * `vinodex-ios/Sources/VinodexCore/BackPlateStamps.swift`.
 *
 * The passport's badges say what it *took*; a stamp says what it
 * *commemorates*, wears its own ink, and carries a denomination — postage
 * says how much it was worth, and the denominations climb with the badge's
 * difficulty, which is a small philatelic joke that also makes each stamp's
 * rank legible at a glance. Keyed to `BadgeId`, one to one, and
 * `stampCatalog.test.ts` holds the two vocabularies together.
 */
export interface Stamp {
  id: BadgeId;
  title: string;
  /** The tap-for-story copy: what this stamp commemorates. */
  info: string;
  /** Frame, keyline and ink — `#RRGGBB`. Each stamp has its own colour, like a real series. */
  colorHex: string;
  /** The denomination corner. */
  denomination: string;
}

export const STAMP_CATALOG: readonly Stamp[] = [
  { id: 'firstSip', title: 'FIRST SIP', info: 'Issued for your first tasting. Every cellar, every journey, every ruined carpet starts with one glass.', colorHex: '#A63838', denomination: '1¢' },
  { id: 'tenBottles', title: 'TEN BOTTLES', info: 'Ten tastings on the shelf. The palate is officially a returning customer.', colorHex: '#33518F', denomination: '10¢' },
  { id: 'allNoble', title: 'ALL NOBLE', info: 'Every noble grape, tried. The aristocracy has received you; act surprised.', colorHex: '#6E4F8F', denomination: '25¢' },
  { id: 'regionComplete', title: 'REGION COMPLETE', info: 'Every notable grape of one region, tried. Somewhere on a map, a place is entirely yours.', colorHex: '#2F6E4F', denomination: '15¢' },
  { id: 'streakWeek', title: 'STREAK WEEK', info: 'Seven daily challenges in a row. Discipline, applied to wine — a rare vintage.', colorHex: '#8F5A33', denomination: '7¢' },
  { id: 'sommelier', title: 'SOMMELIER', info: "The Wine Exam's top tier, unlocked. The device defers to your judgement from here on.", colorHex: '#2F6E6E', denomination: '50¢' },
];

export const stampFor = (id: BadgeId): Stamp => STAMP_CATALOG.find(s => s.id === id)!;
