# Encyclopedia data pipeline

Three-file pipeline that turns an OCR'd wine encyclopedia into structured data the codebase can consume.

## Files in this directory

| File | Purpose | Bundle into app? |
|---|---|---|
| `source/sothebys-wine-encyclopedia-2005.raw.txt` | Raw OCR text (input only) | **No** |
| `encyclopedia.json` | Structured facts + short paraphrased blurbs | **Yes** (ship-safe) |
| `encyclopedia.reference.md` | Cleaned human-readable reference (raw walk) | **No** (developer-only) |
| `reference/countries.md` | Per-country index + region list | **No** (developer-only) |
| `reference/regions.md` | Regions grouped by country with AOC counts | **No** (developer-only) |
| `reference/aocs.md` | Full per-appellation entries (deduplicated) | **No** (developer-only) |
| `reference/grapes.md` | Cleaned grape glossary (OCR noise filtered) | **No** (developer-only) |
| `reference/coverage.md` | App data → encyclopedia coverage audit | **No** (developer-only) |

## Source

*The Sotheby's Wine Encyclopedia*, Tom Stevenson, 4th edition (2005). Publisher: Dorling Kindersley. © 1988, 1991, 1997, 2001, 2005.

The raw OCR text is the input to the parser. It is not redistributed in the build output.

## Public-deploy policy

Vinodex ships publicly. Verbatim long-form text from the source is **not** shipped. The parser is constrained to emit:

- **Facts** — appellation lists, grape compositions, aging windows, classifications, producer names. Facts are not copyrightable.
- **Short paraphrased summaries** — capped at 300 characters per string in `encyclopedia.json`.

The `encyclopedia.reference.md` file holds longer cleaned text for developer reference only. It must not be copied into `dist/` or otherwise served to users.

## Re-running the parser

```
npm run build:encyclopedia
```

Runs `scripts/cleanEncyclopediaText.ts` against the raw source and rewrites both `encyclopedia.json` and `encyclopedia.reference.md`. The script also runs a ship-safety check that flags any string in the JSON longer than 300 chars.

## Building the split reference + coverage report

```
npm run build:encyclopedia:reference
```

Runs `scripts/buildEncyclopediaReference.ts` against `encyclopedia.json` and the app data files (`data/countries.ts`, `data/regions.ts`, `data/grapes.ts`). Output goes to `data/encyclopedia/reference/`:

- `countries.md`, `regions.md`, `aocs.md`, `grapes.md` — per-category indexes. AOCs are deduplicated by `name + classification`, keeping the entry with the most extracted content. Grapes drop OCR debris (section headers and orphaned fragments).
- `coverage.md` — read-only audit of which app entries the encyclopedia covers. Matches are diacritic-folded and synonym-aware for grapes; region matches are direct, substring (e.g. "Napa Valley" ↔ "NAPA"), or via appellation.

The split reference is also developer-only — do **not** bundle into the production build.

### Known data quality limits

The upstream OCR-derived parse in `cleanEncyclopediaText.ts` mis-attributes some content across page boundaries (a few country intros pick up paragraphs from the previous chapter; some regions appear under the wrong country header; the grape glossary headings come through without body text). The split reference faithfully surfaces what the JSON contains — it does not attempt to rewrite mis-attributed prose. Fixing those would require improvements upstream in the OCR-to-tree walker.

## Attribution to surface in the app

When `encyclopedia.json` content is rendered in the UI (e.g. an About / Credits screen, or a tooltip on encyclopedia-derived text), include this attribution:

> Encyclopedia facts and summaries derived from *The Sotheby's Wine Encyclopedia* by Tom Stevenson (Dorling Kindersley, 4th edition, 2005).

This is also embedded as the top-level `attribution` object in `encyclopedia.json` so the app can read it directly.
