# Encyclopedia data pipeline

Three-file pipeline that turns an OCR'd wine encyclopedia into structured data the codebase can consume.

## Files in this directory

| File | Purpose | Bundle into app? |
|---|---|---|
| `source/sothebys-wine-encyclopedia-2005.raw.txt` | Raw OCR text (input only) | **No** |
| `encyclopedia.json` | Structured facts + short paraphrased blurbs | **Yes** (ship-safe) |
| `encyclopedia.reference.md` | Cleaned human-readable reference | **No** (developer-only) |

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

## Attribution to surface in the app

When `encyclopedia.json` content is rendered in the UI (e.g. an About / Credits screen, or a tooltip on encyclopedia-derived text), include this attribution:

> Encyclopedia facts and summaries derived from *The Sotheby's Wine Encyclopedia* by Tom Stevenson (Dorling Kindersley, 4th edition, 2005).

This is also embedded as the top-level `attribution` object in `encyclopedia.json` so the app can read it directly.
