# Vinodex-web — UI Modernization Plan

_Grounded in the current `origin/master` (v0.3.0, the v8 line) and the iOS app's
`DexTheme`. Direction chosen by the owner: **sleek modern app inside a refined
retro chassis.**_

## North star (the synthesis)

The two decisions — "sleek modern app" and "keep the chassis, refined" — resolve
into one idea: **a beautifully-made retro handheld running genuinely modern
software on its screen.** Reference points: Playdate (charming hardware, crisp
modern UI), Teenage Engineering, Arc/Linear-grade software polish. The device is
the brand; the *content on the LCD* is where we modernize hard.

Concretely:

- **The chassis stays** as the signature frame, but is refined — cleaner
  proportions, more considered materials, less "toy plastic," calmer chrome.
- **Everything inside the LCD becomes a modern app**: real card surfaces,
  generous spacing, a proper type hierarchy, restrained color, layered soft
  depth, and smooth micro-interactions.
- **Retro is an accent, not the whole voice.** The pixel font is for the
  wordmark, the marquee, and small "system" flourishes — not for paragraphs and
  button labels. The LCD/terminal green stays as a motif, not the only color.

## What's wrong today (from the current build)

Screenshotted `origin/master` at mobile + desktop. The chassis chrome is
actually good — detailed lamps, orb, speaker grille, and the device-frame height
cap already fits the viewport (the earlier desktop-cutoff bug is fixed). The
problems are almost all *inside the screen*:

1. **Tiles read as 2010s flat material** — four max-saturation color blocks
   (purple/green/orange/blue) with a single hard drop shadow. Garish, heavy, not
   premium.
2. **Pixel font used for reading text** — "WHO WE ARE" / "CONTACT US" wrap
   awkwardly inside Press Start 2P; labels are hard to read and cramped. The
   retro face is doing a job it's bad at.
3. **Color is unmodulated** — full chroma everywhere, no tints/surfaces/neutrals,
   so nothing recedes and there's no hierarchy.
4. **Depth is crude** — hard offset shadows instead of layered soft elevation;
   no sense of material or light.
5. **Little motion** — tiles are static; no press feedback, no considered screen
   transitions. iOS gets its "clean" feel largely from consistent, subtle motion.
6. **Desktop is a small phone in a black void** — the chassis floats with no
   considered stage, which undercuts the "modern" ask on large screens.

## Design foundations to establish (do these first)

Everything else depends on a small, real design system. Add these as tokens in
`web/index.css` `@theme` + a `shared/` design-token module, then refactor to use
them — no more magic values scattered in components.

- **Type.** Add a clean variable sans for all reading text and UI labels — Inter
  or Geist via the existing Google-Fonts `@import` pattern (it's CSP-allowed).
  Keep `Press Start 2P` for the wordmark/marquee/accents and `VT323` for
  deliberate "terminal/LCD" moments only. Define a real scale (display / title /
  body / label / caption) with line-heights. **This single change does the most
  for "clean like iOS."**
- **Color.** Keep the category hues (grapes-purple, regions-green,
  styles-orange, flavors-blue) but retune them: lower the chroma a step, add a
  tint ramp (surface / subtle / border / solid) per hue, and add a neutral
  surface ramp for cards and backgrounds so content has hierarchy. Preserve the
  dex-red chassis and LCD-green identity. Keep the per-skin theming system
  (`stylePalette.ts` / `ChassisSkin`) intact — retune, don't replace.
- **Spacing & radius.** One spacing scale (4/8/12/16/20/24…) and 2–3 radii
  (control, card, surface). Apply consistently — the current cramped/inconsistent
  padding is a big part of the "unclean" feel.
- **Elevation.** Replace hard offset shadows with a 3-tier layered soft-shadow
  system (resting / raised / overlay), theme-aware. Reserve subtle glass
  (`backdrop-blur`) for true overlays (modals, the install banner, sheets) — not
  everywhere.
- **Motion.** Port the iOS named curves from `DexTheme.swift` (overlay fade,
  control press-spring, lift-spring, screen transition) into CSS/JS tokens.
  Every interactive surface gets a press state; screens cross-fade/slide
  consistently. Gate all of it behind `prefers-reduced-motion`.

## The transformations (what to actually change)

### A. Refine the chassis (keep the identity, calm the chrome)
`DeviceLayout.tsx`, `ChassisIsland/Lamp`, `DeviceBackPanel`, `DeviceFooter`,
`deviceFrame.ts`. Tighten proportions and bezel widths, soften the plastic
gradients toward a more premium matte, calm the lamp glows, and unify the corner
radii between the shell, the LCD, and the footer. On **desktop**, give the device
a considered stage (a soft ambient backdrop / vignette / subtle reflection) so it
reads as an intentional product shot rather than a tiny phone in black void.

### B. Modernize the in-LCD content (the big win)
The tile grids (`WebsitePortal.tsx`, `MainMenu.tsx`) and list/detail screens.
- Turn the flat color blocks into **modern cards**: neutral/tinted surface, one
  soft layered shadow, consistent radius, the category color as an *accent*
  (icon chip, top hairline, or gradient wash) rather than the whole fill.
- Icon in a rounded tinted container; **label in the clean sans**, single line,
  proper size — no more pixel-font wrapping.
- Add **press/hover** states (scale + shadow via the motion tokens).
- Apply the same card/spacing/type system to `EntryTile`, `EncyclopediaList`,
  `EntryDetail`, `PassportScreen`, `ChipFilterScreen`, `BookmarksScreen`.

### C. Typography pass across every screen
Swap all reading text and control labels to the sans scale; keep pixel/VT323 only
where it's a deliberate accent. Fix every awkward wrap.

### D. Motion & micro-interaction pass
Tile/button press springs, consistent screen transitions, a smoother marquee, and
tasteful entrance animations (respecting reduced-motion). This is what will make
it "feel more modern than it is."

## Sequencing (each step independently shippable)

1. **Foundations** — add font + tokens (type/color/spacing/radius/elevation/
   motion) to `index.css` + a token module. No visual rewrite yet; just the
   system. Ship.
2. **Card + type primitives** — build a `Card`/`Tile` primitive and apply the sans
   scale. Convert `WebsitePortal` and `MainMenu` first (highest-visibility). Ship.
3. **Chassis refinement** — proportions, materials, desktop stage. Ship.
4. **Screen-by-screen** — EntryTile → lists → EntryDetail → Passport → Chip
   filter → Bookmarks, applying the system. Ship in small batches.
5. **Motion pass** — press states, transitions, reduced-motion. Ship.

## Guardrails

- **Mobile-first**: the phone view is the primary surface; verify every change at
  ~390×844 before desktop.
- **Theme-aware**: honor the existing per-skin system and light/dark; define
  colors as tokens, never one-off.
- **Don't break parity or tests**: the catalogue/data and the `*.test.tsx` /
  coverage / quiz-golden suites must stay green; this is a presentation-layer
  change only.
- **Accessibility**: maintain contrast (the retuned colors must pass AA on their
  surfaces), keep hit targets ≥44px, and gate motion behind `prefers-reduced-
  motion`.
- **Verify visually every step** (see the companion prompt): build → headless
  screenshot at mobile + desktop → compare before/after. Don't rely on typecheck
  alone for a design change.
- **Keep it iOS-honest**: when in doubt about a treatment, match what the iOS app
  does (`vinodex-ios` `DexTheme.swift` and the SwiftUI screens) — same identity,
  cleaner execution is the whole goal.
