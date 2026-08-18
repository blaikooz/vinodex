import { WineEntry, isGrapeEntry, isStyleEntry } from '@/shared/types';
import {
  FIRST_TIME_TRIGGERS,
  FirstTimeTrigger,
  VinoLine,
  vinoLine,
} from './vinoDialogue';

/**
 * Which first-time lines have already been shown, and how they fire —
 * ported from `vinodex-ios/Sources/VinodexCore/FirstTimeTriggers.swift`
 * (0.8.9c E1, 0.8.9d) — v6#23/#26.
 *
 * One storage key holding comma-joined ids, unknown ids dropped on read, the
 * set only ever added to — widening the vocabulary is a strict superset, so
 * a new trigger shows its bubble because its key is simply absent.
 *
 * **The first-run trap, sorted by shape:** navigation/action triggers become
 * true by the player doing something *now*, one at a time — no seed, worst
 * case one bubble at the moment they open a thing. History-derived triggers
 * (`firstTried`, `firstInsight`, `firstStamp`) are computed from state an
 * existing user already has on disk and would burst — so those three, and
 * only those three, are seeded. Seeding everything would silently rob every
 * existing player of the entire character, which is the opposite failure and
 * a much quieter one.
 *
 * Storage keys are the iOS raw values (`firstTimeTriggersSeen`,
 * `firstTimeTriggersSeeded`, `vinoSilenced`).
 */

export const TRIGGERS_SEEN_KEY = 'firstTimeTriggersSeen';
export const TRIGGERS_SEEDED_KEY = 'firstTimeTriggersSeeded';
export const VINO_SILENCED_KEY = 'vinoSilenced';

const ls = (): Storage | null => (typeof window === 'undefined' ? null : window.localStorage);

const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach(fn => fn());
export const subscribeToTriggers = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

/** Seen keys, unknown ids dropped — a trigger retired in a later release
 *  should not keep a slot in the stored set forever. */
export const seenTriggers = (): Set<FirstTimeTrigger> => {
  try {
    const raw = ls()?.getItem(TRIGGERS_SEEN_KEY) ?? '';
    const known = new Set<string>(FIRST_TIME_TRIGGERS);
    return new Set(
      raw.split(',').filter((k): k is FirstTimeTrigger => k.length > 0 && known.has(k)),
    );
  } catch {
    return new Set();
  }
};

const persistSeen = (seen: Set<FirstTimeTrigger>): void => {
  try {
    if (seen.size === 0) ls()?.removeItem(TRIGGERS_SEEN_KEY);
    else ls()?.setItem(TRIGGERS_SEEN_KEY, [...seen].sort().join(','));
  } catch {
    /* ignore */
  }
};

export const hasFired = (trigger: FirstTimeTrigger): boolean => seenTriggers().has(trigger);

/**
 * The hide-him preference (0.8.9d). **A filter, not a consumption**: a
 * silenced trigger returns null from `fireOnce` *without* marking the key
 * seen, so turning him back on restores the whole unseen set — the
 * difference between a mute and a wipe. It does not silence the coachmark
 * walkthrough, whose lines are the content of something the player pressed a
 * button to start.
 */
export const isVinoSilenced = (): boolean => {
  try {
    return ls()?.getItem(VINO_SILENCED_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setVinoSilenced = (silenced: boolean): void => {
  try {
    if (silenced) ls()?.setItem(VINO_SILENCED_KEY, 'true');
    else ls()?.removeItem(VINO_SILENCED_KEY);
  } catch {
    /* ignore */
  }
  notify();
};

/**
 * The line owed for this action, or null if it has already been said.
 * **Marks seen on the way out, not on dismissal** — the queue could hold an
 * un-marked line twice before its first copy is ever seen, so "once" is a
 * property of the request rather than of the presentation. A deferred line
 * and a silenced store both return null *without* consuming the key.
 */
export const fireOnce = (trigger: FirstTimeTrigger): VinoLine | null => {
  if (isVinoSilenced()) return null;
  const line = vinoLine(trigger);
  if (!line || line.deferredUntil) return null;
  const seen = seenTriggers();
  if (seen.has(trigger)) return null;
  seen.add(trigger);
  persistSeen(seen);
  notify();
  return line;
};

/**
 * What arriving at a web route is worth saying, in order. **A list rather
 * than one**, because one arrival can legitimately be two firsts: opening a
 * Godforsaken grape as your first grape is both `firstGrapeViewed` and
 * `firstGodforsaken` — category first (the orientation), rarity second (the
 * remark about it). The iOS `DexRoute` arms, translated to paths; SHOP's arm
 * keys on the stored `ACCESS` spelling, displayed or not.
 */
export const triggersForArrival = (path: string, entry?: WineEntry | null): FirstTimeTrigger[] => {
  if (path.startsWith('/detail/')) {
    if (!entry) return [];
    const found: FirstTimeTrigger[] = [];
    switch (entry.category) {
      case 'GRAPES':
        found.push('firstGrapeViewed');
        break;
      case 'REGIONS':
        found.push('firstRegionViewed');
        break;
      case 'STYLES':
        found.push('firstStyleViewed');
        break;
      case 'FLAVORS':
        found.push('firstFlavorViewed');
        break;
      default:
        break;
    }
    const rarity = isGrapeEntry(entry) ? entry.rarity : isStyleEntry(entry) ? entry.rarity : undefined;
    if (rarity === 'GODFORSAKEN') found.push('firstGodforsaken');
    return found;
  }
  if (path === '/daily-challenge') return ['firstDailyChallenge'];
  if (path === '/quiz') return ['firstWineExam'];
  // BLIND TASTING kept the /scanner route through the rename — exactly why
  // the keys are named after concepts, not routes.
  if (path === '/scanner') return ['firstBlindTasting'];
  if (path === '/passport') return ['firstPassport'];
  if (path === '/settings/CUSTOMIZE') return ['firstCustomize'];
  if (path === '/settings/ACCESS') return ['firstShop'];
  return [];
};

/**
 * Suppress the bubbles an existing player has already earned. Runs once
 * ever; a new install passes zeros, seeds to empty, and gets every line —
 * "seeded to empty" and "never seeded" are different states, so the flag is
 * separate from the emptiness of the set. `triedCount >= 1` is
 * `InsightDepth.first`'s threshold — one tasting means the panel would
 * already have been showing derived lines.
 */
export const seedTriggers = (triedCount: number, hasAnnouncedStamps: boolean): void => {
  try {
    if (ls()?.getItem(TRIGGERS_SEEDED_KEY) === 'true') return;
    const seen = seenTriggers();
    if (triedCount >= 1) {
      seen.add('firstTried');
      seen.add('firstInsight');
    }
    if (hasAnnouncedStamps) seen.add('firstStamp');
    persistSeen(seen);
    ls()?.setItem(TRIGGERS_SEEDED_KEY, 'true');
  } catch {
    /* ignore */
  }
};

/** Back to a fresh install. The silence preference goes with them — a fresh
 *  install has not asked to be left alone. */
export const resetTriggers = (): void => {
  try {
    const storage = ls();
    storage?.removeItem(TRIGGERS_SEEN_KEY);
    storage?.removeItem(TRIGGERS_SEEDED_KEY);
    storage?.removeItem(VINO_SILENCED_KEY);
  } catch {
    /* ignore */
  }
  notify();
};
