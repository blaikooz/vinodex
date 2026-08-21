# Shell, cap art and UI modernization — scoping report

_Read-only investigation, 2026-08-18. Web at `9a1f1a6` (`testing` == `master`),
working tree clean; **nothing in either repo was modified by this pass** except
this file, which is deliberately left uncommitted. iOS reference is
`vinodex-ios` @ `c0532a6` (**v0.9.2** — note this is past the 0.7.8/0.8.99
numbers in the task brief; the chassis work landed 0.8.91–0.8.99 and nothing
after 0.9.0 touched it)._

**Severity words** are v5/v6's: **cosmetic** (a glyph or a word), **minor**
(layout, order, copy), **moderate** (a missing control or section),
**structural** (a screen or system that does not exist here).

**Size** is engineering hours for one focused agent pass, including gates.
**Risk** is `low` (mechanical, gated) / `med` (visual change on a surface the
user has opinions about) / `high` (touches persisted vocabulary, the shared
mirror, or a system with a history of regressions).

Ids are stable and per-document: cite them qualified — `scope#S3`, not `#S3`.

---

## Method, and what was actually measured

- Read `Chassis/DeviceChassis.swift` (131 KB), `ChassisButton.swift`,
  `ChassisSkins.swift`, `ChassisStyle.swift`, `DeviceParts.swift`,
  `ChassisCapArt.swift` (35 KB) and `scripts/import-footer-art.py` end to end,
  against `web/components/DeviceLayout.tsx` (590 lines) and
  `web/src/services/theme.ts`.
- **Ported `ChassisCapLoader.fitCap` + `reink` to Python** and ran it over the
  four shipped sprites × the full 22-skin colour table, to get real byte
  counts and real timings instead of estimates. Contact sheets rendered and
  inspected. Scratch artifacts live outside both repos in the session
  scratchpad; nothing was written into `vinodex-web` or `vinodex-ios`.
- **Measured the shipped sprites directly** (alpha silhouettes, skirt-band
  pixel counts, face medians, per-pixel diff of `home` vs `back`) to settle
  whether the home-cap defect history is closed.
- **Built the web and screenshotted the live footer across 8 skins** through
  Playwright against `vite preview`, then sampled cap pixels, to prove rather
  than assert what the web currently renders.
- Re-read `IOS-PARITY-v6.md`'s Status block and its **Deliberate deviations**
  list before writing a single finding. **Nothing below re-raises a settled
  deviation.**

### Corrections to the brief's premises

Stated so the plan is built on facts:

1. **The home-cap sprite defect is fixed, and the fix is not `graft_home_skirt`.**
   0.8.96's graft and 0.8.97's seam-blend were both superseded in **0.8.99** by
   `rebuild_home_from_back` (`vinodex-ios/scripts/import-footer-art.py:331`),
   which rebuilds `home` as **back's drawing verbatim** with back's chevron
   inpainted out and home's house transplanted in. Measured on the shipped
   `Resources/FooterArt/footer-home.png` (mtime 2026-08-10, one day after its
   three siblings): the alpha silhouette is **byte-identical to `back`** —
   0 differing alpha pixels of 65,024 — the skirt rows match exactly
   (y=222/230/238/246 → 148/120/91/55 opaque px on both, against the ~21 the
   defect report cited), and only **3,858 pixels (5.9%)** differ materially,
   which is the house glyph against the chevron. Face medians match (245 vs
   244), so the over-bright lit face is gone too. **Whatever the web mirrors
   today is already correct art.**
2. **Thirteen missing systems is stale.** v6 shipped FIRMWARE, GRAPE LINEAGE,
   the CHEAT CONSOLE, the SCREENSAVER, the STAMP UNLOCK prompt, the BIOS,
   marquee art and stamps. Of the original thirteen, what is genuinely still
   absent is the **Device Workshop** (v6#35, open on size alone), the
   **Label Reader** (v6#4, ruled COMING SOON), the **Shop** (no paywall — a
   standing deliberate deviation), **expansion-pack cartridges**, and
   **diagnostics**. None of those are in scope here.
3. **The `SETTINGS_SECTIONS` static-import note in v6's "Standing notes" is
   stale.** It was fixed — the constants live in
   `web/src/services/settingsSections.tsx` and `SettingsPanel` splits cleanly
   into its own 45 KB chunk. Do not re-schedule it.
4. **iOS's own `CHANGELOG.md` skips 0.7.0–0.8.99 entirely** (it jumps 0.9.0 →
   0.6.5). The chassis history is only in commit bodies and doc comments. That
   is a dexbot problem, not a web one, but it is why this report quotes commit
   messages: there is no other written record.

---

# Part 1 — The app shell / chassis

## 1.0 What the iOS chassis is now, layer by layer

`DeviceChassis.frontFace` (`Chassis/DeviceChassis.swift:542`) is a `ZStack`
of, back to front:

