import { isStandalone } from './shareLink';

/**
 * Installing the PWA, on purpose (v0.6.22, Phase 3).
 *
 * Until now installing relied on whatever the browser did by itself: Chrome
 * on Android shows its own banner when it feels like it, desktop Chrome
 * hides an icon in the address bar, and iOS Safari offers nothing unless you
 * already know about Share ▸ Add to Home Screen. Nothing in the app said
 * "you can keep this", which for a local-first, works-offline device is the
 * one thing worth saying.
 *
 * Chromium fires `beforeinstallprompt` when the manifest and service worker
 * pass its installability checks. This module catches that event **before
 * the app renders** (`bindInstallPrompt()` runs from `index.tsx`), holds it,
 * and lets SETTINGS ▸ DATA fire it from a row of its own. Where there is no
 * such event -- iOS, Firefox, an already-installed app -- `installSurface()`
 * says which hint to show instead, or none.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let bound = false;
const subscribers = new Set<() => void>();
const notify = (): void => subscribers.forEach(fn => fn());

/** Catch the browser's offer early. Idempotent; a no-op without a window. */
export const bindInstallPrompt = (): void => {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
};

/** For `useSyncExternalStore`: fires when the offer arrives, is spent, or the app is installed. */
export const subscribeInstall = (fn: () => void): (() => void) => {
  bindInstallPrompt();
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};

export const canPromptInstall = (): boolean => deferred !== null;

/** Fire the held offer. `unavailable` when there is none to fire. */
export const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
  const offer = deferred;
  if (!offer) return 'unavailable';
  await offer.prompt();
  const { outcome } = await offer.userChoice;
  // Spent either way: Chromium fires the event once per page load.
  deferred = null;
  notify();
  return outcome;
};

/** An iPhone or iPad, where the only install is Safari's Share sheet. */
export const isIosDevice = (ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): boolean =>
  /iP(hone|ad|od)/.test(ua)
  // iPadOS 13+ reports itself as a Mac; the touch points give it away.
  || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 1);

export type InstallSurface = 'standalone' | 'prompt' | 'ios' | 'none';

/**
 * Which install row to show. `standalone` means none: the app is already
 * on the home screen. The order matters -- an installed app on iOS is
 * standalone first, iOS second.
 */
export const installSurface = (): InstallSurface => {
  if (isStandalone()) return 'standalone';
  if (canPromptInstall()) return 'prompt';
  if (isIosDevice()) return 'ios';
  return 'none';
};
