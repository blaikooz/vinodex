import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildWineEntries } from '@/shared/constants';
import { buildOgManifest, ogManifestDigest, readIndexCss } from './ogManifest';
import { SHAREABLE_CATEGORIES, ogCardPath } from './siteIndex';

/**
 * The baked share cards, held to what they were baked from (v0.6.24).
 *
 * `scripts/bake-og-cards.py` writes 440 PNGs and a manifest recording the
 * digest of its input -- every card's id, name, category, livery and art
 * path, resolved by `ogManifest.ts` with the tiles' own functions. The
 * output is committed, so nothing in CI runs the bake; this suite is what
 * makes a stale bake visible. It fails, naming the fix, when:
 *
 *   - an entry was added, renamed or re-categorised (the digest moves);
 *   - a livery hex in index.css was retuned (the digest moves);
 *   - a sprite resolves differently (the digest moves);
 *   - a card file is missing, altered or orphaned (the file hashes).
 *
 * The fix is always the same two commands: `npm run og:manifest` then
 * `python3 scripts/bake-og-cards.py`, and commit.
 */
const ROOT = process.cwd();
const OG = path.join(ROOT, 'web/public/og');

describe('the share cards', () => {
  const entries = buildWineEntries();
  const specs = buildOgManifest(entries, readIndexCss(ROOT));
  const baked = JSON.parse(fs.readFileSync(path.join(OG, 'manifest.json'), 'utf8')) as {
    digest: string;
    files: Record<string, string>;
  };

  it('were baked from the catalogue and liveries as they are now', () => {
    expect(baked.digest, 'the cards are stale: npm run og:manifest && python3 scripts/bake-og-cards.py').toBe(ogManifestDigest(specs));
  });

  it('cover every shareable entry, once, with no orphans', () => {
    const wanted = entries.filter(e => SHAREABLE_CATEGORIES.has(e.category)).map(e => e.id).sort();
    expect(Object.keys(baked.files).sort()).toEqual(wanted);
    const onDisk = fs.readdirSync(OG).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4)).sort();
    expect(onDisk).toEqual(wanted);
  });

  it('are the bytes the bake wrote, and 1200x630', () => {
    for (const [id, sha] of Object.entries(baked.files)) {
      const file = path.join(OG, `${id}.png`);
      const bytes = fs.readFileSync(file);
      expect(createHash('sha256').update(bytes).digest('hex'), `${id} was altered after the bake`).toBe(sha);
      // PNG IHDR: width at byte 16, height at 20, big-endian.
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], `${id} is not 1200x630`).toEqual([1200, 630]);
      expect(bytes.length, `${id} is over the 40 KB budget`).toBeLessThan(40 * 1024);
    }
  });

  it('are named the way the prerender points at them', () => {
    expect(ogCardPath('G001')).toBe('/og/G001.png');
  });
});
