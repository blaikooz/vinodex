import { beforeEach, describe, expect, it } from 'vitest';
import {
  anchor,
  clear,
  forget,
  isEmpty,
  isOn,
  keyForCountry,
  keyForDetail,
  keyForList,
  keyForState,
  query,
  setAnchor,
  setFlag,
  setQuery,
  toggleFlag,
} from './screenState';

/**
 * `screenState` has no Swift test suite to port — it is named in IOS-PARITY.md
 * as one of the untested web services whose Swift original
 * (`ScreenState.swift`) does have tests. These cases are written against the
 * behaviours its own header documents as load-bearing, because each of them is
 * a bug that was actually shipped once: a shared scroll position between two
 * countries, an anchor surviving a changed query, and Back clearing what it was
 * meant to restore.
 *
 * The store is a module-level singleton and deliberately not persisted, so
 * `clear()` between tests is the whole reset — there is no storage to wipe.
 */
describe('screenState', () => {
  beforeEach(() => {
    clear();
  });

  it('starts empty', () => {
    expect(isEmpty()).toBe(true);
    expect(anchor('detail:G001')).toBeNull();
    expect(query('list:/list/GRAPES')).toBe('');
    expect(isOn('detail:G001', 'flavors')).toBe(false);
  });

  describe('anchors', () => {
    it('round-trips', () => {
      setAnchor('detail:G001', 'section-rarity');
      expect(anchor('detail:G001')).toBe('section-rarity');
      expect(isEmpty()).toBe(false);
    });

    it('null removes rather than storing a null', () => {
      setAnchor('detail:G001', 'section-rarity');
      setAnchor('detail:G001', null);
      expect(anchor('detail:G001')).toBeNull();
      expect(isEmpty()).toBe(true);
    });

    /** The bug this store exists to prevent: two pages sharing a position. */
    it('keeps separate positions per screen instance', () => {
      setAnchor(keyForCountry('France'), 'saint-emilion');
      setAnchor(keyForCountry('Italy'), 'barolo');
      expect(anchor(keyForCountry('France'))).toBe('saint-emilion');
      expect(anchor(keyForCountry('Italy'))).toBe('barolo');
    });
  });

  describe('flags', () => {
    it('sets, reads and toggles', () => {
      setFlag('detail:G001', 'flavors', true);
      expect(isOn('detail:G001', 'flavors')).toBe(true);

      toggleFlag('detail:G001', 'flavors');
      expect(isOn('detail:G001', 'flavors')).toBe(false);

      toggleFlag('detail:G001', 'flavors');
      expect(isOn('detail:G001', 'flavors')).toBe(true);
    });

    it('holds several flags on one screen independently', () => {
      setFlag('detail:G001', 'flavors', true);
      setFlag('detail:G001', 'regions', true);
      setFlag('detail:G001', 'flavors', false);
      expect(isOn('detail:G001', 'flavors')).toBe(false);
      expect(isOn('detail:G001', 'regions')).toBe(true);
    });

    /** Off is absence, so collapsing everything must leave nothing behind. */
    it('is empty again once every flag is off', () => {
      setFlag('detail:G001', 'flavors', true);
      setFlag('detail:G001', 'regions', true);
      setFlag('detail:G001', 'flavors', false);
      setFlag('detail:G001', 'regions', false);
      expect(isEmpty()).toBe(true);
    });

    it('turning off a flag that was never on is a no-op', () => {
      setFlag('detail:G001', 'never', false);
      expect(isEmpty()).toBe(true);
    });
  });

  describe('queries', () => {
    it('round-trips', () => {
      setQuery(keyForList('/list/GRAPES'), 'nebbiolo');
      expect(query(keyForList('/list/GRAPES'))).toBe('nebbiolo');
    });

    it('an empty query is removed rather than stored', () => {
      setQuery(keyForList('/list/GRAPES'), 'nebbiolo');
      setQuery(keyForList('/list/GRAPES'), '');
      expect(query(keyForList('/list/GRAPES'))).toBe('');
      expect(isEmpty()).toBe(true);
    });

    /**
     * A changed query makes the old anchor meaningless — that row may not even
     * be in the new results — so restoring it would scroll somewhere random.
     */
    it('setting a query drops that listing anchor', () => {
      const key = keyForList('/list/GRAPES');
      setAnchor(key, 'row-42');
      setQuery(key, 'neb');
      expect(anchor(key)).toBeNull();
      expect(query(key)).toBe('neb');
    });

    it('does not disturb another listing anchor', () => {
      const grapes = keyForList('/list/GRAPES');
      const regions = keyForList('/list/REGIONS');
      setAnchor(regions, 'row-7');
      setQuery(grapes, 'neb');
      expect(anchor(regions)).toBe('row-7');
    });
  });

  describe('clear and forget', () => {
    it('clear drops everything', () => {
      setAnchor('detail:G001', 'a');
      setFlag('detail:G001', 'f', true);
      setQuery(keyForList('/list/GRAPES'), 'q');
      clear();
      expect(isEmpty()).toBe(true);
    });

    it('forget drops one screen and leaves the rest', () => {
      setAnchor(keyForCountry('France'), 'a');
      setFlag(keyForCountry('France'), 'f', true);
      setQuery(keyForCountry('France'), 'q');
      setAnchor(keyForCountry('Italy'), 'b');

      forget(keyForCountry('France'));

      expect(anchor(keyForCountry('France'))).toBeNull();
      expect(isOn(keyForCountry('France'), 'f')).toBe(false);
      expect(query(keyForCountry('France'))).toBe('');
      expect(anchor(keyForCountry('Italy'))).toBe('b');
    });
  });

  describe('keys', () => {
    it('are prefixed per screen kind', () => {
      expect(keyForDetail('G001')).toBe('detail:G001');
      expect(keyForCountry('France')).toBe('country:France');
      expect(keyForState('Oregon')).toBe('state:Oregon');
      expect(keyForList('/list/GRAPES')).toBe('list:/list/GRAPES');
    });

    /** Washington is both a country-level gate and a state; they must not collide. */
    it('do not collide between a country and a state of the same name', () => {
      expect(keyForCountry('Washington')).not.toBe(keyForState('Washington'));
      setAnchor(keyForCountry('Washington'), 'c');
      setAnchor(keyForState('Washington'), 's');
      expect(anchor(keyForCountry('Washington'))).toBe('c');
      expect(anchor(keyForState('Washington'))).toBe('s');
    });

    /** A filtered listing is a different page from the unfiltered one. */
    it('distinguish a filtered listing from its base', () => {
      const base = keyForList('/list/GRAPES');
      const filtered = keyForList('/list/GRAPES?filterMode=TYPE&filterValue=RED');
      expect(base).not.toBe(filtered);
      setAnchor(base, 'top');
      setAnchor(filtered, 'deep');
      expect(anchor(base)).toBe('top');
      expect(anchor(filtered)).toBe('deep');
    });
  });
});
