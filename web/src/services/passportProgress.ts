import { Badge } from './passport';
import { PassportTier, tierFor, tierFromStorage } from './passportTier';

/**
 * Which passport badges and which rank the user has already been told about —
 * ported from `vinodex-ios/Sources/VinodexCore/PassportProgress.swift`
 * (0.7.1 D2, 0.8.7 D1) — v6#17.
 *
 * The passport itself stays pure arithmetic over the tried shelf; it can
 * answer "is this earned" but never "did this just become earned". The diff
 * lives here, and remembers exactly one thing per ledger: what has already
 * been announced.
 *
 * **`announce*` is not idempotent, and must not be** — it returns the newly
 * earned things *and* records them in the same call, which is what makes it
 * safe to call from an event handler; call it at the moment the thing
 * happens, never in a render.
 *
 * Storage keys are the iOS raw values (`passportSeenBadges`,
 * `passportSeenTierRank` + their seeded flags) — persisted vocabulary is
 * shared vocabulary.
 */

export const SEEN_BADGES_KEY = 'passportSeenBadges';
export const BADGES_SEEDED_KEY = 'passportSeenBadgesSeeded';
export const SEEN_TIER_KEY = 'passportSeenTierRank';
export const TIER_SEEDED_KEY = 'passportSeenTierSeeded';

const ls = (): Storage | null => (typeof window === 'undefined' ? null : window.localStorage);

/** Badge ids already announced. Ids, not indices or a bitmask — a seventh
 *  badge could plausibly be *inserted*, at which point a positional encoding
 *  would silently re-announce everything after it. */
export const seenBadges = (): Set<string> => {
  try {
    const raw = ls()?.getItem(SEEN_BADGES_KEY) ?? '';
    return new Set(raw.split(',').filter(s => s.length > 0));
  } catch {
    return new Set();
  }
};

const persistBadges = (seen: Set<string>): void => {
  try {
    if (seen.size === 0) ls()?.removeItem(SEEN_BADGES_KEY);
    else ls()?.setItem(SEEN_BADGES_KEY, [...seen].sort().join(','));
  } catch {
    /* ignore */
  }
};

/**
 * The badges earned since the last call, in catalog order — marked announced
 * by the act of asking.
 */
export const announceBadges = (badges: Badge[]): Badge[] => {
  const seen = seenBadges();
  const fresh = badges.filter(b => b.earned && !seen.has(b.id));
  if (fresh.length === 0) return [];
  for (const b of fresh) seen.add(b.id);
  persistBadges(seen);
  return fresh;
};

/**
 * The rank held, read raw. `null` is "nothing announced" — which is also a
 * genuinely unranked player, which is why the seeded flag exists separately:
 * an absent key must not decode as "announced MASTER" (index 0).
 */
const seenTierRank = (): number | null => {
  try {
    const raw = ls()?.getItem(SEEN_TIER_KEY);
    if (raw === null || raw === undefined) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  } catch {
    return null;
  }
};

/**
 * The rung crossed since the last call, or null. Returns *the tier now held*
 * rather than each rung passed on the way — the ladder can climb several
 * rungs in one tap only by importing a shelf, and stacked celebrations for
 * one tap would be an unreadable pile. **By threshold, never by stored
 * index** — declaration order is not the ladder, and comparing raw indices
 * would say APPRENTICE (4) outranks WINE MONK (3). An index this build does
 * not know resolves to null and is treated as "nothing announced": at worst
 * one repeated card, never an invented demotion.
 */
export const announceTier = (tastings: number): PassportTier | null => {
  const tier = tierFor(tastings);
  if (!tier) return null;
  const seenIndex = seenTierRank();
  const seen = seenIndex === null ? null : tierFromStorage(seenIndex);
  if (seen && seen.threshold >= tier.threshold) return null;
  try {
    ls()?.setItem(SEEN_TIER_KEY, String(tier.storageIndex));
  } catch {
    /* ignore */
  }
  return tier;
};

const flag = (key: string): boolean => {
  try {
    return ls()?.getItem(key) === 'true';
  } catch {
    return false;
  }
};

const setFlag = (key: string): void => {
  try {
    ls()?.setItem(key, 'true');
  } catch {
    /* ignore */
  }
};

/** Whether either ledger still owes a seed. */
export const needsSeeding = (): boolean => !flag(BADGES_SEEDED_KEY) || !flag(TIER_SEEDED_KEY);

/**
 * Mark everything currently earned as already announced, without returning
 * it. **The upgrade path, and load-bearing**: an existing user arrives with
 * badges earned and nothing recorded, and the first announce would hand them
 * a queue of celebrations for things they did weeks ago. Seeded-to-empty and
 * never-seeded are different states, so each ledger has its own flag — a
 * vocabulary added later needs a flag added later, or it is never seeded at
 * all (the 0.8.7 lesson).
 *
 * Call before the first possible announce — the entry page seeds on appear,
 * which is always before its own TRIED pill can be pressed. `badges` and
 * `tastings` are thunks so a device that is already seeded never computes a
 * passport for a flag that will be false for the rest of the install's life.
 */
export const seedIfNeeded = (badges: () => Badge[], tastings: () => number): void => {
  if (!needsSeeding()) return;
  if (!flag(BADGES_SEEDED_KEY)) {
    const seen = seenBadges();
    for (const b of badges()) if (b.earned) seen.add(b.id);
    persistBadges(seen);
    setFlag(BADGES_SEEDED_KEY);
  }
  if (!flag(TIER_SEEDED_KEY)) {
    const tier = tierFor(tastings());
    try {
      if (tier) ls()?.setItem(SEEN_TIER_KEY, String(tier.storageIndex));
    } catch {
      /* ignore */
    }
    setFlag(TIER_SEEDED_KEY);
  }
};

export const resetProgress = (): void => {
  try {
    const storage = ls();
    storage?.removeItem(SEEN_BADGES_KEY);
    storage?.removeItem(BADGES_SEEDED_KEY);
    storage?.removeItem(SEEN_TIER_KEY);
    storage?.removeItem(TIER_SEEDED_KEY);
  } catch {
    /* ignore */
  }
};
