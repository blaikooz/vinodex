# Web ↔ iOS parity plan

Goal: bring `vinodex-web` as close to `vinodex-ios` v0.4.1.7 as the platforms
allow, and ship it on Vercel.

> **Status — all blocks below are built and merged.** `splash-split` turned out
> to be wholly contained in `screen-state-port`, and `master` was an ancestor of
> it, so combining the three was a fast-forward with no conflicts; `master` is
> pushed at 18 commits ahead of where it stood. Blocks 9 and 10 below were added
> after the merge; block 11 closes the last of the untested services; blocks
> 12–13 replace the moon dial and start on the readout interiors; block 14
> brings across the iOS audit branch; block 15 rebuilds the DATA panel;
> block 16 is the screen-by-screen plan that follows. See "Still open".

`vinodex-ios` is the reference and stays **read-only**. Every block below ports
*from* Swift *to* React.

## Where the gap actually is

Already ported (branches `splash-split`, `screen-state-port`):

- splash fork at `/`, dex menu at `/dex`
- ScreenState — scroll position and section flags survive Back
- minigames hub, daily reveal, scanner, saved list, SAVE control

Remaining gap, which is what this plan covers:

| iOS has | Web has today |
|---|---|
| `ChassisSkin` — 5 colourways | one hardcoded red shell |
| `LcdMode` — dark / light screen | dark only |
| `TextScale` — small / large | fixed |
| Settings panel + 4 section panels | nothing |
| Chassis buttons: back, home, **saved, settings** | back, home |
| REGIONS tile opens the **globe** | opens a 2D region map |
| Menu: 4 tiles + search | 4 tiles + search + 2 extra circles |

## Block 1 — Theme foundation (skins, screen mode, text scale)

The load-bearing block: everything after it reads these values.

1. `web/src/services/theme.ts` — port `ChassisSkin`, `LcdMode`, `TextScale`
   from `DexTheme.swift`, including the exact hex tables. Keep the Swift raw
   values as the persisted vocabulary (`CLASSIC`, `DARK`, `SMALL`) so the two
   apps could ever share a backup, and because renaming a case would silently
   reset everyone's stored choice.
2. Apply as **CSS custom properties** on a root element rather than threading
   props: `DeviceLayout` and every screen already use Tailwind classes, and
   variables let those become `bg-[var(--chassis-body)]` without a rewrite.
3. `useTheme()` — reads/writes localStorage, notifies via an external store
   (same pattern as `bookmarks.ts`), so a change in settings repaints instantly.
4. Rewire `DeviceLayout`: `bg-dex-red` → chassis body, `bg-dex-ui` → panel,
   `border-stone-400` → panel edge, footer wash, grill slats.

**Checkpoint:** switching skin repaints only the moulding; the LCD content is
untouched. That is the whole point of the iOS split — a skin swap must not
affect legibility.

## Block 2 — Chassis buttons + menu parity

1. `DeviceLayout` gains SAVED and SETTINGS controls, matching `DeviceChassis`.
2. With those in the chassis, `MainMenu` drops its two extra circles and
   becomes exactly iOS's layout: 4 tiles around one search button.
3. REGIONS opens the globe (`/retro-globe`), not `/region-map`. Keep the old
   route alive for existing links.

## Block 3 — Settings

1. `/settings` — grid of 4 tiles (CUSTOMIZATION, DATA, ACCESS, DEV), matching
   `SettingsSection`.
2. `/settings/:section`:
   - **CUSTOMIZATION** — chassis skin picker, screen mode, text size.
   - **DATA** — database readout: counts per category, climates, rarities.
   - **ACCESS** — the honest web answer. iOS gates entries behind IAP tiers;
     nothing on the web is locked, so this panel says so rather than porting a
     paywall into a free app.
   - **DEV** — diagnostics: entry count, decode errors, build info.

## Block 4 — Vercel

1. `vercel.json` with a SPA rewrite, so `/dex` and `/detail/x` resolve on a
   cold load rather than 404ing.
