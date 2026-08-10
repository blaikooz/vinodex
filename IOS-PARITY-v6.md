# Web ↔ iOS parity plan — v6 (comprehensive 0.6.9 → 0.8.94)

_The web is at iOS **v0.6.9** parity (chassis chrome, catalog, the earlier v2–v5
passes). iOS `main` is at **v0.8.94**. This is the full gap, inventoried from the
`origin/main` changelog (v0.7.0 → v0.8.91), organized by area with web status,
effort, and priority — the execution plan for the comprehensive pass._

Legend — **effort**: S (hours) / M (a session) / L (multi-session).
**priority**: ★★★ do first · ★★ next · ★ defer / lower web value.

Reference: `vinodex-ios` @ `origin/main` (a7ff9f9, v0.8.91+). Web entry ids match
iOS exactly, and the catalogue is already the expanded 146 grapes / 116 regions.

---

## 0. Acquisition funnel — DONE (this session, pending push)

Shareable canonical entry URLs, build-time per-entry OG prerender (399 pages),
a SHARE button on every entry, and a dismissible iOS install nudge. Committed
locally at `6d38f92`; awaiting repo authorization to push. Remaining: real App
Store URL / `apple-itunes-app` smart-banner id, and (optional) per-entry OG
images instead of the shared logo card.

---

## Progress (this session)

- **Item 1 (dial menu) — DONE.** `MainMenu.tsx` rebuilt as the moulded four-way
  pad: dark housing, four quadrant tiles rounded outside and concavely scooped
  inside (radial-gradient mask), amber search hub concentric in the centre.
- **Item 18 (grape data truth) — VERIFIED already correct.** Diffed all 146
  grapes: web `grapeCards` characteristics match iOS `grapeCharacteristics`
  exactly (0/730 field diffs). No import needed.
- **Item 2 (BIOS boot) — DONE.** `VinodexBoot.tsx`: the POST (MEMORY / DATABASE
  N ENTRIES / FIRMWARE) resolving into the identity splash (chrome wordmark,
  DISCOVER · COLLECT · TASTE, SYSTEM CHECK…OK, © HORIZON/GODOT, prompt), content
  ported verbatim from Core. Once per session, tap-to-skip, auto-advances, and
  skipped on deep-link arrivals so shared-link visitors play instantly.
- **Item 8 (master search) — already wired** on web (see finding below).
- **Item 11 (passport tiers) — DONE.** `PassportScreen.tsx` gains a RANK card
  (APPRENTICE 5 / MASTER 25 / GRANDMASTER 100 / LEGENDARY 250 / WINE MONK 400,
  ported from iOS `PassportTier`) with Crown, tried count, progress bar and a
  "N to NEXT" caption.
- **Item 13 (growth) — partial.** The DATA→GROWTH wave now animates (line sweep +
  running counter, respects reduced-motion). The full iOS "trio of readouts" is
  still a single wave — remaining as ★ polish.
- **Item 10 (chip facets) — DONE.** The web filter grew from 6 facets to the full
  iOS 12: added STYLE (grapeStyle), STYLE CLASS, IN THE GLASS (styleColor), TASTE
  (flavorClass), FLAVOUR FAMILY (flavorSubclass) and the player-state SHELF facet
  (SAVED/WANTED/TRIED, 0.8.91 B1). Shelf membership threads through matching as a
  snapshot, mirroring iOS's `matches` parameter. 11 tests pass.
- _Note: item 12 (collection "three registers") was a mis-scope — the "registers"
  in the changelog are art layers, not collection sort. The web already ships the
  three shelves; no sort control exists on iOS `main` to port._
- **Item 20 (authored maps) — DONE (dots) + gap found.** Diffed all 121 iOS region
  dots vs web: 9 had drifted after iOS's v0.8.4 authored-map switch — synced to the
  iOS source, now 0 diffs. **Newly-surfaced gap:** 7 regions exist on iOS but not on
  web (R117 Serra Gaúcha, R118 Campanha Gaúcha, R119 Ribeiro, R120 Mallorca, R122
  South West France, R123 San Benito, R124 Itata Valley) — a whole-entry catalogue
  import, larger than a dot fix. **Tracked as item 23 below.**

