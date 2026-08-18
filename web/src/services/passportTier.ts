/**
 * The passport's rank ladder, ported from the tier half of
 * `vinodex-ios/Sources/VinodexCore/Passport.swift` (0.8.7 D1, 0.8.9b) —
 * v6#21.
 *
 * **Declaration order is storage, threshold order is the ladder.** The names
 * are display copy and must stay renameable, so what persists is the
 * declaration index (`storageIndex`), never the name — 0.8.9b renamed two
 * rungs and stripped a prefix without a byte of stored state moving, and
 * APPRENTICE was *appended* below MASTER rather than inserted, which is the
 * one shape this scheme could not absorb. Thresholds are absolute counts,
 * not fractions of the catalog, and are distinct by construction.
 */

export interface PassportTier {
  /** Declaration index — the persisted value. */
  storageIndex: number;
  /** Display copy; renameable because it is never stored. */
  name: string;
  /** Tastings required. Absolute, ascending along the ladder. */
  threshold: number;
  blurb: string;
}

/** Declaration order (storage). APPRENTICE is appended, not inserted. */
export const PASSPORT_TIERS: PassportTier[] = [
  { storageIndex: 0, name: 'MASTER', threshold: 25, blurb: 'Twenty-five. The ladder proper begins here.' },
  { storageIndex: 1, name: 'GRANDMASTER', threshold: 100, blurb: 'A hundred. You are no longer guessing.' },
  { storageIndex: 2, name: 'LEGENDARY', threshold: 250, blurb: 'Two hundred and fifty. Most of the book.' },
  { storageIndex: 3, name: 'WINE MONK', threshold: 400, blurb: 'Four hundred. There is very little left to pour.' },
  { storageIndex: 4, name: 'APPRENTICE', threshold: 5, blurb: 'Five entries tried. You have started, which is the part most people skip.' },
];

/** Threshold-ascending — the ladder as climbed. */
export const TIER_LADDER: PassportTier[] = [...PASSPORT_TIERS].sort((a, b) => a.threshold - b.threshold);

/** The rung held at a tastings count, or null below the first. */
export const tierFor = (count: number): PassportTier | null => {
  let held: PassportTier | null = null;
  for (const tier of TIER_LADDER) if (count >= tier.threshold) held = tier;
  return held;
};

/** The rung above, or null at the top. By threshold, not by declaration. */
export const nextTier = (tier: PassportTier | null): PassportTier | null => {
  if (!tier) return TIER_LADDER[0] ?? null;
  return TIER_LADDER.find(t => t.threshold > tier.threshold) ?? null;
};

/** A stored index back to its tier — an unknown index is nothing, never a guess. */
export const tierFromStorage = (index: number): PassportTier | null =>
  PASSPORT_TIERS.find(t => t.storageIndex === index) ?? null;

/**
 * Progress toward the next rung, **measured from the held rung's floor rather
 * than from zero** — a bar that never visibly empties reads as broken, and a
 * bar from zero spends most of the climb pinned at the right.
 */
export const tierProgress = (count: number): { held: PassportTier | null; next: PassportTier | null; fraction: number } => {
  const held = tierFor(count);
  const next = nextTier(held);
  if (!next) return { held, next: null, fraction: 1 };
  const floor = held?.threshold ?? 0;
  const span = next.threshold - floor;
  const fraction = span <= 0 ? 1 : Math.min(1, Math.max(0, (count - floor) / span));
  return { held, next, fraction };
};
