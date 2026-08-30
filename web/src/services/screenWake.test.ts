import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { heldSentinel, installScreenWake, keepAwakeEnabled, setKeepAwakeEnabled } from './screenWake';

/** KEEP AWAKE (v0.6.45): the stored key finally drives a real wake lock. */
beforeEach(() => window.localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { wakeLock?: unknown }).wakeLock;
});

describe('screenWake', () => {
  it('round-trips the registered key', () => {
    expect(keepAwakeEnabled()).toBe(false);
    setKeepAwakeEnabled(true);
    expect(window.localStorage.getItem('keepAwakeEnabled')).toBe('true');
    setKeepAwakeEnabled(false);
    expect(keepAwakeEnabled()).toBe(false);
  });

  it('takes the lock when asked and releases it when turned off', async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const request = vi.fn().mockResolvedValue({ release });
    (navigator as { wakeLock?: unknown }).wakeLock = { request };
    installScreenWake();
    setKeepAwakeEnabled(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(request).toHaveBeenCalledWith('screen');
    expect(heldSentinel()).toBeTruthy();
    setKeepAwakeEnabled(false);
    await Promise.resolve();
    await Promise.resolve();
    expect(release).toHaveBeenCalled();
    expect(heldSentinel()).toBeNull();
  });

  it('is a stored preference and nothing more where the API is absent', () => {
    setKeepAwakeEnabled(true);
    expect(keepAwakeEnabled()).toBe(true);
    expect(heldSentinel()).toBeNull();
  });
});
