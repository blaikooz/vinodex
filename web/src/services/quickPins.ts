import type { SettingsSectionId } from './settingsSections';

/**
 * Where one of the marquee's two lamp buttons can be pointed.
 *
 * Ported from `vinodex-ios/Sources/VinodexCore/QuickPins.swift` (iOS 0.7.6,
 * A1), whose design note is the reason this exists at all and is worth
 * restating rather than re-deriving:
 *
 * Through iOS 0.7.5 the device had **three** ways to reach the same handful of
 * places — two lamp buttons hardwired to TOOLS and CUSTOMIZE, up to two pin
 * buttons in the marquee's corners, and a swipe drawer behind the panel whose
 * PINNED row is where the pins were chosen. A1 collapsed all three into the
 * first: **the lamps *are* the pins**, always visible, one tap, each
 * reassignable. The drawer and the corner buttons were deleted.
 *
 * The web arrives at that end state directly, having never shipped the drawer.
 *
 * ## The vocabulary is a strict superset of the settings sections
 *
 * Four of the five pins name a settings group; TOOLS names a route
 * (`/minigames`) and is the one that forced a type of its own rather than
 * reusing `SettingsSectionId`. `DEV` is deliberately **not** offered — it is
 * developer plumbing reached by a button, not a place to point a lamp — which
 * is the same one-case asymmetry iOS documents.
 *
 * A pin's label, glyph and destination are the section's or the route's, never
 * restated, which is what stops a lamp wearing one name and landing on a
 * screen wearing another.
 *
 * ## Two rules, both forced by the lamps being physical
 *
 * 1. **The list is always full.** A lamp cannot be empty — it is a moulded
 *    part of the shell, and a dark one reads as a fault, not as an invitation.
 *    So `pins()` always returns exactly `CAPACITY` entries and an under-filled
 *    stored value is padded from `DEFAULTS`.
 * 2. **Assignment is by slot, not by set.** Assigning a pin the *other* lamp
 *    already holds **swaps** the two, rather than putting one destination on
 *    both — a device with two identical buttons is not a choice anybody made.
 *
 * ## Why a store rather than a bare localStorage read
 *
 * iOS's own answer, and it transfers: the value is an ordered fixed-length
 * list with a padding rule, a swap rule and a defaults rule. Putting those in
 * the view means every call site re-implements them, and the first one to get
 * it wrong ships. This follows the external-store pattern `bookmarks.ts`
 * established, so both lamps and the chooser stay in step without a context
 * provider threaded through the chassis.
 */
export const MARQUEE_PINS = ['TOOLS', 'CUSTOMIZE', 'SETTINGS', 'DATA', 'ACCESS'] as const;

export type MarqueePin = (typeof MARQUEE_PINS)[number];

/**
 * One key holding a comma-joined list of `MarqueePin` values.
 *
 * **The spelling is iOS's and stays iOS's.** It says "quick pins" because it
 * was written for the drawer's pin bar; the pins moved to the lamps and the
 * key did not, for the reason the shared-vocabulary rule gives — a tidier name
 * silently resets the pins of everyone who had set any, and the two apps could
 * ever share a backup.
 */
export const QUICK_PINS_KEY = 'marqueeQuickPins';

/**
 * Two, because there are two lamps. The cap and the slot count are the same
 * number by construction.
 */
export const CAPACITY = 2;

/**
 * What the lamps say on a device nobody has reassigned: TOOLS on the left,
 * CUSTOMIZE on the right — iOS's shipped pair, in iOS's order.
 */
export const DEFAULTS: readonly MarqueePin[] = ['TOOLS', 'CUSTOMIZE'];

/** The settings group a pin names, or null for TOOLS. */
export function pinSection(pin: MarqueePin): SettingsSectionId | null {
  return pin === 'TOOLS' ? null : (pin as SettingsSectionId);
}

/**
 * Where the lamp goes. One expression rather than a table, so a pin cannot
 * name a destination its own label disagrees with.
 */
export function pinRoute(pin: MarqueePin): string {
  const section = pinSection(pin);
  return section ? `/settings/${section}` : '/minigames';
}

/**
 * The label, taken from whatever the destination already calls itself.
 *
 * The five ids are the words the tiles and the panel headers already show, so
 * there is nothing to translate — which is the same property iOS relies on to
 * make ACCESS read as its own name without this file knowing about a rename.
 *
 * **It is an identity function and it is still called** (`MarqueeLampButton`
 * for the accessible name, the engraved legend and the fitting width;
 * `MarqueeLampChooser` for the chip). That is the point of it: iOS's rule is
 * that a pin's label is never restated, and a seam every caller bypasses
 * documents an invariant it does not enforce. When one of these five stops
 * being the word on screen, this is the one place that changes.
 */