## New gaps found this session

23. **~~Eight regions missing from the web catalogue~~ — DONE.** Imported R117–R124
    (Serra Gaúcha, Campanha Gaúcha, Ribeiro, Mallorca, Azores, South West France,
    San Benito, Itata Valley) with full detail; REGIONS is now at iOS main's 124.
    Added a Brazil country gate and the IP / Brazil-DO appellation names; regen'd
    the quiz golden. Web total 405 → 413.
24. **~~Style backlog~~ (styles DONE) + grape backlog** — STYLES imported to iOS
    main's 33 (S033 Madeira, S034 Cava). **Remaining:** GRAPES 177 on iOS main vs
    web 146 (+31) — now the *only* category behind. A multi-session import (each
    grape carries characteristics, lineage, tasting profile, rarity). **L, ★★.**

### Catalogue parity scoreboard (after this session)

| Category | web | iOS main | status |
|---|---|---|---|
| GRAPES | 146 | 177 | +31 to go (item 24) |
| REGIONS | 124 | 124 | ✅ parity |
| STYLES | 33 | 33 | ✅ parity |
| FLAVORS | 106 | 106 | ✅ parity |
| CONTINENTS | 6 | 6 | ✅ parity |

Web total 415 / iOS main 446 — the 31-grape gap is the whole remainder.
- _Note: `main` moved skins into the Device Workshop's derived-palette system
  (item 16), so "new skins" (item 5) is now part of that larger item, not a data
  copy._

## A. Chassis & device chrome

1. **Dial menu (v0.8.4) — DONE.** The four category tiles become a moulded
   four-way pad set into a dark housing, scooped toward a central search hub.
   Web `MainMenu.tsx`.
2. **BIOS / boot POST (v0.7.3a, v0.7.7, v0.7.8 §A) — DONE.** `VinodexBoot.tsx`,
   content ported verbatim from Core (`BootSequence` / `Bios`). Full-viewport
   power-on; once per session; funnel-safe.
