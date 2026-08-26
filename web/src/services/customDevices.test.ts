import { afterEach, describe, expect, it } from 'vitest';
import {
  CUSTOM_DEVICES_KEY,
  DEVICE_CAPACITY,
  DEVICE_NAME_LIMIT,
  deleteDevice,
  matchingDevice,
  normalizeDeviceName,
  renameDevice,
  sanitizeDevices,
  saveDevice,
  savedDevices,
} from './customDevices';
import { STOCK_BUILD } from './deviceParts';

/** The saved-build store's rules, pinned against `CustomDevices.swift`. */

const build = (orb: string) => ({ ...STOCK_BUILD, orb });

describe('customDevices', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('normalises names the way the retro face demands', () => {
    // Trim, collapse runs, uppercase, clip — so `garage` and `GARAGE` cannot
    // be two builds that look identical in the list.
    expect(normalizeDeviceName('  my   garage  ')).toBe('MY GARAGE');
    expect(normalizeDeviceName('x'.repeat(40))).toHaveLength(DEVICE_NAME_LIMIT);
    expect(normalizeDeviceName('   ')).toBe('');
  });

  it('saves, and re-saving under a name replaces — which is how you edit', () => {
    const first = saveDevice('garage', build('VIOLET'));
    expect(first.kind).toBe('saved');
    const second = saveDevice('GARAGE', build('COBALT'));
    expect(second.kind).toBe('replaced');
    expect(savedDevices()).toHaveLength(1);
    expect(savedDevices()[0]!.build.orb).toBe('COBALT');
    // The id survives the replace — a replace is not a delete-and-recreate.
    expect((second as { id: string }).id).toBe((first as { id: string }).id);
  });

  it('refuses an unnameable save and a full list', () => {
    expect(saveDevice('   ', build('VIOLET')).kind).toBe('needsName');
    for (let i = 0; i < DEVICE_CAPACITY; i += 1) {
      expect(saveDevice(`BUILD ${i}`, build('VIOLET')).kind).toBe('saved');
    }
    expect(saveDevice('ONE MORE', build('COBALT')).kind).toBe('full');
    // But replacing an existing name still works on a full list.
    expect(saveDevice('BUILD 3', build('COBALT')).kind).toBe('replaced');
  });

  it('renames, and refuses a name another build already holds', () => {
    const a = saveDevice('ALPHA', build('VIOLET')) as { id: string };
    saveDevice('BETA', build('COBALT'));
    expect(renameDevice(a.id, 'GAMMA').kind).toBe('replaced');
    expect(savedDevices().map(d => d.name).sort()).toEqual(['BETA', 'GAMMA']);
    // A rename that ate an unrelated build would be a delete nobody asked for.
    expect(renameDevice(a.id, 'beta').kind).toBe('nameTaken');
  });

  it('derives which build is fitted, and never stores it', () => {
    saveDevice('GARAGE', build('VIOLET'));
    expect(matchingDevice(build('VIOLET'))?.name).toBe('GARAGE');
    // One part changed: the device is no longer wearing GARAGE, and the list
    // says so by matching nothing.
    expect(matchingDevice(build('COBALT'))).toBeUndefined();
  });

  it('removes the key outright when the list empties', () => {
    const saved = saveDevice('GARAGE', build('VIOLET')) as { id: string };
    expect(window.localStorage.getItem(CUSTOM_DEVICES_KEY)).not.toBeNull();
    deleteDevice(saved.id);
    expect(window.localStorage.getItem(CUSTOM_DEVICES_KEY)).toBeNull();
  });

  it('sanitises a stored list: dedupes by name, drops the unnameable, caps', () => {
    const raw = [
      { id: 'a', name: 'GARAGE', build: build('VIOLET') },
      { id: 'b', name: 'garage', build: build('COBALT') }, // dupe after normalise
      { id: 'c', name: '   ', build: build('COBALT') }, // unnameable
      ...Array.from({ length: 20 }, (_, i) => ({ id: `x${i}`, name: `B${i}`, build: build('SLATE') })),
    ];
    const clean = sanitizeDevices(raw);
    expect(clean).toHaveLength(DEVICE_CAPACITY);
    expect(clean[0]!.name).toBe('GARAGE');
    expect(clean[0]!.build.orb).toBe('VIOLET');
    expect(clean.some(d => d.name === '')).toBe(false);
  });
});