2. Confirm the build command and output directory match `vite.config.ts`
   (`dist/` at the repo root, not `web/dist`).
3. Check `start_url` and the service worker still behave behind Vercel's CDN.

## Block 5 — Screen mode reaches the content ✅

The content screens carried a fixed dark palette across ~200 class names in
seven components. Remapped once in `index.css` onto the theme variables, scoped
to `.lcd-themed` on the LCD wrapper so the chassis does not follow it. Search
fields are pinned to `--lcd-well` explicitly, since letting the `bg-black` remap
take them would make the field flush with the page instead of a recess in it.

## Block 6 — The remaining behavioural gaps ✅

- **SHOW ALL expanders.** Twelve linked lists truncated silently at 3/6/8. Now
  capped with a SHOW ALL (n) toggle, held in the screen-state store's `flags`,
  so an expanded list survives Back.
- **Search queries survive Back**, completing the `SearchStateStore` port —
  scroll anchor, section flags and query are all now kept.
- **One version number.** `appVersion.ts` mirrors `AppVersion.swift` at
  0.4.1.7; the back plate said `v0.0.<commit count>` while the phone said
  0.4.1.7. Commit count demoted to a build id in the DEV panel.

## Block 7 — Button-by-button and chrome pass ✅

- Main menu is exactly `MainMenuScreen.swift`: four tiles around one search
  button. The spare globe circle is deleted, and GRAPES carries the nine-dot
  grid (`circle.grid.3x3.fill` → lucide `Grip`), not a grape.
- Every button on the chassis is one diameter, as iOS has it
  (`controlButton = footerControl = 4 * rem`): orb, cog and the three footer
  controls. Cog glyph is 52% of its button; status dots are 17%.
- The Back slot becomes the person glyph when there is nowhere to go back to,
  and is suppressed entirely on the splash.
- Splash keeps the wordmark (nothing else names the product there) and uses the
  PNG mark, rounded to the 18% the SVG's own plate uses.
- Settings gained EXIT TO SPLASH — Home goes to `/dex` by design, so the splash
  was otherwise unreachable once you had entered.
- Icons resolve from a local bundle rather than the live Iconify API, mirroring
  what `rasterize-icons.sh` bakes for iOS.

## Block 8 — Entry readout: extract, then order ✅

The per-variant sections were 26 inline conditionals in a 1,250-line
component, which made their order unreadable and unsafe to change. A first
attempt to move the JSX blocks textually mis-nested a region section inside a
grape conditional and was reverted.

The working approach was to **extract first**: ten sections (five grape, five
region) became named consts above the return, keeping every closure they
already used, with the inner JSX byte-identical. Order then became a five-line
list per variant, matching `categorySections`:

| Variant | Order (now matching Swift) |
|---|---|
| Grape | characteristics → rarity → flavour profile → also known as → notable regions |
| Region | system → appellations → climate → soil → notable grapes |

The region order is the behavioural change: the grape list sat third, above
climate and soil. iOS puts appellations directly under the system that governs
them and the grape list last — the appellations *are* that system's
denominations, and a section apart they read as an unrelated tag cloud.

Also fixed here, found by reading the Swift rather than by testing: the rarity
stars ranked COMMON above UNCOMMON (`rarityRank` is common 1, uncommon 2,
rare 3; the web read COMMON 2 / UNCOMMON 1), and only filled stars were drawn,
so two and three stars were the same shape at different widths.

## Block 9 — The website ✅

Web-only: there is no Swift counterpart, and this block does not port anything.
`/` already forked between the dex and a muted "coming soon" stub; the stub now
leads somewhere.

- `/website` is the dex menu's face with the categories swapped — OUR APPS, WHO
  WE ARE, CONTACT US, DATA. Tile geometry, depress, sheen and grid are lifted
  from `MainMenu` rather than reinvented, so the two menus read as one screen
  with different labels. The centre slot holds the mark as a decorative disc:
  nothing on a four-page site earns a control as prominent as master search, and
  a circle that looked pressable and did nothing would be worse.
