# Web ↔ iOS parity plan — v9 (presentation splits)

_Follows `IOS-PARITY-v8.md`. Executed on `testing` from `347a42a` (= `master`
= tag `v0.3.0`), 2026-08-21. Ships as **web v0.4.0**._

_Severity words are unchanged from v5–v8: **cosmetic** (a glyph/word),
**minor** (layout/order/copy), **moderate** (a missing control or section),
**structural** (a screen or system that does not exist here). They grade the
**size of each change**, since — as in v8 — there is no parity gap being
closed._

_Ids are per-document. Cite them qualified — `v9#m2`, not `#m2`._

---

# 0. THE RULING — read this before any future parity work

**This is the most important entry in the document, and it governs every
session after this one.**

The user's ruling, verbatim:

> *"web and ios split here, but keep the same internal data and ideas. we want
> web updated to match the feel but keep its uniqueness to new web
> capabilities."*

## 0.1 What that changes

From v0.1.0 to v0.3.0, every one of these ledgers ran on one premise: **iOS is
canonical for presentation, and a visual difference on the web is debt**. v5
graded 60 findings that way. v6 shipped thirteen systems to close it. v7 ported
the chassis. Each closed with a *"Deliberate deviations (kept, not bugs)"* list
— which exists precisely because divergence was, by default, a defect that
needed an excuse.

**That premise is retired.** The line now runs:

| | |
|---|---|
| **SHARED, and still canonical** | The catalogue. The systems. The *ideas*: the passport, grape lineage, the exam, Professor Vino, quick pins, the skin table, the LCD modes, the tile liveries, the dial. `shared/` remains the cross-repo master and `sync-shared.ps1` remains the only way anything crosses. A data fix still goes to `HGapps\shared` and comes back through the sync. |
| **SPLIT** | How any of it looks. The web is **no longer required to match iOS's visual execution**, and a difference is no longer debt. It must still read as Vinodex — same identity, same product, same voice — but expressed with what the web actually has: `:focus-visible`, pointer-gated hover, `color-mix`, container queries, `linear()` easings, variable fonts, responsive layout, a keyboard. |

## 0.2 What a future session must NOT do

- **Do not "fix" the divergence back.** A screen that no longer matches its
  SwiftUI counterpart pixel for pixel is not a finding as of v0.4.0. Reporting
  one as a bug is the same class of error as re-raising a settled deliberate
  deviation, and is now the most expensive mistake available in this repo.
- **Do not read the old ledgers as still-live presentation debt.** v5–v8's
  visual findings were correct under the old rule and are historical under this
  one. Their *data* and *systems* findings are unaffected and still stand.
- **Do not put web presentation in `shared/`.** See v9#m2 — this was an active
  trap in the plan that produced this pass.

## 0.3 What survives unchanged

- iOS is still **read-only**. Nothing in `vinodex-ios` was modified or is ever
  modified from here.
- `shared/` is still a **mirror** in this repo and is never edited here.
- The **deliberate-deviations list** survives, but its job narrows: it now
  records deviations of **behaviour, product scope and vocabulary** — the
  un-gated free tier, COLLECTION vs SAVED, the flat country step — not of
  drawing. §5 carries it forward on those terms.
