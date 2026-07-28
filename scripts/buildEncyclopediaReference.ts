/**
 * Builds split, deduplicated reference files from the parsed encyclopedia data,
 * plus a coverage report cross-referencing app data (countries.ts / regions.ts /
 * grapes.ts) against the encyclopedia.
 *
 * Input:
 *   data/encyclopedia/encyclopedia.json    (already parsed by cleanEncyclopediaText.ts)
 *   data/countries.ts / data/regions.ts / data/grapes.ts  (app data, regex-scraped)
 *
 * Output (all under data/encyclopedia/reference/, dev-only — do not bundle):
 *   countries.md   — country index with blurb + region/AOC counts
 *   regions.md     — regions grouped by country with AOC count
 *   aocs.md        — full AOC entries grouped by country/region
 *   grapes.md      — cleaned grape glossary (drops OCR noise entries)
 *   coverage.md    — which app data entries the encyclopedia covers / misses
 *
 * Cleanup policy: drop obvious garbage only. We do not attempt to merge
 * fragmented entries or rewrite blurbs.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const ENCYC_JSON = resolve(REPO_ROOT, 'data/encyclopedia/encyclopedia.json');
const COUNTRIES_TS = resolve(REPO_ROOT, 'data/countries.ts');
const REGIONS_TS = resolve(REPO_ROOT, 'data/regions.ts');
const GRAPES_TS = resolve(REPO_ROOT, 'data/grapes.ts');
const OUT_DIR = resolve(REPO_ROOT, 'data/encyclopedia/reference');

// Grape names that are clearly OCR debris, section headers, or appellations
// mis-extracted as grapes. Compared case-insensitively.
const GRAPE_NAME_BLOCKLIST = new Set([
  'glossaryofgrapevarieties',
  'introduction',
  'saint-émilion',
  'à petits grains',
  'cabernet', // appears solo, separated from "Sauvignon"
  'sauvignon', // appears solo
]);

// Country names that appear as section headings in the encyclopedia but have
// no real content — these are page-header artifacts, not country chapters.
// Empty-country-blurb is the main signal; this set is only for cosmetic order.
const COUNTRY_HEADER_DEBRIS_REGEX = /^(see also|maps?|chapter|introduction)\b/i;

interface EncycRoot {
  attribution: Record<string, string>;
  countries: Record<string, EncycCountry>;
  grapes: Record<string, EncycGrape>;
}
interface EncycCountry {
  name: string;
  shortBlurb: string;
  regions: Record<string, EncycRegion>;
}
interface EncycRegion {
  name: string;
  shortBlurb: string;
  aocs: EncycAOC[];
}
interface EncycAOC {
  name: string;
  classification: string;
  district: string | null;
  shortBlurb: string;
  styles: { red?: string; white?: string; rose?: string; sparkling?: string };
  grapeComposition: string[];
  agingWindow: string[];
  topProducers: string[];
}
interface EncycGrape {
  name: string;
  shortBlurb: string;
  synonyms: string[];
  origin: string | null;
  notableRegions: string[];
}

// ---------- Cleanup helpers ----------

function isGrapeNoise(name: string): boolean {
  const k = name.trim().toLowerCase();
  if (!k) return true;
  if (GRAPE_NAME_BLOCKLIST.has(k)) return true;
  // Single-character or two-character "names" are debris
  if (k.length < 3) return true;
  // Stray fragments like "À" or "Des" that survived OCR
  if (/^[a-zà-ÿ]{1,3}$/i.test(k)) return true;
  return false;
}

function isRegionPlaceholder(name: string): boolean {
  return name === '(General)';
}

// Score an AOC by how much real info it has so we can keep the richest copy
// when duplicates appear.
function scoreAOC(a: EncycAOC): number {
  let s = 0;
  s += a.shortBlurb.length;
  s += (a.styles.red?.length ?? 0) + (a.styles.white?.length ?? 0)
    + (a.styles.rose?.length ?? 0) + (a.styles.sparkling?.length ?? 0);
  s += a.grapeComposition.join('').length;
  s += a.agingWindow.join('').length;
  s += a.topProducers.join('').length * 5;
  return s;
}

function dedupeAOCs(aocs: EncycAOC[]): EncycAOC[] {
  const byKey = new Map<string, EncycAOC>();
  for (const a of aocs) {
    const key = `${a.name}::${a.classification}`;
    const existing = byKey.get(key);
    if (!existing || scoreAOC(a) > scoreAOC(existing)) byKey.set(key, a);
  }
  return [...byKey.values()];
}

// Dedupe grapes case-insensitively, keeping the entry with the most data.
function dedupeGrapes(grapes: EncycGrape[]): EncycGrape[] {
  const byKey = new Map<string, EncycGrape>();
  for (const g of grapes) {
    const key = g.name.trim().toLowerCase();
    const existing = byKey.get(key);
    const score = (g.shortBlurb?.length ?? 0)
      + g.synonyms.length * 5
      + g.notableRegions.length * 5
      + (g.origin ? 5 : 0);
    const exScore = existing
      ? (existing.shortBlurb?.length ?? 0) + existing.synonyms.length * 5
        + existing.notableRegions.length * 5 + (existing.origin ? 5 : 0)
      : -1;
    if (!existing || score > exScore) byKey.set(key, g);
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ---------- App data scraping (regex; structure is consistent) ----------

interface AppCountry { id: string; name: string; origin: string; keyRegions: string[]; notableGrapes: string[]; }
interface AppRegion { id: string; name: string; origin: string; notableGrapes: string[]; appellations: string[]; }
interface AppGrape { id: string; name: string; origin: string; keyRegions: string[]; synonyms: string[]; }

// Splits the file into top-level entry blocks like `{ id: ..., ... }`. The
// data files happen to keep each entry on a single line, so we just split on
// lines that start an `{ id:` block.
function splitEntryBlocks(src: string): string[] {
  // Each entry is a single line (or contiguous block) opening with `{ id: ...`.
  // Trim trailing comma and we have a parseable-shape string.
  const blocks: string[] = [];
  // Match outermost braces using a balanced bracket scan, starting at each
  // `{ id:` position.
  const re = /\{\s*id:\s*['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const start = m.index;
    let depth = 0;
    let i = start;
    let inStr: '"' | "'" | null = null;
    for (; i < src.length; i++) {
      const ch = src[i];
      const prev = src[i - 1];
      if (inStr) {
        if (ch === inStr && prev !== '\\') inStr = null;
      } else if (ch === '"' || ch === "'") {
        inStr = ch as '"' | "'";
      } else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { blocks.push(src.slice(start, i + 1)); break; }
      }
    }
  }
  return blocks;
}

function extractField(block: string, field: string): string | null {
  // Match `field: "..."` or `field: '...'`. Inside a double-quoted value an
  // apostrophe is legal (e.g. "Nero d'Avola"), and vice versa.
  const reDouble = new RegExp(`${field}:\\s*"([^"]*)"`);
  const reSingle = new RegExp(`${field}:\\s*'([^']*)'`);
  return block.match(reDouble)?.[1] ?? block.match(reSingle)?.[1] ?? null;
}

function extractArrayField(block: string, field: string): string[] {
  const re = new RegExp(`${field}:\\s*\\[([^\\]]*)\\]`);
  const m = block.match(re);
  return m ? parseStringList(m[1]) : [];
}

async function scrapeCountries(): Promise<AppCountry[]> {
  const src = await readFile(COUNTRIES_TS, 'utf8');
  return splitEntryBlocks(src).map(b => ({
    id: extractField(b, 'id') ?? '',
    name: extractField(b, 'name') ?? '',
    origin: extractField(b, 'origin') ?? '',
    keyRegions: extractArrayField(b, 'keyRegions'),
    notableGrapes: extractArrayField(b, 'notableGrapes'),
  })).filter(c => c.id);
}

async function scrapeRegions(): Promise<AppRegion[]> {
  const src = await readFile(REGIONS_TS, 'utf8');
  return splitEntryBlocks(src).map(b => ({
    id: extractField(b, 'id') ?? '',
    name: extractField(b, 'name') ?? '',
    origin: extractField(b, 'origin') ?? '',
    notableGrapes: extractArrayField(b, 'notableGrapes'),
    appellations: extractArrayField(b, 'appellations'),
  })).filter(r => r.id && r.id.startsWith('R'));
}

async function scrapeGrapes(): Promise<AppGrape[]> {
  const src = await readFile(GRAPES_TS, 'utf8');
  return splitEntryBlocks(src).map(b => ({
    id: extractField(b, 'id') ?? '',
    name: extractField(b, 'name') ?? '',
    origin: extractField(b, 'origin') ?? '',
    keyRegions: extractArrayField(b, 'keyRegions'),
    synonyms: extractArrayField(b, 'synonyms'),
  })).filter(g => g.id && g.id.startsWith('G'));
}

function parseStringList(inner: string): string[] {
  if (!inner.trim()) return [];
  const out: string[] = [];
  // Match either "..." (allowing internal apostrophes) or '...' (allowing
  // internal double quotes). Apostrophes are common in grape and AOC names.
  const re = /"([^"]+)"|'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) out.push(m[1] ?? m[2]);
  return out;
}

// ---------- Emit per-category markdown ----------

function emitCountries(root: EncycRoot): string {
  const lines: string[] = [];
  lines.push('# Encyclopedia — Countries Index');
  lines.push('');
  lines.push('Derived from `encyclopedia.json`. Developer reference only — do not bundle.');
  lines.push('');
  lines.push('| Country | Regions | AOCs | Has Blurb |');
  lines.push('|---|---:|---:|:---:|');
  for (const [name, c] of Object.entries(root.countries)) {
    const regions = Object.keys(c.regions).length;
    let aocs = 0;
    for (const r of Object.values(c.regions)) aocs += dedupeAOCs(r.aocs).length;
    lines.push(`| ${name} | ${regions} | ${aocs} | ${c.shortBlurb ? 'Y' : '—'} |`);
  }
  lines.push('');
  for (const [name, c] of Object.entries(root.countries)) {
    lines.push(`## ${name}`);
    lines.push('');
    if (c.shortBlurb) {
      lines.push(c.shortBlurb);
      lines.push('');
    }
    const regions = Object.values(c.regions).filter(r => !isRegionPlaceholder(r.name) || r.aocs.length > 0);
    if (regions.length) {
      lines.push('**Regions:** ' + regions.map(r => r.name).join(', '));
      lines.push('');
    }
  }
  return lines.join('\n');
}

function emitRegions(root: EncycRoot): string {
  const lines: string[] = [];
  lines.push('# Encyclopedia — Regions Index');
  lines.push('');
  lines.push('Each region is listed under its parent country. `(General)` is used for AOCs that the parser could not assign to a named sub-region.');
  lines.push('');
  for (const [cname, c] of Object.entries(root.countries)) {
    const regions = Object.values(c.regions);
    if (!regions.length) continue;
    lines.push(`## ${cname}`);
    lines.push('');
    lines.push('| Region | AOCs | Blurb |');
    lines.push('|---|---:|---|');
    for (const r of regions) {
      const aocs = dedupeAOCs(r.aocs);
      const blurb = r.shortBlurb.replace(/\|/g, '\\|').slice(0, 120);
      lines.push(`| ${r.name} | ${aocs.length} | ${blurb || '—'} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function emitAOCs(root: EncycRoot): string {
  const lines: string[] = [];
  lines.push('# Encyclopedia — Appellations');
  lines.push('');
  lines.push('Full per-appellation entries with grape composition, aging windows, and named producers where the parser captured them. Duplicates collapsed by `name + classification`, keeping the richest copy.');
  lines.push('');

  let totalAOCs = 0;
  for (const [cname, c] of Object.entries(root.countries)) {
    const regions = Object.values(c.regions);
    let countryAOCs = 0;
    for (const r of regions) countryAOCs += dedupeAOCs(r.aocs).length;
    if (countryAOCs === 0) continue;
    totalAOCs += countryAOCs;
    lines.push(`## ${cname}`);
    lines.push('');
    for (const r of regions) {
      const aocs = dedupeAOCs(r.aocs);
      if (!aocs.length) continue;
      lines.push(`### ${r.name}`);
      lines.push('');
      for (const a of aocs.sort((x, y) => x.name.localeCompare(y.name))) {
        lines.push(`#### ${a.name} ${a.classification}`);
        lines.push('');
        if (a.shortBlurb) {
          lines.push(a.shortBlurb);
          lines.push('');
        }
        const styleKeys: Array<keyof EncycAOC['styles']> = ['red', 'white', 'rose', 'sparkling'];
        for (const k of styleKeys) {
          if (a.styles[k]) lines.push(`- **${k[0].toUpperCase() + k.slice(1)} style:** ${a.styles[k]}`);
        }
        if (a.grapeComposition.length) lines.push(`- **Grapes:** ${a.grapeComposition.join('; ')}`);
        if (a.agingWindow.length) lines.push(`- **Aging:** ${a.agingWindow.join('; ')}`);
        if (a.topProducers.length) lines.push(`- **Producers:** ${a.topProducers.slice(0, 12).join(', ')}`);
        lines.push('');
      }
    }
  }
  lines.unshift('');
  lines.unshift(`_Total appellations: ${totalAOCs}_`);
  return lines.join('\n');
}

function emitGrapes(root: EncycRoot): string {
  const lines: string[] = [];
  lines.push('# Encyclopedia — Grape Glossary');
  lines.push('');
  const all = Object.values(root.grapes);
  const cleaned = dedupeGrapes(all.filter(g => !isGrapeNoise(g.name)));
  const dropped = all.length - cleaned.length;
  lines.push(`_Source: ${all.length} raw grape headings → ${cleaned.length} after dedupe + noise filter (${dropped} dropped)._`);
  lines.push('');
  lines.push('Note: the OCR source emitted grape glossary headings without body text, so most entries have an empty blurb. The list is still useful as a name index.');
  lines.push('');
  lines.push('| Grape | Origin | Synonyms | Notable Regions | Blurb |');
  lines.push('|---|---|---|---|---|');
  for (const g of cleaned) {
    const blurb = (g.shortBlurb || '').replace(/\|/g, '\\|').slice(0, 100);
    lines.push(`| ${g.name} | ${g.origin || '—'} | ${g.synonyms.join(', ') || '—'} | ${g.notableRegions.join(', ') || '—'} | ${blurb || '—'} |`);
  }
  return lines.join('\n');
}

// ---------- Coverage report ----------

function emitCoverage(
  root: EncycRoot,
  app: { countries: AppCountry[]; regions: AppRegion[]; grapes: AppGrape[] },
): string {
  const lines: string[] = [];
  lines.push('# App Data → Encyclopedia Coverage Report');
  lines.push('');
  lines.push('Generated by `scripts/buildEncyclopediaReference.ts`. Read-only audit — no changes proposed.');
  lines.push('');

  // Index encyclopedia entries with lowercase + diacritic-folded keys.
  const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const encycCountries = new Set(Object.keys(root.countries).map(fold));
  const encycRegionsAll = new Set<string>();
  const encycAOCsAll = new Set<string>();
  for (const [, c] of Object.entries(root.countries)) {
    for (const [rname, r] of Object.entries(c.regions)) {
      encycRegionsAll.add(fold(rname));
      for (const a of r.aocs) encycAOCsAll.add(fold(a.name));
    }
  }
  const encycGrapes = new Set(
    Object.values(root.grapes)
      .filter(g => !isGrapeNoise(g.name))
      .map(g => fold(g.name)),
  );

  // --- Countries ---
  lines.push('## Countries');
  lines.push('');
  lines.push(`App countries: ${app.countries.length}. Encyclopedia countries: ${encycCountries.size}.`);
  lines.push('');
  // Group app countries by origin (the actual country) so US states don't all
  // show up as 50 "missing countries". We check whether origin maps to encyc.
  const originSeen = new Map<string, AppCountry[]>();
  for (const c of app.countries) {
    const k = c.origin || c.name;
    if (!originSeen.has(k)) originSeen.set(k, []);
    originSeen.get(k)!.push(c);
  }
  lines.push(`Distinct app origins (countries): ${originSeen.size}`);
  lines.push('');
  lines.push('| Origin (app) | Entries in app | In encyclopedia? |');
  lines.push('|---|---:|:---:|');
  for (const [origin, entries] of [...originSeen.entries()].sort()) {
    const hit = encycCountries.has(fold(origin))
      || (fold(origin) === 'usa' && encycCountries.has('united states'));
    lines.push(`| ${origin} | ${entries.length} | ${hit ? 'Y' : '—'} |`);
  }
  lines.push('');

  // Encyclopedia countries with no app coverage
  const appOrigins = new Set([...originSeen.keys()].map(fold));
  const encycOnly = [...encycCountries].filter(c => !appOrigins.has(c) && !(c === 'united states' && appOrigins.has('usa')));
  if (encycOnly.length) {
    lines.push('**Encyclopedia countries with no app entries:**');
    lines.push('');
    for (const c of encycOnly.sort()) lines.push(`- ${c}`);
    lines.push('');
  }

  // --- Regions ---
  lines.push('## Regions');
  lines.push('');
  lines.push(`App regions: ${app.regions.length}.`);
  lines.push('');
  lines.push('Match types: **direct** = exact name (diacritic-folded). **substring** = the app name contains, or is contained in, an encyclopedia region (e.g. "Napa Valley" ↔ "NAPA"). **AOC** = no region match but the name appears as an appellation.');
  lines.push('');
  lines.push('| App Region | Country | Match |');
  lines.push('|---|---|---|');
  for (const r of app.regions) {
    const f = fold(r.name);
    let match = '—';
    if (encycRegionsAll.has(f)) match = 'direct';
    else {
      const sub = [...encycRegionsAll].find(e => e !== '(general)' && (e.includes(f) || f.includes(e)));
      if (sub) match = `substring (${sub})`;
      else if (encycAOCsAll.has(f)) match = 'AOC';
    }
    lines.push(`| ${r.name} | ${r.origin} | ${match} |`);
  }
  lines.push('');

  // --- Grapes ---
  lines.push('## Grapes');
  lines.push('');
  lines.push(`App grapes: ${app.grapes.length}. Encyclopedia grapes (cleaned): ${encycGrapes.size}.`);
  lines.push('');
  lines.push('| App Grape | Origin | Encyclopedia match | Match via synonym |');
  lines.push('|---|---|:---:|:---:|');
  let appHits = 0;
  for (const g of app.grapes) {
    const direct = encycGrapes.has(fold(g.name));
    const synHit = !direct && g.synonyms.some(s => encycGrapes.has(fold(s)));
    if (direct || synHit) appHits++;
    lines.push(`| ${g.name} | ${g.origin} | ${direct ? 'Y' : '—'} | ${synHit ? 'Y' : '—'} |`);
  }
  lines.push('');
  lines.push(`App grape coverage: ${appHits} / ${app.grapes.length} matched in encyclopedia.`);
  lines.push('');

  // Encyclopedia-only grapes
  const appGrapeNames = new Set<string>();
  for (const g of app.grapes) {
    appGrapeNames.add(fold(g.name));
    for (const s of g.synonyms) appGrapeNames.add(fold(s));
  }
  const encycOnlyGrapes = [...encycGrapes].filter(n => !appGrapeNames.has(n)).sort();
  lines.push(`**Encyclopedia grapes not in app (${encycOnlyGrapes.length}):**`);
  lines.push('');
  // Print as a wrapped paragraph to keep file readable
  lines.push(encycOnlyGrapes.map(s => `\`${s}\``).join(', '));
  lines.push('');

  return lines.join('\n');
}

// ---------- Main ----------

async function main() {
  console.log('Reading encyclopedia.json...');
  const root = JSON.parse(await readFile(ENCYC_JSON, 'utf8')) as EncycRoot;

  console.log('Scraping app data...');
  const [countries, regions, grapes] = await Promise.all([
    scrapeCountries(),
    scrapeRegions(),
    scrapeGrapes(),
  ]);
  console.log(`  app: ${countries.length} countries, ${regions.length} regions, ${grapes.length} grapes`);

  await mkdir(OUT_DIR, { recursive: true });

  console.log('Writing reference/countries.md...');
  await writeFile(resolve(OUT_DIR, 'countries.md'), emitCountries(root), 'utf8');
  console.log('Writing reference/regions.md...');
  await writeFile(resolve(OUT_DIR, 'regions.md'), emitRegions(root), 'utf8');
  console.log('Writing reference/aocs.md...');
  await writeFile(resolve(OUT_DIR, 'aocs.md'), emitAOCs(root), 'utf8');
  console.log('Writing reference/grapes.md...');
  await writeFile(resolve(OUT_DIR, 'grapes.md'), emitGrapes(root), 'utf8');
  console.log('Writing reference/coverage.md...');
  await writeFile(
    resolve(OUT_DIR, 'coverage.md'),
    emitCoverage(root, { countries, regions, grapes }),
    'utf8',
  );

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