- **DATA opens `/settings/DATA`**, the existing panel, rather than a second copy
  of the readout.
- `appUnlock.ts` gates Vinodex behind a code (`0000`), persisted like
  `bookmarks` — a gate that reopened on every refresh reads as a bug. It is
  deliberately *not* `access.ts`: that is the paywall harness and models bundles
  someone owns, this models whether the site hands the app over at all. They
  never consult each other. SETTINGS → DATA can re-lock.
- Home inside the website means the website menu, not `/dex` — otherwise it
  would push a visitor through a gate they have not passed.

## Block 10 — A test runner ✅

The "no test runner" item below is closed. Vitest under jsdom, configured by
`vitest.config.ts` separately from `vite.config.ts` (which sets `root: web/` and
mounts the PWA plugin — neither of which a unit test wants).

jsdom rather than node because the stores are localStorage-backed, and the Swift
originals run against a real `UserDefaults`; a stubbed store would not exercise
the JSON round trip or the corrupt-value guards, which is where the bugs are.

126 tests across 9 files. The service suites are ports of
`ios/Tests/VinodexCoreTests/`, each file's header recording which Swift cases
were adapted or dropped and why — `bookmarks` drops the `SavedItem` place cases
(the web has COUNTRY_GATE entries, so the distinction is absent), `dailyPick`
adapts the free-tier assertions (the web ships no tiers manifest), `grapeScan`
derives the body chips from the data rather than a closed enum.

The component tests are the first in the repo, and they found the bug that the
next section had been claiming for weeks: `WHO WE\nARE` as a tile label put a
literal newline in the button's accessible name. Wrapping is left to the browser
now; the visual result is identical.

## Block 11 — The last four Swift suites, and what they caught ✅

`MoonCalendar`, `EntryFilter`, `Continent` and `Coverage` are ported. 219 tests
across 13 files. Porting them found two places where the web had silently
drifted from the reference — which is the entire argument for doing it.

**`EntryFilter` had to be extracted before it could be tested.** iOS keeps the
predicate in `VinodexCore/EntryFilter.swift` with its own suite; the web had it
as a ~120-line `useMemo` inside `EncyclopediaList.tsx`, closing over eight
component locals. `FilterTests.swift` opens by saying it "exercises the ported
`EncyclopediaList.tsx` filter predicate" — and nothing on this side could run a
line of it. It now lives in `src/services/entryFilter.ts`; the component keeps
only the input state. Same extract-first move as block 8.

**Bug 1 — search was not diacritic-insensitive.** The predicate compared
`.toLowerCase()` on both sides, so "albarino" did not find Albariño and "rias"
did not find Rías Baixas: you had to type the accent to reach an entry whose
distinguishing feature is that it has one. `normalizeLabel` already folded
diacritics and was used by every *filter* — it simply was never applied to the
search path. iOS folds here and `FilterTests.diacritics` pins both names.

**Bug 2 — the globe markers were on cities, not continents.** North America was
pinned to (38, -122), which is San Francisco; Africa to (-33, 20), Cape Town;
South America to Santiago. Markers hung off the landmass they label. This is not
a new discovery — iOS fixed it a while ago and `WineDatabase.swift` names *this
repo's* `RetroGlobeScreen.tsx` as where the bad values came from, but the fix was
never brought back. The coordinates and their bounding boxes now live in
`src/services/continents.ts`, ported from the Swift enum, and
`continents.test.ts` pins every marker inside its own continent's box. The globe
is UI, so nothing else here would ever have noticed.

Two Swift cases could not be ported as written: `MoonCalendar.quote` lives in
`MoonDialScreen` on the web rather than in the service, and `drinkingDays`
asserts flower days that the web reading does not expose. Both are noted in the
suite headers.

## Block 12 — The moon dial, replaced ✅

The web's dial was a draggable control that swept the lunar month, backed by a
sidereal (Lahiri) longitude, an ecliptic-node window and hourly sampling. iOS
threw all of that away and said why, about this file by name:

