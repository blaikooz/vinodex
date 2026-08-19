import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CAPACITY,
  DEFAULTS,
  MARQUEE_PINS,
  QUICK_PINS_KEY,
  decodePins,
  pinAt,
  pinDisplayName,
  pinRoute,
  pinSection,
  pins,
} from './quickPins';
import { SETTINGS_SECTIONS } from './settingsSections';
import { STORAGE_KEYS } from './storageKeys';

/**
 * The two marquee lamp buttons and where they point.
 *
 * Ported from `vinodex-ios/Tests/VinodexCoreTests` coverage of
 * `QuickPinStore`. The decoder's four worked examples are iOS's own, written
 * into its doc comment as the migration argument, and they are the cases a
 * hand-edited or older stored value actually produces.
 */

/**
 * The module memoises its first read (see the note on `cache`), so a case that
 * seeds localStorage has to get a module that has not read it yet.
 * `vi.resetModules()` drops the registry; the dynamic import re-evaluates.
 */
const fresh = async (): Promise<typeof import('./quickPins')> => {
  vi.resetModules();
  return import('./quickPins');
};

describe('the pin vocabulary', () => {
  it('is the settings sections plus TOOLS, minus DEV', () => {
    // iOS: "the raw values are a strict superset of SettingsSection's", with
    // DEV the one case that could never have been stored. If a section is
    // added or renamed, this is the test that says whether the lamps follow.
    const sections = SETTINGS_SECTIONS.filter(s => s.id !== 'DEV').map(s => s.id);
    expect([...MARQUEE_PINS].sort()).toEqual([...sections, 'TOOLS'].sort());
    expect(MARQUEE_PINS).not.toContain('DEV');
  });

  it('sends every pin somewhere real, and TOOLS to the shelf', () => {
    // The rule the one-expression `pinRoute` exists to hold: a pin cannot
    // name a destination its own label disagrees with.
    for (const pin of MARQUEE_PINS) {
      const section = pinSection(pin);
      expect(pinRoute(pin)).toBe(section ? `/settings/${section}` : '/minigames');
      expect(pinDisplayName(pin)).toBe(pin);
    }
    expect(pinSection('TOOLS')).toBeNull();
    expect(pinRoute('TOOLS')).toBe('/minigames');
  });

  it('is registered as persisted vocabulary', () => {
    expect(STORAGE_KEYS.map(k => k.key)).toContain(QUICK_PINS_KEY);
  });

  it('keeps iOS spelling for the key, the cap and the shipped pair', () => {
    // Persisted vocabulary: renaming any of these silently resets the pins of
    // everyone who had set any.
    expect(QUICK_PINS_KEY).toBe('marqueeQuickPins');
    expect(CAPACITY).toBe(2);
    expect(DEFAULTS).toEqual(['TOOLS', 'CUSTOMIZE']);
  });
});

describe('decodePins', () => {
  it('gives a device that never pinned anything the shipped pair', () => {
    expect(decodePins('')).toEqual(['TOOLS', 'CUSTOMIZE']);
  });

  it('pads a single stored pin, keeping the slot it was in', () => {
    // iOS's worked example: the pin they chose keeps its slot, and the first
    // unused default fills the other.
    expect(decodePins('SETTINGS')).toEqual(['SETTINGS', 'TOOLS']);
  });

  it('leaves a full stored pair untouched', () => {
    expect(decodePins('DATA,ACCESS')).toEqual(['DATA', 'ACCESS']);
  });

  it('drops a value this app never wrote, then pads', () => {
    // 'PACKS' is a section iOS retired and the web never had.
    expect(decodePins('PACKS,DATA')).toEqual(['DATA', 'TOOLS']);
  });

  it('drops duplicates rather than lighting two lamps the same', () => {
    expect(decodePins('DATA,DATA')).toEqual(['DATA', 'TOOLS']);
  });

  it('never returns fewer or more than two, whatever it is given', () => {
    // "A lamp cannot be empty" — the invariant every call site relies on.
    for (const raw of ['', 'DEV', 'garbage', 'TOOLS,CUSTOMIZE,SETTINGS,DATA', ',,,', 'DATA']) {
      const out = decodePins(raw);
      expect(out, raw).toHaveLength(CAPACITY);
      expect(new Set(out).size, `${raw} produced a duplicate`).toBe(CAPACITY);
    }
  });
});

