import { beforeEach, describe, expect, it } from 'vitest';
import {
  FRESH_PROFILE_NAME,
  MAX_PROFILES,
  currentSnapshot,
  isAppStateKey,
  loadProfile,
  profileInSlot,
  profiles,
  saveProfile,
  snapshotOfSlot,
} from './userProfiles';

/**
 * Ported from the slot-logic cases of
 * `vinodex-ios/Tests/VinodexCoreTests/` UserProfiles coverage. The plist/file
 * IO cases have no counterpart — the web store is localStorage-backed and the
 * jsdom store here is the injected directory's analogue.
 */
describe('user profiles', () => {
  beforeEach(() => localStorage.clear());

  it('HORIZON is seeded once, and only when no index exists at all', () => {
    const first = profiles();
    expect(first).toEqual([{ slot: 1, name: 'HORIZON', savedAt: null }]);
    // An empty index that *does* exist means the user deleted their
    // profiles; re-seeding would resurrect what they removed.
    localStorage.setItem('userProfilesIndex', '[]');
    expect(profiles()).toEqual([]);
  });

  it('the store keys are outside the domain it snapshots', () => {
    expect(isAppStateKey('bookmarkedEntryIDs')).toBe(true);
    expect(isAppStateKey('examResults')).toBe(true);
    expect(isAppStateKey('userProfilesIndex')).toBe(false);
    expect(isAppStateKey('userProfileSlot-3')).toBe(false);
    localStorage.setItem('triedEntryIDs', '["G001"]');
    saveProfile(2, 'PAT');
    const snap = currentSnapshot();
    expect(snap.triedEntryIDs).toBe('["G001"]');
    expect(Object.keys(snap).some(k => k.startsWith('userProfile'))).toBe(false);
  });

  it('a populated domain round-trips through a slot', () => {
    localStorage.setItem('triedEntryIDs', '["G001","S002"]');
    localStorage.setItem('dailyStreak', '4');
    localStorage.setItem('chassisSkin', 'BURGUNDY');
    expect(saveProfile(2, 'PAT')).toBe(true);

    localStorage.setItem('triedEntryIDs', '["G099"]');
    localStorage.setItem('dailyStreak', '0');
    loadProfile(2);
    expect(localStorage.getItem('triedEntryIDs')).toBe('["G001","S002"]');
    expect(localStorage.getItem('dailyStreak')).toBe('4');
    expect(localStorage.getItem('chassisSkin')).toBe('BURGUNDY');
    // The index survives the load — it lives outside the domain.
    expect(profileInSlot(2)?.name).toBe('PAT');
  });

  it('loading FRESH or a never-saved slot is a fresh install, every time', () => {
    localStorage.setItem('triedEntryIDs', '["G001"]');
    // HORIZON is seeded but never saved into — loading it is a fresh start.
    expect(profileInSlot(1)?.savedAt).toBe(null);
    expect(snapshotOfSlot(1)).toBe(null);
    loadProfile(1);
    expect(localStorage.getItem('triedEntryIDs')).toBe(null);

    localStorage.setItem('triedEntryIDs', '["G002"]');
    loadProfile('fresh');
    expect(localStorage.getItem('triedEntryIDs')).toBe(null);
  });

  it('an occupied slot keeps its name when none is passed, and renames when one is', () => {
    saveProfile(3, 'FIRST');
    saveProfile(3);
    expect(profileInSlot(3)?.name).toBe('FIRST');
    saveProfile(3, 'SECOND');
    expect(profileInSlot(3)?.name).toBe('SECOND');
  });

  it('an out-of-range slot is refused', () => {
    expect(saveProfile(0)).toBe(false);
    expect(saveProfile(MAX_PROFILES + 1)).toBe(false);
  });

  it('a hand-edited index drops strangers and duplicates', () => {
    localStorage.setItem(
      'userProfilesIndex',
      JSON.stringify([
        { slot: 2, name: 'OK', savedAt: 1 },
        { slot: 2, name: 'DUPE', savedAt: 2 },
        { slot: 99, name: 'STRANGER', savedAt: 3 },
        { slot: 1, name: 'ALSO OK', savedAt: null },
      ]),
    );
    expect(profiles().map(p => `${p.slot}:${p.name}`)).toEqual(['1:ALSO OK', '2:OK']);
  });

  it('FRESH is a reserved name, not a slot', () => {
    expect(FRESH_PROFILE_NAME).toBe('FRESH');
    expect(profiles().some(p => p.name === FRESH_PROFILE_NAME)).toBe(false);
  });
});