> Deliberately a readout with no interaction. The web reference
> (`MoonDialScreen.tsx`) drove a draggable dial through the lunar month, which
> is a lot of machinery in front of a single fact — the only thing anyone wants
> from it is whether tonight is a good night.

`moonService.ts` is now a port of `MoonCalendar.swift`: mean ecliptic longitude,
anchored at **local noon** so a day gets one type and the screen cannot flip
from a leaf day to a fruit day over lunch. The screen is the four-tick ring,
the DAY TYPE / ELEMENT / MOON IN readout, the tinted verdict panel and the
rotating line, all from `MoonDialScreen.swift`.

This changes what the app *says*: the sidereal offset is roughly 24°, close to a
whole sign, so the two builds regularly disagreed about which sign the moon was
in on the same evening. They now agree. Both Swift cases that had been recorded
as unportable — `drinkingDays` and `quotes` — port directly, because the service
carries the same `MoonDay` model and the same quote pools rather than a bare
`isFruitDay`.

## Block 13 — The entry readouts ✅

The first pass at the "section bodies below the chrome" item. Order, titles and
rules already matched; these are the interiors.

- **Appellation systems are spelled out.** The region readout printed a bare
  `AOC` chip. iOS prints the abbreviation *and* the full name beside it, plus
  the state — and the web had no `appellationName` function at all, so two
  `CoverageTests` cases (`docIsCountrySpecific`, `appellationNamesResolve`) had
  nothing to assert against. `src/services/entryDisplay.ts` ports it, keyed by
  the (system, country) pair because `DOC` means three different things. The
  chip keeps the short form for the reason the Swift gives: it is what the
  bottle label actually prints.
- **Soil glyphs were falling through.** `soilDisplay.tsx` kept its own seven
  keywords while `iconManifest.json` — a direct copy of iOS's generated
  `icons.json` — had been shipping the full fifteen all along, unread. Six terms
  in the dataset resolved to the default brown mountain: **Alluvial, Laterite,
  Loess, basalt, red loam, shale**. That is exactly the fault
  `CoverageTests.soilsResolve` exists for, down to the count in its comment
  ("six terms were silently doing exactly that"). The helper now reads the
  manifest, so keywords, order, glyphs and colours all come from the generator.
- **The CLIMATE section shows its glyph**, as `climateSection` does. The web had
  the icon in the hero tile row only, so the section actually titled CLIMATE was
  the one place without it.
- **Flavour taxonomy glyphs** are pinned 1:1 across classes and subclasses,
  including SALTY being both. This one found nothing — the web already complied
  — but the bug it guards is invisible, so it is worth holding.

## Block 14 — The iOS audit pass, brought across ✅

`vinodex-ios` ran an audit and remediation effort on an unmerged
`audit-fixes` branch — pushed ~13 hours after `main`, and the newest work in
that repo. `main` itself holds nothing the frozen `ios/` snapshot here does not
already have, and `shared/` is byte-identical between the two repos, so the
branch is the whole of what there was to take.

Ported:

- **M44 — `onAccent`.** New token: dark → black, light → white. Dark mode's
  accent is mint, and white on it is about 1.8:1. The selected settings row now
  fills with `--lcd-accent` and labels with `--lcd-on-accent`, which is also a
  visual change: the web marked the selection with a border and a tick alone,
  where iOS fills the row.