- The two apps still **version independently** (`appVersion.ts` §"This number
  is the web app's own"). This document names iOS v0.9.2 only as the build its
  ports were read from.

---

## Status — stages 1 and 2 of five, executed and green (2026-08-21, on `testing`)

**Scope was ruled at two stages of five and stopped there**, so the user can
see the new language on real screens before it reaches twenty more. Stages 3–5
(chassis refinement, the screen-by-screen rollout, the app-wide motion pass)
are **not** in this release; §4 lists what was deliberately left.

Gates, run sequentially on the committed tree:
**lint 21 warnings (cap 22) · typecheck clean · 642 tests / 57 files · build OK
(440 OG pages, 426 precache entries / 5,416 KiB) · check:refs zero dangling ·
playwright 132 passed, exit 0.**

Vitest gained one file and 17 tests (`designTokens.test.ts`); v8 closed at 625
/ 56. Playwright gained two (`a11y.spec.ts`) and **no existing spec needed
amending**, which is worth stating: the site suite asserts button *accessible
names*, so the conversion had to preserve every one of them. `WHO WE ARE` in
particular was only producing that name by accident, out of a `<br />`-split
label.

> **A note on how the gates were run, because it cost two hours.** Three
> earlier Playwright runs reported 3, 4 and 11 failures, and every one of
> those was **self-inflicted contention**, not a defect: `npm run build` has
> `emptyOutDir: true` and writes the same `dist/` the Playwright web server is
> serving, so a build started during a run 404s the app out from under it, and
> a concurrent `eslint` over the whole repo tips 45-second tests into
> teardown timeouts. The run above was left strictly alone. **Do not run
> another gate while Playwright is running in this repo.**

Before/after screenshots for the two converted screens, at 390x844 and
1280x800, in DARK and LIGHT, plus a keyboard-focus shot of each:
`web/e2e/.shots/v0.4.0/{before,after}/` (gitignored, like every other shot
this repo takes). The "before" set was taken by stashing the change and
rebuilding at `347a42a`, not from memory.

- **Done — stage 1 (foundations):** v9#m1 (the three typefaces self-hosted, and
  Inter added), v9#m2 (the token layer: type scale, radii, elevation, motion,
  the neutral surface ramp, the tint ramp, the seven-livery table in both
  modes, the focus ring), v9#m6 (`data-lcd-light`, so CSS can branch on the
  mode's own `isLight` rather than on one mode of nine).
- **Done — stage 2 (the primitive and the two hero screens):** v9#m3 (`Card` /
  `Tile`), v9#m4 (`WebsitePortal`, all five screens), v9#m5 (`MainMenu`).
- **Bugs found and fixed on the way, none of them cosmetic:** v9#b1 (white on
  every tile livery failed AA in every mode), v9#b2 (the company site drew
  light-mode ink on a fixed dark ground — its own wordmark was invisible on
  five of the nine screen modes), v9#b3 (the web never got iOS's light-mode
  livery table, so five modes drew dark-mode faces on a pale page), v9#b4 (the
  SMALL/LARGE text setting reached almost nothing), v9#b5 (the dial's focus
  ring was masked away — introduced by this pass, found by tabbing through it,
  and now pinned).
- **Added:** `web/components/Card.tsx`,
  `web/src/services/designTokens.test.ts` (17 pins), `web/e2e/a11y.spec.ts`
  (2 pins), `web/public/fonts/` (six woff2 subsets + three OFL licences).
- **Deleted:** the third-party `@import` in `index.css`, and the two Workbox
  runtime-cache rules for `fonts.googleapis.com` / `fonts.gstatic.com` that it
  was the only caller of.
- **Version:** 0.4.0 in all four spellings (`appVersion.ts`, `package.json`,
  both `package-lock.json` fields) plus an authored `webChangelog.ts` entry;
  0.3.0 promoted to `PREVIOUS`, and the log's floor raised from 2 to 6.

---

# 1. Stage 1 — foundations

## v9#m1 — The three typefaces are self-hosted; Inter joins them *(moderate)*

**What it was.** `web/index.css:1` — one line, `@import
url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323')`
— plus two Workbox `CacheFirst` rules in `vite.config.ts` to catch the
resulting third-party requests.

**The decision, and why it is not "use the existing pattern".** The plan asked
for a variable sans "via the existing Google-Fonts `@import` pattern". Four
measured reasons say the existing pattern is the thing to replace, not extend:

1. **`@import` of a third-party stylesheet is the longest possible path to a
   glyph.** The browser cannot request the font until it has fetched and parsed
   `index.css`, *then* fetched and parsed Google's stylesheet — two extra round
   trips to two extra origins, on the critical path, on the primary surface,
   which is a phone.
2. **This app is offline-first and its type was not.** 420 precache entries
   make the shell run with no network; the fonts sat outside that in a runtime
   cache that only fills after a *successful online* fetch.
