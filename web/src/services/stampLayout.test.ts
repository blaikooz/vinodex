import { beforeEach, describe, expect, it } from 'vitest';
import { STAMP_LAYOUT_KEY, moveStamp, stampOffset, stampOffsets } from './stampLayout';

/** iOS StampLayoutStore's contract, key for key (v0.6.48). */
beforeEach(() => window.localStorage.clear());

describe('the stamp layout', () => {
  it('stores a move, reads it back, and treats absence as home', () => {
    expect(stampOffset('firstSip')).toEqual({ dx: 0, dy: 0 });
    moveStamp('firstSip', { dx: 12, dy: -30 });
    expect(stampOffset('firstSip')).toEqual({ dx: 12, dy: -30 });
    expect(JSON.parse(window.localStorage.getItem(STAMP_LAYOUT_KEY)!)).toEqual({ firstSip: { dx: 12, dy: -30 } });
  });

  it('a move back to the issued spot clears the entry, and an empty map leaves nothing behind', () => {
    moveStamp('firstSip', { dx: 12, dy: -30 });
    moveStamp('firstSip', { dx: 0, dy: 0 });
    expect(window.localStorage.getItem(STAMP_LAYOUT_KEY)).toBeNull();
  });

  it('shrugs off a corrupted blob', () => {
    window.localStorage.setItem(STAMP_LAYOUT_KEY, '{"a":{"dx":"NaN"},"b":[1],"c":{"dx":1,"dy":2}}');
    expect(stampOffsets()).toEqual({ c: { dx: 1, dy: 2 } });
  });
});
