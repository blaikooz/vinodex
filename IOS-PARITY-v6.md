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

## A. Chassis & device chrome

1. **Dial menu (v0.8.4)** — the main menu becomes a rotary **dial** instead of the
   four-tile grid; the categories sit on a wheel you turn. Signature look of the
   current build. Web `MainMenu.tsx`. **M–L, ★★★.**
2. **BIOS / boot POST (v0.7.3a, v0.7.7, v0.7.8 §A)** — a power-on self-test / BIOS
   boot sequence on the LCD before the menu, redesigned to render *in* the screen.
   New web boot component gating first paint. **M, ★★.**
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

8. **Master search (v0.7.1)** — global search across the whole catalogue. Verify
   what the web's centre-dial magnifier does today; upgrade to full master search
   if it's only a category filter. **M, ★★★.**
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

18. **Tannin bar truth + grape overhaul (v0.7.4)** — "+25 grapes, +6 regions"
    (counts already synced) and "the tannin bar tells the truth" — verify the web
    stat bars use the corrected tannin values from shared data. **S, ★★★.**
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
