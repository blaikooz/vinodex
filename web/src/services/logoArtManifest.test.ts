import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const LOGO_DIR = path.resolve(__dirname, '../../public/art/logo');
const IOS_LOGO_ART = [
  'vinodex-logo.png',
  'vinodex-mark-face.png',
  'vinodex-mark-shade.png',
];

describe('iOS Logo mirror', () => {
  it('contains the complete canonical logo set', () => {
    expect(fs.readdirSync(LOGO_DIR).filter(file => file.endsWith('.png')).sort())
      .toEqual(IOS_LOGO_ART);
  });

  it('contains readable PNG assets and is named in the one-way sync', () => {
    for (const file of IOS_LOGO_ART) {
      const payload = fs.readFileSync(path.join(LOGO_DIR, file));
      expect(payload.byteLength, `${file} is empty`).toBeGreaterThan(500);
      expect([...payload.subarray(0, 8)], `${file} is not a PNG`).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
    }
    const sync = fs.readFileSync(path.resolve(__dirname, '../../../scripts/sync-shared.snapshot.ps1'), 'utf8');
    expect(sync).toMatch(/From\s*=\s*'Logo';\s*To\s*=\s*'logo'/);
  });
});
