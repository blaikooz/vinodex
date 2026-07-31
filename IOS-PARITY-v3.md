# Web ↔ iOS parity plan — v3 (post A–D)

_Updates `IOS-PARITY-v2.md`. That plan mapped the whole v0.4.1.7 → v0.6.3
gap and split it into five phases. **Phases A–D are built, verified and
merged onto `testing`.** iOS is unchanged at v0.6.3 (no new drift), so this
document is the remaining work — re-scoped, because the shape of what's left
is different from what's done._

`vinodex-ios` @ **v0.6.3** stays the read-only reference.

---

## 1. Where things stand

The web app on `testing` has reached **functional parity** with iOS v0.6.3.
Everything a person actually *does* on the phone, they can now do on the web:

| Layer | Status |
|---|---|
| Catalog (375 entries, GODFORSAKEN, mapPosition data) | ✅ Phase A |
| Pixel-art portraits — grape / style / flavour | ✅ Phase A |
| Collection — 3 shelves, ratings, recents, avatar | ✅ Phase B |
| Tools hub, Chip Filter, Wine Exam, Daily Challenge, Passport, streak | ✅ Phase C |
| Chassis skins (15), screen modes (9, incl. monochrome), UI scale, sound, walkthrough | ✅ Phase D |

Each phase shipped with a headless Chromium smoke test, so the new surfaces
are confirmed rendering — not just compiling. What remains is **fidelity,
polish, hardening, and release**: the parts a returning user notices on a
second look rather than a first, plus the safety net under the logic ported
in C, plus getting it onto `master`.

The remaining items are the deferrals called out in each phase commit, the
"still open" list carried since v1, and the never-shipped test layer. They
regroup naturally into five fresh phases, **E–I**.

---

## 2. Phase E — Visual fidelity: the art layer

The last genuinely *visible* gap. Phase A shipped the three "portrait" art
sets (grape/style/flavour) that hang off `artName`. iOS has a **fourth**
channel — `art:`-prefixed icon ids — that the web doesn't render at all yet:
the 94 **ClassArt** PNGs.

1. **ClassArt `art:` ids** — globes (continents), country/state **outlines**,
   **soils**, and the colour/body/climate/subclass/styleclass class-art. iOS
   resolves an `art:`-prefixed `iconID` by stripping the prefix and drawing
   the bundled full-colour PNG instead of a tinted glyph. Web work: add an
   `art:` branch to `LocalIcon` (strip prefix → `<img src="/art/class/…">`,
   no tint); migrate the tile helpers (`climateDisplay`, `soilDisplay`,
   `entryIconVisuals` continent branch, style/colour/body tiles) to read the
   manifest's `art:` tables; refresh web's `iconManifest.json` from iOS's
   current `icons.json` so those tables carry `art:` values. Bundle the 94
   ClassArt PNGs (mirrors the Phase-A art bundle).

2. **Grape per-rarity leaf recolour** — Phase A renders the base `-rare`
   bunch; the leaf doesn't vary by tier. Port `GrapeSpriteLoader` (a small
   canvas HSV repaint of the leaf pixels to `GrapeArt.leafHex(rarity)`), or
   pre-bake the five rarity variants. The detail screen's rarity emblem
   already signals the tier, so this is cosmetic — but it's the one place the
   Phase-A art is knowingly approximate.

3. **Region `mapPosition` on outline art** — the `mapPosition {x,y}` field is
   imported (Phase A) but nothing consumes it. iOS drops a region marker onto
   its country/state outline at that fractional point. This depends on the
   ClassArt outlines from item 1, so it rides along here: render the outline
   PNG with a positioned pin on region screens.

_Outcome: every entry and place looks like v0.6.3, not just the grape/style/
flavour tiles._

---

## 3. Phase F — Chrome finish

The chassis is themable (15 skins / 9 modes) but the richest skin flourishes
were deferred as decorative.

1. **Translucent skins + Internals board** — GLOUGLOU and RETROVIN render as
   solid colourways today. iOS shows a mock circuit board *through* the
   translucent shell (`InternalsView`). Port a simple internals layer behind
   the chassis, revealed when the active skin `isTranslucent`.

2. **Patterned skin textures** — WINE XMAS / OAKED / STAINLESS STEEL currently
   use flat body colours. iOS tiles a `bodyPatternAsset` (xmas-wrap /
   oak-grain / steel-brush). Bundle the 3 pattern PNGs and apply as the
   chassis-body background for those skins.

3. **Back-plate passport stamps** — the device flip already exists on web
   (`DeviceBackPanel`). iOS inks one worn stamp per earned passport badge onto
   the underside at fixed slots. Now that Passport (Phase C) computes the
   earned set, port the stamp field — pure decorative flavour, fixed layout
   constants.

