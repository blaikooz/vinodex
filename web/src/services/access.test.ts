import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  browsableCount,
  entitlementBlurb,
  entitlementId,
  entitlementTitle,
  grantedIds,
  isGranted,
  isLocked,
  revokeAll,
  setStarterOnly,
  starterOnly,
  subscribeToAccess,
  toggleEntitlement,
  TESTABLE_ENTITLEMENTS,
} from './access';
import { getAllEntries } from './wineData';
import { WineEntry } from '@/shared/types';

/**
 * Ported from `vinodex-ios/Tests/VinodexCoreTests/AccessTests.swift`, against
 * the web port's documented divergence: iOS ships a `tiers.json` naming a free
 * slice, the web ships none, so with the switch on an entry is browsable only
 * if a granted bundle covers it. The Swift cases asserting a free-tier count
 * therefore have no counterpart; everything about how bundles grant access does.
 */
describe('access', () => {
  const all: WineEntry[] = getAllEntries();
  const grape = all.find(e => e.category === 'GRAPES')!;
  const continent = all.find(e => e.category === 'CONTINENTS')!;
  const flavor = all.find(e => e.category === 'FLAVORS')!;

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('has the fixtures the rest of this suite assumes', () => {
    expect(grape).toBeDefined();
    expect(continent).toBeDefined();
    expect(flavor).toBeDefined();
  });

  describe('the free-tier switch', () => {
    /** Defaults off: this app has no paywall, only a harness for testing one. */
    it('defaults off, and nothing is locked while it is', () => {
      expect(starterOnly()).toBe(false);
      for (const e of [grape, continent, flavor]) {
        expect(isLocked(e)).toBe(false);
      }
      expect(browsableCount(all)).toBe(all.length);
    });

    it('locks ungranted entries once turned on', () => {
      setStarterOnly(true);
      expect(starterOnly()).toBe(true);
      expect(isLocked(grape)).toBe(true);
      expect(browsableCount(all)).toBeLessThan(all.length);
    });

    it('turning it back off reopens everything', () => {
      setStarterOnly(true);
      setStarterOnly(false);
      expect(isLocked(grape)).toBe(false);
      expect(browsableCount(all)).toBe(all.length);
    });
  });

  describe('bundles', () => {
    beforeEach(() => {
      setStarterOnly(true);
    });

    it('pro unlocks everything', () => {
      toggleEntitlement({ kind: 'pro' });
      expect(isGranted({ kind: 'pro' })).toBe(true);
      expect(browsableCount(all)).toBe(all.length);
    });

    /**
     * Continents are the map. Locking the way in makes the rest unreachable
     * rather than unbought — the rule is straight from iOS.
     */
    it('never locks a continent, even with nothing granted', () => {
      expect(grantedIds()).toEqual([]);
      expect(isLocked(continent)).toBe(false);
    });

    it('the flavours bundle opens the flavour category only', () => {
      toggleEntitlement({ kind: 'flavors' });
      expect(isLocked(flavor)).toBe(false);
      expect(isLocked(grape)).toBe(true);
    });

    it('a country bundle opens that origin and no other', () => {
      const french = all.find(
        e => (e.details as { origin?: string }).origin === 'France' && e.category !== 'CONTINENTS',
      );
      const other = all.find(e => {
        const origin = (e.details as { origin?: string }).origin;
        return !!origin && origin !== 'France' && e.category !== 'CONTINENTS';
      });
      expect(french).toBeDefined();
      expect(other).toBeDefined();

      toggleEntitlement({ kind: 'country', name: 'France' });
      expect(isLocked(french!)).toBe(false);
      expect(isLocked(other!)).toBe(true);
    });

    it('matches an origin regardless of case', () => {
      const french = all.find(
        e => (e.details as { origin?: string }).origin === 'France' && e.category !== 'CONTINENTS',
      );
      expect(french).toBeDefined();
      toggleEntitlement({ kind: 'country', name: 'france' });
      expect(isLocked(french!)).toBe(false);
    });

    it('toggling a bundle off locks it again', () => {
      toggleEntitlement({ kind: 'pro' });
      toggleEntitlement({ kind: 'pro' });
      expect(isGranted({ kind: 'pro' })).toBe(false);
      expect(isLocked(grape)).toBe(true);
    });

    it('revokeAll drops every grant', () => {
      toggleEntitlement({ kind: 'pro' });
      toggleEntitlement({ kind: 'flavors' });
      revokeAll();
      expect(grantedIds()).toEqual([]);
    });

    it('grants survive a re-read', () => {
      toggleEntitlement({ kind: 'country', name: 'Italy' });
      expect(grantedIds()).toEqual(['country:Italy']);
      expect(isGranted({ kind: 'country', name: 'Italy' })).toBe(true);
    });
  });

  describe('entitlement identity', () => {
    /**
     * Bundles are identified by string so a stored grant survives a change to
     * the model — the reasoning the Swift `id` carries.
     */
    it('ids are stable and distinct', () => {
      const ids = TESTABLE_ENTITLEMENTS.map(entitlementId);
      expect(new Set(ids).size).toBe(ids.length);
      expect(entitlementId({ kind: 'pro' })).toBe('pro');
      expect(entitlementId({ kind: 'country', name: 'France' })).toBe('country:France');
    });

    it('every testable bundle has a title and a blurb', () => {
      for (const e of TESTABLE_ENTITLEMENTS) {
        expect(entitlementTitle(e).length).toBeGreaterThan(0);
        expect(entitlementBlurb(e).length).toBeGreaterThan(0);
      }
    });
  });

  it('notifies subscribers when the switch or a bundle changes', () => {
    const seen = vi.fn();
    const unsubscribe = subscribeToAccess(seen);

    setStarterOnly(true);
    expect(seen).toHaveBeenCalledTimes(1);

    toggleEntitlement({ kind: 'pro' });
    expect(seen).toHaveBeenCalledTimes(2);

    unsubscribe();
    revokeAll();
    expect(seen).toHaveBeenCalledTimes(2);
  });
});
