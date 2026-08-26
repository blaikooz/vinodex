/**
 * The player's saved builds (v0.5.0) — ported from
 * `vinodex-ios/Sources/VinodexCore/CustomDevices.swift`.
 *
 * A store rather than a bare key, for iOS's stated reason: the value is an
 * ordered list with a cap, a name-normalisation rule and a save-or-replace
 * rule, and a blob can only hold the blob. The rules live here so the
 * workshop cannot re-implement "trim it, uppercase it, refuse an empty one,
 * replace rather than duplicate" wrongly.
 *
 * **`apply` is not on this store.** Applying a build writes the ten device
 * keys, and that is `theme.applyBuild`'s job — keeping it out is what stops
 * this becoming a second answer to "what does the device look like right
 * now". Which build is fitted is **derived, never stored**: `matching()`
 * compares the live keys against each saved build, exactly as iOS does, so a
 * fitted build that has one part changed simply stops matching.
 */

import { DeviceBuild, buildsEqual, sanitizeBuild, isStock } from './deviceParts';

export interface CustomDevice {
  /** A UUID string, so renaming a build is a rename rather than a re-save. */
  id: string;
  /** Normalised — see `normalizeDeviceName`. Never empty. */
  name: string;
  build: DeviceBuild;
}

/** iOS `CustomDeviceStore.storageKey`, spelled identically. */
export const CUSTOM_DEVICES_KEY = 'customDevices';

/** The cap. Twelve — more builds than the axes can meaningfully distinguish. */
export const DEVICE_CAPACITY = 12;

/** The longest name that fits a saved-build row beside its swatch strip. */
export const DEVICE_NAME_LIMIT = 16;

/** Trim, collapse whitespace runs, uppercase, clip — iOS `normalize`. */
export function normalizeDeviceName(raw: string): string {
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
    .toUpperCase()
    .slice(0, DEVICE_NAME_LIMIT);
}

export type SaveOutcome =
  | { kind: 'saved'; id: string }
  | { kind: 'replaced'; id: string }
  | { kind: 'needsName' }
  | { kind: 'full' }
  | { kind: 'nameTaken' };

let revision = 0;
const listeners = new Set<() => void>();
const notify = (): void => {
  revision += 1;
  listeners.forEach(fn => fn());
};

export const subscribeToDevices = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const devicesRevision = (): number => revision;

/** Drop the unnameable, dedupe by name, take the first `capacity`. */
export function sanitizeDevices(raw: unknown): CustomDevice[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: CustomDevice[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as { id?: unknown; name?: unknown; build?: unknown };
    const name = normalizeDeviceName(typeof record.name === 'string' ? record.name : '');
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push({
      id: typeof record.id === 'string' && record.id ? record.id : cryptoId(),
      name,
      build: sanitizeBuild(record.build),
    });
    if (out.length === DEVICE_CAPACITY) break;
  }
  return out;
}

const cryptoId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function savedDevices(): CustomDevice[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_DEVICES_KEY);
    if (!raw) return [];
    // Re-normalised on read rather than trusted: an older build, a restored
    // backup or a hand-edited value is cheaper to re-sanitise than to reason
    // about having been skipped once.
    return sanitizeDevices(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

/**
 * Removes the key outright when the list empties — absence and emptiness
 * must not be two states (`QuickPinStore`'s rule, followed on iOS too).
 */
function persist(devices: CustomDevice[]): void {
  try {
    if (devices.length === 0) window.localStorage.removeItem(CUSTOM_DEVICES_KEY);
    else window.localStorage.setItem(CUSTOM_DEVICES_KEY, JSON.stringify(devices));
  } catch {
    /* ignored */
  }
  notify();
}

export const deviceNamed = (raw: string): CustomDevice | undefined => {
  const name = normalizeDeviceName(raw);
  if (!name) return undefined;
  return savedDevices().find(d => d.name === name);
};

/** The saved build the device is wearing right now, if any. Derived. */
export const matchingDevice = (build: DeviceBuild): CustomDevice | undefined =>
  savedDevices().find(d => buildsEqual(d.build, build));

/**
 * Save under a name, replacing a build already called that — replace rather
 * than duplicate, which is also what "edit" is: re-saving under the name.
 */
export function saveDevice(rawName: string, build: DeviceBuild): SaveOutcome {
  const name = normalizeDeviceName(rawName);
  if (!name) return { kind: 'needsName' };
  const devices = savedDevices();
  const index = devices.findIndex(d => d.name === name);
  if (index >= 0) {
    devices[index] = { ...devices[index]!, build: sanitizeBuild(build) };
    persist(devices);
    return { kind: 'replaced', id: devices[index]!.id };
  }
  if (devices.length >= DEVICE_CAPACITY) return { kind: 'full' };
  const device: CustomDevice = { id: cryptoId(), name, build: sanitizeBuild(build) };
  persist([...devices, device]);
  return { kind: 'saved', id: device.id };
}

/**
 * Give a saved build a different name. Refuses a name another build already
 * holds rather than silently merging two builds into one.
 */
export function renameDevice(id: string, rawName: string): SaveOutcome {
  const name = normalizeDeviceName(rawName);
  if (!name) return { kind: 'needsName' };
  const devices = savedDevices();
  const index = devices.findIndex(d => d.id === id);
  if (index < 0) return { kind: 'needsName' };
  if (devices.some(d => d.id !== id && d.name === name)) return { kind: 'nameTaken' };
  devices[index] = { ...devices[index]!, name };
  persist(devices);
  return { kind: 'replaced', id };
}

export function deleteDevice(id: string): void {
  const devices = savedDevices().filter(d => d.id !== id);
  persist(devices);
}

export const devicesFull = (): boolean => savedDevices().length >= DEVICE_CAPACITY;

/** True when a build is worth saving at all (the stock device is not). */
export const isSaveable = (build: DeviceBuild): boolean => !isStock(build);
