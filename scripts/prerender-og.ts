#!/usr/bin/env node
// The static share layer: per-page Open Graph cards, sitemap.xml, robots.txt.
//
// The web app is a Vite SPA, so a crawler fetching a shared link only sees
// the static index.html and never runs the router — every shared card would
// unfurl with the generic studio title. This writes a static
// dist/<route>/index.html for every page worth sharing: a copy of the built
// shell with that page's own title, description, OG/Twitter tags and canonical
// link written into its <head>. Vercel serves the matching static file before
// the SPA rewrite, so crawlers get the page's card and real visitors still
// boot into the app (same hashed bundle) at the right route.
//
// Two kinds of page, one mechanism:
//   - the 440 shareable catalogue entries at /detail/<id> (since v0.6.1) —
//     entry ids match the iOS app's, so a card shared from iOS resolves here;
//   - the site's own pages at /apps, /who-we-are, /contact, /privacy (since
//     v0.6.15), plus the landing's tags rewritten into the shell itself.
//
// Everything this writes is decided by `web/src/services/siteIndex.ts`, which
// `siteIndex.test.ts` holds against the route table — this file only formats
// and writes. The sitemap and robots come from the same module for the same
// reason: three outputs that must not drift from one route table.
//
// Run after `vite build` (npm postbuild).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildWineEntries } from '../shared/constants';
import {
  SHAREABLE_CATEGORIES,
  SITE_PAGES,
  entryPageMeta,
  injectMeta,
  robotsTxt,
  sitePageMeta,
  sitemapXml,
} from '../web/src/services/siteIndex';

const DIST = join(process.cwd(), 'dist');
const shell = readFileSync(join(DIST, 'index.html'), 'utf8');

const writePage = (routePath: string, html: string) => {
  const dir = routePath === '/' ? DIST : join(DIST, routePath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
};

// The catalogue's share pages.
const entryIds: string[] = [];
for (const e of buildWineEntries()) {
  if (!SHAREABLE_CATEGORIES.has(e.category)) continue;
  entryIds.push(e.id);
  writePage(`/detail/${e.id}`, injectMeta(shell, entryPageMeta(e.id, e.name, e.description)));
}

// The site's pages. The landing IS the shell, so its tags are written into
// dist/index.html itself — which every other route also serves, exactly as
// before: the shell's card has always been the studio's.
for (const page of SITE_PAGES) {
  writePage(page.path, injectMeta(shell, sitePageMeta(page)));
}

writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml(entryIds));
writeFileSync(join(DIST, 'robots.txt'), robotsTxt());

console.log(
  `prerender-og: wrote ${entryIds.length} entry pages, ${SITE_PAGES.length} site pages, sitemap.xml (${entryIds.length + SITE_PAGES.length} urls) and robots.txt`,
);