3. **Footer-cap / cog / home-lip fixes (v0.8.5, v0.8.6, v0.8.91)** — the button
   band caps, the cog's teeth, and the home cap's lip were re-cut (the lip "was
   never a shadow"). Polish on the band the web just ported. **S, ★★.**
4. **Recessed lamps + scripted marquee + marquee-as-control (v0.7.1, v0.7.2)** —
   indicator lamps recessed; the marquee becomes a scripted, interactive control
   surface rather than a static ticker. **M, ★★.**
5. **New skins + per-skin back plate (v0.7.0, v0.7.6)** — web has 15 skins; iOS
   now has ~19 (adds `psvino`, `grisDeGris`, `orangeWine`, `petNat`, incl. a
   hand-drawn "sketch" shell). Port the straightforward ones; the drawn skin is
   its own effort. Per-skin back plate art too. **M (data) / L (sketch), ★★.**
6. **Sticker (v0.7.8, v0.8.6)** — a peel decal on the shell ("a sticker, not a
   frame"). Cosmetic. **S, ★.**
7. **Device experience extras (v0.7.3a)** — screensaver, demo mode, firmware
   history, cheat console. Fun but low web-funnel value. **M total, ★.**

## B. Features & screens

8. **Master search (v0.7.1)** — global search across the whole catalogue.
   _Finding: the web already wires a master search (`handleManualSearch` in
   App.tsx)._ So this is a **verify + close the gaps** task (facets, sectioning,
   recents) rather than a build-from-zero. **S–M, ★★.**
9. **Quiz clue economy (v0.8.8)** — the Wine Exam gains a "every clue has a price"
   mechanic (spend to reveal hints). Plus Wine Exam changes (v0.7.5). Web
   `TastingQuizScreen`. **M, ★★.**
10. **Chip facets / sectioned picker (v0.7.0)** — the list/picker gains faceted
    chip filters and section headers. Web `EncyclopediaList` / `ChipFilterScreen`.
    **M, ★★.**
11. **Passport tiers (v0.7.1)** — the passport gains tiered progression. Web
    `PassportScreen`. **S–M, ★★.**
12. **Collection: tried shelf + "drop sorts into three registers" (v0.8.9a/b)** —
    the drop/sort re-buckets into three registers, and the tried shelf/fifth rung
    changed. Web `BookmarksScreen`. **S–M, ★★.**
13. **Growth trio (v0.7.8 §B–D)** — the DATA panel's growth chart becomes a trio
    of readouts. Web already has a single GROWTH wave. **S, ★.**
14. **Tutorial + confirm dialogs (v0.8.9)** — walkthrough re-draw and confirm-vs-
    warn dialog treatment ("a door not a wall"). **S, ★.**
15. **Shop + Expansion-pack cartridges (v0.7.3c, v0.7.5, v0.8.3)** — a Shop where
    content ships as "cartridges"; shelves become cartridges. Monetization-shaped;
    decide whether the free web funnel wants it at all. **L, ★ (decide).**
16. **Device Workshop (v0.7.3b)** — a customizer with eight part axes, derived
    palettes and live preview (supersedes the simple skin picker). **L, ★.**
17. **Label Scan (v0.7.2)** — on-device wine-label reader (camera + OCR). Web
    could use `getUserMedia`, but OCR/matching is heavy. **L, ★ (defer).**

## C. Catalogue & data

18. **Tannin bar truth + grape overhaul (v0.7.4)** — counts already synced
    (146/116). But _finding: the data shapes have diverged_ — iOS grapes now carry
    explicit numeric `grapeCharacteristics` bars (body/acid/tannin/aromatics/
    colour), while the web derives its bars from string labels in
    `shared/data/grapes.ts` (`tannin: "High"`). So "tells the truth" means
    **importing iOS's numeric characteristics** into the shared web data and
    reading bars from it, not re-deriving. **M, ★★★.**
19. **Grape lineage (v0.7.5, v0.8.2)** — parentage / cross data with "21 drawn
    parts." Lives outside `entries.json` (a lineage resource) — locate it in
    shared, then add a LINEAGE section + link graph to grape detail. **M, ★★.**
20. **Authored maps, not generated (v0.8.4)** — region maps stop being generated;
    check the web's `mapPosition` dots still match the authored source. **S, ★★.**
21. **Brazil + coming-soon country gates (v0.7.3c)** — confirm the country gates
    parity. **S, ★.**

## D. Cross-cutting

22. Per-mode consoles / palettes (v0.7.6), "two readers two spaces" typography
    (v0.8.91), and assorted colour/z-order fixes threaded through the batches —
    fold in opportunistically while touching each screen. **S each, ★.**

---

## Suggested order

1. **Data truth first** (18, 20) — cheap, and everything renders off it.
2. **Dial menu** (1) — the signature visual change; highest "feels current" ROI.
3. **Master search** (8) + **chip facets** (10) — core navigation.
4. **Quiz clue economy** (9), **passport tiers** (11), **collection sort** (12).
5. **Chrome polish** (3, 4) + **new skins** (5) + **BIOS boot** (2).
6. **Lineage** (19), **growth trio** (13), **tutorial/confirm** (14).
7. **Decide** on Shop/cartridges (15), Workshop (16), Label Scan (17) — these are
   large and may not fit the free-PWA funnel; scope with product intent first.

## Notes

- Verify-before-building flags: lineage resource location (19), what the web
  centre-dial search does today (8), whether Shop/Workshop belong on the free web
  surface (15, 16).
- Push is currently blocked (repo not in the session's authorized sources); all
  work lands on `testing` and fast-forwards to `master` once authorized.
