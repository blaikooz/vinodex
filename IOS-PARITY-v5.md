# Web ↔ iOS parity plan — v5 (page-by-page polish)

_Follows `IOS-PARITY-v4.md`. Passes 2–5 of v4 are done, plus a fix round for
region flag wells, unified shelf colour, country-list flags, chip-wrapped
climate, and outline location dots. This document is a **page-by-page** sweep of
the small things still off — from a fresh screen-by-screen discrepancy review
against `vinodex-ios` (read-only). Severity: **cosmetic** (a glyph/word),
**minor** (layout/order/copy), **moderate** (a small missing control/section)._

Everything here is presentation or a small control; none of it touches the
data model or the test suite. Items are grouped by screen. Do them in any order;
each is independent.

---

## Main menu & chassis

Largely at parity (tile faces, icons, orb hold-to-flip, nameplate, marquee all
match). Remaining:

1. **Device back panel — stale CREATED BY line.** Web renders a `CREATED BY
   HORIZON` line (`DeviceBackPanel.tsx:133`); iOS deleted it in v0.5.3 and keeps
   the maker's mark only in the © line. _minor._
2. **Back panel — creator string.** Web `© YEAR HORIZON`; iOS is
   `HORIZON/GODOT` (`DeviceBackPlate.swift:17`). _minor._
3. **Back panel — missing factory leavings.** iOS draws a faded `BarcodeSticker`
   and a ripped `SALE $4.99` price tag on the plate; web has neither. _minor._
4. **Back panel — return hint.** Web `◀ TAP TO RETURN`; iOS `hand.draw` +
   `SWIPE TO RETURN`. The tap-vs-swipe wording is a fair web adaptation; the
   leading glyph (left-triangle vs hand-draw) is the cosmetic miss. _cosmetic._
5. **"Saved" aria-label.** Web `Saved`; iOS `Saved entries`. _cosmetic._

## Encyclopedia list

6. **Filter-banner icon.** Web swaps a different lucide glyph per filter mode;
   iOS uses one funnel glyph (`line.3.horizontal.decrease.circle.fill`) in the
   accent colour for every filter (`EncyclopediaList.tsx:278`). _minor._
7. **No DATA LOAD ERROR state.** iOS separates a genuine empty result from a
   database-load failure (warning triangle + "See SETTINGS ▸ DEV"); web only
   shows "NO DATA FOUND" (`EncyclopediaList.tsx:379`). _minor (edge case)._
8. **Empty-state glyph.** Web `List` @48/opacity-50; iOS `list.bullet.rectangle`
   @40/0.6. _cosmetic._

## Entry detail

Header tiles, MY RATING, class-art tiles, section-header icons, region flag
wells and shelf colours are already fixed. Remaining:

9. **INFO block suppressed on flavours.** Web hides INFO for all flavor entries
   (`EntryDetail.tsx` `!isFlavor` guard); iOS shows the top INFO block for any
   entry with a non-empty description, flavours included. _moderate (verify the
   flavor description copy reads well first)._
10. **APPELLATION SYSTEM — spelled-out name.** Web shows only the abbreviation
    chip (e.g. "AOC"); iOS shows the abbreviation **and** the full
    `appellationName` (and the state when present). _moderate._
11. **FLAVOR PROFILE drops unmatched notes.** Web renders only tasting notes
    that resolve to a flavor entry; iOS renders every note, greying the
    unresolved ones (`EntryDetail.tsx:147`). _moderate._
12. **Rarity readout colour.** Web wraps label+stars in one green pill
    regardless of tier; iOS uses a rarity-tier-coloured chip with the stars
    sitting outside it. _minor._
13. **ALSO KNOWN AS / APPELLATIONS pills.** Web renders grey
    (`bg-stone-800`) pills; iOS uses green `chipSection` chips. APPELLATIONS
    also flows (FlowLayout) vs web `grid-cols-2`. _cosmetic._
14. **Empty-section placeholders.** Web prints "NO ALTERNATE NAMES LISTED." /
    "No flavor profile listed."; iOS drops the section entirely when empty.
    _minor._
15. **CLIMATE name case.** Web keeps source case; iOS `.uppercased()`
    (`EntryDetail.tsx:832`). _cosmetic._
16. **Expand caps.** Style lists collapse to 6 before EXPAND ALL; iOS uses
    `prefix(3)`. Conversely web adds an EXPAND ALL to NOTABLE REGIONS / NOTABLE
    GRAPES where iOS hard-caps at 8 with no expander. _minor._
17. **EXPAND ALL affordance.** Web is a text-only rounded button; iOS is a
    capsule with a `chevron.up/down`. _cosmetic._
18. **Soil grid columns.** Web `grid-cols-2` at device width; iOS always 3.
    _minor._
19. **NOBLE crown glow.** iOS gives the NOBLE crown a yellow drop-shadow; web's
    is a flat glyph (the GODFORSAKEN flame glow is already present). _cosmetic._

