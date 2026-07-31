/**
 * Light haptics, the web analogue of iOS's `Haptics`. On by default (as iOS
 * has them), toggled from settings. Uses the Vibration API, which is Android/
 * Chrome only — iOS Safari ignores it, so this is a no-op there rather than a
 * fallback. Rides button clicks via one global listener, like the sound pack.
 */

const STORAGE_KEY = 'hapticsEnabled';

let revision = 0;
const listeners = new Set<() => void>();

export function hapticsEnabled(): boolean {
  try {
    // Default ON: only an explicit "false" disables it.
    return window.localStorage.getItem(STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'true' : 'false');
  } catch {
    /* ignore */
  }
  revision += 1;
  listeners.forEach(fn => fn());
}

export function tapHaptic(): void {
  if (!hapticsEnabled()) return;
  try {
    navigator.vibrate?.(8);
  } catch {
    /* devices without the API just get silence */
  }
}

export function installGlobalHaptics(): void {
  if (typeof document === 'undefined') return;
  document.addEventListener(
    'click',
    e => {
      if (!hapticsEnabled()) return;
      const el = e.target as HTMLElement | null;
      if (el && el.closest('button')) tapHaptic();
    },
    true,
  );
}

export function subscribeToHaptics(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}
export function hapticsRevision(): number {
  return revision;
}