describe('assignPin', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('points a lamp and leaves its neighbour alone', async () => {
    const m = await fresh();
    expect(m.pins()).toEqual(['TOOLS', 'CUSTOMIZE']);
    m.assignPin('DATA', 0);
    expect(m.pins()).toEqual(['DATA', 'CUSTOMIZE']);
    expect(window.localStorage.getItem(QUICK_PINS_KEY)).toBe('DATA,CUSTOMIZE');
  });

  it('swaps when the other lamp already holds it', async () => {
    // THE rule: "a device with two identical buttons is not a choice anybody
    // made". Assigning the right lamp's pin to the left trades the two.
    const m = await fresh();
    m.assignPin('CUSTOMIZE', 0);
    expect(m.pins()).toEqual(['CUSTOMIZE', 'TOOLS']);
  });

  it('does nothing when the lamp already points there', async () => {
    const m = await fresh();
    m.assignPin('TOOLS', 0);
    expect(m.pins()).toEqual(['TOOLS', 'CUSTOMIZE']);
  });

  it('ignores a slot that is not a lamp', async () => {
    const m = await fresh();
    m.assignPin('DATA', 2);
    m.assignPin('DATA', -1);
    expect(m.pins()).toEqual(['TOOLS', 'CUSTOMIZE']);
  });

  it('tells its subscribers', async () => {
    const m = await fresh();
    let beats = 0;
    const stop = m.subscribeToPins(() => { beats += 1; });
    const before = m.pinsRevision();
    m.assignPin('ACCESS', 1);
    expect(beats).toBe(1);
    expect(m.pinsRevision()).toBeGreaterThan(before);
    stop();
    m.assignPin('DATA', 1);
    expect(beats).toBe(1);
  });

  it('removes the key when the lamps are back at the factory pair (W-9)', async () => {
    // iOS's `persist()` does this, on the principle that a stored value equal
    // to the default and no stored value must not be two different states.
    // Nothing on the web can currently tell them apart — `decodePins('')`
    // returns DEFAULTS and every reader goes through it — but the two stores
    // are answerable to one description, and a never-customised device should
    // look like one in storage.
    const m = await fresh();
    m.assignPin('DATA', 0);
    expect(window.localStorage.getItem(QUICK_PINS_KEY)).toBe('DATA,CUSTOMIZE');
    m.assignPin('TOOLS', 0);
    expect(m.pins()).toEqual(['TOOLS', 'CUSTOMIZE']);
    expect(window.localStorage.getItem(QUICK_PINS_KEY)).toBeNull();
  });

  it('reads a stored pair back on the next load', async () => {
    window.localStorage.setItem(QUICK_PINS_KEY, 'ACCESS,DATA');
    const m = await fresh();
    expect(m.pins()).toEqual(['ACCESS', 'DATA']);
    expect(m.pinAt(0)).toBe('ACCESS');
    expect(m.pinAt(1)).toBe('DATA');
  });
});

describe('pinAt', () => {
  it('answers for both lamps, and falls back rather than throwing', () => {
    expect(pins()).toHaveLength(CAPACITY);
    expect(pinAt(0)).toBe(pins()[0]);
    expect(pinAt(1)).toBe(pins()[1]);
    // The store always holds `CAPACITY` pins, so this is a formality — but a
    // chassis that crashed because a list was short would be a poor trade for
    // one saved line. iOS makes the same guard at its own call site.
    expect(MARQUEE_PINS).toContain(pinAt(9));
  });
});
