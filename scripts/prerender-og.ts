#!/usr/bin/env node
// Per-entry Open Graph prerender — the funnel's share-card layer.
//
// The web app is a Vite SPA, so a crawler fetching a shared /detail/:id link
// only sees the static index.html and never runs the router — every shared card
// would unfurl with the generic product title. This writes a per-entry
// dist/detail/<id>/index.html: a copy of the built shell with the entry's own
// <title> and OG/Twitter tags injected. Vercel serves the matching static file
// before the SPA rewrite, so crawlers get the entry's card and real visitors
// still boot into the app (same hashed bundle) at the right route.
//
// Run after `vite build` (npm postbuild). Entry ids match the iOS app's, so a
// card shared from iOS at ${BASE}/detail/<id> resolves to the same entry here.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildWineEntries } from '../shared/constants';

const BASE = 'https://vinodex.vercel.app';
const DIST = join(process.cwd(), 'dist');
const shell = readFileSync(join(DIST, 'index.html'), 'utf8');

const esc = (s: string): string =>
  (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Only the readable catalogue entries are shareable pages; continents open a
// dedicated screen and country gates are navigational.
const SHAREABLE = new Set(['GRAPES', 'REGIONS', 'STYLES', 'FLAVORS']);
const IMAGE = `${BASE}/vinodex-logo.png`;

function pageFor(name: string, description: string, url: string): string {
  const title = `${name} — Vinodex`;
  const desc = (description || 'A retro wine field guide.').replace(/\s+/g, ' ').trim().slice(0, 180);
  let html = shell;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);

  const setMeta = (attr: 'name' | 'property', key: string, value: string) => {
    const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
    if (re.test(html)) html = html.replace(re, `$1${esc(value)}$2`);
    else html = html.replace('</head>', `    <meta ${attr}="${key}" content="${esc(value)}" />\n  </head>`);
  };

  setMeta('name', 'description', desc);
  setMeta('property', 'og:type', 'article');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', IMAGE);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image', IMAGE);

  html = html.replace('</head>', `    <link rel="canonical" href="${url}" />\n  </head>`);
  return html;
}

let count = 0;
for (const e of buildWineEntries()) {
  if (!SHAREABLE.has(e.category)) continue;
  const url = `${BASE}/detail/${e.id}`;
  const dir = join(DIST, 'detail', e.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), pageFor(e.name, e.description, url));
  count += 1;
}

console.log(`prerender-og: wrote ${count} entry OG pages under dist/detail/`);