4. **Richer per-skin chrome** — iOS skins carry their own status-light
   colours, orb tint, lit-button accent ramps, and NOCTURNE's `#A8FF96` rim
   glow. The web skin model is the simpler body/panel/grill set. Extend it
   with the per-skin accents so a skin swap changes more than the shell
   colour. (Lower priority; the core skins already read correctly.)

_Outcome: the customization layer is complete, easter eggs included._

---

## 4. Phase G — Behavioural fidelity & cleanup

The parts where the web produces the right result through different or
coarser means than the Swift.

1. **Scanner globe step** — the web scanner still uses a flat country list;
   iOS walks the globe. Bring the scanner's geography step in line with the
   globe interaction.

2. **Style-variant branching** — `EntryDetail` has five overlapping
   conditionals for the style readout where iOS has one switch. Extract-then-
   simplify (the same treatment Phase-A-era work gave the grape/region
   sections) so the order is legible and safe to change.

3. **Section-body interiors** — the stat rows, chip clouds and tile grids
   *inside* each entry section are still a parallel implementation: order,
   titles, rules and rarity match iOS, but the interior markup was never
   transcribed. Reconcile them against the Swift section bodies.

4. **Saved "places"** — the web saved shelf holds entries only. iOS also saves
   countries/states via `COUNTRY_`/`STATE_` prefixed ids. Add a SAVE control
   to country/state screens and resolve the prefixed ids on the saved shelf.

5. **Haptics (optional)** — no true web analogue, but `navigator.vibrate()`
   exists on Android. Low value; include only if trivial.

_Outcome: the how matches, not just the what._

---

## 5. Phase H — Hardening

The logic ported in Phase C (the quiz RNG, streak rules, chip-filter matching,
passport badges) is real, subtle, and currently untested on the web side. iOS
ships 15 `VinodexCore` test suites; the web has none.

1. **Stand up Vitest** — add the runner + a `test` npm script (kept out of the
   build). No test runner exists on web today.

2. **Port the logic suites** — `quiz`, `chipFilter`, `passport`, streak
   (`dailyChallenge`), `bookmarks` (shelves + coupling), `recentlyViewed`,
   `screenState`, `dailyPick`, `grapeScan`, `access`, `appVersion`, plus
   `coverage` / decode-robustness / continents. These are pure modules — the
   ports are close to the Swift `XCTest` files.

3. **A web↔iOS determinism test** — the quiz generator was ported to reproduce
   the Swift RNG byte-for-byte. Add a golden test that pins the question set
   for a fixed seed, so a future refactor can't silently drift the daily
   challenge away from the phone's.

4. **Systematic browser pass** — the phase smoke tests cover the new surfaces;
   the *older* theming (the burgundy shell, the light screen, the expanders)
   predates any render and has still only been seen piecemeal. One deliberate
   pass through every screen in a couple of skins/modes.

_Outcome: a safety net under the ported logic, and the last unseen corners
seen._

---

## 6. Phase I — Release

1. **Merge `testing` → `master`.** Phases A–D (and E–H as they land) ride the
   `testing` integration branch; `master` is still the pre-parity code.

2. **Retire the stale branches** — `splash-split`, `screen-state-port`,
   `phase-a-catalog-art`, `phase-b-collection`, `phase-c-tools-games`,
   `phase-d-theming` are all subsumed by `testing`.

3. **Confirm the deploy** — Vercel build from the merged branch, PWA service
   worker updates cleanly (the `sw.js` / `manifest` no-cache headers are
   already set), art + SFX assets serve, and the SPA rewrite resolves the new
   `/website/*`, `/quiz`, `/passport`, `/walkthrough` routes on cold load.

_Outcome: v0.6.3 parity is live on `master`._

---

## 7. Suggested order & sizing

E and H are the highest-value remaining work: E closes the last *visible* gap,
H puts a net under the *invisible* logic. F and G are polish and can interleave
or slip. I is the finish line and should wait until you've tested the merged
result in a browser.

A reasonable sequence: **H** (lock down the logic first, cheap and high-
confidence) → **E** (the visible art layer) → **G** (behavioural cleanup) →
**F** (decorative chrome) → **I** (merge + release). But E and F are the more
*demoable*, so if the next milestone is a show-and-tell rather than a ship,
front-load those instead.

---

## 8. Explicitly not planned

- **A paywall.** iOS gates 221/375 entries behind IAP; the web deliberately
  stays free (the `access.ts` harness is reference only). Unchanged from v2 §8.
- **Re-importing a grown catalog.** iOS is static at v0.6.3; revisit only if it
  grows again. A shared data package (v2 §8 option b) is the fix if the two
  drift a third time.
- **The iOS build/decode hardening** (minified JSON, schema self-check,
  field-stripping) — web imports the TS directly and needs none of it. The one
  useful piece, `find-missing-refs`, is already ported (`npm run check:refs`).