| # | Layer | iOS | Web counterpart |
|---|---|---|---|
| 1 | **Mock internals**, behind translucent shells only | `InternalsView` (`Chassis/InternalsView.swift:70`), gated on `skin.isTranslucent` | **absent.** `theme.ts:616` writes `document.documentElement.dataset.translucent` and *nothing reads it*. WALDGLAS is pre-composited over a flat `#14161A` in the table (`theme.ts:251`) as a stand-in. |
| 2 | **The shell** — moulding, tiled pattern, PÉT-NAT paper grain | `ChassisShell` (`DeviceChassis.swift:2138`), takes the *bare* skin not the resolved look | `DeviceLayout.tsx:334-342` — `--chassis-body` + `--chassis-pattern` at `96px`. Close enough; no grain, no sketch. |
| 3 | **Island flank** — orb left, lamp trio right, level with the cutout | `islandFlank` (`:607`), `lcdOrb` (`:921`), `statusDots` (`:950`) | `DeviceLayout.tsx:353-400`. Orb is a **circle**; iOS's has been a **stadium/capsule** since 0.7.6 E1 and is the trio's full length. Lamps are flat discs with a blur halo; iOS routes every lamp *and* the orb through `RecessedLamp` (`:1928`). |
| 4 | **Screen housing** — white bezel / LCD band / bottom strip, filled and clipped to a chamfered shape | `screenHousing` (`:986`), `screenPanelShape` → `ChamferedPanel` (`:2008`) | `DeviceLayout.tsx:403-410` — a plain `rounded-[2rem]` box with `border-l/r/b-[6px]`. **No chamfer**, so the bottom-left diagonal cut that defines the silhouette is missing. |
| 5 | **Top bezel lamps** — two red bulbs, recessed | `ventDot` (`:1103`) via `.recessedLamp` | `DeviceLayout.tsx:413-418` — two flat `bg-red-500` dots. |
| 6 | **Inner bezel + LCD** | `innerBezel` (`:1111`), `ScanlineOverlay` / `DexScreenBackground` (`Chassis/ChassisEffects.swift:18/41`) | `DeviceLayout.tsx:421-445`. Good: `isolation:isolate`, `.lcd-themed`, `--mono-tint` multiply. This layer is at parity. |
| 7 | **Bottom strip** — lamp, stretched wordmark, grille | `bottomVents` (`:1270`), `StretchedWordmark` (`:2085`), `ChassisGrille` (`DeviceParts.swift:311`) | `DeviceLayout.tsx:452-475`. Wordmark is a hardcoded `scaleX(1.3)` rather than measured-and-filled. Grille is **4 hardcoded slats**; iOS has a 5-value `GrilleShape` axis (`DeviceParts.swift:271`: SLATS/BARS/DOTS/MESH/NONE). |
| 8 | **Footer band** — two capsule wells, marquee, two lamp buttons | `footer()` (`:1362`), `buttonBundle` (`:1549`), `ButtonWell` (`:1858`), `indicatorPills` (`:1653`), `lampButton` (`:1665`) | `DeviceLayout.tsx:485-568`. See Part 2 — this is where the gap is. |
| 9 | **Refresh flash / press** | `LcdRefreshFlash` (`:2281`), `ChassisPressStyle` (`:2240`, scale 0.88) | `active:scale-[0.95]` inline per button. No shared press. No refresh flash. |

## 1.1 What 0.8.91–0.8.99 actually changed structurally

Reconstructed from commit bodies (`04fc5d9`, `5461c0d`, `1a48e0e`, `96809bc`,
`abe0e4d`, `8e3728d`, `64d630b`, `dc02acd`, `626f5e5`) and the doc comments:

- **0.8.91 D2** — CLASSIC gains an authored black `buttonSet`; it had been the
  one skin whose four caps disagreed with each other.
- **0.8.92/0.8.93** — the home lip's black paint lifted at import; `litFloor`
  (0.55) added to `reink` so a dark ink actually darkens the cap.
- **0.8.94 A1/A2/A3** — *the headline*. `ChassisLook.footerCap(_:)`
  (`DeviceParts.swift:498`) becomes **the** resolution path for all four caps.
  Home's fallback stops being `skin.accent` and becomes the cap itself, via
  `ChassisAccent(cap:)` (`ChassisSkins.swift:~150`). `FooterCapTests` pins the
  invariant.
- **0.8.95** — the *previews* (picker tiles, workshop schematic) get the same
  rule; the last two `skin.accent` reads for Home die.
- **0.8.96/0.8.97** — sprite-side skirt graft, then seam blend. Both superseded.
- **0.8.98** — `ChassisButton` becomes **kind-blind**: `capInkHex = cap.topHex`
  and `capGlyphHex = cap.glyphHex` for every kind (`ChassisButton.swift:101/105`);
  one gradient, one rim (`:277/281`); Home's inner lit disc is deleted; an
  authored lit ramp is restated as a plain `ChassisControl` at
  `footerCap(.home)`. **"Lit is a colour, not a code path."**
- **0.8.99** — `rebuild_home_from_back`: the four caps become one drawing family
  by construction.

**Net structural change to port: one function.** The whole 0.8.94–0.8.99 arc
collapses, on the web, into *"the four footer caps resolve from one per-skin
`ChassisControl` table, and Home is not special."*

## 1.2 Chassis findings

### S1 — The footer caps do not read the skin at all *(structural)*

**Proven, not asserted.** Built the app and screenshotted `<footer>` across 8
skins at 420×900, then sampled cap pixels. The Home cap's face and glyph are
**pixel-identical on every skin sampled** (`rgb(123,51,6)`), as is the Settings
cap ring (`rgb(59,55,52)`). CLASSIC, ORIGINAL, BURGUNDY, OAKED, PET_NAT,
HALLOWEEN, W64 and PSVINO all render the same amber Home and the same
stone Back/User/Settings.

- Web: `DeviceLayout.tsx:503` Back — `from-stone-700 to-stone-950 border-stone-400`,
  hardcoded. `:517` Saved — same. `:549-554` Home — `from-amber-200 to-amber-500
  border-amber-700`, **plus an inner lit disc** at `:552` (`from-amber-100 to-amber-400`)
  with `text-amber-900` on it. `:561-564` Settings — literal `#44403c`/`#1c1917`/
  `#a8a29e`/`#e8ebee`.
