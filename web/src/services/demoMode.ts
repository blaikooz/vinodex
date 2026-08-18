/**
 * The in-store attract loop, ported from
 * `vinodex-ios/Sources/VinodexCore/DemoMode.swift` (0.7.3, A2) — v6#30.
 *
 * **What a demo mode is for decides what is on it.** This runs on a device
 * nobody is holding, in front of somebody who has not decided to pick it up,
 * so every stop has to be legible from arm's length in the few seconds it
 * gets. The dwells differ on purpose — a uniform interval reads as a
 * slideshow of screenshots; the globe is longest because it is the only stop
 * that animates on its own, the lists shortest because a list says what it is
 * instantly and then says nothing more. The loop ends on the globe-adjacent
 * shape iOS chose so the wrap is the cut a passer-by most likely catches.
 *
 * The iOS tour carries twelve stops; the web walks the eleven whose screens
 * exist here — LABEL SCAN arrives with v6#27, added when the thing it shows
 * is, same rule as the cheat table.
 */

export interface DemoStop {
  /** Where the tour navigates to. */
  path: string;
  /** The route's own title, so a stop cannot be mis-captioned. */
  caption: string;
  /** Seconds it stays. */
  dwell: number;
}

export const DEMO_STOPS: DemoStop[] = [
  // The four the spec names, first and in its order.
  { path: '/scanner', caption: 'BLIND TASTING', dwell: 4.5 },
  { path: '/retro-globe', caption: 'GLOBE SCAN', dwell: 6.0 },
  { path: '/list/GRAPES', caption: 'GRAPES', dwell: 3.5 },
  { path: '/passport', caption: 'PASSPORT', dwell: 4.5 },
  // The rest of the shelf.
  { path: '/quiz', caption: 'WINE EXAM', dwell: 4.5 },
  { path: '/daily-challenge', caption: 'DAILY CHALLENGE', dwell: 4.0 },
  // PROF. VINO joined with v6#26, in iOS's slot on the loop (0.8.93).
  { path: '/prof-vino', caption: 'PROF. VINO', dwell: 4.0 },
  { path: '/moon-dial', caption: 'MOON DIAL', dwell: 4.5 },
  { path: '/chip-filter', caption: 'MASTER SEARCH', dwell: 3.5 },
  // Two more of the encyclopedia, so the loop is not eight tools and one
  // list — the catalog is what the tools are all *for*.
  { path: '/list/STYLES', caption: 'STYLES', dwell: 3.5 },
  { path: '/list/FLAVORS', caption: 'FLAVORS', dwell: 3.5 },
];

/** One full pass, for the "how long until it repeats" line in Settings. */
export const demoCycleSeconds = (): number => DEMO_STOPS.reduce((s, x) => s + x.dwell, 0);

/**
 * The stop at a counter, wrapping. Floors at zero: the caller is a counter
 * that only goes up, and a modulo on a negative would be a wrong stop rather
 * than a compile error if that stopped being true.
 */
export const demoStopAt = (index: number): DemoStop => DEMO_STOPS[Math.max(index, 0) % DEMO_STOPS.length]!;

// ---------------------------------------------------------------------------
// The switch — session-scoped, because an attract loop that survives a
// browser restart is a device that turned itself back on.
// ---------------------------------------------------------------------------

let active = false;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach(fn => fn());

export const subscribeToDemo = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

export const isDemoActive = (): boolean => active;

export const startDemo = (): void => {
  if (active) return;
  active = true;
  notify();
};

export const stopDemo = (): void => {
  if (!active) return;
  active = false;
  notify();
};
