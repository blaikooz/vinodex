/**
 * KEEP AWAKE (iOS `ScreenWake`, web v0.6.45): reading a bottle takes longer
 * than the auto-lock allows. The key -- `keepAwakeEnabled` -- has been
 * registered in `storageKeys.ts` and carried by the backup archive since the
 * archive existed; this is the module that finally reads it.
 *
 * The Screen Wake Lock API is the whole implementation: a sentinel held
 * while the setting is on and the page is visible, re-acquired when the tab
 * comes back (the browser releases it on hide), released and dropped when
 * the setting turns off. Browsers without the API get a toggle that stores
 * its promise and does nothing -- the setting still round-trips through the
 * archive, which is what it did for the last twenty releases anyway.
 */
const KEY = 'keepAwakeEnabled';

type WakeSentinel = { release(): Promise<void>; addEventListener?: unknown };

let sentinel: WakeSentinel | null = null;
let installed = false;

export function keepAwakeEnabled(): boolean {
  try {
    return window.localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

export function setKeepAwakeEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(KEY, on ? 'true' : 'false');
  } catch {
    /* ignore */
  }
  // Applied now rather than at the next launch -- a setting whose effect
  // you cannot observe reads as broken (iOS ScreenWake.settingChanged).
  void applyWakeState();
}

async function applyWakeState(): Promise<void> {
  const wakeLock = (navigator as { wakeLock?: { request(type: 'screen'): Promise<WakeSentinel> } }).wakeLock;
  if (!wakeLock) return;
  if (keepAwakeEnabled() && document.visibilityState === 'visible') {
    if (sentinel) return;
    try {
      sentinel = await wakeLock.request('screen');
    } catch {
      sentinel = null; // A denied lock (battery saver, policy) is the browser's call.
    }
  } else if (sentinel) {
    const held = sentinel;
    sentinel = null;
    try {
      await held.release();
    } catch {
      /* already released */
    }
  }
}

/** Call once at app start: takes the lock if the stored setting asks, and re-takes it whenever the tab returns. */
export function installScreenWake(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener('visibilitychange', () => void applyWakeState());
  void applyWakeState();
}

/** Test seam: what the module currently holds. */
export const heldSentinel = (): unknown => sentinel;
