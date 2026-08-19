import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  CHASSIS_SKINS,
  FOOTER_CAP_KINDS,
  footerCap,
  type ChassisSkinId,
} from './theme';

/**
 * The baked caps, their sources and their colours, held to each other.
 *
 * `scripts/bake-footer-caps.py` renders 88 PNGs — 22 skins x 4 caps — from
 * four drawn sprites and the colour table in `theme.ts`. The output is
 * committed, so nothing in CI ever runs the bake, which is the whole point
 * and also the hazard: **stale art is invisible**. A cap baked against last
 * month's colours renders perfectly and is simply wrong, and a browser cannot
 * tell you so.
 *
 * There are exactly two ways the bake can go stale, and this suite watches
 * both:
 *
 *   1. **iOS ships new sprites.** `sync-shared.ps1`'s art leg mirrors
 *      `FooterArt` one-way, so a new drop lands in `web/public/art/footer/`
 *      with no code change anywhere. The manifest records each source
 *      sprite's SHA-256; if the file on disk no longer matches, the caps were
 *      baked from a drawing that has since been redrawn.
 *   2. **The web changes a cap colour.** `theme.ts`'s tables are what the
 *      re-ink is keyed on. The manifest records a hash over the whole
 *      resolved table, recomputed here from `footerCap()` — so a single hex
 *      edit on one skin fails the gate, naming the fix as "re-run the bake"
 *      rather than leaving one shell's buttons a release behind.
 *
 * Plus the ordinary integrity checks: every skin and kind has a file, every
 * file matches its recorded hash, and no orphans linger from a skin that was
 * renamed.
 *
 * **This is the price of the algorithm existing twice** — in Swift for the
 * device and in Python for the bake. That duplication is accepted knowingly:
 * a runtime re-ink in the browser would put a 250-line pixel pipeline and a
 * canvas into the one component every screen mounts, to compute at each
 * launch what a fixed 22-row table makes knowable once. What the duplication
 * buys is zero runtime cost; what it risks is silent drift, and this file is
 * the answer to that risk. If the Device Workshop ever lands, 13 part
 * colours x 4 caps makes the matrix 1,144 files and the trade flips.
 */

const CAPS_DIR = path.resolve(__dirname, '../../public/art/caps');
const FOOTER_DIR = path.resolve(__dirname, '../../public/art/footer');
const MANIFEST = path.join(CAPS_DIR, 'manifest.json');

interface Manifest {
  outputPx: number;
  sourceSprites: Record<string, string>;
  colourTableSha256: string;
  files: Record<string, string>;
}

const REBAKE = 'Re-run `python3 scripts/bake-footer-caps.py` and commit the result.';

const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex');

const ALL_SKINS = Object.keys(CHASSIS_SKINS) as ChassisSkinId[];

