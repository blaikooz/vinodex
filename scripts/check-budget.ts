// The performance budget, written down where it can fail a build (Phase 6,
// v0.6.37). Two facts the LCP work established, held rather than remembered:
//
//   1. The eager entry chunk -- the one script the landing cannot paint
//      without -- stays under BUDGET_GZ gzipped. It was 264 KB gz before the
//      catalogue split (v0.6.31) and 197 KB gz after; the budget is set with
//      ~6% headroom over the after, so a dependency or a careless import that
//      drags tens of kilobytes back into the first paint fails here, with a
//      number, instead of surfacing as a Lighthouse regression months later.
//
//   2. The catalogue chunk stays OUT of the first paint: `index.html` must
//      not reference it, by script tag or modulepreload. A static import
//      anywhere on the eager path would fold the tables back in -- and would
//      also blow the first check -- but this names the actual regression.
//
// Runs after `vite build` (dist must exist), like check:refs.
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BUDGET_GZ = 210_000;

const DIST = join(process.cwd(), 'dist');
const html = readFileSync(join(DIST, 'index.html'), 'utf8');

const entry = html.match(/\/assets\/(index-[\w-]+\.js)/)?.[1];
if (!entry) {
  console.error('check-budget: no /assets/index-*.js referenced by dist/index.html -- did the build change shape?');
  process.exit(1);
}
const gz = gzipSync(readFileSync(join(DIST, 'assets', entry))).length;
if (gz > BUDGET_GZ) {
  console.error(`check-budget: eager chunk ${entry} is ${gz} B gzipped -- over the ${BUDGET_GZ} B budget. Something joined the first paint; find it before raising the number.`);
  process.exit(1);
}

const catalogue = readdirSync(join(DIST, 'assets')).find(f => /^constants-[\w-]+\.js$/.test(f));
if (!catalogue) {
  console.error('check-budget: no constants-*.js chunk in dist/assets -- the catalogue split (v0.6.31) is gone.');
  process.exit(1);
}
if (html.includes(catalogue)) {
  console.error(`check-budget: dist/index.html references ${catalogue} -- the catalogue is back in the first paint.`);
  process.exit(1);
}

console.log(`check-budget: eager ${entry} ${gz} B gz (budget ${BUDGET_GZ}); catalogue ${catalogue} stays behind the dex boundary.`);
