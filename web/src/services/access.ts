import { WineEntry } from '@/shared/types';

/**
 * Entitlements and the free-tier switch — the paywall *testing* harness.
 *
 * Ported from `vinodex-ios/Sources/VinodexCore/Entitlements.swift` and the
 * ACCESS panel of `SettingsPanel.swift`.
 *
 * Read this before assuming the web app has a paywall: it does not. The switch
 * defaults **off**, which means everything is open regardless of bundles, and
 * nothing in the UI ever turns it on by itself. It exists so the locked
 * experience can be exercised — one boolean could only produce two states, all
 * locked or all open, so every interesting case went untested. The bundle rows
 * reproduce them: own one country and nothing else, own the flavour wheel but
 * no atlas, own a cosmetic but no content.
 *
 * One deliberate difference from iOS. That build ships a `tiers.json` manifest
 * naming the free slice, so it can say "132 of 284 browsable" with the switch
 * on and no bundles. The web app ships no such manifest, so with the switch on
 * an entry is browsable only if a granted bundle covers it. The counter says
 * what it counts rather than pretending to a number it cannot compute.
 */

export type Entitlement =
  | { kind: 'pro' }
  | { kind: 'country'; name: string }
  | { kind: 'flavors' }
  | { kind: 'skins' }
  | { kind: 'lightMode' }
  | { kind: 'workshop' };

/**
 * Bundles are identified by a string rather than by shape alone, so a stored
 * grant survives a change to the model — same reasoning as the Swift `id`.
 */
export function entitlementId(e: Entitlement): string {
  switch (e.kind) {
    case 'pro': return 'pro';
    case 'country': return `country:${e.name}`;
    case 'flavors': return 'flavors';
    case 'skins': return 'skins';
    case 'lightMode': return 'lightMode';
    case 'workshop': return 'workshop';
  }
}

export function entitlementTitle(e: Entitlement): string {
  switch (e.kind) {
    case 'pro': return 'VINODEX PRO';
    case 'country': return `${e.name.toUpperCase()} BUNDLE`;
    case 'flavors': return 'FLAVOR WHEEL';
    case 'skins': return 'CHASSIS SKINS';
    case 'lightMode': return 'LIGHT MODE';
    case 'workshop': return 'DEVICE WORKSHOP';
  }
}

export function entitlementBlurb(e: Entitlement): string {
  switch (e.kind) {
    case 'pro': return 'Every grape, region, style and flavour, plus every skin.';
    case 'country': return `Every grape and region from ${e.name}.`;
    case 'flavors': return 'All flavour entries and the full tasting wheel.';
    case 'skins': return 'All chassis colourways beyond the default.';
    case 'lightMode': return 'The paper-white LCD, for reading in daylight.';
    case 'workshop': return 'Build the device part by part, and save the results.';
  }
}

/** The bundles the ACCESS panel offers, matching the iOS test list. */
export const TESTABLE_ENTITLEMENTS: Entitlement[] = [
  { kind: 'pro' },
  { kind: 'country', name: 'France' },
  { kind: 'country', name: 'Italy' },
  { kind: 'country', name: 'Spain' },
  { kind: 'flavors' },
  { kind: 'skins' },
  { kind: 'lightMode' },
  { kind: 'workshop' },
];

const STARTER_KEY = 'starterOnly';
const GRANTED_KEY = 'grantedEntitlements';

let revision = 0;
const listeners = new Set<() => void>();

function notify(): void {
  revision += 1;
  listeners.forEach(fn => fn());
}

export function starterOnly(): boolean {
  try {
    return window.localStorage.getItem(STARTER_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setStarterOnly(on: boolean): void {
  try {
    window.localStorage.setItem(STARTER_KEY, String(on));
  } catch {
    /* session-only fallback */
  }
  notify();
}

export function grantedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(GRANTED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

function writeGranted(ids: string[]): void {
  try {
    window.localStorage.setItem(GRANTED_KEY, JSON.stringify(ids));
  } catch {
    /* session-only fallback */
  }
  notify();
}

export const isGranted = (e: Entitlement): boolean => grantedIds().includes(entitlementId(e));

export function toggleEntitlement(e: Entitlement): void {
  const id = entitlementId(e);
  const ids = grantedIds();
  const i = ids.indexOf(id);
  if (i >= 0) ids.splice(i, 1);
  else ids.push(id);
  writeGranted(ids);
}

export function revokeAll(): void {
  if (grantedIds().length === 0) return;
  writeGranted([]);
}

/**
 * Whether an entry is locked under the current combination.
 *
 * Continents are never locked — they are the map, and locking the way in makes
 * the rest unreachable rather than unbought. That rule is straight from iOS.
 */
export function isLocked(entry: WineEntry): boolean {
  if (!starterOnly()) return false;

  const ids = grantedIds();
  if (ids.includes('pro')) return false;
  if (entry.category === 'CONTINENTS') return false;
  if (entry.category === 'FLAVORS' && ids.includes('flavors')) return false;

  const origin = (entry.details as { origin?: string }).origin ?? '';
  const owned = ids.some(id => id.startsWith('country:') && id.slice(8).toLowerCase() === origin.toLowerCase());
  return !owned;
}

export function browsableCount(all: WineEntry[]): number {
  return all.filter(e => !isLocked(e)).length;
}

export function subscribeToAccess(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function accessRevision(): number {
  return revision;
}
