# Core-screen audit — against the PREMIUM RETRO bar

_Written 2026-08-28 on `testing`, after web v0.6.11 (the all-retro type revert)
and before the polish releases that follow it. Direction:
`WEB-BATCH-PREMIUM-RETRO.md` — Playdate / Teenage Engineering; modern
execution, retro soul. The test for every finding: **does the screen still
read as the handheld, or has it started to look like a generic modern web
app?**_

Screens audited: `EntryTile` (via the listings), `EncyclopediaList`,
`EntryDetail` (+ `EntryDetailHeaders` / `EntryDetailSections`),
`PassportScreen`, `ChipFilterScreen`, `BookmarksScreen`, and the landing
(`WebsitePortal.PortalHome`). Evidence is the `design-shots.spec.ts` set at
390×844 and 1280×800 in DARK and LIGHT, before (v0.6.10, Inter) and after
(v0.6.11, all-retro).

## Verdict in one paragraph

All six core screens are **on the token system** — surfaces, liveries, radii,
elevation and press states all come from `index.css`, and
`designTokens.test.ts` polices literal colour on every one of them (they are
all in its `CONVERTED` list since v0.4.3). Nothing here is a flat full-fill
colour block any more, and as of v0.6.11 nothing reads in a sans. What is
**crude against the premium-retro bar is the opposite problem**: stage 4
rounded and softened everything into the same modern card — 16px corners, a
1px 14% hairline, a purely soft shadow, a 373ms spring — so the LCD content
reads as a SaaS list dropped into a retro shell. The retro signifiers survive
on the chassis (lamps, marquee, scanlines, the LCD treatment) and in the type;
the *materials inside the LCD* are the gap.

## Findings, graded

Grades: **good** (already premium-retro, leave it) / **crude** (lift it) /
**deliberate** (kept, with the reason).

### The shared material — one lever, every screen

| # | Where | Grade | Finding | Lift |
|---|---|---|---|---|
| A1 | `--radius-card` 1rem, `--radius-control` 0.625rem (`index.css` @theme) | crude | Every row, card and control wears a 16px corner. That is the "round everything into soft modern cards" the direction names as a hard don't. | Chunk the vocabulary: card 0.5rem, control 0.375rem, surface 1rem. One edit, every screen. |
| A2 | `border border-[var(--surface-line)]` on every card | crude | A 1px hairline at 14% ink. Reads as a modern divider, not a pixel border. | Cards and controls get a 2px edge (`.lcd-themed` rule on `.rounded-card` / `.rounded-control` + `.border`), and `--surface-line` steps up from 14% to 20% so the edge is seen. |
| A3 | `--shadow-elev-1/2/3` | crude | Pure soft layered shadows. Premium, but there is no retro edge under them. | Keep the soft layers and add a 2px hard offset as the first layer on tiers 1 and 2 — the blend the direction asks for, not a swap. |
| A4 | `--motion-press` 373ms, `--motion-settle` 361ms, `--motion-crossfade` 550ms | crude | The iOS spring, ported honestly — and floaty on the web. The direction wants snappy, a little pixel-y. | Shorten the durations (the `linear()` spring keeps its shape, so the overshoot stays and the test that pins it as a spring still holds): press 180ms, settle 220ms, crossfade 320ms. |
| A5 | Scrollbars (`::-webkit-scrollbar`, `.custom-scrollbar`) | crude | Fixed `#232323/#DC0A2D` and `#1a1a1a/#4a4a4a` — a dark grey bar down the right edge of a paper-white page on the four pale modes. | Tokens: track `--surface-sunken`, thumb `--surface-line-strong`, plus `scrollbar-color` for Firefox. |
| A6 | Scanlines, LCD grid wash, the hero rule, `.dex-pill`, the VT323 search wells | good | These *are* the retro signifiers inside the LCD and they survived stage 4 intact. | Keep. |

### EntryTile / EncyclopediaList

| # | Where | Grade | Finding | Lift |
|---|---|---|---|---|
| L1 | `EntryTile.tsx` row | good (after A1–A3) | Icon well, pixel title, terminal-face chips, chevron, stagger entrance — the row reads as a device readout once the material is fixed. | Nothing beyond the shared lever. |
| L2 | `EncyclopediaList.tsx` search well | good | The `lcd.well` recess, VT323 2xl, block cursor: a deliberate LCD-terminal moment. | Keep; make it the *one* search field (see C1). |
| L3 | `EncyclopediaList.tsx` clear button | crude | `hover:opacity-75` only — no press state on a control every other control springs on. | `dex-pressable`, rounded. |
| L4 | Icon well keyline `border-black/20` (`iconRendering.ts`) | deliberate | A 20% black keyline over a data-coloured well is a shadow, not paint; it darkens correctly on every mode. | Keep. |

