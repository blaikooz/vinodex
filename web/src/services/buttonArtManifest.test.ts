import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const BUTTON_DIR = path.resolve(__dirname, '../../public/art/button');

const IOS_BUTTON_ART = [
  'backarrow.png',
  'blindtasting.png',
  'camera.png',
  'cheatcodes.png',
  'customize.png',
  'dailychallenge.png',
  'data.png',
  'demomode.png',
  'dev.png',
  'edit.png',
  'firmware.png',
  'flavors.png',
  'grapes.png',
  'haptics.png',
  'home.png',
  'labelscanner.png',
  'moondial.png',
  'numberedstack.png',
  'passport.png',
  'regions.png',
  'search.png',
  'settings.png',
  'shop.png',
  'sounds.png',
  'styles.png',
  'system.png',
  'tools.png',
  'tutorial.png',
  'user.png',
  'wineexam.png',
  'workshop.png',
];

describe('iOS ButtonArt mirror', () => {
  it('contains the complete canonical button-art set with no web-only strays', () => {
    const files = fs.readdirSync(BUTTON_DIR).filter(file => file.endsWith('.png')).sort();
    expect(files).toEqual(IOS_BUTTON_ART);
  });

  it('is named in the one-way iOS-to-web art sync', () => {
    const snapshot = path.resolve(__dirname, '../../../scripts/sync-shared.snapshot.ps1');
    const source = fs.readFileSync(snapshot, 'utf8');
    expect(source).toMatch(/From\s*=\s*'ButtonArt';\s*To\s*=\s*'button'/);
  });

  it('contains readable, distinct PNG payloads rather than empty or duplicated mirrors', () => {
    const signatures = new Map<string, string>();
    for (const file of IOS_BUTTON_ART) {
      const payload = fs.readFileSync(path.join(BUTTON_DIR, file));
      expect(payload.byteLength, `${file} is suspiciously small`).toBeGreaterThan(1_000);
      expect([...payload.subarray(0, 8)], `${file} does not carry a PNG signature`).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);

      const digest = createHash('sha256').update(payload).digest('hex');
      expect(signatures.get(digest), `${file} duplicates another ButtonArt payload`).toBeUndefined();
      signatures.set(digest, file);
    }
  });
});
