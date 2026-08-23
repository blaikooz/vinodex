import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

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
});