export function pinDisplayName(pin: MarqueePin): string {
  return pin;
}

const isPin = (v: string): v is MarqueePin =>
  (MARQUEE_PINS as readonly string[]).includes(v);

/**
 * Split, resolve, drop unknowns, drop duplicates, take the first `CAPACITY` —
 * then **pad the rest from `DEFAULTS`**.
 *
 * The first four steps are a defence against a value this app did not write:
 * an older build's list, a hand-edited localStorage, a section removed between
 * releases. The pad is what makes "a lamp is never empty" true from the first
 * read rather than at each call site. Worked through, because the migration is
 * the interesting case:
 *
 * - `''` (nobody ever pinned anything) → `[TOOLS, CUSTOMIZE]`. The
 *   overwhelming majority of devices.
 * - `'SETTINGS'` (one pin) → `[SETTINGS, TOOLS]`: the pin they chose keeps the
 *   slot it was in, and the first unused default fills the other.
 * - `'DATA,ACCESS'` → `[DATA, ACCESS]`, untouched.
 * - `'PACKS,DATA'` (a pin for a section that does not exist here) → `[DATA,
 *   TOOLS]` — the same silent drop iOS documents.
 */
export function decodePins(raw: string): MarqueePin[] {
  const seen = new Set<MarqueePin>();
  const out: MarqueePin[] = [];
  for (const piece of raw.split(',')) {
    const t = piece.trim();
    if (!isPin(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length === CAPACITY) break;
  }
  for (const d of DEFAULTS) {
    if (out.length === CAPACITY) break;
    if (seen.has(d)) continue;
    seen.add(d);
    out.push(d);
  }
  return out;
}

/**
 * Memoised, and deliberately with no invalidation hook: CLEAR ALL SAVED DATA
 * removes the key and then reloads the page (`SettingsPanel.tsx:96`), so the
 * cache never outlives the value it caches. A `resetPinsCache()` here would be
 * an export nothing calls.
 */
let cache: MarqueePin[] | null = null;
let revision = 0;
const listeners = new Set<() => void>();

function emit(): void {
  revision += 1;
  listeners.forEach(fn => fn());
}

function read(): MarqueePin[] {
  if (cache) return cache;
  let raw = '';
  try {
    raw = window.localStorage.getItem(QUICK_PINS_KEY) ?? '';
  } catch {
    raw = '';
  }
  cache = decodePins(raw);
  return cache;
}

/** Always exactly `CAPACITY` entries, always distinct. */
export function pins(): MarqueePin[] {
  return read();
}

/** What the lamp in `slot` is pointed at. 0 is the left lamp, 1 the right. */
export function pinAt(slot: number): MarqueePin {
  const list = read();
  return list[slot] ?? DEFAULTS[Math.min(slot, DEFAULTS.length - 1)]!;
}

/**
 * Point a lamp somewhere.
 *
 * If the *other* lamp already holds `pin`, the two **swap** — see the rule
 * above. Anything else replaces the slot's own pin and leaves its neighbour
 * alone.
 */
export function assignPin(pin: MarqueePin, slot: number): void {
  if (slot < 0 || slot >= CAPACITY) return;
  const next = [...read()];
  const other = next.indexOf(pin);
  if (other === slot) return;
  if (other !== -1) next[other] = next[slot]!;
  next[slot] = pin;
  cache = next;
  try {
    // **Back at the factory pair, the key goes away** — iOS's `persist()` does
    // the same, on the principle that a stored value equal to the default and
    // no stored value must not be two different states. Nothing on the web can
    // currently tell them apart, because `decodePins('')` returns `DEFAULTS`
    // and every reader goes through it; mirroring it anyway is cheap and it
    // keeps the two stores answerable to one description. It also means
    // `storageKeys.test.ts` sees a device that has never been customised look
    // like one, which is what a wipe leaves behind.
    const atDefaults =
      next.length === DEFAULTS.length && next.every((p, i) => p === DEFAULTS[i]);
    if (atDefaults) {
      window.localStorage.removeItem(QUICK_PINS_KEY);
    } else {
      window.localStorage.setItem(QUICK_PINS_KEY, next.join(','));
    }
  } catch {
    // A device with storage disabled still gets working lamps for the
    // session; only the memory of the choice is lost.
  }
  emit();
}

// A store outside React, subscribed to with `useSyncExternalStore`, so the two
// lamps and the chooser stay in step — the pattern `bookmarks.ts` established.

export function subscribeToPins(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function pinsRevision(): number {
  return revision;
}
