/**
 * Per-screen UI state — where a screen was scrolled to, and which of its
 * collapsible sections were open — kept alive across navigation.
 *
 * Ported from `vinodex-ios/Sources/VinodexCore/ScreenState.swift`; that file is
 * the spec. The iOS app has no NavigationStack, so a screen is destroyed when
 * you leave it and rebuilt when you come back, losing its state. React Router
 * does the same thing for the same reason: `<Route>` unmounts the old element.
 *
 * What it was like without this: open France, scroll down to Saint-Émilion,
 * open it, press Back — and land at the top of France again, having to scroll a
 * second time to reach the row next to the one you had just read.
 *
 * Two kinds of state, matching the Swift store. An anchor names a *section or
 * row* (a `data-screen-anchor` value), never a pixel offset, so a screen whose
 * content changed underneath still restores somewhere sensible instead of into
 * empty space. Flags are named booleans for collapsible sections.
 *
 * Keyed per screen INSTANCE rather than per screen type: France and Italy are
 * different pages and must not share a scroll position.
 *
 * A module-level singleton rather than React context, and deliberately NOT
 * backed by localStorage or sessionStorage: this is session state, and a cold
 * load must start clean. It is also invisible to React on purpose — scroll
 * handlers write straight into it, so scrolling never triggers a re-render.
 */

const anchors = new Map<string, string>();
const flags = new Map<string, Set<string>>();
const queries = new Map<string, string>();

/**
 * The in-flight search query for a listing.
 *
 * The third thing iOS keeps alive across navigation (`SearchStateStore`), and
 * for the same reason as the other two: returning from a result used to drop
 * you into the unfiltered list with an empty field, so finding the *second*
 * result meant retyping the search.
 */
export function query(key: string): string {
  return queries.get(key) ?? '';
}

/**
 * Empty queries are removed rather than stored, so clearing a field costs
 * nothing and `isEmpty` means what it says.
 *
 * Setting a query drops that listing's anchor: a changed query makes the old
 * anchor meaningless — that row may not even be in the new results — and
 * restoring it would scroll to a seemingly random position mid-type.
 */
export function setQuery(key: string, value: string): void {
  if (value === '') queries.delete(key);
  else queries.set(key, value);
  anchors.delete(key);
}

/** The anchor id at the top of the viewport, or null for the top of the screen. */
export function anchor(key: string): string | null {
  return anchors.get(key) ?? null;
}

export function setAnchor(key: string, value: string | null): void {
  if (value === null) anchors.delete(key);
  else anchors.set(key, value);
}

export function isOn(key: string, flag: string): boolean {
  return flags.get(key)?.has(flag) ?? false;
}

/**
 * Off is stored as absence rather than as `false`, so collapsing every section
 * leaves nothing behind — matching the Swift store, where that is what keeps
 * `isEmpty` meaningful.
 */
export function setFlag(key: string, flag: string, on: boolean): void {
  const set = flags.get(key) ?? new Set<string>();
  if (on) set.add(flag);
  else set.delete(flag);

  if (set.size === 0) flags.delete(key);
  else flags.set(key, set);
}

export function toggleFlag(key: string, flag: string): void {
  setFlag(key, flag, !isOn(key, flag));
}

/**
 * Wired to the Home action only. Back must NOT clear — restoring on Back is the
 * whole point — and entering or leaving the splash must not clear either.
 */
export function clear(): void {
  anchors.clear();
  flags.clear();
  queries.clear();
}

/** Drops one screen's state without touching the rest. */
export function forget(key: string): void {
  anchors.delete(key);
  flags.delete(key);
  queries.delete(key);
}

export function isEmpty(): boolean {
  return anchors.size === 0 && flags.size === 0 && queries.size === 0;
}

// Keys are spelled out rather than derived, so a rename cannot silently orphan
// stored state. Prefixed per screen kind so a country and a state of the same
// name (Washington is both) cannot collide.

export const keyForDetail = (entryId: string): string => `detail:${entryId}`;
export const keyForCountry = (name: string): string => `country:${name}`;
export const keyForState = (name: string): string => `state:${name}`;

/**
 * The web list screens are URL-addressed, so the list URL is the natural
 * instance key — `/list/GRAPES?filterMode=TYPE&filterValue=RED` is a different
 * listing from `/list/GRAPES`, and they must not share a position.
 */
export const keyForList = (canonicalUrl: string): string => `list:${canonicalUrl}`;