describe('the baked footer caps', () => {
  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

  it('has a file for every skin and every kind', () => {
    const missing: string[] = [];
    for (const skin of ALL_SKINS) {
      for (const kind of FOOTER_CAP_KINDS) {
        const name = `${skin}-${kind}.png`;
        if (!fs.existsSync(path.join(CAPS_DIR, name))) missing.push(name);
      }
    }
    expect(missing, `missing baked caps:\n${missing.join('\n')}\n${REBAKE}`).toEqual([]);
    expect(Object.keys(manifest.files)).toHaveLength(ALL_SKINS.length * FOOTER_CAP_KINDS.length);
  });

  it('has no orphaned caps from a renamed or deleted skin', () => {
    const expected = new Set(
      ALL_SKINS.flatMap(s => FOOTER_CAP_KINDS.map(k => `${s}-${k}.png`)),
    );
    const orphans = fs.readdirSync(CAPS_DIR)
      .filter(f => f.endsWith('.png'))
      .filter(f => !expected.has(f));
    expect(orphans, `caps for skins that no longer exist: ${orphans.join(', ')}\n${REBAKE}`).toEqual([]);
  });

  it('matches every recorded file hash', () => {
    // Catches a hand-edited PNG, a half-finished bake, and a merge that took
    // one side's art and the other's manifest.
    const drifted: string[] = [];
    for (const [name, hash] of Object.entries(manifest.files)) {
      const actual = sha256(fs.readFileSync(path.join(CAPS_DIR, name)));
      if (actual !== hash) drifted.push(name);
    }
    expect(drifted, `baked caps differ from the manifest:\n${drifted.join('\n')}\n${REBAKE}`).toEqual([]);
  });

  it('was baked from the sprites currently on disk', () => {
    // The iOS-side drift. `sync-shared.ps1` mirrors FooterArt one-way with no
    // code change, so a redrawn cap arrives silently.
    const stale: string[] = [];
    for (const [stem, hash] of Object.entries(manifest.sourceSprites)) {
      const file = path.join(FOOTER_DIR, `footer-${stem}.png`);
      expect(fs.existsSync(file), `source sprite missing: ${file}`).toBe(true);
      if (sha256(fs.readFileSync(file)) !== hash) stale.push(stem);
    }
    expect(
      stale,
      `these source sprites have changed since the bake: ${stale.join(', ')}\n`
      + `iOS has redrawn them and sync-shared.ps1 has mirrored them in. ${REBAKE}`,
    ).toEqual([]);
  });

  it('was baked from the colour table currently in theme.ts', () => {
    // The web-side drift, and the one most likely to happen: a single hex
    // edit on one skin, with 87 correct caps around it.
    const table: Record<string, Record<string, unknown>> = {};
    for (const skin of ALL_SKINS) {
      table[skin] = {};
      for (const kind of FOOTER_CAP_KINDS) table[skin]![kind] = footerCap(skin, kind);
    }
    // Serialised the way the baker serialises it -- see `pythonJson`.
    const pythonish = pythonJson(table);
    expect(
      sha256(Buffer.from(pythonish, 'utf8')),
      `theme.ts's cap colours have changed since the bake. ${REBAKE}`,
    ).toBe(manifest.colourTableSha256);
  });

  it('records the resolution the caps were rendered at', () => {
    // 192px: the caps draw at 48/56 CSS px, so DPR 3 asks for 168. Pinned so
    // a re-bake at a different size is a decision rather than a default.
    expect(manifest.outputPx).toBe(192);
  });

  it('keeps the baked output out of the mirrored directory', () => {
    // `sync-shared.ps1`'s art leg /MIRs `art/footer/`, which deletes anything
    // the iOS side does not have. 88 baked files written there would vanish on
    // the next sync, silently, and the band would fall back to CSS circles.
    const footerFiles = fs.readdirSync(FOOTER_DIR).filter(f => f.endsWith('.png')).sort();
    expect(footerFiles).toEqual([
      'footer-back.png',
      'footer-home.png',
      'footer-settings.png',
      'footer-user.png',
    ]);
  });

  it('is written to a directory the sync script does not mirror', () => {
    // The check above is a *proxy* -- it observes the consequence (only four
    // files in the mirrored folder) rather than the rule (which folders get
    // /MIR'd), so it would still pass if somebody added `art/caps` to the
    // sync leg and re-baked (L9). This reads the script.
    //
    // The script lives outside the repo, at the HGapps root, because it syncs
    // two repos. Skipped rather than failed when it is absent, since a
    // checkout of vinodex-web alone is a legitimate way to work -- but never
    // silently: an absent script means this invariant is unverified here and
    // the assertion above is all that stands.
    const script = path.resolve(__dirname, '../../../../sync-shared.ps1');
    if (!fs.existsSync(script)) {
      expect(fs.existsSync(FOOTER_DIR), 'sync-shared.ps1 absent; source sprites must still be present').toBe(true);
      return;
    }
    const src = fs.readFileSync(script, 'utf8');

    // The `$WebArt` table is the enumerated list of mirrored folders.
    const table = src.slice(src.indexOf('$WebArt = @('), src.indexOf(')', src.indexOf('$WebArt = @(')));
    const mirrored = [...table.matchAll(/To\s*=\s*'([^']+)'/g)].map(m => m[1]!);

    expect(mirrored, 'the art leg should mirror the four source sprites into art/footer').toContain('footer');
    expect(
      mirrored,
      'art/caps appears in the $WebArt table of sync-shared.ps1. /MIR deletes anything the iOS '
      + 'side does not have, and the iOS side has no baked caps -- so the next sync would '
      + 'delete all 88 of them and the footer would silently fall back to CSS circles.',
    ).not.toContain('caps');
  });
});

/**
 * `json.dumps(obj, sort_keys=True)` as Python writes it.
 *
 * The hash has to be computed identically on both sides or the check is
 * theatre. Python's default separators are `", "` and `": "` — not
 * `JSON.stringify`'s `","` and `":"` — and it sorts keys at every level.
 */
function pythonJson(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(pythonJson).join(', ')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}: ${pythonJson(v)}`).join(', ')}}`;
}
