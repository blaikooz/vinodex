# Web ↔ iOS parity plan

Goal: bring `vinodex-web` as close to `vinodex-ios` v0.4.1.7 as the platforms
allow, and ship it on Vercel.

> **Status — all blocks below are built and pushed** on
> `vinodex-web@screen-state-port` (9 commits, unmerged). Nothing has been
> verified in a browser: the gates run were `npm run typecheck`, `npm run build`
> and every route resolving under the dev server. See "Still open" at the foot.

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

## Still open

- **Nothing has been looked at in a browser.** The burgundy shell, the light
  screen, the cog, the expanders — all compile and none have been seen.
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
- **No test runner on the web side.** `screenState`, `dailyPick`, `grapeScan`
  and `bookmarks` are untested here; their Swift originals have unit tests.
- **Nothing is merged.** Three branches sit on their PR links.

## Out of scope, deliberately

- **Access tiers / entitlements.** iOS IAP plumbing. Porting the locks would
  add a paywall to a free app — a product decision, not a port.
- **Haptics.** No web equivalent worth faking.
- **The 3D flip to the back panel** already exists on web and is unchanged.
- **Scanner's globe step.** Still a flat country list; see the previous port.
