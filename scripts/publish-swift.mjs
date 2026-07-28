#!/usr/bin/env node
/**
 * Publishes the `vinodex-swift` mirror from this monorepo.
 *
 * This replaced `git subtree split --prefix=native`. A subtree split can only
 * take one prefix, so the published repo got the Swift package and nothing
 * else — `generate.ts` sat there importing `../../constants.ts` from a web tree
 * that wasn't in the repo, and `rasterize-icons.sh` looked for a `pixelflags/`
 * that wasn't either. Both were dead on arrival in `vinodex-swift`.
 *
 * The mirror needs three prefixes, so it is assembled instead:
 *
 *   ios/*                     -> <root>/           the Swift package itself
 *   shared/                   -> <root>/shared/    data + colour tables
 *   pixelflags/               -> <root>/pixelflags/
 *   scripts/generate-ios-data.ts, rasterize-icons.sh
 *                             -> <root>/scripts/
 *   scripts/swift-mirror/*    -> <root>/           README, package.json, tsconfig
 *   KNOWN-ISSUES.md           -> <root>/
 *
 * `scripts/` and `shared/` keep their repo-root-relative paths, which is why
 * `../shared/...` resolves identically in both repos and the generator needs no
 * rewriting. Only the Swift package moves, and the two scripts probe for that.
 *
 * The work happens in a git worktree on the `swift-main` branch, so the mirror
 * keeps real history and pushes fast-forward rather than force.
 *
 * Usage:
 *   node scripts/publish-swift.mjs            # build the commit, don't push
 *   node scripts/publish-swift.mjs --push     # build and push to swift/main
 *   node scripts/publish-swift.mjs --check    # verify only, no commit
 */

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKTREE = join(tmpdir(), 'vinodex-swift-mirror');
const BRANCH = 'swift-main';
const REMOTE = 'swift';

const args = new Set(process.argv.slice(2));
const doPush = args.has('--push');
const checkOnly = args.has('--check');

const git = (...a) =>
  execFileSync('git', a, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
const gitIn = (cwd, ...a) =>
  execFileSync('git', a, { cwd, encoding: 'utf8' }).trim();

// --- 1. Refuse to publish a tree that isn't committed ------------------------
// The mirror is built from the working tree, not from HEAD, so uncommitted
// changes would ship to vinodex-swift while being absent from the monorepo.
const dirty = git('status', '--porcelain', '--', 'ios', 'shared', 'pixelflags', 'scripts', 'KNOWN-ISSUES.md');
if (dirty) {
  console.error('refusing to publish: uncommitted changes in the mirrored paths\n');
  console.error(dirty);
  process.exit(1);
}

const sourceCommit = git('rev-parse', 'HEAD');
const sourceSubject = git('log', '-1', '--format=%s');

// --- 2. Fresh worktree on the mirror branch ---------------------------------
if (existsSync(WORKTREE)) {
  try { git('worktree', 'remove', '--force', WORKTREE); } catch { /* not registered */ }
  rmSync(WORKTREE, { recursive: true, force: true });
}
git('worktree', 'prune');
git('worktree', 'add', '--force', WORKTREE, BRANCH);

// --- 3. Empty it, keeping .git ----------------------------------------------
for (const entry of readdirSync(WORKTREE)) {
  if (entry === '.git') continue;
  rmSync(join(WORKTREE, entry), { recursive: true, force: true });
}

// --- 4. Assemble ------------------------------------------------------------
/** ios/'s contents are hoisted to the mirror root; everything else keeps its path. */
const copyDir = (from, to) =>
  cpSync(join(REPO_ROOT, from), join(WORKTREE, to), { recursive: true });
const copyFile = (from, to) => {
  mkdirSync(dirname(join(WORKTREE, to)), { recursive: true });
  cpSync(join(REPO_ROOT, from), join(WORKTREE, to));
};

for (const entry of readdirSync(join(REPO_ROOT, 'ios'))) {
  // The mirror gets its own .gitignore from the template below — ios/.gitignore
  // is scoped to the package's position inside the monorepo.
  if (entry === '.gitignore') continue;
  copyDir(join('ios', entry), entry);
}

copyDir('shared', 'shared');
copyDir('pixelflags', 'pixelflags');
copyFile('scripts/generate-ios-data.ts', 'scripts/generate-ios-data.ts');
copyFile('scripts/rasterize-icons.sh', 'scripts/rasterize-icons.sh');
copyFile('KNOWN-ISSUES.md', 'KNOWN-ISSUES.md');

for (const entry of readdirSync(join(REPO_ROOT, 'scripts/swift-mirror'))) {
  copyFile(join('scripts/swift-mirror', entry), entry);
}

// --- 5. Sanity-check the result is actually self-contained -------------------
const required = [
  'Package.swift',
  'xtool.yml',
  'Sources/VinodexCore/Resources/entries.json',
  'Sources/VinodexCore/Resources/palette.json',
  'Sources/VinodexUI/Resources/Icons',
  'Sources/VinodexUI/Resources/Flags',
  'Tests/VinodexCoreTests',
  'shared/constants.ts',
  'shared/types.ts',
  'shared/stylePalette.ts',
  'shared/data/grapes.ts',
  'shared/services/chipColors.ts',
  'scripts/generate-ios-data.ts',
  'scripts/rasterize-icons.sh',
  'pixelflags',
  'package.json',
  'tsconfig.json',
  'README.md',
];
const missing = required.filter((p) => !existsSync(join(WORKTREE, p)));
if (missing.length) {
  console.error('assembled mirror is missing:\n  - ' + missing.join('\n  - '));
  process.exit(1);
}

// Every relative import in the generator must resolve inside the mirror. This
// is the check that would have caught the original `../../constants.ts` break.
const generator = join(WORKTREE, 'scripts/generate-ios-data.ts');
const source = await import('node:fs/promises').then((fs) => fs.readFile(generator, 'utf8'));
const specifiers = [...source.matchAll(/from\s+'(\.\.?\/[^']+)'/g)].map((m) => m[1]);
const unresolved = specifiers.filter(
  (spec) => !existsSync(resolve(dirname(generator), spec)),
);
if (unresolved.length) {
  console.error('generator imports that do not resolve inside the mirror:\n  - ' + unresolved.join('\n  - '));
  process.exit(1);
}
console.log(`generator: ${specifiers.length} relative imports, all resolve inside the mirror`);

if (checkOnly) {
  console.log(`\n--check passed. Worktree left at ${WORKTREE}`);
  process.exit(0);
}

// --- 6. Commit --------------------------------------------------------------
gitIn(WORKTREE, 'add', '-A');
const staged = gitIn(WORKTREE, 'status', '--porcelain');
if (!staged) {
  console.log('mirror already matches the monorepo — nothing to publish');
} else {
  const message = `${sourceSubject}\n\nPublished from blaikooz/vinodex@${sourceCommit.slice(0, 10)}.\nAssembled by scripts/publish-swift.mjs — do not commit here directly.\n`;
  gitIn(WORKTREE, 'commit', '-q', '-m', message);
  console.log(`committed ${gitIn(WORKTREE, 'rev-parse', '--short', 'HEAD')} on ${BRANCH}`);
}

// --- 7. Push ----------------------------------------------------------------
if (doPush) {
  console.log(git('push', REMOTE, `${BRANCH}:main`));
  console.log(`pushed ${BRANCH} -> ${REMOTE}/main`);
} else {
  console.log(`\nnot pushed. To publish:\n  git push ${REMOTE} ${BRANCH}:main`);
}

git('worktree', 'remove', '--force', WORKTREE);