### EntryDetail (+ headers, sections)

| # | Where | Grade | Finding | Lift |
|---|---|---|---|---|
| D1 | Hero panel | good | Wash + grid + 4px accent rule, pixel display title, the icon well. | Keep. |
| D2 | Shelf pills SAVED / WANT / TRIED / SHARE | crude | Four pills over three rows on a phone (390px) — the hero is half buttons. | Tighter pills (`px-3`, `gap-1.5`) so the three shelves sit on one row and SHARE alone on the second. |
| D3 | `text-[15px] md:text-base` on the scroller | crude | A magic size the type roles override anyway. | `text-body`. |
| D4 | Section headers (`SectionHeader`), `.dex-section-rule`, `.dex-info-rule` | good | iOS's three distinct rules, in the mode's accent, pixel label. | Keep. |
| D5 | Soil / flavor / linked rows | good (after A1–A3) | Same row language as the listing. | Shared lever. |

### PassportScreen

| # | Where | Grade | Finding | Lift |
|---|---|---|---|---|
| P1 | `Section` header | crude | Re-spells the section rule inline (`color-mix ... 45%`) instead of `.dex-section-rule` (40%) — a second copy that has already drifted. | Use the class. |
| P2 | Progress bars | crude | `rounded-full` pill tracks with a soft fill: the one place on the screen that reads "fitness app". | Square-ish tracks (`rounded-sm`) with a 2px well edge — a segment gauge, like the CHARACTERISTICS bars on the readout. |
| P3 | Stat tiles, rank card, stamps | good (after A1–A3) | Livery-tinted edges, pixel values, terminal captions. | Shared lever. |

### ChipFilterScreen

| # | Where | Grade | Finding | Lift |
|---|---|---|---|---|
| C1 | Search input | crude | A plain `text-sm` field, the smallest search box in the app, on the one route whose purpose is typing; every other search is the 2xl VT323 well. | The listing's well, with the accent glass and a clear button. |
| C2 | Facet chips, summary card, FILTER CHIPS toggle | good (after A1–A3) | Pixel micro labels with counts, accent-filled when on. | Shared lever. |

### BookmarksScreen

| # | Where | Grade | Finding | Lift |
|---|---|---|---|---|
| B1 | Remove (×) control | crude | Hangs off the card corner (`-top-1.5 -right-1.5`) and has no press state. | Inside the corner, `dex-pressable`. |
| B2 | Recently-viewed tiles, edit/save name | crude | No press state on three controls. | `dex-pressable`. |
| B3 | Profile / shelf switcher / shelf header stack | good | Three bands, each a surface step, pixel tabs with counts. | Shared lever. |

### The landing (`PortalHome`)

| # | Where | Grade | Finding | Lift |
|---|---|---|---|---|
| H1 | Tile labels | crude | `WHO WE ARE`, `OPEN VINODEX`, `CONTACT US` wrap to two lines at 390px — the exact wrap the v0.4.0 tile was built to end, back through the site's own size override (`.portal-home-tile > span:nth-of-type(2)`). | Size the override to the tile: `clamp(0.6rem, 2.6vw, 0.9rem)`. |
| H2 | Wordmark, tagline, four solid-livery tiles | good | The tiles are full livery on purpose here (the site's own call, v9#m4) and read as the studio's four buttons. | Keep. |

## Not findings (checked, and deliberately not changed)

- **The chips' 4px `rounded`.** A chip is not a card; its small radius is already
  chunkier than anything around it and is not in the three-radius vocabulary on
  purpose.
- **`shadow-inner` on the icon wells and the search recess.** An inset shadow is
  the recess; it is what makes a well a well.
- **Hit targets under 44px** on the caption-sized pills, tabs and chips across all
  six screens. Real, measured (31–39px), and deferred to the a11y item of this
  batch where it is fixed once with a hit-extension rule rather than by making
  every chip 44px tall.
- **The listing search well's VT323 at 2xl** and the collection's `custom-scrollbar`
  horizontal strip: both retro signifiers, both kept.

## What ships where

- **v0.6.12** — A1–A5 (the material lever), L3, D3, P1, C1, B1, B2, H1, this note.
- **v0.6.13** — D2, P2, and whatever the v0.6.12 screenshots turn up.
