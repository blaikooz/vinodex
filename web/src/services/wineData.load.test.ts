import { describe, expect, it, vi } from 'vitest';

/**
 * The catalogue is a dynamic import (v0.6.31, Phase 6 LCP): nothing on the
 * page carries the tables until a dex route asks. A fresh module instance --
 * `resetModules`, since `test-setup.ts` preloads the shared one -- shows the
 * three states: not loaded (a named throw, not an empty list), one shared
 * flight, and loaded for good.
 */
describe('wineData loading (v0.6.31)', () => {
  it('throws by name before the load, shares one flight, then answers synchronously', async () => {
    vi.resetModules();
    const fresh = await import('./wineData');
    expect(fresh.peekEntries()).toBeNull();
    expect(() => fresh.getAllEntries()).toThrow(/loadAllEntries/);
    const a = fresh.loadAllEntries();
    const b = fresh.loadAllEntries();
    expect(b).toBe(a);
    const list = await a;
    expect(list.length).toBeGreaterThan(300);
    expect(fresh.getAllEntries()).toBe(list);
    expect(fresh.peekEntries()).toBe(list);
    expect(await fresh.loadAllEntries()).toBe(list);
  });
});
