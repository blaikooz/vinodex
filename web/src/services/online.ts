/**
 * Whether the browser believes it has a network (v0.6.21, Phase 3 offline).
 *
 * The app is local-first and its shell, fonts and catalogue are precached,
 * so being offline mostly *works* -- which is exactly why nothing said so.
 * A portrait that had never been seen simply failed, and a visitor had no
 * way to tell "the app is broken" from "I am in a tunnel". This is the one
 * fact, read once, for the OFFLINE pill in `DeviceLayout` and anything else
 * that wants it.
 *
 * `navigator.onLine` is a coarse signal (a captive portal reads as online),
 * but it is the only one the platform offers without a probe request, and
 * a probe is a network request the privacy page would have to mention.
 */
const subscribers = new Set<() => void>();
let bound = false;

const notify = (): void => subscribers.forEach(fn => fn());

const bind = (): void => {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  window.addEventListener('online', notify);
  window.addEventListener('offline', notify);
};

/** True unless the browser says otherwise; true where there is no browser. */
export const isOnline = (): boolean =>
  typeof navigator === 'undefined' || navigator.onLine !== false;

/** For `useSyncExternalStore`: fires on the browser's own online/offline events. */
export const subscribeOnline = (fn: () => void): (() => void) => {
  bind();
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};