## Entry tile (list rows)

20. **No locked-tier affordance.** iOS shows a yellow `lock.fill` (in place of
    the chevron) and desaturates free-tier-locked rows; web has none. Likely
    deliberate (the port doesn't gate browsing) — decide keep-or-port. _minor /
    possibly deliberate._

## Collection (bookmarks)

21. **Single-item remove skips confirm.** Web deletes on tap; iOS routes through
    a "REMOVE FROM {SHELF}?" alert. _moderate._
22. **PASSPORT button.** Web adds a trailing chevron and uses `BookMarked`; iOS
    is `book.closed.fill` + label, no chevron. _cosmetic._
23. **Recently-viewed labels.** Web keeps source case and allows 2 lines; iOS
    uppercases and truncates to 1. _minor._
24. **Streak capsule tint.** Web tints the whole pill amber; iOS is a neutral
    well with only the flame in yellow. _cosmetic._
25. **Avatar size / badge / placeholder.** Web 64px avatar, corner-tab camera
    badge, `UserRound` placeholder; iOS 96pt, circular `camera.fill` badge,
    gradient `person.crop.circle.fill`. _cosmetic._
26. **Edit-pencil glyph.** Web `Pencil`; iOS `square.and.pencil` (`SquarePen`).
    _cosmetic._

## Wine exam (quiz)

27. **Results button emphasis inverted.** iOS: RETRY is the prominent yellow
    pill, BACK is subdued. Web has them swapped (exit is the bright green one).
    _moderate._
28. **Reveal-card button colours.** iOS LEARN MORE = green, NEXT/SEE RESULTS =
    yellow; web LEARN MORE = dark, NEXT = green. _minor._
29. **Reveal order/layout.** iOS: verdict → description → tile → LEARN MORE →
    NEXT, stacked full-width, centred. Web: verdict → tile → description →
    LEARN MORE + NEXT side-by-side, bottom-anchored. _minor._
30. **Question prompt font.** Web `font-mono`; iOS `DexFont.retro(15)`.
    _minor._
31. **Results seal icon.** Web `CheckCircle2`/`XCircle`; iOS
    `checkmark.seal.fill`/`xmark.seal.fill`. _cosmetic._
32. **Results/done card + copy.** iOS wraps results and daily-done in a
    hero-wash card and uses uppercase, period-free strings; web centres them
    bare with sentence-case + trailing periods. _cosmetic (matches the web-wide
    mono normal-case convention — decide once)._
33. **Locked-tier alert glyph & footer alignment.** Web adds a `Lock` glyph to
    the alert and centres the "Ten questions, 8 to pass…" line; iOS has no alert
    glyph and left-aligns the footer. _cosmetic._

## Passport

34. **Stat tiles orientation.** Web stacks icon-over-value-over-label vertically;
    iOS is a horizontal row (icon left, value+label right). _moderate._
35. **Fonts.** Progress-row and stat-tile labels use `font-retro`; iOS uses
    `DexFont.mono(17)` / `mono(15)`. _minor._
36. **Icon choices.** GRAPES `LayoutGrid` vs `circle.grid.3x3.fill`; STYLES
    `Wine` vs `wineglass.fill`. _cosmetic._

## Daily grape / daily challenge

37. **Reveal name shadow.** Web renders the name flat green; iOS uses `lcd.text`
    with a green offset pixel shadow. _cosmetic._

## Rating prompt

38. **Entry-name font.** Web `font-retro` truncated; iOS `DexFont.mono(20)`
    wrapping. _minor._

## Scanner

39. **Prompt copy per step.** Web `WHAT COLOUR IS IT?` / `HOW DOES IT FEEL?` /
    `WHAT DO YOU TASTE?`; iOS `WHAT COLOR?` / `HOW IS THE BODY?` / `AROMAS AND
    FLAVORS?`, each with a second-line subtitle web omits. _minor._
40. **Skip label + step counter.** Web `SKIP` and `n / 5`; iOS `NOT SURE` and
    `STEP n OF 5` (→ `RESULT` on the last step). _minor._
41. **No RESET control.** iOS shows RESET when criteria are non-empty; web only
    has per-step back + SCAN AGAIN. _minor._
42. **Flavour step is thinner.** iOS adds a `SEARCH FLAVORS…` bar and a
    SUBCLASSES group and labels the count `BASKET n/limit`; web offers classes
    only with `n / limit SELECTED`. _moderate._
43. **Reveal is a flat list, not a hero.** iOS shows a single BEST MATCH hero
    (icon well, OPEN ENTRY, then "ALSO FITS (n MORE)"); web lists up to 20 tiles
    under "{n} MATCHES", with different empty/blank copy. _moderate._
44. **Body chips 2-col.** Web lays body options in 2 columns; iOS stacks them
    vertically to read as the light→full scale. _cosmetic._
45. _Deliberate:_ the country step uses a flat list instead of the globe
    (documented). Leave.

## Globe

46. **Missing second instruction line.** Web `DRAG TO SPIN GLOBE` only; iOS adds
    `TAP TO SELECT CONTINENT`. _minor._
47. **World-search control.** Web is a bottom green pill "WORLD SEARCH"; iOS is a
    top search bar "SEARCH WORLD..." styled like every list search. Also align
    the wording with RegionMapScreen (which already says "SEARCH WORLD").
    _moderate._
48. **Marker positions.** Web pins continents to old wine-city coords (which
    seat labels off the landmass); iOS uses tuned continent centroids. _moderate._
49. **Marker colours.** Web overrides via `MARKER_COLOR_OVERRIDES`; iOS uses each
    continent entry's own colour. _cosmetic._

## Country / state pages

50. **Country outline map with region dots.** iOS `CountryScreen`/`StateScreen`
    render the country/state outline with one red dot per region
    (`CountryOutlineMap`). Confirm whether the web country page shows the
    equivalent multi-dot map (the single-entry outline+dot is done; the
    all-regions map may not be ported). _moderate — verify then scope._

## Chip filter

51. **Summary + reset glyphs.** Web `Filter` funnel + `X`-prefixed RESET; iOS
    `line.3.horizontal.decrease.circle.fill` and a text-only reset. _cosmetic._
52. **Country result rows tinted yellow.** Web tints them yellow; iOS uses the
    neutral entry-row surface. _cosmetic._
53. **Empty-state copy.** Web "Try a different search or fewer chips."; iOS
    "Nothing fits the chips and the search together." _minor._

## Tools

54. **Tile style is the odd one out.** Tools tiles are outlined dark tiles with a
    uniformly green label; iOS (and the web SETTINGS grid's own `FeatureTile`)
    use filled colour faces with a 6px extrusion. Reuse `FeatureTile` here.
    _moderate._
55. **Icons.** MOON DIAL `Moon` → `MoonStar`; SCANNER `ScanSearch` →
    sparkle-magnifier equivalent. _minor._

## Settings grid & panels

56. **Grid icons.** TUTORIAL `Flag` → checkered flag; TOOLS `Wrench` →
    wrench+screwdriver. _cosmetic._
57. **CUSTOMIZE preview tiles miss their glyph.** iOS draws the mode's SF Symbol
    on the screen-mode preview and the skin's emblem on the skin preview; web
    previews show neither. _minor._
58. **No lock/gating on mode/skin tiles.** iOS dims locked options and overlays
    `lock.fill`; web sets them unconditionally. Likely deliberate (no gating in
    the port) — decide. _moderate / possibly deliberate._
59. **TEXT/UI SIZE layout + helper copy.** Web is a vertical radio stack with no
    helper text; iOS is a segmented row with descriptive copy ("Applies
    everywhere. Capped so the retro face still fits its tiles." / "Buttons,
    wells and chassis chrome — the text keeps its own size above."). _minor._
60. **CLEAR SAVED DATA dialog.** Web confirm button reads "CLEAR"; iOS "ERASE".
    Message wording differs slightly too. _cosmetic._
61. **FREE TIER toggle glyph.** Web plain `ToggleRow`; iOS gives it a leading
    `lock.fill`/`lock.open.fill`. _minor._
62. **DEV panel content gap.** iOS DEV = a health report (font/entries/palette/
    icons/flags/decode with OK/!! rows) + component gallery + icon sheet; web DEV
    is a flat StatRow list (VERSION/BUILD/…). The DEV row even advertises "the
    component gallery and the icon sheet". Port at least the health rows.
    _moderate._

## Walkthrough

63. **Progress indicator + tools mock.** Web uses fixed-width dots and text
    labels for the tools mini-LCD; iOS uses equal-width capsules and glyph
    tiles. Copy is verbatim-correct. _cosmetic._

---

## Deliberate deviations (kept, not bugs)

- Collection titled **COLLECTION**, not iOS's SAVED (clearer with three tabs).
- **Moon dial** is a full interactive dial on web; iOS reduced it to a static
  readout. Two intentional designs.
- **Region map** (2D world picker) is web-only; iOS selects continents only via
  the 3D globe.
- Scanner **country step** uses a flat list rather than routing through the globe.
- **Splash** screen is web-only (no iOS counterpart).
- Several explanatory helper paragraphs on ACCESS are web-only additions.

## Notes

- Highest visual payoff, cheap: Tools filled-face tiles (54), CUSTOMIZE preview
  glyphs (57), rarity chip colour (12), APPELLATION SYSTEM full name (10),
  scanner copy (39–41).
- Verify-before-building: flavour INFO block (9), country region-dot map (50),
  DEV health rows (62).
- Release (merge `testing` → `master`) remains yours to fold in.
