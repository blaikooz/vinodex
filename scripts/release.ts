#!/usr/bin/env node
// One command to move the version — every spelling at once, or none of them.
//
// The version lives in more places than anyone remembers under deadline:
// `appVersion.ts` (the constant the UI renders), `package.json`, and the two
// fields `npm install` maintains inside `package-lock.json`. This repo has
// shipped the lockfile drift twice (see appVersion.test.ts), and the 0.4.3 /
// 0.4.4 releases shipped with no git tag at all. Each of those is a step
// somebody has to remember, and the fix for "remember" is one command.
//
// What it does, in order:
//   1. Resolves the new version from `patch` / `minor` / `major` (against the
//      APP_VERSION currently in appVersion.ts) or an explicit `x.y.z`.
//   2. FAILS unless webChangelog.ts already has an entry for that version —
//      the changelog is authored first, same contract webChangelog.test.ts
//      enforces: the version cannot move without someone saying what changed.
//   3. Rewrites APP_VERSION in appVersion.ts and `version` in package.json.
//   4. Runs `npm install --package-lock-only`, the step nobody runs by hand.
//   5. Runs the two pinning suites (appVersion.test.ts, webChangelog.test.ts)
//      so a half-applied bump cannot leave the tree quietly inconsistent.
//   6. Prints the `git tag` command for after the master fast-forward — the
//      tag goes on master, not here, so it is printed rather than run.
//
// It deliberately does NOT commit, push, or tag: those are the release flow's
// own steps (see RELEASING.md), and the master-ff has to happen in between.
//
// Run: `npm run release -- patch|minor|major|x.y.z`

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();
const APP_VERSION_FILE = join(ROOT, 'web/src/services/appVersion.ts');
const CHANGELOG_FILE = join(ROOT, 'web/src/services/webChangelog.ts');
const PACKAGE_FILE = join(ROOT, 'package.json');

const fail = (msg: string): never => {
  console.error(`release: ${msg}`);
  process.exit(1);
};

// The arg is picked out by shape rather than by position: this script arrives
// at node through a pipe (`esbuild ... | node --input-type=module -`), and
// where npm lands `-- minor` in argv depends on the shell. Anything that looks
// like a bump word or a version is the instruction; nothing else can be.
const args = process.argv.filter(a => /^(patch|minor|major|\d+\.\d+\.\d+)$/.test(a));
if (args.length !== 1) {
  fail('usage: npm run release -- patch|minor|major|x.y.z  (see RELEASING.md for which)');
}
const instruction = args[0]!;

// -- 1. Current and next ----------------------------------------------------

const appVersionSrc = readFileSync(APP_VERSION_FILE, 'utf8');
const currentMatch = appVersionSrc.match(/export const APP_VERSION = '(\d+)\.(\d+)\.(\d+)';/);
if (!currentMatch) fail(`could not find APP_VERSION in ${APP_VERSION_FILE}`);
const maj = Number(currentMatch![1]);
const min = Number(currentMatch![2]);
const pat = Number(currentMatch![3]);
const current = `${maj}.${min}.${pat}`;

const next =
  instruction === 'patch' ? `${maj}.${min}.${pat + 1}`
  : instruction === 'minor' ? `${maj}.${min + 1}.0`
  : instruction === 'major' ? `${maj + 1}.0.0`
  : instruction;

if (next === current) fail(`the version is already ${current}`);

// -- 2. The changelog gate --------------------------------------------------

const changelogSrc = readFileSync(CHANGELOG_FILE, 'utf8');
if (!changelogSrc.includes(`version: '${next}',`)) {
  fail(
    `webChangelog.ts has no entry for ${next}. Author it first — promote CURRENT `
    + 'into PREVIOUS, write the new CURRENT — then rerun. The version cannot '
    + 'move without someone saying what changed.',
  );
}

// -- 3. The two hand-edited spellings ---------------------------------------

writeFileSync(
  APP_VERSION_FILE,
  appVersionSrc.replace(
    /export const APP_VERSION = '\d+\.\d+\.\d+';/,
    `export const APP_VERSION = '${next}';`,
  ),
);

const pkgSrc = readFileSync(PACKAGE_FILE, 'utf8');
if (!/"version": "\d+\.\d+\.\d+",/.test(pkgSrc)) fail('could not find "version" in package.json');
writeFileSync(PACKAGE_FILE, pkgSrc.replace(/"version": "\d+\.\d+\.\d+",/, `"version": "${next}",`));

console.log(`release: ${current} -> ${next} (${APP_VERSION_FILE} + package.json)`);

// -- 4. The lockfile, which npm maintains -----------------------------------

console.log('release: npm install --package-lock-only');
execSync('npm install --package-lock-only', { cwd: ROOT, stdio: 'inherit' });

// -- 5. Prove it ------------------------------------------------------------

console.log('release: running the version-pinning suites');
execSync(
  'npx vitest run web/src/services/appVersion.test.ts web/src/services/webChangelog.test.ts',
  { cwd: ROOT, stdio: 'inherit' },
);

// -- 6. The tag, for later --------------------------------------------------

console.log(`
release: ${next} is staged. From here (RELEASING.md has the full flow):

  1. run the gates, commit on testing, push, wait for CI
  2. git checkout master && git merge --ff-only testing && git push
  3. git tag v${next} && git push origin v${next}
  4. git checkout testing
`);
