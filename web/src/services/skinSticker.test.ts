import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CHASSIS_SKINS } from './theme';
import { skinStickerStem } from './skinSticker';

/** Every shell's sticker resolves to a real file; the two stickerless shells stay null. */
describe('skinStickerStem', () => {
  it('names a committed file for every shell that has one', () => {
    const files = new Set(readdirSync('web/public/art/sticker'));
    for (const id of Object.keys(CHASSIS_SKINS) as (keyof typeof CHASSIS_SKINS)[]) {
      const stem = skinStickerStem(id);
      if (id === 'ORANGE_WINE' || id === 'CHRISTMAS') {
        expect(stem, id).toBeNull();
      } else {
        expect(stem, id).toBeTruthy();
        expect(files.has(`${stem}.png`), `${id} -> ${stem}.png`).toBe(true);
      }
    }
  });
});