3. **The visual gate depended on somebody else's DNS.** `web/e2e/fixtures.ts`
   fails a spec on any `requestfailed`, so every screenshot test carried a live
   dependency on `fonts.googleapis.com`.
4. No third-party request, no third-party record of who read the site.

**What shipped.** Six woff2 subsets in `web/public/fonts/` — Inter v20
(variable, 400–700 on one axis), Press Start 2P v16, VT323 v18, each in Google's
own `latin` and `latin-ext` cuts with Google's own `unicode-range` values, and
the exact source URLs recorded in the `index.css` header so the download is
reproducible. **190 KB**, and `globPatterns` already named `woff2`, so the
precache goes 420 entries / 5,222 KiB → **426 / 5,414 KiB (+192 KiB, 3.7%)**.
The three `latin` cuts are `<link rel=preload>`ed from `index.html`;
`latin-ext` is not, because it exists for the six characters in the catalogue
(`ű š ć ř ō ă`, measured) that fall outside `latin` and would otherwise
fall back per-glyph to the system sans in the middle of an Inter word.

All three are SIL OFL 1.1; the licences ship beside the files, which is what
the licence asks for.

**Inter, not Geist.** Both were on offer. Inter's variable cut is 48 KB for the
whole 400–700 range on the `latin` subset, its metrics are close enough to the
system UI stack that a `font-display: swap` fallback does not reflow the page,
and it is the face the plan's own reference points (Linear, Arc) are set in.

## v9#m2 — The token layer *(structural)*

**In `web/index.css`, and deliberately NOT in `shared/`.** The plan proposed
"a `shared/` design-token module". `shared/` is the cross-repo master that
`sync-shared.ps1` mirrors into **both** repos — a web type scale placed there
is a web type scale shipped into vinodex-ios on the next sync, which is exactly
the split §0 draws. Web's design language is `web/`'s. Half of it is in the
`@theme` block (Tailwind has to know about a token to generate `text-body`,
`rounded-card`, `shadow-elev-2`); half is in `:root`, because `@theme` values
are static and these switch per screen mode.

What is in it:

| Group | Tokens | Note |
|---|---|---|
| **Type** | `--font-sans` + `--text-{display,title,heading,body,label,caption}` with line-height, tracking and weight | Every step is `calc(<rem> * var(--text-scale, 1))` — see v9#b4 |
| **Radius** | `--radius-{control,card,surface}` | Three, named for what they wrap. The app had eleven distinct corner values and no rule |
| **Elevation** | `--shadow-elev-{1,2,3}` | Two layered shadows each (a tight contact shadow and a wide ambient one) replacing `retro-shadow`'s single hard `4px 4px 0` |
| **Motion** | `--motion-{overlay,crossfade,press,settle}` + `--ease-*`, `--press-scale` | Ported from `DexMotion` — see below |
| **Layout** | `--pad-screen`, `--pad-card`, `--gap-grid`, `--gap-stack` | Semantic, **not** a second numeric scale: Tailwind v4 already ships the 4/8/12/16 ramp and authoring a parallel one would be two scales |
| **Surface** | `--surface-{sunken,base,raised,high,line,line-strong}` | Derived by `color-mix` from the `--lcd-page` / `--lcd-surface` / `--lcd-text` each mode already authors |
| **Tint** | `.dex-tint` → `--tint-{surface,subtle,border,ink,solid}` from one `--tint` | Four derived steps per hue instead of four authored ones |
| **Livery** | `--livery-{violet,green,amber,red,orange,sky,emerald}` and `-deep`, in both modes | A whole port of `DexTileLivery` — see v9#b3 |
| **Focus** | `--focus-ring` | Two rings: the page colour inside, the mode's accent outside, so it survives a black LCD, a paper-white one and a royal-blue one |

**The motion port is a real port, not an approximation.** `DexMotion`
(`DexTheme.swift:1430`) is four named curves. `overlay` (easeOut 0.15) and
`crossfade` (easeInOut 0.55) are CSS's own easings and cross unchanged. The
other two are SwiftUI springs, where `response` is the period of the undamped
oscillation:

