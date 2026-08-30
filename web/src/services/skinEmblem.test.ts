import { describe, it, expect } from 'vitest';
import { SKIN_EMBLEM } from './skinEmblem';
import { CHASSIS_SKINS } from './theme';

describe('SKIN_EMBLEM (v0.6.30)', () => {
  it('gives every chassis skin an emblem glyph for the picker mockup', () => {
    for (const id of Object.keys(CHASSIS_SKINS)) {
      expect(SKIN_EMBLEM[id as keyof typeof SKIN_EMBLEM], id).toBeTruthy();
    }
  });
});