- iOS: `ChassisLook.footerCap` (`DeviceParts.swift:498`), consumed by
  `ChassisButton.cap` (`ChassisButton.swift:263`) and `settingsButton`
  (`DeviceChassis.swift:767`).
- **The web's Home button is the exact fork iOS spent 0.8.92–0.8.98 killing**,
  frozen in Tailwind: a bright accent-lit disc unrelated to the moulded caps
  beside it. `DeviceLayout.tsx:552` is the literal web twin of the
  `ChassisAccent`-lit inner disc that 0.8.98 deleted.
- `theme.ts` carries **no** `control`/`accent`/`buttonSet` data at all
  (`ChassisSkin` interface, `theme.ts:28-51`), and no `--chassis-control-*`
  CSS variable is ever written (`applyTheme`, `theme.ts:600-624`).

**Fix:** port `ChassisControl` (22 rows from `ChassisSkins.swift:769`) and
`ChassisButtonSet` (4 rows from `:866`) into `theme.ts`; write
`--cap-{back,home,user,settings}-{top,bottom,edge,glyph}`; point the four
buttons at them; delete the Home inner disc. **Size: 4–6 h. Risk: med** —
it changes what every user sees on every screen, which is the point, and it
is exactly the surface v6#19's own approval condition named (screenshots in
both modes). Playwright now exists to gate it.
**Decision needed: none beyond "yes".** This is a straight port of a settled
iOS decision and it is the highest-value item in this report.

### S2 — Dead and missing chassis tokens *(minor)*

`applyTheme` writes `--chassis-on-body` and `--chassis-on-body-shadow`
(`theme.ts:612-613`) and `--chassis-rim-glow` (`:615`); **nothing in the app
reads any of the three** (grepped `components/` + `src/` + `index.css`).
NOCTURNE's phosphor halo (iOS `screenHousing`'s `.background` stack,
`DeviceChassis.swift:1067-1073`) therefore does not render.
**Size: 1 h. Risk: low.** Either wire the rim glow onto the housing or delete
the dead writes; both are one-liners. **Decision: wire or delete?**

### S3 — The lamp trio, orb and vent dots are flat, not seated *(minor)*

iOS routes all eight lamps *and* the orb through one `RecessedLamp` modifier
(`DeviceChassis.swift:1928`): a blurred dark wall riding high, a pale lip low,
the lamp's own keyline, an optional specular bead, and a seat shadow — every
measurement a fraction of `size`, nothing skin-coloured. Web draws a flat disc
plus a blurred halo (`DeviceLayout.tsx:387-397`, `413-418`, `453`).
The orb is also still a **circle** (`:375`, `w-11 h-11`) where iOS's has been a
**stadium the width of the lamp trio** since 0.7.6 E1 (`lcdOrb`, `:921`).
**Size: 3–4 h** (one `recessed-lamp` CSS utility + the orb geometry).
**Risk: med** — visible change to the island strip. **Decision: does the orb
become a stadium?** It is a real silhouette change to the most-looked-at part
of the device.

### S4 — The screen housing has no chamfer *(minor)*