```
x(t) = 1 - e^(-zeta*wn*t) * (cos(wd*t) + (zeta*wn/wd) * sin(wd*t))
wn = 2*pi/response      wd = wn * sqrt(1 - zeta^2)
```

They **overshoot** — 6.3% for `press` (response 0.24, damping 0.66), 1.1% for
`settle` (0.28 / 0.82) — and **no `cubic-bezier` can both overshoot and settle
back**. CSS `linear()` can, so each is that equation sampled at 26 points, with
the duration set where the response stays inside 0.2% of its target for good
(373 ms and 361 ms). Both are the true settling time; the movement is
perceptually over in a third of it, which is how the iOS original feels.
`linear()` is Baseline-available; a browser without it drops the declaration
and falls back to `ease`, which is a worse spring and not a broken page.

`designTokens.test.ts` pins that both easings start at rest, end at rest and
overshoot — so a well-meaning "simplification" back to a bezier is a red test.

**Reduce Motion.** iOS deliberately does not fold it into the curves, because
whether a movement should happen at all is a per-movement judgement, and
neither do we. `index.css`'s existing catch-all covers every transition
including future ones, and **no new `@keyframes` were added**, so
`reducedMotion.test.ts`'s derived handled-class check still holds without
being relaxed.

**One CSS detail that is a bug, not a preference.** `.dex-pressable:active`
uses the independent `scale` property, **not** `transform: scale()`. A control
positioned with a transform — the dial's search hub is
`-translate-x-1/2 -translate-y-1/2` over its own centre — would have that
transform *replaced* by the press and would jump half its own width up and left
on every touch. `scale` composes; `transform` overwrites.

## v9#m6 — `data-lcd-light`, so CSS can ask the right question *(minor)*

`applyTheme` publishes the mode's own `isLight` flag as an attribute. The
existing `[data-lcd="light"]` rule that softens the grid wash on a pale page
covers **one mode of the five that are pale** — VINTAGE, WINE.OS, VINOFD's
siblings and GRÜNERBOY have exactly the same problem and no rule. Rather than
repeat that mistake for a seven-row livery table, the flag that already decides
this in TypeScript is published for CSS to branch on.

