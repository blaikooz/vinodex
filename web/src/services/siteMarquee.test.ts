import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_MARK_TITLE, WEB_MARQUEE_ART } from './marqueeArt';

/**
 * The site's own marquee mark, and the sync leg that must never see it (v8#10).
 *
 * **This is the first web-authored art in the repo.** Every other piece of
 * drawn chrome — the professor's six expressions, the ten passport stamps, the
 * 36 per-route marquee panels, the 20 skin stickers and the four footer
 * sprites — is mirrored one-way out of `vinodex-ios` by `sync-shared.ps1`'s art
 * leg (v6 ruling #2). iOS owns those; the web consumes them. This one cannot
 * work that way, because iOS has no company site and so has no mark for one.
 *
 * ## The trap this exists to spring first
 *
 * The leg runs, per folder:
 *
 *     robocopy <ios Resources>\MarqueeArt <web public/art>\marquee *.png /MIR
 *
 * `/MIR` mirrors **deletions**. A web-authored PNG placed in
 * `web/public/art/marquee/` is deleted by the next sync — silently, with no
 * build failure and no console error, because `marqueeGlyph` simply falls back
 * to the lucide wineglass. The site would quietly go back to wearing the
 * encyclopedia's mark and nothing would say so.
 *
 * The sync script's own comment names this hazard for the footer caps, and
 * `capsManifest.test.ts` pins the answer there. This is the same answer in the
 * same shape: **the art lives in a folder the leg cannot reach**, and that
 * fact is asserted two ways, because one of them is only a proxy.
 *
 * ## Why the hash as well
 *
 * The output of `scripts/draw-site-marquee.py` is committed and no gate runs
 * the script — same arrangement as the 88 baked caps, and the same hazard:
 * stale or hand-edited art renders perfectly and is simply wrong. The manifest
 * records the file's SHA-256, so a PNG edited in place, or a re-draw committed
 * without its output, fails here rather than shipping.
 */

const SITE_DIR = path.resolve(__dirname, '../../public/art/site');
const MANIFEST = path.join(SITE_DIR, 'manifest.json');
const REDRAW = 'Re-run `python3 scripts/draw-site-marquee.py` and commit the result.';

interface Manifest {
  grid: number;
  scale: number;
  ink: string;
  files: Record<string, string>;
}

const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex');

describe('the site marquee mark', () => {
  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

  it('is what the chassis asks for', () => {
    // The map's value is a URL under `public/`; this resolves it back to disk,
    // so a renamed file or a typo'd path is a failed test rather than a broken
    // image nobody looks at.
    const src = WEB_MARQUEE_ART[SITE_MARK_TITLE];
    expect(src, `${SITE_MARK_TITLE} is not in WEB_MARQUEE_ART`).toBeTruthy();
    const onDisk = path.resolve(__dirname, '../../public', src!.replace(/^\//, ''));
    expect(fs.existsSync(onDisk), `${src} does not exist on disk`).toBe(true);
    expect(path.dirname(onDisk)).toBe(SITE_DIR);
  });

  it('matches its recorded hash', () => {
    const drifted: string[] = [];
    for (const [name, hash] of Object.entries(manifest.files)) {
      const file = path.join(SITE_DIR, name);
      expect(fs.existsSync(file), `${name} is missing`).toBe(true);
      if (sha256(fs.readFileSync(file)) !== hash) drifted.push(name);
    }
    expect(drifted, `the site mark differs from its manifest:\n${drifted.join('\n')}\n${REDRAW}`).toEqual([]);
  });

  it('records the grid and the ink it was drawn on', () => {
    // Pinned so a re-draw at a different size or in a different colour is a
    // decision rather than a default. `#FAF4C8` is the single colour every
    // shipped iOS marquee panel resolves to — measured, not chosen — and the
    // 36x4 grid is what makes the mark read as pixel art beside them.
    expect(manifest.grid).toBe(36);
    expect(manifest.scale).toBe(4);
    expect(manifest.ink).toBe('#FAF4C8');
  });

  it('holds nothing but the marks and the manifest', () => {
    // An unrelated PNG landing here would be art with no key, which is the
    // "drawn, imported, reaching no screen" fault `marqueeArt.test.ts` guards
    // on the iOS side.
    const files = fs.readdirSync(SITE_DIR).sort();
    const expected = [...Object.keys(manifest.files), 'manifest.json'].sort();
    expect(files).toEqual(expected);
  });

  it('is written to a directory the sync script does not mirror', () => {
    // **The rule, not its consequence.** `capsManifest.test.ts` makes the same
    // distinction and for the same reason (L9): asserting "only the right files
    // are in the folder" is a proxy that would still pass the day somebody adds
    // this folder to the sync leg — the deletion only happens on the *next*
    // sync, on somebody else's machine, long after the test went green. This
    // reads the script.
    //
    // The script lives outside the repo, at the HGapps root, because it syncs
    // two repos. Skipped rather than failed when absent, since a checkout of
    // vinodex-web alone is a legitimate way to work — but never silently: an
    // absent script means this invariant is unverified here, and the file
    // check above is all that stands.
    const script = path.resolve(__dirname, '../../../../sync-shared.ps1');
    if (!fs.existsSync(script)) {
      expect(fs.existsSync(SITE_DIR), 'sync-shared.ps1 absent; the site mark must still be present').toBe(true);
      return;
    }
    const src = fs.readFileSync(script, 'utf8');

    const table = src.slice(src.indexOf('$WebArt = @('), src.indexOf(')', src.indexOf('$WebArt = @(')));
    const mirrored = [...table.matchAll(/To\s*=\s*'([^']+)'/g)].map(m => m[1]!);

    // The premise: the table is real and is the marquee's mirrored home.
    expect(mirrored, 'the art leg should still mirror the iOS panels into art/marquee').toContain('marquee');
    expect(
      mirrored,
      'art/site appears in the $WebArt table of sync-shared.ps1. /MIR deletes anything the iOS '
      + 'side does not have, and iOS has no site mark -- so the next sync would delete it and the '
      + "company site would silently go back to wearing the encyclopedia's wineglass.",
    ).not.toContain('site');

    // And the script says why, so the next person editing the table meets the
    // reason before they meet this test.
    expect(
      src.includes('art\\site'),
      'sync-shared.ps1 no longer names art\\site. The note explaining why the web-authored mark '
      + 'is not in the table is the only warning at the point of edit; keep it.',
    ).toBe(true);
  });
});
