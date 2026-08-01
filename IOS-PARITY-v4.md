# Web ↔ iOS parity plan — v4 (polish backlog)

_Updates `IOS-PARITY-v3.md`. Phases A–H closed the feature/visual/test gap;
`testing` is at broad parity with iOS v0.6.3. This document is the **small
things** — the label/icon/order/copy discrepancies a careful eye catches on a
second look — from a full discrepancy review, minus what's already fixed._

Reference: `vinodex-ios` @ v0.6.3 (read-only).

---

## Fixed in polish pass 1 (on `testing`, commit `1c39be0`)

- **Country/state outlines** now render (the 28 `art:outline-*` PNGs bundled in
  Phase E were unwired) — state outline for US regions, else the country's.
- **CUSTOMIZATION → CUSTOMIZE**; **DEV** demoted from a peer tile to a
  DEVELOPER button; **TOOLS** tile icon is now a wrench.
- CUSTOMIZE order: **SCREEN MODE before CHASSIS SKINS**; "CHASSIS SKINS" plural.
- Grape detail: **RARITY leads before CHARACTERISTICS**; "SHOW ALL" → "EXPAND ALL".

---

## The backlog

Everything below is small and independent. Grouped into four light passes by
where the work lives; do them in any order. Severity: **cosmetic** (a glyph or
word), **minor** (layout/order/copy), **moderate** (a small missing control or
section).

### Pass 2 — Settings faithfulness

1. **Split CUSTOMIZE and SETTINGS.** iOS has two tiles: CUSTOMIZE (screen mode +
   skins only) and a separate **SETTINGS** (text size, UI size, haptics, sounds,
   clear-data, developer). The web lumps all of it under CUSTOMIZE. _moderate._
2. **STORED DATA / CLEAR SAVED DATA control.** iOS can wipe shelves/ratings/
   recents/profile/quiz/streak; the web has no clear-data button. The store
   method exists (`removeEverything`) — this is UI only. _moderate._
3. **DATA third section is GROWTH** (an animated growth-wave chart) on iOS; the
   web shows a COVERAGE stat table and reuses the growth blurb where it no
   longer fits. Either build the chart or re-caption. _minor._
4. **Database stat tiles carry a per-category glyph + tint** (grid/globe/
   wineglass/leaf/map/flag); the web tiles are count+label only. _minor._
5. **TOTAL ENTRIES glyph** (`square.stack.3d.up.fill`) and **ACCESS bundle
   symbols** (crown/leaf/flag/palette/sun) are absent on web. _cosmetic._
6. **Feedback copy + split.** iOS has separate HAPTICS then SOUNDS sections with
   fuller copy ("Every chassis button clicks in your hand.", "Clicks, pings and
   stings from the SFX pack."); the web has one FEEDBACK section, reversed
   order, terser copy. _cosmetic._

### Pass 3 — Entry-detail fidelity

7. **MY RATING as a body section.** iOS renders it as a dedicated section
   (star header, five large stars, RATE/EDIT, note below); the web shows a
   compact pill in the hero. _minor/moderate._
8. **TYPE-class styles show a NOTABLE GRAPES section** on iOS; the web omits the
   grape list for TYPE-class styles. _moderate._
9. **Header tile order / shape**: style tiles COLOR→CLASS→ORIGIN (web has
   CLASS→COLOR); region header is a full-width KEY GRAPE bar + CLIMATE/COUNTRY
   row (web uses three equal tiles); flavor header is 2 tiles on iOS (web adds a
   third GRAPES count). _minor._
10. **Section header icons**: FLAVOR PROFILE `drop` (web `Grape`), APPELLATIONS
    `shield` (web `MapPinned`), ALSO KNOWN AS `character.book.closed` (web
    `Tag`). Also iOS keeps the APPELLATIONS title constant where the web
    switches it to "CRUS OF BEAUJOLAIS". _cosmetic._

### Pass 4 — Class-art tiles (the rest of the `art:` layer)

11. **Colour / body / styleclass / subclass / flavor-class detail tiles** still
    render game-icons/lucide glyphs where iOS draws `art:color-*`, `art:body-*`,
    `art:styleclass-*`, `art:subclass-*`, `art:class-*`. The PNGs are already
    bundled (Phase E) and `LocalIcon` already renders `art:` ids — this is
    swapping the tile-helper maps in `EntryDetail`/style/flavor/grape display to
    emit `art:` ids, the same move Pass-1 made for outlines. _minor, ~4 sites._
12. **Region `mapPosition` marker.** With outlines now drawn, the region's
    `mapPosition {x,y}` can place the red location dot on its outline (iOS
    `EntryVisual`). The data is imported; this is the render. _minor._

### Pass 5 — Chassis & screen chrome

13. **Marquee per-route glyph.** iOS stamps a route symbol between marquee
    repetitions (wineglass on the menu, gear on SYSTEM); the web marquee is text
    only. _minor._
14. **Front nameplate.** iOS engraves a "VINODEX" metal nameplate on a title
    bump above the LCD on every screen; the web front shows the wordmark only on
    the splash. _minor._
15. **Collection title.** iOS titles the screen "SAVED"; the web uses
    "COLLECTION". (Web's choice is arguably clearer given the three tabs — a
    deliberate-deviation candidate rather than a straight fix.) _minor._
16. **Small collection/quiz cosmetics**: remove icon `xmark`-in-circle vs the
    web's `Trash2`; the tried journal line shows stars-only when unrated (web
    adds a "tap to rate" placeholder); tier rows carry no leading glyph (web
    gives SOMMELIER a cap); "CHOOSE YOUR EXAM" left-aligned over a rule (web
    centred); clear-all message wording. _cosmetic._

---

## Notes

- None of the above affects behaviour or the test suite; they're presentation.
- Pass 4 (class-art tiles + mapPosition) is the highest *visual* payoff and the
  cheapest per item, since the infrastructure is already in place.
- The larger deliberate deferrals from v3 still stand: the scanner globe step,
  the EntryDetail structural refactors, and the translucent-skin internals
  board. Those are scope decisions, not polish.
- Release (merge `testing` → `master`) remains yours to fold in.