The pre-existing `[data-lcd="light"]` rule was **left alone**, deliberately: it
is craft debt found while working, not the item this pass was sent for. It is
recorded in §4 as (v9#d1).

---

# 2. Stage 2 — the primitive, and the two hero screens

## v9#m3 — `Card` and `Tile` *(structural)*

`web/components/Card.tsx`. A card is: a surface tinted 14% toward its livery,
one soft two-layer shadow, one radius from the three-radius vocabulary, and the
livery appearing **once** — in the icon chip. Not a border *and* a chip *and* a
wash. `Card` renders a `<div>`, or a `<button>` when given an `onClick`, so a
card with an action is a real control with a focus ring, a keyboard path and a
44 px floor rather than a `<div onClick>`.

**The percentages are measured, not chosen.** Every step of the tint ramp was
swept across **all nine LCD modes × all seven liveries** and set to the loosest
value that still clears WCAG everywhere:

| step | mix | measured worst case |
|---|---|---|
| `--tint-surface` | 14% over `--lcd-surface` | label in `--lcd-text` on it: **4.56:1** (VINOFD/amber) — AA text |
| `--tint-subtle` | 26% over `--lcd-page` | the icon well; mixed toward *page* rather than surface because page is the more extreme of the two in every mode, and that is where the headroom is |
| `--tint-ink` | 70% toward `--lcd-text` | the glyph on the well: **3.14:1** (VINOFD/red) — clears 1.4.11. At a full 100% the same pair measures **2.20:1 and fails**, which is why the glyph is a blend and not the livery |
| `--tint-border` | 55% over `--lcd-surface` | the hairline accent |

VINOFD (`BLUE_SCREEN`) binds every one of those, as it should: a dark mode with
a royal-blue page is the hardest ground in the table to sit a colour on.

## v9#b1 — White on every tile livery failed AA *(moderate — an accessibility defect, found by this pass)*

Measured across the seven dark liveries: **1.92:1** (amber) to **3.96:1**
(violet). Not one reaches AA's 4.5:1, and the two greens do not reach the 3:1
non-text floor either. iOS's own comment on `DexTileLivery.ink` says "white on
every livery, in both modes — the faces are all deep enough to carry it", and
for the dark half that is not true.

**The taste change and the fix are the same change.** Once the livery is an
accent rather than the fill, the label sits in `--lcd-text` on a 14% tint and
measures 4.56:1 at its worst. This is the strongest single argument for the
card treatment and it is worth stating in those terms rather than as a
preference about flat colour.

*The same defect exists on `SettingsPanel`'s six-tile grid and on `EntryTile`,
which stages 1–2 do not touch. Carried to §4 as (v9#d2).*

## v9#b3 — The web never got iOS's light-mode livery table *(moderate)*

iOS hoisted `DexTileLivery` into one seven-row table with a dark **and** a
light value per livery, and says why in its own header: *"light mode was added
to the settings grid and missed on the main menu, because there was no one
place that knew a tile face has two values."* The web never got the hoist —
`MainMenu.tsx` spelled four dark hexes at the call site and `SettingsPanel.tsx`
six more — so on **all five pale LCD modes** the web drew the bright dark-mode
faces on a pale page, which is precisely the fault iOS's note describes.

Both halves now live in `index.css`, all seven rows, and
`designTokens.test.ts` fails if either half loses a row.

**Retuned one chroma step**, as the plan asked: converted to OKLCH, C × 0.84,
L and H untouched, so each colour is recognisably itself. Violet, for example,
`#a855f7` → `#a362e6`, C 0.233 → 0.195.

## v9#b4 — The SMALL/LARGE text setting reached almost nothing *(minor)*

`.lcd-themed { font-size: calc(1em * var(--text-scale)) }` only ever reached
text with **no explicit size of its own**, and the app sizes nearly everything
with rem utilities — so the accessibility control did close to nothing on the
screens people actually read. Every step of the new scale is
`calc(<rem> * var(--text-scale, 1))`: absolute, so it does not compound through
nesting, and scaled, so the setting works by construction. Pinned.

## v9#m4 — `WebsitePortal`, all five screens *(moderate)*

- **`PortalHome`.** Four near-identical `<button>` blocks differing in six
  places each become one four-row table and a `Tile`. That is how WHO WE ARE
  and CONTACT US ended up carrying a literal `<br />` while the other two did
  not — **every label now reads on one line** at 390 px, which was the plan's
  most concrete complaint. Two flex rows become a real 2×2 grid, so a longer
  label cannot change a tile's size. `DATA` moves from Tailwind `blue-500` to
  the livery table's `sky`, which is the colour iOS has always used for the
  same job.
- **The wordmark keeps Press Start 2P** — it is a mark, not a label, and the
  plan's own rule keeps the pixel face for exactly this. It loses its
  hardcoded `2px 2px 0 rgba(8,32,16,0.6)` drop shadow, which was a dark offset
  drawn on whatever page the mode supplied.
- **`OurAppsList`.** Rows become `Card`s: real buttons, sans titles, sentence-
  case blurbs. The Vinodex row's "this one opens here" badge is now the green
  livery tint doing the job `border-green-600` did and the padlock did before
  that.
- **`ProjectSplash` / `InfoPage` / `ContactUs`.** Paragraphs move to the sans
  at body size with `normal-case` and `max-w-prose`. The LCD wrapper
  uppercases its whole subtree — correct for a device readout, wrong for three
  paragraphs about a studio, and a large part of why those pages were hard to
  read. The two hard-bordered green buttons become one `primaryAction` on
  `--lcd-accent` / `--lcd-on-accent`, which is the mode's own authored answer
  to "what colour is text on the accent" and is therefore legible in all nine
  without a branch.

## v9#b2 — The company site drew light-mode ink on a fixed dark ground *(moderate — shipped in v0.3.0, found by this pass)*

Every site screen filled with `bg-dex-screen`, a fixed `#232323`, while the
copy on top of it went through `.lcd-themed`'s palette remap and **did** follow
the screen mode. On LIGHT, `--lcd-body-text` resolves to `#23342A` — on
`#232323` that is a contrast ratio of roughly **1:1**. *The HORIZON/GODOT
wordmark on the front page was invisible*, and no gate could see it, because
nothing in the repo compares two colours.

Screenshotted before and after at 390×844; the before shot is the evidence.
Fixed by grounding the site on `--surface-base` so the page and the ink agree
by construction.

## v9#m5 — `MainMenu` *(moderate)*

**The dial is kept, and that is a decision worth stating.** The plan's step 2
says "convert `MainMenu`", and the literal conversion — four cards in a grid —
would delete the concave-scooped four-way pad that is the screen's whole
identity and one of the *shared ideas* §0 protects. What changed is its
materials, not its geometry:

- the four call-site hex pairs become livery names, so the screen gains a
  light-mode table it never had (v9#b3);
- the painted faces become tints and the labels move to the sans in
  `--lcd-text` (v9#b1);
- each quadrant keeps its `radial-gradient` scoop mask and its outer radius —
  `Tile` takes `bordered={false} elevation={0}` for exactly this, because a
  tile set *into* a housing does not cast a shadow onto it;
- the housing's `black/35` hairline becomes `--surface-line` and its
  hand-written `0 6px 14px` becomes `--shadow-elev-2`;
- the search hub is built from the same parts as a tile's icon chip — amber
  well, ink glyph — plus the one saturated ring on the screen, so the dial
  reads as one system rather than four tiles and a button from elsewhere;
- **the hub's `animate-pulse` white wash is deleted.** An infinite pulse on a
  control that is always available says something is happening when nothing is,
  and it was one of only two things on this screen that moved on their own.

REGIONS green and FLAVORS emerald are still two greens beside each other. Left
exactly as iOS has it: the hue-to-category assignment is one of the shared
*ideas*, so changing it is a product decision and not a presentation one.
Raised as an open question in §6.

## v9#b5 — The dial's focus ring was masked away *(moderate — introduced by this pass, found by using it)*

Worth recording in full, because it is the kind of defect this repo's gates
are structurally unable to see and because two obvious ways to test it are
both wrong.

`Tile` gives every control a `:focus-visible` ring as a `box-shadow`, and the
four dial quadrants are clipped to their concave shape with `mask-image`. **A
mask clips to the border box; a `box-shadow` without `inset` is painted
outside it.** So the ring was declared, computed, and then removed — a
keyboard user got no focus indicator at all on the app's front screen.
Typecheck is silent on it, the screenshot gate photographs a page nobody has
tabbed into, and a pointer user never asks for a focus ring.

The fix renames `bordered` to **`clipped`**, which is the honest name — it
states what is true about the tile rather than what it does to the border —
and lets that one fact decide both of its consequences: drop the card's
rectangle and hairline, which would fight the shape, and draw the ring inside,
which is the only place a masked element can show one.

`web/e2e/a11y.spec.ts` pins it. The two traps, both hit and both now written
down in the spec's own header:

1. **`.focus()` does not do.** `:focus-visible` is a statement about *how*
   focus arrived, and Chromium does not implement
   `FocusOptions.focusVisible` — a programmatic focus leaves a button in plain
   `:focus`. The first draft measured the resting shadow and reported a
   missing ring on controls that have one. It presses Tab.
2. **The ring transitions in** over `--motion-settle` (361 ms), so a
   `getComputedStyle` straight after the key press reads the *start* of that
   transition, which is indistinguishable from no ring. Every read waits.

So the assertion is not "the CSS declares a ring" — it did. It is that the
resolved `box-shadow` **changes** when Tab reaches the control, and that on a
clipped control it is `inset`. Both tests also assert their control count, so
neither can pass by the screen quietly losing a tile or the scoop.

`after/menu-focus.png` is the visual evidence: the ring follows the quadrant's
scoop and its outer radius.

---

# 3. What was verified, and how

- **Screenshots before and after**, at 390×844 and 1280×800, in DARK and
  LIGHT, on `/`, `/apps` and `/dex` — 12 shots each side, driven through
  Playwright against `vite preview`. The "before" set was taken by stashing
  the change and rebuilding at `347a42a`, not by memory.
- **Contrast computed, then measured in the engine.** First offline: sRGB →
  OKLab → WCAG relative luminance, over all nine LCD modes × all seven
  liveries, including the `grayscale(1)` the four monochrome phosphors apply,
  for both the label and the glyph. The ramp percentages in v9#m3 are the
  output of that sweep. Then **in Chromium against the built preview**, walking
  both converted screens through all nine modes and reading the *resolved*
  colours back — a `color-mix()` computes to `oklab()`, so each value is
  painted onto a 1×1 canvas and read as pixels rather than re-deriving the
  engine's colour maths. Live result:

  ```
  WORST label-on-tile  4.77:1  at / BLUE_SCREEN WHO WE ARE   (AA text needs 4.5)
  WORST glyph-on-chip  3.18:1  at / BLUE_SCREEN OUR WORK     (1.4.11 needs 3.0)
  no hit target under 44px on either screen, in any mode
  ```

  Both a little better than the offline worst case (4.56 / 3.14), because that
  case is a livery neither converted screen uses.
- **The existing pins all still hold.** The 22-skin screenshot gate, the
  footer-cap gate and the lamp gate read `--chassis-*` and `--cap-*` custom
  properties against `theme.ts`'s own tables; **stages 1–2 touch no chassis
  colour**, and all three stayed green untouched. Nothing was re-pinned,
  because nothing legitimately moved. The viewport gate — nothing painted
  outside the window, every chassis control on screen and clickable at three
  sizes — is likewise green unamended, which is the check that the tile grid
  becoming a real 2×2 did not change the LCD's box.
- **`reducedMotion.test.ts` still derives its handled set from the CSS**, and
  still passes without amendment: the pass added transitions and no keyframes,
  and the catch-all covers transitions.

---

# 4. Deliberately left for stages 3–5

Named so the next session does not have to rediscover them, and so nothing here
reads as an oversight.

- **(stage 3) The chassis.** Proportions, bezels, plastic gradients, lamp
  glows, unified corner radii, and a considered desktop stage instead of a
  device in a black void. Untouched by this pass on purpose — the chassis is
  where the pinned gates live, and mixing it with a token change would make a
  gate failure ambiguous.
- **(stage 4) The other twenty-odd screens.** `EntryTile`,
  `EncyclopediaList`, `EntryDetail`, `PassportScreen`, `ChipFilterScreen`,
  `BookmarksScreen`, `SettingsPanel` and the rest still carry the old type and
  the old fills.
- **(stage 4) `body { font-family: 'VT323' }` still stands**, so every
  unconverted screen looks exactly as it did. Flipping the default to the sans
  is stage 4's *first* act, once the rollout has reached the screens that would
  inherit it — doing it now would change twenty screens this pass did not look
  at.
- **(stage 5) The motion pass.** The tokens exist and two screens use them;
  screen transitions, entrance animations and the marquee are untouched.
- **(v9#d1) The `[data-lcd="light"]` grid-wash rule** still covers one pale
  mode of five. One-word fix, left alone because it is not what this pass was
  sent for.
- **(v9#d2) v9#b1's defect survives wherever the old tiles do.**
  `SettingsPanel`'s six-tile grid and `EntryTile` still put white on a
  full-chroma face. Stage 4 closes it by conversion.
- **(v9#d3) The `.lcd-themed` palette escape is set up, not closed.** 441 uses
  across 80 Tailwind palette classes are still remapped one by one at the foot
  of `index.css` — a remap that covers only the shades somebody remembered to
  list, and that any opacity modifier escapes because it compiles to its own
  class. The surface ramp is the thing they can be converted *to*
  (`bg-[var(--surface-raised)]` needs no remap and cannot escape one). **No
  conversions were done this pass**; that is stage 4, screen by screen.
- **(v9#d4) The grid wash is duplicated** in `WebsitePortal` and `MainMenu`,
  now in token form in both. Not hoisted into a shared component on purpose:
  the dex and the site share a chassis and nothing else, and a shared
  decoration component is the first thread of the coupling the separation rule
  exists to prevent.
- **(v9#d5) Press Start 2P and VT323 are now self-hosted but still carry their
  `latin-ext` cuts into the precache** (26 KB) for text that is almost always
  ASCII. Measurable, not worth a special case yet.
- Carried open from v8: (v5#7) DATA LOAD ERROR; (v7#S5) the workshop's per-axis
  lamp overrides; (v7#S6); (v7#U1–U6, U8–U10). None touched.

---

# 5. Deliberate deviations — carried forward, and re-scoped

**§0 narrows what this list is for.** It used to record every way the web looked
unlike the phone. Divergence of *drawing* is no longer a deviation, so what
belongs here now is deviation of **behaviour, product scope and vocabulary**.
Re-checked this pass; nothing below was re-raised as a bug.

Still deviations, unchanged:

- **COLLECTION, not SAVED / User**, on the chassis button and the page it
  opens.
- **The interactive moon dial**, the **web-only region map**, and the
  **scanner's flat country step**.
- **The un-gated free tier.** No paywall, no Shop.
- **The company site has no Swift counterpart at all** — v8's reframing of the
  retired splash. iOS still has no landing product.
- **The site's marquee mark is the only web-authored art in the repo** (v8#10).
  Unchanged, and still the item to revisit if iOS ever gains a site screen.
- **The island trio stays `aria-hidden`**; **the chooser's hairline is the LCD
  accent**; **one colour table for the trio and the marquee pair**.
- **`starterOnly` differs from iOS's `starterTierOnly`** in spelling. Still
  deliberate — a rename resets stored state.

**Reclassified by §0 — no longer deviations, now simply the web's design:**

- The tile treatment (card and accent, against iOS's painted plastic).
- The type: a variable sans for reading text, the pixel face reserved for the
  wordmark, the marquee and system flourishes.
- The motion vocabulary: the same four *named curves*, expressed as CSS
  transitions with `linear()` springs, plus hover and `:focus-visible` states
  that have no SwiftUI counterpart.
- Sentence-case body copy on the site's prose pages, against the LCD's
  blanket uppercase.

---

# 6. The open question

**Does FLAVORS keep the emerald livery?** REGIONS green and FLAVORS emerald sit
side by side on the dial and are two greens; retuning one chroma step made them
slightly closer rather than further apart, and on the four monochrome phosphor
modes all four quadrants collapse to grey anyway. iOS has the same pairing and
this pass left it alone, because the hue-to-category assignment is one of the
shared *ideas* §0 protects — changing it is a product decision, not a
presentation one, and it would want to change on both platforms or be recorded
as a real split. **A ruling either way is wanted before stage 4**, since
`EntryTile`, the passport and the settings grid all read the same assignment.

---

# 7. Notes

- **iOS is untouched.** `DexTheme.swift` and `MainMenuScreen.swift` were read
  for the motion curves and the livery table; nothing in `vinodex-ios` was
  modified.
- **`shared/` is untouched**, in both the "do not edit the mirror" sense and
  the sharper one this pass is about: no design token was placed there.
- **`web/public/wine-entries.json` and the frozen `scripts/` generators are
  untouched.**
- **The service-worker config was edited once**, to delete two rules that
  became provably dead. The art rule — 254 portraits runtime-cached on purpose
  — the unminified SW and the `no-cache` headers in `vercel.json` are all
  exactly as they were.
- **Nothing was pushed.** `master` is wired to Vercel; the merge and the tag
  are the user's call.
