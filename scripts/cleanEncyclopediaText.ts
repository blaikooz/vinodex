/**
 * Cleans and structures the OCR'd Sotheby's Wine Encyclopedia text.
 *
 * Input:  data/encyclopedia/source/sothebys-wine-encyclopedia-2005.raw.txt
 * Output: data/encyclopedia/encyclopedia.json         (ship-safe: facts + short blurbs)
 *         data/encyclopedia/encyclopedia.reference.md (dev-only: longer cleaned reference)
 *
 * Public-deploy policy: encyclopedia.json contains only facts (appellation lists,
 * grape compositions, aging windows, classifications, top producer names) and
 * short paraphrased blurbs (<=300 chars). Long verbatim prose stays out of the
 * shipped artifact. The .reference.md file is for developer reference only and
 * must not be bundled into the production build.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SOURCE = resolve(REPO_ROOT, 'data/encyclopedia/source/sothebys-wine-encyclopedia-2005.raw.txt');
const OUT_JSON = resolve(REPO_ROOT, 'data/encyclopedia/encyclopedia.json');
const OUT_MD = resolve(REPO_ROOT, 'data/encyclopedia/encyclopedia.reference.md');

const ATTRIBUTION = {
  source: "The Sotheby's Wine Encyclopedia",
  author: 'Tom Stevenson',
  edition: '4th edition (2005)',
  publisher: 'Dorling Kindersley',
  note:
    'Facts and short paraphrased summaries derived from the source. Long-form text from the original is not redistributed.',
};

const KNOWN_COUNTRIES = [
  'FRANCE', 'ITALY', 'SPAIN', 'PORTUGAL', 'GERMANY', 'AUSTRIA', 'SWITZERLAND',
  'HUNGARY', 'BULGARIA', 'ROMANIA', 'GREECE', 'LUXEMBOURG', 'ENGLAND',
  'SLOVAKIA', 'CZECH REPUBLIC', 'CROATIA', 'SLOVENIA', 'GEORGIA', 'MOLDOVA',
  'UKRAINE', 'RUSSIA', 'TURKEY', 'LEBANON', 'ISRAEL', 'CYPRUS', 'MOROCCO',
  'TUNISIA', 'ALGERIA', 'SOUTH AFRICA', 'CANADA', 'MEXICO', 'CHILE',
  'ARGENTINA', 'URUGUAY', 'BRAZIL', 'AUSTRALIA', 'NEW ZEALAND', 'CHINA',
  'JAPAN', 'INDIA', 'UNITED STATES', 'USA',
];

const KNOWN_REGIONS = [
  // France
  'BORDEAUX', 'BURGUNDY', 'CHAMPAGNE', 'ALSACE', 'LOIRE VALLEY', 'THE LOIRE VALLEY',
  'RHÔNE VALLEY', 'THE RHÔNE VALLEY', 'PROVENCE', 'CORSICA', 'LANGUEDOC',
  'LANGUEDOC-ROUSSILLON', 'JURA', 'SAVOIE', 'BEAUJOLAIS', 'CHABLIS',
  'THE MÉDOC', 'MÉDOC', 'PAUILLAC', 'ST.-ESTÈPHE', 'ST.-JULIEN', 'MARGAUX',
  'GRAVES', 'SAUTERNES', 'BARSAC', 'POMEROL', 'ST.-ÉMILION',
  // Italy
  'TUSCANY', 'PIEDMONT', 'VENETO', 'SICILY', 'CAMPANIA', 'ABRUZZO', 'PUGLIA',
  'NORTHWESTERN ITALY', 'NORTHEASTERN ITALY', 'WEST-CENTRAL ITALY', 'EAST-CENTRAL ITALY',
  // Spain
  'RIOJA', 'NAVARRA', 'PENEDÉS', 'JEREZ', 'PRIORAT', 'RIBERA DEL DUERO', 'RUEDA',
  // Portugal
  'PORT', 'MADEIRA', 'DOURO',
  // Germany
  'AHR', 'MOSEL', 'NAHE', 'RHEINGAU', 'RHEINHESSEN', 'PFALZ', 'FRANKEN', 'BADEN',
  // USA
  'CALIFORNIA', 'NAPA', 'NAPA COUNTY', 'SONOMA', 'SONOMA COUNTY', 'MENDOCINO',
  'OREGON', 'WASHINGTON', 'NEW YORK', 'THE CENTRAL VALLEY', 'THE CENTRAL COAST',
  'THE PACIFIC NORTHWEST', 'THE ATLANTIC NORTHEAST',
  // New World
  'BAROSSA', 'BAROSSA VALLEY', 'MARLBOROUGH', 'CENTRAL OTAGO', 'STELLENBOSCH',
  'MENDOZA', 'MAIPO',
];

const COUNTRY_SET = new Set(KNOWN_COUNTRIES);
const REGION_SET = new Set(KNOWN_REGIONS);

interface AOC {
  name: string;
  classification: string;
  country: string;
  region: string;
  district?: string;
  shortBlurb: string;
  styles: { red?: string; white?: string; rose?: string; sparkling?: string };
  grapeComposition: string[];
  agingWindow: string[];
  topProducers: string[];
  rawIntroLines: string[];
}

interface RegionNode {
  name: string;
  country: string;
  shortBlurb: string;
  introLines: string[];
  aocs: AOC[];
}

interface CountryNode {
  name: string;
  shortBlurb: string;
  introLines: string[];
  regions: Map<string, RegionNode>;
}

interface GrapeEntry {
  name: string;
  shortBlurb: string;
  synonyms: string[];
  origin?: string;
  notableRegions: string[];
}

// ---------- Phase A: text repair ----------

function repairLines(rawLines: string[]): string[] {
  const out: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];

    // Normalize whitespace
    line = line.replace(/ /g, ' ').replace(/\s+$/g, '');

    // Strip standalone page numbers
    if (/^\s*\d{1,3}\s*$/.test(line)) continue;

    // Strip "see also pXXX" debris that often appears alone
    if (/^,?\s*see also p\d+\s*$/i.test(line)) continue;

    // Strip "T H E   M É D O C" style spaced-letter headings later — keep for now but
    // collapse internal extra spaces caused by OCR
    if (/^[A-ZÀ-ŸŒÆ]( [A-ZÀ-ŸŒÆ]){2,}/.test(line)) {
      line = line.replace(/(?<=[A-ZÀ-ŸŒÆ]) (?=[A-ZÀ-ŸŒÆ])/g, '');
    }

    out.push(line);
  }

  // Dehyphenate broken words across line breaks: line ends with "...word-" and
  // next line starts lowercase
  const dehyphenated: string[] = [];
  for (let i = 0; i < out.length; i++) {
    const cur = out[i];
    const next = out[i + 1];
    if (next && /[A-Za-zÀ-ÿ]-$/.test(cur) && /^[a-zà-ÿ]/.test(next)) {
      dehyphenated.push(cur.replace(/-$/, '') + next);
      i++; // skip next
    } else {
      dehyphenated.push(cur);
    }
  }

  return dehyphenated;
}

// ---------- Phase B: heading detection ----------

const RE_AOC = /^([A-ZÀ-ŸŒÆ0-9'’ \.\-]+?)\s+(AOC|DOC|DOCG|DOCa|VDQS|DO|IGT|VR|VdT|VdP|VLQPRD|QmP|QbA)$/;
const RE_STYLE_HEADER = /^(RED|WHITE|ROSÉ|ROSE|SPARKLING|FORTIFIED|SWEET)\b/;

function isCountryHeading(line: string): boolean {
  const t = line.trim();
  return COUNTRY_SET.has(t);
}

function isRegionHeading(line: string): boolean {
  const t = line.trim();
  return REGION_SET.has(t);
}

function parseAOCHeading(line: string): { name: string; classification: string } | null {
  const t = line.trim();
  const m = t.match(RE_AOC);
  if (!m) return null;
  // Sanity: must not be too long (OCR noise can match)
  if (m[1].length > 60) return null;
  // Must contain at least one space-or-letter before classification token
  const name = m[1].replace(/\s+/g, ' ').trim();
  if (!/[A-ZÀ-ŸŒÆ]/.test(name)) return null;
  return { name, classification: m[2] };
}

// ---------- Phase B/C: walk and segment ----------

function buildTree(lines: string[]): {
  countries: Map<string, CountryNode>;
  grapes: GrapeEntry[];
} {
  const countries = new Map<string, CountryNode>();
  const grapes: GrapeEntry[] = [];

  let curCountry: CountryNode | null = null;
  let curRegion: RegionNode | null = null;
  let curAOC: AOC | null = null;
  let mode: 'country-intro' | 'region-intro' | 'aoc-intro' | 'aoc-style' | 'idle' = 'idle';
  let curStyle: keyof AOC['styles'] | null = null;
  let glossaryActive = false;
  // Country headings are only accepted once we've seen the first "The WINES of"
  // chapter anchor. This prevents the table-of-contents and introduction
  // sections from being mis-attributed to whatever country happens to appear
  // first in the TOC.
  let chapterGate = false;
  let winesOfHits = 0;
  // The TOC contains ~10 "The WINES of" entries before the body chapters
  // start. Once we've passed those, real chapter starts begin.
  const TOC_WINES_OF_COUNT = 10;

  const ensureCountry = (name: string): CountryNode => {
    const key = name.trim();
    let c = countries.get(key);
    if (!c) {
      c = { name: key, shortBlurb: '', introLines: [], regions: new Map() };
      countries.set(key, c);
    }
    return c;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect glossary section
    if (/^GLOSSARY OF GRAPE VARIETIES$/i.test(trimmed)) {
      glossaryActive = true;
      continue;
    }
    if (glossaryActive && /^(GRAPE VARIETY SYNONYMS|STORING WINE|SERVING WINE)$/i.test(trimmed)) {
      glossaryActive = false;
    }

    // Count "The WINES of" occurrences. The TOC repeats this anchor about 10
    // times before the first body chapter begins; gate opens after those.
    if (/^the wines of$/i.test(trimmed)) {
      winesOfHits++;
      if (winesOfHits > TOC_WINES_OF_COUNT) chapterGate = true;
      continue;
    }

    // Country heading — start a new country context (only after chapter gate).
    // Two guards:
    //  (a) Skip if the previous non-blank line ends with ",", "&", or "AND"
    //      — that's a multi-line TOC chapter title.
    //  (b) Skip if the next 6 non-blank lines don't include a substantive
    //      paragraph (>= 100 chars) — running page headers and map labels
    //      never have a real intro paragraph following them.
    if (chapterGate && isCountryHeading(trimmed)) {
      let prev = '';
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        if (lines[j] && lines[j].trim()) { prev = lines[j].trim(); break; }
      }
      if (/[,&]$/.test(prev) || /\bAND$/i.test(prev)) continue;

      // OCR splits paragraphs into ~40–70 char column-width lines, so we look
      // for 3+ substantial (>=40 char) lines within the next 15 non-blank lines.
      let substantiveLines = 0;
      let scanned = 0;
      for (let j = i + 1; j < lines.length && scanned < 15; j++) {
        const t = lines[j].trim();
        if (!t) continue;
        scanned++;
        if (t.length >= 40) substantiveLines++;
        if (substantiveLines >= 3) break;
      }
      if (substantiveLines < 3) continue;

      // Avoid clobbering existing data: if we've already opened this country
      // and assigned regions/AOCs, just resume it.
      curCountry = ensureCountry(trimmed);
      curRegion = null;
      curAOC = null;
      mode = 'country-intro';
      continue;
    }

    // Region heading
    if (curCountry && isRegionHeading(trimmed)) {
      const regionKey = trimmed.replace(/^THE\s+/, '');
      let r = curCountry.regions.get(regionKey);
      if (!r) {
        r = { name: regionKey, country: curCountry.name, shortBlurb: '', introLines: [], aocs: [] };
        curCountry.regions.set(regionKey, r);
      }
      curRegion = r;
      curAOC = null;
      mode = 'region-intro';
      continue;
    }

    // AOC/DOC heading
    const aocHead = parseAOCHeading(trimmed);
    if (aocHead && curCountry) {
      // If we don't yet have a region, attach AOCs to a synthetic "General" region
      if (!curRegion) {
        const synthName = '(General)';
        let r = curCountry.regions.get(synthName);
        if (!r) {
          r = { name: synthName, country: curCountry.name, shortBlurb: '', introLines: [], aocs: [] };
          curCountry.regions.set(synthName, r);
        }
        curRegion = r;
      }
      curAOC = {
        name: aocHead.name,
        classification: aocHead.classification,
        country: curCountry.name,
        region: curRegion.name,
        shortBlurb: '',
        styles: {},
        grapeComposition: [],
        agingWindow: [],
        topProducers: [],
        rawIntroLines: [],
      };
      curRegion.aocs.push(curAOC);
      mode = 'aoc-intro';
      curStyle = null;
      continue;
    }

    // Wine style sub-block
    if (curAOC) {
      const styleMatch = trimmed.match(RE_STYLE_HEADER);
      if (styleMatch) {
        const tok = styleMatch[1].toUpperCase();
        curStyle = tok === 'RED' ? 'red'
          : tok === 'WHITE' ? 'white'
          : (tok === 'ROSÉ' || tok === 'ROSE') ? 'rose'
          : tok === 'SPARKLING' ? 'sparkling'
          : null;
        if (curStyle) {
          mode = 'aoc-style';
          // Capture the rest of the line as the start of style description
          const tail = trimmed.replace(RE_STYLE_HEADER, '').trim();
          if (tail) curAOC.styles[curStyle] = tail;
          continue;
        }
      }

      // Symbol-prefixed lines: g (grape composition), k (aging), t (top producers)
      // The OCR put these symbols inline at the start of words.
      if (/^g[A-ZÀ-Ÿ]/.test(trimmed)) {
        const content = trimmed.slice(1).trim();
        curAOC.grapeComposition.push(content);
        continue;
      }
      if (/^k[A-Za-z0-9]/.test(trimmed) && trimmed.length < 200) {
        const content = trimmed.slice(1).trim();
        curAOC.agingWindow.push(content);
        continue;
      }
      if (/^t[A-ZÀ-Ÿ]/.test(trimmed)) {
        const content = trimmed.slice(1).trim();
        const producers = content.split(/[•·]/).map(s => s.trim()).filter(Boolean);
        curAOC.topProducers.push(...producers);
        continue;
      }
    }

    // Glossary grape entries: heading like "CABERNET SAUVIGNON" followed by paragraph.
    // Reject category headings like "WHITE GRAPE VARIETIES", "CROSSES AND HYBRIDS",
    // "CLONES AND CLONING", "GRAPE COLOR" — they contain English connector words
    // or describe a topic rather than a single varietal.
    if (
      glossaryActive
      && /^[A-ZÀ-ŸŒÆ][A-ZÀ-ŸŒÆ '\-]{2,40}$/.test(trimmed)
      && !COUNTRY_SET.has(trimmed)
      && !/\b(AND|OR|VARIETIES|COLOR|CLONES|CROSSES|HYBRIDS|SYNONYMS|GRAPE)\b/.test(trimmed)
    ) {
      grapes.push({
        name: toTitleCase(trimmed),
        shortBlurb: '',
        synonyms: [],
        notableRegions: [],
      });
      continue;
    }
    if (glossaryActive && grapes.length > 0 && trimmed && !curAOC && !curCountry) {
      const last = grapes[grapes.length - 1];
      if (last.shortBlurb.length < 280) {
        last.shortBlurb = trimUtf((last.shortBlurb + ' ' + trimmed).trim(), 300);
      }
      continue;
    }

    // Accumulate intro lines based on mode
    if (!trimmed) continue; // skip blanks

    switch (mode) {
      case 'country-intro':
        if (curCountry && curCountry.introLines.length < 30) curCountry.introLines.push(trimmed);
        break;
      case 'region-intro':
        if (curRegion && curRegion.introLines.length < 25) curRegion.introLines.push(trimmed);
        break;
      case 'aoc-intro':
        if (curAOC && curAOC.rawIntroLines.length < 20) curAOC.rawIntroLines.push(trimmed);
        break;
      case 'aoc-style':
        if (curAOC && curStyle) {
          const prev = curAOC.styles[curStyle] ?? '';
          if (prev.length < 400) {
            curAOC.styles[curStyle] = (prev + ' ' + trimmed).trim();
          }
        }
        break;
      default:
        break;
    }
  }

  return { countries, grapes };
}

// ---------- Phase C: blurb shaping ----------

function shortenBlurb(introLines: string[], maxChars = 300): string {
  if (introLines.length === 0) return '';
  const joined = introLines.join(' ').replace(/\s+/g, ' ').trim();
  // Take first 1–2 sentences up to maxChars
  const sentences = joined.split(/(?<=[.!?])\s+/);
  let acc = '';
  for (const s of sentences) {
    if ((acc + ' ' + s).trim().length > maxChars) break;
    acc = (acc + ' ' + s).trim();
    if (acc.length > 120) break; // 1–2 sentences is enough
  }
  return acc || joined.slice(0, maxChars);
}

function trimUtf(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s|-)/)
    .map(w => /\s|-/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

// ---------- Phase D: emit ----------

function buildJSON(countries: Map<string, CountryNode>, grapes: GrapeEntry[]) {
  const out: any = { attribution: ATTRIBUTION, countries: {}, grapes: {} };

  for (const [cname, c] of countries) {
    const cBlurb = shortenBlurb(c.introLines);
    const regions: Record<string, any> = {};
    for (const [rname, r] of c.regions) {
      const aocs = r.aocs.map(a => ({
        name: a.name,
        classification: a.classification,
        district: a.district ?? null,
        shortBlurb: shortenBlurb(a.rawIntroLines, 280),
        styles: {
          red: a.styles.red ? trimUtf(a.styles.red, 280) : undefined,
          white: a.styles.white ? trimUtf(a.styles.white, 280) : undefined,
          rose: a.styles.rose ? trimUtf(a.styles.rose, 280) : undefined,
          sparkling: a.styles.sparkling ? trimUtf(a.styles.sparkling, 280) : undefined,
        },
        grapeComposition: dedupe(a.grapeComposition.map(s => trimUtf(s, 280))),
        agingWindow: dedupe(a.agingWindow.map(s => trimUtf(s, 80))),
        topProducers: dedupe(a.topProducers).slice(0, 30),
      }));
      regions[rname] = {
        name: r.name,
        shortBlurb: shortenBlurb(r.introLines, 280),
        aocs,
      };
    }
    out.countries[cname] = { name: cname, shortBlurb: cBlurb, regions };
  }

  for (const g of grapes) {
    if (!g.name) continue;
    out.grapes[g.name] = {
      name: g.name,
      shortBlurb: trimUtf(g.shortBlurb, 300),
      synonyms: g.synonyms,
      origin: g.origin ?? null,
      notableRegions: g.notableRegions,
    };
  }
  return out;
}

function dedupe<T>(xs: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const x of xs) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

function buildMarkdown(countries: Map<string, CountryNode>, grapes: GrapeEntry[]): string {
  const lines: string[] = [];
  lines.push('# Sotheby\'s Wine Encyclopedia — Cleaned Reference');
  lines.push('');
  lines.push('> **Reference only — derived from copyrighted source. Not for redistribution.**');
  lines.push('>');
  lines.push(`> Source: *${ATTRIBUTION.source}*, ${ATTRIBUTION.author}, ${ATTRIBUTION.edition}. Publisher: ${ATTRIBUTION.publisher}.`);
  lines.push('>');
  lines.push('> This file is a developer-only reference. Do **not** bundle into the production build.');
  lines.push('> Only `encyclopedia.json` (facts + short blurbs) is intended to ship.');
  lines.push('');

  for (const [cname, c] of countries) {
    lines.push(`# ${cname}`);
    lines.push('');
    if (c.introLines.length) {
      lines.push(c.introLines.slice(0, 8).join(' ').replace(/\s+/g, ' ').trim());
      lines.push('');
    }
    for (const [, r] of c.regions) {
      lines.push(`## ${r.name}`);
      lines.push('');
      if (r.introLines.length) {
        lines.push(r.introLines.slice(0, 6).join(' ').replace(/\s+/g, ' ').trim());
        lines.push('');
      }
      for (const a of r.aocs) {
        lines.push(`### ${a.name} ${a.classification}`);
        lines.push('');
        if (a.rawIntroLines.length) {
          lines.push(a.rawIntroLines.slice(0, 6).join(' ').replace(/\s+/g, ' ').trim());
          lines.push('');
        }
        const facts: string[] = [];
        if (a.grapeComposition.length) facts.push(`- **Grapes:** ${a.grapeComposition.join('; ')}`);
        if (a.agingWindow.length) facts.push(`- **Aging:** ${a.agingWindow.join('; ')}`);
        if (a.topProducers.length) facts.push(`- **Producers:** ${dedupe(a.topProducers).slice(0, 12).join(', ')}`);
        if (facts.length) {
          lines.push(...facts);
          lines.push('');
        }
      }
    }
  }

  if (grapes.length) {
    lines.push('# Grape Glossary');
    lines.push('');
    for (const g of grapes) {
      lines.push(`## ${g.name}`);
      lines.push('');
      if (g.shortBlurb) {
        lines.push(g.shortBlurb);
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

// ---------- Main ----------

async function main() {
  console.log(`Reading ${SOURCE} ...`);
  const raw = await readFile(SOURCE, 'utf8');
  const rawLines = raw.split(/\r?\n/);
  console.log(`  ${rawLines.length.toLocaleString()} raw lines`);

  console.log('Phase A: repairing OCR artifacts...');
  const lines = repairLines(rawLines);
  console.log(`  ${lines.length.toLocaleString()} lines after repair`);

  console.log('Phase B+C: segmenting and extracting facts...');
  const { countries, grapes } = buildTree(lines);
  let aocCount = 0;
  for (const c of countries.values()) {
    for (const r of c.regions.values()) aocCount += r.aocs.length;
  }
  console.log(`  ${countries.size} countries, ${aocCount} AOC/DOC entries, ${grapes.length} glossary grapes`);

  console.log('Phase D: emitting artifacts...');
  await mkdir(dirname(OUT_JSON), { recursive: true });
  const json = buildJSON(countries, grapes);
  await writeFile(OUT_JSON, JSON.stringify(json, null, 2), 'utf8');
  console.log(`  wrote ${OUT_JSON}`);

  const md = buildMarkdown(countries, grapes);
  await writeFile(OUT_MD, md, 'utf8');
  console.log(`  wrote ${OUT_MD}`);

  // Public-deploy safety check: flag any string in the JSON that looks suspiciously long.
  const flat = JSON.stringify(json);
  const longRuns = flat.match(/"[^"]{301,}"/g);
  if (longRuns && longRuns.length) {
    console.warn(`  WARN: ${longRuns.length} string(s) over 300 chars in JSON — review for paraphrasing.`);
  } else {
    console.log('  ship-safety: no JSON strings exceed 300 chars.');
  }
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
