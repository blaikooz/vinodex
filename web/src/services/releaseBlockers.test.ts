import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { RELEASE_BLOCKERS } from './releaseBlockers';
import { CONTACT_ADDRESS } from './brand';
import { SUPPORT_ADDRESS, supportMailtoURL } from './supportContact';
import { APP_STORE_URL, APP_STORE_LISTING_IS_LIVE } from './shareLink';

/**
 * The registry and reality must agree (W26).
 *
 * A placeholder is only safe while somebody remembers it is one. The App
 * Store id was safe because `APP_STORE_LISTING_IS_LIVE` made it *observable*
 * and the install banner read it; the contact address was not, and shipped
 * twice, on two different unregistered domains, as live `mailto:` links.
 *
 * These tests fail in **both** directions: a blocker that has been resolved
 * without deleting its entry, and a placeholder still in the tree with no
 * entry. That is deliberate — a registry only nobody updates is a comment.
 */

const WEB_ROOT = path.resolve(__dirname, '../..');

describe('release blockers', () => {
  it('lists each blocker once, with a where and a resolution', () => {
    const ids = RELEASE_BLOCKERS.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of RELEASE_BLOCKERS) {
      expect(b.where, `${b.id} does not say where the constant lives`).toContain('web/');
      expect(b.resolution.length, `${b.id} does not say what to do`).toBeGreaterThan(30);
    }
  });

  it('points each blocker at a file that exists and names the constant', () => {
    // The registry that keeps placeholders honest was stale on its first
    // entry (L5): `contact-address` pointed at `supportContact.ts` while the
    // constant had moved to `brand.ts` during the same commit. A pointer
    // nobody checks is the failure this whole module exists to prevent, one
    // level up.
    //
    // The `where` field is "<path> - <IDENTIFIER>", so both halves are
    // checkable.
    for (const b of RELEASE_BLOCKERS) {
      const [rel, ident] = b.where.split(/\s+[-—]\s+/);
      expect(rel, `${b.id}'s where has no path`).toBeTruthy();
      expect(ident, `${b.id}'s where names no identifier`).toBeTruthy();

      const abs = path.resolve(WEB_ROOT, '..', rel!.trim());
      expect(fs.existsSync(abs), `${b.id} points at a file that does not exist: ${rel}`).toBe(true);

      // **Declares**, not merely mentions. The first version of this check
      // used `toContain(ident)` and passed against the stale path it was
      // written to catch, because `supportContact.ts` re-exports
      // CONTACT_ADDRESS and therefore names it. "Where the constant lives"
      // means where it is declared -- that is the file somebody has to edit.
      // A plain substring, not a regex: `const NAME` matches both
      // `const NAME` and `export const NAME`, and does not match
      // `import { NAME } from ...`, which is the whole distinction.
      expect(
        fs.readFileSync(abs, 'utf8').includes(`const ${ident!.trim()}`),
        `${b.id} points at ${rel}, which does not DECLARE ${ident} (it may only import it)`,
      ).toBe(true);
    }
  });

  describe('contact-address', () => {
    const entry = RELEASE_BLOCKERS.find(b => b.id === 'contact-address');

    it('is registered while the address is still a placeholder', () => {
      const placeholder = /@vinodex\.(app|com)$/.test(CONTACT_ADDRESS);
      if (placeholder) {
        expect(entry, 'the contact address is still a placeholder but is not registered').toBeDefined();
      } else {
        expect(entry, `the contact address is now ${CONTACT_ADDRESS}; delete the blocker entry`).toBeUndefined();
      }
    });

    it('is exactly one string, in brand.ts, and every site reads it', () => {
      // The defect: two addresses on two domains. This walks the source for
      // any *other* vinodex mailto or address literal, so a third cannot be
      // pasted in without failing here.
      const offenders: string[] = [];
      const walk = (dir: string) => {
        for (const name of fs.readdirSync(dir)) {
          if (name === 'node_modules' || name === 'e2e' || name.startsWith('.')) continue;
          const full = path.join(dir, name);
          if (fs.statSync(full).isDirectory()) { walk(full); continue; }
          if (!/\.tsx?$/.test(name) || name.includes('.test.')) continue;
          // brand.ts is where the one literal is allowed to be.
          if (full.endsWith(`${path.sep}brand.ts`)) continue;
          const src = fs.readFileSync(full, 'utf8');
          for (const m of src.matchAll(/[\w.]+@vinodex\.[a-z]+/g)) {
            // Doc comments naming the historical addresses are the record of
            // this fix and are not a second constant.
            const line = src.slice(0, m.index).split('\n').pop() ?? '';
            if (/^\s*(\*|\/\/)/.test(line)) continue;
            offenders.push(`${m[0]}  (${path.relative(WEB_ROOT, full)})`);
          }
        }
      };
      walk(WEB_ROOT);
      expect(offenders, `contact addresses outside brand.ts:\n${offenders.join('\n')}`).toEqual([]);
    });

    it('is the same address the support screen and the portal both use', () => {
      expect(SUPPORT_ADDRESS).toBe(CONTACT_ADDRESS);
      expect(supportMailtoURL('0.1.0')).toContain(CONTACT_ADDRESS);
    });
  });

  describe('app-store-id', () => {
    const entry = RELEASE_BLOCKERS.find(b => b.id === 'app-store-id');

    it('is registered exactly while the listing is not live', () => {
      if (APP_STORE_LISTING_IS_LIVE) {
        expect(entry, `the listing is live at ${APP_STORE_URL}; delete the blocker entry`).toBeUndefined();
      } else {
        expect(entry, 'the App Store id is a placeholder but is not registered').toBeDefined();
      }
    });

    it('keeps the install nudge switched off while it is a placeholder', () => {
      // The behaviour the observable placeholder buys: a prominent GET APP
      // button pointing at a dead listing spends the one nudge a visitor gets.
      if (!APP_STORE_LISTING_IS_LIVE) expect(APP_STORE_URL).toContain('id0000000000');
    });
  });
});
