#!/usr/bin/env node
// Writes scripts/og/manifest.json -- the input to `bake-og-cards.py`.
//
//   npm run og:manifest
//
// The resolution of which art each entry shows lives in
// `web/src/services/ogManifest.ts`, next to the functions the tiles use, so
// the cards and the app cannot disagree about what a grape looks like. This
// file only writes the answer down for Python to read.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildWineEntries } from '../shared/constants';
import { buildOgManifest, ogManifestDigest, readIndexCss } from '../web/src/services/ogManifest';

const ROOT = process.cwd();
const specs = buildOgManifest(buildWineEntries(), readIndexCss(ROOT));
mkdirSync(join(ROOT, 'scripts/og'), { recursive: true });
writeFileSync(join(ROOT, 'scripts/og/manifest.json'), JSON.stringify({ digest: ogManifestDigest(specs), cards: specs }, null, 1));
const kinds = specs.reduce<Record<string, number>>((a, s) => ((a[s.artKind] = (a[s.artKind] ?? 0) + 1), a), {});
console.log(`og-manifest: ${specs.length} cards (${JSON.stringify(kinds)}) -> scripts/og/manifest.json`);
