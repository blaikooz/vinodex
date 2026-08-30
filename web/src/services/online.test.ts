import { afterEach, describe, expect, it, vi } from 'vitest';
import { isOnline, subscribeOnline } from './online';

describe('the online signal', () => {
  afterEach(() => vi.restoreAllMocks());

  it("reads the browser's own flag", () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    expect(isOnline()).toBe(true);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(isOnline()).toBe(false);
  });

  it("notifies on the browser's online/offline events, and stops when unsubscribed", () => {
    const fn = vi.fn();
    const stop = subscribeOnline(fn);
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    expect(fn).toHaveBeenCalledTimes(2);
    stop();
    window.dispatchEvent(new Event('offline'));
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