- **L29 — `heroGrid`.** The entry hero drew its grid in a fixed `green-900`
  (#14532d), the shade iOS singled out as reading heavy on the light hero. Now
  a token, lifted toward the paper in light mode. Countries, states and
  continents all render through `EntryDetail`, so this one place is the web's
  equivalent of the four hero grids the Swift pass touched.
- **L34 — search clear button.** Emptying the field meant holding backspace
  through a query `screenState` had deliberately kept alive across Back.
- **H10 — chassis labels.** The Saved control announced as "Saved"; it is now
  "Saved entries", as on iOS. The orb is worse than iOS's case and was missed by
  the original audit: it is a `<button>` with no accessible name at all on every
  screen that gives it no flip handler, so it is now `aria-hidden` when inert.
- **M19 — modal dialog.** The CLEAR ALL SAVED confirm had no `role="dialog"` or
  `aria-modal`, so a screen reader could wander into the list behind the scrim.
- **M25 — 44px hit target.** The destructive remove-bookmark button was ~28px
  and sits a few pixels from the tile that opens the entry, so a near-miss
  opened something instead of removing it. 44px target, same visual.

Already satisfied here, and verified rather than assumed:

- **M14 and M15** (secondary text and the filter banner using theme tokens) are
  structural on the web: the `.lcd-themed` remap in `index.css` already sends
  `text-stone-400` → `--lcd-subtext`, `bg-stone-800` → `--lcd-surface` and
  `text-stone-200` → `--lcd-text`. The banner needed no edit.
- **L30** (hero title shadow on `lcd.accent`) was already done.
- **M13** (search field repainting on a live mode toggle) cannot occur here —
  the field is styled by CSS variables, so it repaints by construction.
- **M1, L4, L5, L6, L16** are Swift-internal: `tiers.json` decode handling (the
  web ships no tiers manifest), dead Swift properties, stale Swift comments, and
  `UIFont` probing.

`theme.ts` gained a suite in the same pass — it is a port of `DexTheme.swift`,
was on the untested list, and had just gained two tokens. 283 tests.

One thing worth watching: the audit branch strips "Swift-unused" fields from the
generated JSON. `icons.json` was checked key by key against `main` and is
structurally identical — the 625-line diff is minification — so the web's
`iconManifest.json` copy is still valid. A future strip could quietly remove a
field this app reads; `soilDisplay` and `flavorIcon` now depend on that file.

## Block 15 — The DATA panel ✅

The three things `dataReadout` does that the web did not:

- **DATABASE tiles carry a glyph and a tint per table**, from `statGlyph`. The
  five categories reuse the main menu's own symbols and colours so a count is
  recognisably the same thing as the tile that opens it; COUNTRIES is the odd
  one out and gets a flag. The web drew a bare number over a caption.
- **TOTAL ENTRIES** becomes the iOS row — stack glyph, count, and the table
  count pushed right — rather than a centred block.
- **GROWTH**, which the web had no equivalent of at all. `DataWave` is a port of
  the Swift `Canvas` sweep across `waveMilestones` (`[0, 25, 186, total]`): the
  counter and the curve render from one value, so the number climbing to the
  total *is* the line being drawn, smoothstep-eased between milestones so it
  arcs into each one instead of turning a corner. Swift drives it from a
  `TimelineView` clock; the web equivalent is `requestAnimationFrame`, stopping
  once the sweep is done rather than repainting forever, and honouring
  `prefers-reduced-motion` by jumping to the settled frame.

The wave's viewBox is measured rather than fixed. A fixed one needs
`preserveAspectRatio="none"` to fill the panel, which stretches the x axis —
harmless for the curve, but it turns the head dot into an ellipse at every width
but one.

COVERAGE stays below GROWTH. iOS has no equivalent panel for those four counts,
but they are real data rather than decoration.

Also in this pass: **RE-LOCK VINODEX moved from DATA to ACCESS**, where the other
controls that decide what opens live; **CUSTOMIZE reordered** to screen mode,
text size, then shell, as `customization` lists them (the web led with the
cosmetic choice above the two that change legibility); and the **skin swatch
draws body over panel**, so it reads as the actual shell rather than one flat
colour.

### Not found: skin-tinted buttons and orb

Searched for and **not present in `vinodex-ios` at any point in its history**.
`ChassisSkin` carries only `body`, `footerWash`, `panel`, `panelEdge` and
`grill` — no control colours. The orb is `Dex.cyan300` in every commit that has
ever touched `DeviceChassis.swift`, the status dots are a fixed red/yellow/green,
and `ChassisButton` is stone for Back and Saved, amber for Home. The web already
matches all of that. If a skin-tinted chassis exists, it is somewhere outside
this repo's three branches; deferred rather than invented.

## Block 16 — Screen-by-screen visual parity (planned)

Blocks 5–13 brought the *data* and the *chrome* into line. What is left is each
screen's interior read side by side with its Swift counterpart. Ordered by how
much of the app they carry:

1. **Grape readout** — `EntryDetailScreen.swift` `categorySections`, grape arm.
   Stat bars, rarity, flavour profile, ALSO KNOWN AS, NOTABLE REGIONS. Stat bar
   colours and the rarity crown already match; the chip clouds and linked-row
   markup have not been transcribed.
2. **Region readout** — the region arm. System and climate are done (block 13);
   APPELLATIONS and NOTABLE GRAPES still show the same data through different
   markup.
3. **Style readout** — and with it the branching noted below, which is the one
   place the web's structure genuinely diverges rather than merely differing in
   markup.
4. **Catalog / scan lists** — `CatalogScreen.swift` against `EncyclopediaList`.
   The web's per-filter titles (STYLE SCAN, GEOLOGY SCAN, …) have no iOS
   equivalent; decide whether they are a web affordance to keep or drift to
   remove.
5. **Scanner** — `ScannerScreen.swift` is 809 lines against the web's port, and
   still uses a flat country list where iOS walks the globe.

Each wants the same treatment block 8 used: extract the section bodies first so
their structure is legible, then compare, then move.

## Still open

- **Continent glyphs are paired, not unique.** iOS asserts six distinct glyphs
  (`continentPresentation`); the web resolves three across the six —
  Africa/Europe, Asia/Oceania and the two Americas each share one, because the
  game-icons set genuinely pairs those landmasses. Colours *are* all distinct,
  which is what `continents.test.ts` asserts instead. Closing this properly
  means choosing six glyphs, which is a design call rather than a port.
- **Most of it still has not been looked at in a browser.** The burgundy shell,
  the light screen, the cog, the expanders — all compile and none have been
  seen. The website screens are the exception: they are rendered and driven by
  the component tests, so the unlock flow, the tile wiring and the lock badge's
  subscription are exercised rather than assumed.
- **The `.lcd-themed` remap is broad.** If an element inside the LCD wants a
  fixed `bg-stone-900`, it now follows the screen mode. The audit is done: the
  classes left outside the remap are saturated accents on buttons and chips,
  which are fixed in both modes on iOS too, plus the DexAlert dialog, which is
  fixed-colour end to end in `DexAlert.swift` and so stays fixed here.
- **The style variant's branching.** iOS has one switch over the style class
  (method → KEY GRAPES, style/origin/type → NOTABLE GRAPES, blend → nothing,
  then KEY REGIONS). The web has five overlapping conditionals that between
  them produce the same result. Same extract-then-simplify treatment as block 8
  would fix it; it was left inline because its *order* does not diverge.
- **Section bodies below the chrome.** Partly closed by block 13 — the
  appellation system, climate and soil interiors now match. The remaining chip
  clouds, linked rows and tile grids are still a parallel implementation showing
  the same data through different markup; block 16 is the plan for them.
- **The scanner still uses a flat country list** where iOS walks the globe.
- **Every Swift case now has a web counterpart**, including the four that were
  previously recorded as unportable (`drinkingDays`, `quotes`,
  `docIsCountrySpecific`, `appellationNamesResolve`) — each of which became
  portable by fixing the thing that made it impossible to write. 266 tests
  across 17 files. Still untested, and with no Swift original to inherit from:
  `theme`, `appVersion`, `useScreenAnchor`, and the remaining display helpers
  (`grapeDisplay`, `styleDisplay`, `flavorDisplay`, `climateDisplay`,
  `iconRendering`).
- **Only three components are tested.** The two website screens and the unlock
  keypad. The dex screens have no render coverage at all.

## Out of scope, deliberately

- **Access tiers / entitlements.** iOS IAP plumbing. Porting the locks would
  add a paywall to a free app — a product decision, not a port.
- **Haptics.** No web equivalent worth faking.
- **The 3D flip to the back panel** already exists on web and is unchanged.
- **Scanner's globe step.** Still a flat country list; see the previous port.
