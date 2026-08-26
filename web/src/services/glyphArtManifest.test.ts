import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const GLYPH_DIR = path.resolve(__dirname, '../../public/art/glyph');

const IOS_GLYPH_ART = [
  'glyph-battery.png',
  'glyph-bell.png',
  'glyph-bookmark.png',
  'glyph-cog.png',
  'glyph-firmware.png',
  'glyph-gaming.png',
  'glyph-hammer.png',
  'glyph-heart.png',
  'glyph-labelscanner.png',
  'glyph-level1.png',
  'glyph-level2.png',
  'glyph-level3.png',
  'glyph-level4.png',
  'glyph-level5.png',
  'glyph-mail.png',
  'glyph-seal.png',
  'glyph-sounds-off.png',
  'glyph-sounds-on.png',
  'glyph-stamp.png',
  'glyph-star.png',
  'glyph-tools.png',
  'glyph-trophy.png',
];

describe('iOS GlyphArt mirror', () => {
  it('contains the complete canonical glyph-art set with no web-only strays', () => {
    const files = fs.readdirSync(GLYPH_DIR).filter(file => file.endsWith('.png')).sort();
    expect(files).toEqual(IOS_GLYPH_ART);
  });

  it('is named in the one-way iOS-to-web art sync', () => {
    const snapshot = path.resolve(__dirname, '../../../scripts/sync-shared.snapshot.ps1');
    const source = fs.readFileSync(snapshot, 'utf8');
    expect(source).toMatch(/From\s*=\s*'GlyphArt';\s*To\s*=\s*'glyph'/);
  });

  it('contains readable, distinct PNG payloads rather than empty or duplicated mirrors', () => {
    const signatures = new Map<string, string>();
    for (const file of IOS_GLYPH_ART) {
      const payload = fs.readFileSync(path.join(GLYPH_DIR, file));
      expect(payload.byteLength, `${file} is suspiciously small`).toBeGreaterThan(500);
      expect([...payload.subarray(0, 8)], `${file} does not carry a PNG signature`).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);

      const digest = createHash('sha256').update(payload).digest('hex');
      expect(signatures.get(digest), `${file} duplicates another GlyphArt payload`).toBeUndefined();
      signatures.set(digest, file);
    }
  });
});
