# Web ↔ iOS parity plan

Goal: bring `vinodex-web` as close to `vinodex-ios` v0.4.1.7 as the platforms
allow, and ship it on Vercel.

> **Status — all blocks below are built and merged.** `splash-split` turned out
> to be wholly contained in `screen-state-port`, and `master` was an ancestor of
> it, so combining the three was a fast-forward with no conflicts; `master` is
> pushed at 18 commits ahead of where it stood. Blocks 9 and 10 below were added
> after the merge; block 11 closes the last of the untested services. See
> "Still open" at the foot for what remains.

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
- **Section bodies below the chrome.** The stat rows, chip clouds and tile
  grids inside each section are still a parallel implementation — they show the
  same data through different markup. Order, titles, rules and rarity now
  match; the interiors have not been transcribed.
- **The scanner still uses a flat country list** where iOS walks the globe.
- **Every Swift suite now has a web counterpart.** What remains untested here is
  what has no Swift original either: `theme`, `appVersion`, `useScreenAnchor`
  and the display helpers (`grapeDisplay`, `styleDisplay`, `flavorDisplay`,
  `soilDisplay`, `climateDisplay`, `iconRendering`). The display helpers are the
  highest-value of those — `CoverageTests` reaches into iOS's icon tables for
  soil keyword order and flavour taxonomy glyphs, and the web equivalents of
  those assertions are not written.
- **Only three components are tested.** The two website screens and the unlock
  keypad. The dex screens have no render coverage at all.

## Out of scope, deliberately

- **Access tiers / entitlements.** iOS IAP plumbing. Porting the locks would
  add a paywall to a free app — a product decision, not a port.
- **Haptics.** No web equivalent worth faking.
- **The 3D flip to the back panel** already exists on web and is unchanged.
- **Scanner's globe step.** Still a flat country list; see the previous port.