iOS `ChamferedPanel` (`DeviceChassis.swift:2008`) cuts the bottom-left corner
diagonally and fills/clips/strokes the *same* shape so the three cannot drift
(0.6.6 E1's fix). Web is a plain `rounded-[2rem]` (`DeviceLayout.tsx:408`).
On the web this is a `clip-path: polygon(...)` or a CSS corner-shape.
**Size: 2 h. Risk: low-med** — silhouette change, easy to screenshot.

### S5 — Grille shape is hardcoded; no workshop axis *(moderate, blocked)*

Web draws four fixed slats (`DeviceLayout.tsx:470-474`). iOS has a five-value
`GrilleShape` axis (`DeviceParts.swift:271`) plus seven other `DeviceAxis`
part-override axes (buttons, orb, headerLamps, marquee, marqueeLamps,
grilleColor, grilleShape) driven by the Device Workshop.
**This is v6#35's tail, not its own item.** Porting SLATS/BARS/DOTS/MESH/NONE
without the workshop gives the user nothing to change them with. **Recommend:
do not schedule separately** — fold into the workshop pass, and keep the
`ChassisLook` shape (skin ?? part-override) in mind when writing S1's token
layer so the workshop can slot in later without a rewrite.

### S6 — Translucent shells are faked *(minor, deliberate-adjacent)*

`data-translucent` is written and unread; WALDGLAS is pre-composited
(`theme.ts:251`). GLOUGLOU and NOUVEAU are opaque approximations of smoke
plastic with no internals behind them. iOS `InternalsView` is 16 KB of drawn
mock electronics. **Size: 6–8 h** to do honestly, and the drawn-parts problem
means it would be a web-original rendering, not a port.
**Recommend: record as a deliberate deviation** rather than schedule — "the
web ships translucent shells as tinted opaque plastic; no internals view."
That is an honest, small deviation and building a second internals drawing is
poor value. **Decision needed: accept as deviation, or schedule?**

### S7 — The marquee lamps are decoration, not controls *(moderate)*

Web renders two `aria-hidden` spans with **hardcoded** `bg-red-500` and
`#2AB5FF`/`#0B6FA8` (`DeviceLayout.tsx:528-531`). iOS 0.7.1 A7 made them
skin-tinted off `marqueeLights` (`DeviceParts.swift:543`), 0.7.2 A9 made them
**buttons**, and 0.7.6 A1 made them **reassignable quick-pins** (tap to go,
hold to reassign) — the feature that replaced the whole marquee drawer.
Two halves: (a) tint them from `--chassis-lamp1`/`--chassis-lamp3` — **1 h,
low risk**; (b) the `QuickPinStore` + `MarqueePin` behaviour — **5–6 h, med
risk**, and it needs a ruling on whether the web wants a hold gesture at all
(it is a hidden gesture with no hover affordance on desktop).
**Decision needed for (b): do web quick-pins get a hold gesture, a
long-press-or-right-click, or a settings row?** iOS's answer does not
transfer cleanly to a pointer device.

### S8 — No shared chassis press *(cosmetic)*

iOS has two presses and says why they are not one: `DexPressStyle` (scale 0.96)
for on-screen things, `ChassisPressStyle` (`DeviceChassis.swift:2240`,
`ChassisPress.scale` 0.88 + a brightness drop) for moulded parts. Web writes
`active:scale-[0.95]` inline at each of the four caps and `scale-[0.88]
brightness-75` on the orb (`DeviceLayout.tsx:376`) — the orb already has the
right numbers and the caps do not. **Size: 1 h. Risk: low.**

---

# Part 2 — The footer cap art

## 2.0 The sprites

Four, in `vinodex-ios/Sources/VinodexUI/Resources/FooterArt/`, prefix `footer-`
(`ChassisCapLoader.prefix`, `ChassisCapArt.swift:78`):

| stem | file | bytes | pixels | drawn from |
|---|---|---|---|---|
| `back` | `footer-back.png` | 13,632 | 254×256 | `art/icons/chrome/footer/back.png` (133 KB master) |
| `home` | `footer-home.png` | 13,237 | 254×256 | **generated from `back`** at import (0.8.99) |
| `user` | `footer-user.png` | 13,371 | 252×256 | `.../user.png` |
| `settings` | `footer-settings.png` | 19,378 | 266×263 | `.../settings.png` |

**Total 59,618 bytes.** Note the enum case is `bookmarks` but the file stem is
`user` — the illustrator's word, deliberately not renamed
(`ChassisButton.capStem`, `ChassisButton.swift:84`).

Each is a *whole moulded cap* — rim, lit face, moulded skirt, and the symbol
**incised** into the face. They replace the control rather than sitting in it,
which is why `ChassisButton` suppresses its gradient, border and shadow when
one resolves (`:161-189`).

## 2.1 What `reink` actually does

`ChassisCapLoader.reink` (`ChassisCapArt.swift:477`), keyed and cached per
`stem|inkHex|glyphHex|lipHex` (`:93`). I ported it and verified the output;
this description is from the port working, not from reading alone.

**Stage A — `fitCap` (`:315`), once per stem, ink-independent, cached (`:306`):**
1. **Silhouette** = the *largest four-connected opaque component*. This is the
   whole clip rule since 0.8.6 B1 — it removes the ~159 detached specks the
   stripped cast shadow left on `home` and 1–2 on the others, and it is
   shape-correct for a knurled cog as well as for a disc. `outlineReach`
   (0.8.7's geodesic trim) is **retired**; do not reimplement it — the doc
   comment at `:200-247` is an extended warning about why it destroyed exactly
   one of its four inputs.
2. **Coverage** = BFS distance from the outside of that component, ramped over
   `edgeFeather = 1.5` px (`:253`). The sprites have **strictly binary alpha**
   — zero partial pixels in the whole drop — so without this the silhouette is
   an aliased staircase all the way to the screen.
3. **Centroid + median radius** over 360 rays. A *scale*, not a boundary.
4. **Glyph mask.** Dark pixels (`0.06 < v < glyphValue 0.60`) are grouped into
   connected regions; a region is the incised symbol iff it *starts* inside
   `glyphInnerReach 0.20` **and** stays inside `glyphOuterLimit 0.78`. Shape,
   not threshold — the rim, bevel and knurl are annuli that never reach the
   centre. Measured reaches: symbols 0.002/0.038/0.043/0.107; nearest
   non-symbol bottoms out at 0.297.

**Stage B — the per-pixel pass, once per (stem, ink) pair:**
- `coverage <= 0` → cleared to transparent.
- `value <= 0.06` → **the outline clause**: near-black is structure and keeps
  its own colour, only rescaled by coverage. This is what stops the skin's hue
  being pushed into the cel line that separates the cap from the shell.
- otherwise → the pixel **keeps its value** and takes the target's **hue and
  saturation** (`GrapeSpriteLoader`'s 0.6.2 rule).
- `litFloor = 0.55` (`:132`): if the body ink's own value is below it, the face
  multiplies down onto the ink (`bodyScale = body.v`), so a black button is
  actually black rather than the pastel of its own hue. Above the floor the
  scale is exactly 1 and the output is byte-identical to every release since
  0.8.2. The threshold sits in a **measured empty gap**: bright liveries bottom
  out at 0.714, authored dark inks top out at 0.478.
- Below `litFloor` the glyph also **inverts** (`ink.v * (1.05 - value)`): a
  groove cannot be darker than near-black, so on a dark cap the incised symbol
  becomes *print*. This is what makes "black cap, white glyph" drawable.
- `lipBandTop = 0.78` and the `lipHex` third ink still exist in the loader but
  **`ChassisButton` passes nil for them since 0.8.98** (`:132-139`) — the whole
  body re-inks in `cap.top`, so the lip is already the button colour. **A web
  port should not implement the lip band.**
- `rgba(...)` inks (the three translucent skins) parse to saturation 0, which
  greys the cap — the documented honest failure (`:600-607`), and confirmed in
  my render: GLOUGLOU comes out neutral silver.

## 2.2 Is the home defect fixed in what we would mirror? **Yes.**

Measured on the shipped `Resources/FooterArt`, not inferred:

```
              y=222       y=230       y=238       y=246
  back    148 opaque   120 opaque   91 opaque   55 opaque
  home    148 opaque   120 opaque   91 opaque   55 opaque   <- identical
  user    149          119          89          55
```

Alpha-silhouette mismatch between `home` and `back`: **0 pixels of 65,024**.
Materially differing pixels: **3,858 (5.9%)** — the house against the chevron.
Face median value: home 245, back 244. The "~21 px skirt + over-bright lit
face" defect is closed at the drawing level.

## 2.3 What the web renders instead

`DeviceLayout.tsx:498-565`: four CSS-gradient circles.

- Back — `bg-gradient-to-b from-stone-700 to-stone-950`, `border-[3px]
  border-stone-400`, an inline 24×24 `<svg>` chevron at `:506-508`.
- Saved — the same gradient, `<CircleUser>` from lucide at `:520`.
- Home — `from-amber-200 to-amber-500` + a `from-white/35 ... to-black/25`
  sheen + an inset lit disc + `<Home size={28}>`.
- Settings — literal hexes + `<Settings>`.

Distance from the iOS look: **large and structural**, not a tint. There is no
moulded skirt, no rim highlight, no incised groove, no cast-shadow-free cel
outline, no per-skin colour, and the four caps are drawn by two different rules
(three grey ones and a lit amber one) — the fork iOS retired.

## 2.4 The architecture decision — real numbers

I generated the **entire pre-baked matrix** to answer this rather than
estimate it. 22 skins × 4 caps = **88 images**. (Distinct *ink pairs* across
the matrix: 32 — 18 skins share one `control` across all four caps, and
CLASSIC / PSVINO / VINHO_VERDE / W64 author four each. But the cap *drawings*
differ per stem, so 88 files either way.)

| Option | Files | Bytes | Runtime cost | Verdict |
|---|---|---|---|---|
| **A. Pre-baked, 128 px, palette-64 PNG** | 88 | **351 KB** (avg 3,989 B) | zero JS; one `<img>`, browser-cached | **recommended** |
| A′. Pre-baked, 254 px, palette-64 PNG | 88 | 748 KB (avg 8,498 B) | zero JS | overkill — see below |
| A″. Pre-baked, 128 px, lossless WebP | 88 | 1.09 MB | zero JS | **worse than PNG here** — palette PNG beats WebP on flat cel art |
| A‴. Pre-baked, 254 px, RGBA PNG (no quantise) | 88 | 2.63 MB | zero JS | no |
| **B. Runtime canvas re-ink** | 4 source PNGs (60 KB) + ~250 lines | 60 KB + code | see below | viable, not worth it |
| **C. SVG re-colouring** | — | — | — | **not available** — see below |

**Sizing check for A.** The caps render at `w-12`/`md:w-14` = **48/56 CSS px**.
At DPR 3 that is 168 px. 128 px is a slight under-sample at DPR 3 on the `md`
size; **192 px palette-64 is the honest middle** and interpolates to roughly
**700–750 KB** total. Even at the full 254 px the matrix is **748 KB across 88
files, none over ~12 KB** — and the service worker already runtime-caches art
PNGs on purpose rather than precaching them (the tuned SW config), so this
costs **~34 KB on first paint** (four caps for the active skin) and nothing
thereafter. It does not touch the 6 MB precache budget.

**Option B costed properly.** The expensive half is `fitCap`, not `reink`. In
my Python port `fitCap` took 1,545 ms per cap (pure-Python flood fill) while
`reink` took **11 ms**. In JS over typed arrays `fitCap` would land in the
tens of ms per cap — but it never has to run in the browser at all: **its
output (`coverage` + `isGlyph`) is ink-independent** and can be baked at build
time into two 1-byte-per-pixel masks. That reduces the runtime to the
per-pixel HSV pass: 4 caps × 65 k px ≈ 260 k pixels, comfortably **under 20 ms**
on a main thread, once per skin change. So B is technically fine. It is still
the wrong call, because:
- it puts a 250-line pixel pipeline, a canvas, a cache and an
  `ImageData`/`createImageBitmap` async seam into `DeviceLayout`, which is the
  one component every screen mounts;
- it must be reimplemented *exactly* — `litFloor`, the glyph inversion, the
  `<= 0.06` outline clause, the coverage feather — and any drift shows up as
  "the buttons look wrong on one skin", which is the failure mode this
  subsystem has had five times;
- the sprites are re-inked from a **fixed 22-row colour table**. There is no
  user-chosen colour on the web (no Device Workshop). Computing at runtime what
  is knowable at build time buys nothing.
- **If and when the Device Workshop lands (v6#35), that calculus flips** —
  13 `PartColor` values × 4 caps makes the matrix 88 → 1,144 and pre-baking
  stops being viable. Note that as the trigger to revisit.

**Option C is not available, and that is a real answer, not a shortcut.**
The caps are *rendered raster paintings* — a hand-drawn lit face, a moulded
skirt with continuous-tone shading, a cel outline, a knurled cog rim with ~40
teeth. There is no vector source; `art/icons/chrome/footer/*.png` are 133–157 KB
PNGs, and the "SVG" would have to be a traced approximation. Tracing a
continuous-tone moulded highlight loses the drawing, which is precisely
`.renderingMode(.template)`'s failure that `ChassisCapArt`'s header rejects at
length. **Recommend recording C as unavailable rather than leaving it open.**

### Recommendation

**Option A, generated by a build-time script, at 192 px, palette-64 PNG
(~700 KB / 88 files).**

Concretely:
1. Add `@{ From = 'FooterArt'; To = 'footer' }` as a **fifth line** in
   `sync-shared.ps1`'s `$WebArt` array (currently four entries at
   `sync-shared.ps1:60-65`; the leg already `/MIR`s `*.png` per named folder
   and is documented as "one line per directory"). That lands the four source
   sprites at `web/public/art/footer/`. **This is the only change to a file
   outside `vinodex-web`, it is one line, and it must stay ASCII.**
2. A new **web-side** generator (`vinodex-web/scripts/bake-footer-caps.ts` or
   `.py`) that ports `fitCap` + `reink` and emits
   `web/public/art/footer/{SKIN}-{stem}.png`. My Python port is a working
   reference for the algorithm and its output was visually verified.
3. `DeviceLayout` renders `<img src={`/art/footer/${skin}-${stem}.png`}>` with
   the existing CSS circle as the fallback, exactly as
   `ChassisButton.drawnCap` keeps `moldedCap` as its fallback — "the conversion
   can be partial without any control being blank" is the house rule and it
   should survive the port.

**Size: 8–12 h** (generator + verification + wiring + gate). **Risk: med.**
**Depends on S1** — the caps need the per-skin colour table before they can be
baked against it, so S1 must land first. Do not merge S1 and this into one
change; S1 alone is already a visible, gateable improvement.

**Decisions needed:**
- **D1. Is a ~700 KB / 88-file art matrix in `web/public/` acceptable?** For
  scale: `web/public/art/` already carries 325 files / 4.7 MB, so this is a
  ~15% increase to an existing, deliberately runtime-cached tree. I think yes,
  but it is the user's repo.
- **D2. Baked in `vinodex-web` (recommended) or baked in `vinodex-ios` and
  mirrored?** Baking in iOS would put 88 web-only PNGs into the iOS bundle for
  no iOS benefit, and `import-footer-art.py` is an iOS script. Baking on the
  web side keeps ownership where the consumer is. But it does mean **the
  re-ink algorithm exists twice, in two languages** — that is a real, permanent
  duplication and the user should agree to it knowingly. (Mitigation: pin it
  with a test that renders one known cap and asserts a hash, so drift is loud.)
- **D3. Resolution: 128 px (351 KB, slightly soft at DPR 3) or 192 px
  (~700 KB) or 254 px (748 KB)?** I recommend 192.

---

# Part 3 — UI modernization

The web UI is not badly built — `getAllEntries()` is module-cached and every
call site memoises it (`wineData.ts:82`, `EncyclopediaList.tsx:26`,
`EntryTile.tsx:81`, `DeviceBackPanel.tsx:63`); there are **zero** `<div
onClick>` handlers without a role; 21 of ~40 screens are route-lazy; the
service worker and Vite config are deliberately tuned. What it lacks is
**shared primitives** and **token discipline**. Ten items, split by whether the
user would see a difference.

## 3A — Pure refactors (no visual change)

### U1 — Extract a `Section` primitive *(no visual change if done per-family)*
**Size: 3 h. Risk: low.**
`SettingsPanel.tsx:296` already defines exactly the right component
(`Section`), privately. Meanwhile `EntryDetail.tsx` hand-rolls the same header
**27 times** (`flex items-center gap-2 mb-3 dex-section-rule pb-1` ×16 and its
`mb-2` twin ×11), and `font-retro text-xs md:text-sm tracking-widest
text-green-500` appears **26 times** across `components/`. iOS has
`Components/DexSection.swift` for this.
**Caveat that makes this two items, not one:** the two families are *not*
visually identical — `SettingsPanel`'s `Section` uses `border-b-2` at full
`--lcd-accent`, `dex-section-rule` (`index.css:289`) uses
`color-mix(... 40%)`. Extract one component with a `rule` variant and migrate
each family to its own variant → genuinely no visual change. Unifying them to
one rule weight is a **separate, visible decision** (see D9).
**Risk if rushed:** a global find-and-replace silently restyles 27 headers in
the app's largest screen.

### U2 — Extract a modal-scrim primitive *(no visual change)*
**Size: 1.5 h. Risk: low.**
`absolute inset-0 z-30 bg-black/80 flex items-center justify-center p-6`
appears **7 times** verbatim across components. Every one of them is a dialog
and none of them traps focus, sets `role="dialog"`, or closes on Escape — so
this refactor is also the natural home for U6.

### U3 — Route-lazy the two eager heavyweights, and move `firmware.ts` off the critical path *(no visual change)*
**Size: 2–3 h. Risk: low.**
Measured on the current build: `index-*.js` is **827 KB raw / 251 KB gzip**
against a 1.81 MB total asset payload. `EntryDetail` (1,549 lines),
`EncyclopediaList`, `MainMenu` and the whole `WebsitePortal` are **statically
imported** at `App.tsx:12-20` while 21 other screens are `lazy()`.
Concretely provable waste: I grepped the built chunks and
`FIRMWARE_RELEASES` (35.6 KB of source) lands in **`index-*.js`**, not in
`FirmwareHistoryScreen-*.js`, because `shared/constants.ts` re-exports it and
`constants.ts` is on the eager path. Same shape for anything else re-exported
there but read by one lazy screen.
`WebsitePortal` in particular is **portal code in the dex's first paint** —
which is a separation smell as well as a weight one.

### U4 — `FlavorIcon.jsx` is the only `.jsx` in a TypeScript codebase
**Size: 15 min. Risk: low.**
`components/FlavorIcon.jsx` — 14 lines, untyped props, imported by
`src/services/entryIconVisuals.tsx:11`. It is invisible to `tsc --noEmit`.

### U5 — Inline `style={{ color: 'var(--lcd-*)' }}` → Tailwind arbitrary values
**Size: 2 h. Risk: low. Value: low — schedule last or never.**
`style={{ color: 'var(--lcd-subtext)' }}` ×37, `backgroundColor:
'var(--lcd-page)'` ×18, `color: 'var(--lcd-text)'` ×13, the
surface/edge pair ×13. These are *correct* — they read theme custom properties
— just verbose next to `className="text-[var(--lcd-subtext)]"`. Honest
assessment: this is tidying, not modernization. It is listed because it is the
kind of thing that reads as "basic code", and it is genuinely zero-risk.

## 3B — Changes the user would see

### U6 — Dialogs are not dialogs *(moderate, a11y)*
**Size: 4 h. Risk: low-med.**
The 7 scrims in U2 host destructive confirmations (clear-all-data, profile
overwrite, restore). None has `role="dialog"` / `aria-modal`, none traps focus,
none returns focus on close, none closes on Escape. Keyboard and screen-reader
users can tab out of a confirm-wipe dialog into the page behind it. The house
brief names focus states surviving the retro styling as a standing rule.
Visible change: focus rings appear where they did not, and Escape starts
closing things.

### U7 — **No `prefers-reduced-motion` block exists at all** *(moderate, a11y)*
**Size: 1 h. Risk: low. Best value-per-hour in this report.**
`web/index.css` has **8 `@keyframes` and zero `@media (prefers-reduced-motion:
reduce)`**. Seven of the eight animations are `infinite`: `blink`,
`lcd-pulse`, three `dot-pulse-*`, `chassis-throb`, and `terminal-marquee` (a
25 s linear infinite scroll). On top of that `DeviceLayout.tsx:364` and `:394`
attach `chassis-throb` **inline**, so they are not even reachable by a class
selector. Only three components check the media query in JS
(`DataWave.tsx:77`, `ScreensaverOverlay.tsx:33`, `SettingsPanel.tsx:478`).
The fix is one CSS block plus moving two inline animations to classes.
CLAUDE.md names this rule explicitly; it is simply not done.

### U8 — 441 palette-utility uses escape the LCD screen-mode remap *(moderate)*
**Size: 6–10 h. Risk: med-high. Needs a ruling.**
This is the deepest structural weakness in the web UI and the best answer to
"basic code".

`index.css:237-259` remaps Tailwind palette utilities onto theme variables,
scoped to `.lcd-themed`. It is a clever, well-documented shortcut. Measured
across `components/*.tsx`: **932 palette-utility uses, 96 distinct classes —
and only 16 distinct classes are remapped. 80 distinct classes / 441 uses
escape**, and therefore render a fixed dark-mode colour in all nine LCD modes.
Worst offenders (uses / files):

```
  43  text-stone-300     BookmarksScreen, ChipFilterScreen, EntryDetail, GrapeLineage...
  35  text-stone-500     BookmarksScreen, CheatConsole, ChipFilter, FirmwareHistory...
  23  text-stone-100     Coachmark, EntryDetail, FirmwareHistory, GrapeLineage...
  18  border-green-500   BookmarksScreen, EntryDetail, EntryTile, GrapeLineage...
  18  border-green-400   CheatConsole, ChipFilter, EntryDetail, EntryTile...
  17  bg-green-500       CheatConsole, EncyclopediaList, EntryDetail, FirmwareHistory...
  14  bg-green-600  /  14 bg-green-400  /  8 bg-green-700
```

Note the asymmetry that gives the game away: `text-green-500` **is** remapped
and `border-green-500` / `bg-green-500` are **not**. Same colour, same screen,
one follows the mode and two do not.

**And there is a second, sharper leak: inline hex twins defeat the remap
entirely.** `EntryDetail.tsx` writes `style={{ backgroundColor: 'transparent',
borderColor: 'transparent', color: '#22c55e' }}` at lines **427, 441, 456,
533, 548, 597, 614, 633, 676, 689** — `#22c55e` *is* `text-green-500`, written
as an inline style, which beats the `.lcd-themed` cascade. Same file:
`#052e16`/`#15803d`/`#bbf7d0` at `:716` and `:870`, `#16a34a` at `:447`,
`#222` at `:447`. Those tiles stay dark-mode green in AMBER, LIGHT,
BLUE_SCREEN and STAR_TREK.

**Some of these escapes are correct and must not be "fixed":** the chassis
furniture in `DeviceLayout` is moulding and deliberately does not follow the
screen mode; `index.css:229-234` records a *deliberate* decision to leave
`text-stone-300` fixed in the confirm-clear dialog because iOS's `DexAlert` is
fixed-colour end to end; and `WebsitePortal`/portal screens are outside the
LCD entirely. **So this cannot be done by grep.** It is a screen-by-screen
audit with a per-screen ruling.
**Decision needed: extend the remap list (cheap, keeps the fragility) or move
to semantic classes (`.dex-rule`, `.dex-subtext`, `.dex-chip`) and retire the
remap (expensive, permanent)?** I recommend the second, done one screen per
sitting behind the Playwright screenshot gate in both modes — but it is a
multi-pass programme, not one item, and it should be scheduled as such.

### U9 — `SettingsSectionPanel` is a 697-line switch *(minor)*
**Size: 5 h. Risk: low-med.**
`SettingsPanel.tsx` is 1,251 lines. Its *primitives* are good — `Section`,
`ChoiceRow`, `IconToggleRow`, `StatTile`, `StatRow`, `HealthRow`,
`FeatureTile`, `SkinPreviewTile`, `ModePreviewTile` are all cleanly factored.
But `SettingsSectionPanel` (`:554` → `:1251`) is one component holding **7
`useState` hooks** and a 10-branch switch over every settings section, so
DISPLAY, PROFILES, STORED DATA and DEV all share one state bag. Split it into
one component per section behind a small registry. iOS did the same split
(`Screens/SettingsPanel.swift` + `Screens/SettingsControls.swift` +
`Screens/SavedDataActions.swift`). No visual change intended, but a 697-line
extraction always risks a dropped branch — hence the risk grade.

### U10 — `EntryDetail.tsx` is 1,549 lines and 82 KB *(minor)*
**Size: 8 h. Risk: med.**
The largest file in the repo by a wide margin, doing layout + state + data
derivation + tile rendering. iOS split the same surface four ways
(`EntryDetailScreen.swift` / `EntryDetailSections.swift` / `EntryDetailRows.swift`
/ `Components/EntryVisual.swift`). The natural web cut is the same:
a `HeaderTile` primitive (which alone kills the 10 duplicated inline styles
from U8), then per-category section components.
**Recommend: do not schedule this on its own.** Let it fall out of U1 + U8
when those pass through `EntryDetail`, which they must. A standalone
1,549-line refactor with no functional goal is exactly the "silent refactor"
the brief forbids.

---

# What must be decided before anything is scheduled

| # | Decision | Blocks |
|---|---|---|
| **D1** | Accept ~700 KB / 88 pre-baked cap PNGs in `web/public/art/footer/`? | Part 2 |
| **D2** | Bake on the web side (duplicating the re-ink algorithm in TS/Python) vs bake in iOS and mirror? | Part 2 |
| **D3** | Cap resolution: 128 / **192** / 254 px? | Part 2 |
| **D4** | Add `FooterArt` as a fifth line in `sync-shared.ps1`'s `$WebArt`? (one line, must stay ASCII, and it is the only edit outside `vinodex-web` in this whole plan) | Part 2 |
| **D5** | Does the orb become a stadium (S3)? Real silhouette change to the most-looked-at part. | S3 |
| **D6** | Translucent shells (S6): accept "tinted opaque, no internals" as a recorded deliberate deviation, or build an internals view? | S6 |
| **D7** | Marquee quick-pins (S7b): hold gesture, right-click, a settings row, or skip? iOS's hold gesture does not transfer to a pointer device. | S7b |
| **D8** | U8: extend the remap list, or migrate to semantic classes and retire it? The second is a multi-pass programme. | U8 |
| **D9** | Do the two section-rule weights (40% vs 100% accent) unify? Visible on ~29 headers. | U1/U8 |

# Where iOS is unclear, or where the web should deliberately diverge

- **`lipBandTop` / `lipHex` are live code with no live caller.**
  `ChassisCapLoader.image` still takes `lipHex` and `reink` still branches on
  `lipBandTop = 0.78` (`ChassisCapArt.swift:93/115`), but 0.8.98 made every
  caller pass nil. **The web must not port the lip band.** Anyone reading the
  Swift cold would implement it.
- **`GrilleShape` has five cases and the web has no way to choose one.**
  Porting the shapes without the workshop is drawing four dead code paths.
  Fold into v6#35 (S5).
- **The web should diverge on translucency (S6)** and probably on the
  quick-pin *gesture* (S7) — a hidden press-and-hold is an iOS idiom, and the
  web idiom for "reassign this" is a menu or a settings row. Precedent: the
  v5#32 mono normal-case call, where the web idiom correctly beat iOS's.
- **SVG re-colouring for the caps is not a live option (C in §2.4).** Record it
  as unavailable so it is not rediscovered; the art has no vector source and
  tracing it loses the drawing.
- **iOS's `CHANGELOG.md` has no 0.7.x–0.8.x entries.** If the user wants the
  chassis history written down anywhere durable, that is a **dexbot** task, not
  a web one.
- **Standing, unchanged, still the user's call:** the 4.5 MB of copyrighted raw
  text under `web/data/encyclopedia/source/`.

# Suggested sequencing

1. **S1** (cap colour model) — 4–6 h, highest value, unblocks Part 2, gateable
   with the existing Playwright screenshot suite in both modes.
2. **U7** (reduced motion) + **U4** (`.jsx`) + **S8** (shared press) — one
   small hygiene pass, ~2.5 h total, all low risk.
3. **Part 2** (baked caps) — 8–12 h, after D1–D4 are answered.
4. **S2, S3, S4** (rim glow, recessed lamps + orb, chamfer) — one chassis-
   geometry pass, ~6 h, after D5.
5. **U1 + U2 + U6** (section, scrim, dialog semantics) — one primitives pass,
   ~8 h.
6. **U3** (bundle) — 2–3 h, independent, any time.
7. **U8** — its own multi-pass programme, after D8, one screen at a time.

**Not scheduled here:** S5 (folds into v6#35 workshop), S7b (needs D7), U9/U10
(fall out of the passes above), U5 (tidying).
