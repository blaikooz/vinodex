# Vinodex-web — UI modernization batch prompt

Copy everything below the line into a new Cowork session. Companion doc:
`UI-MODERNIZATION-PLAN.md` (read it first — it has the full rationale, the
before-problems, and the token system). This prompt is the executable brief.

---

## 0. The brief

Make `vinodex-web` feel like a **sleek, modern app running inside a refined
retro handheld chassis.** Keep the red device frame as the signature (refine it —
don't remove it), but modernize everything *on the screen* to a clean, premium,
modern-app aesthetic. Reference feel: Playdate hardware + Linear/Arc-grade
software polish. The iOS app (`vinodex-ios`, `DexTheme.swift`) is the identity
anchor — same look, cleaner execution. Retro (pixel font, LCD green) becomes an
accent, not the whole voice.

Read `UI-MODERNIZATION-PLAN.md` for the north star, the specific problems to fix,
and the design-foundation tokens. Follow its sequencing.

## 1. Setup & workflow

- **Repo:** `blaikooz/vinodex-web`. Work on `testing`; release branch is
  `master`. To push, the repo must be in this session's **authorized git-proxy
  sources** (else push 403s). There may be a parallel `origin/testing` line —
  land this as a new branch + PR or rebase onto `origin/testing`, don't force over
  it. Base off the **latest `origin/master`** (v0.3.0+), not an old commit.
- **Verify green before every commit:** `npx tsc --noEmit` (ignore pre-existing
  `*.test.tsx` failures), `npx vitest run`, `npm run build`.
- This is a **presentation-layer** change: the catalogue data, coverage counts,
  and quiz-golden tests must stay green — don't touch data or logic.
- Commit footer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## 2. Verify VISUALLY every step (mandatory for a design task)

Typecheck is not enough. After each batch:
1. `npm run build && npm run preview -- --port 4188 --strictPort`
2. Drive `http://127.0.0.1:4188/` with `playwright-core`
   (`executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`,
   `args:['--no-sandbox']`) at **390×844 (mobile, primary)** and **1280×800
   (desktop)**. Screenshot the portal/landing, the main menu, a list, and an
   entry detail. Read the PNGs back and judge them against the plan.
3. Keep before/after screenshots so the owner can see the change.
- NOTE: the sandbox can't reach the live `vinodex.vercel.app` (egress-blocked),
  so local preview is the way. If **Claude in Chrome** is connected, also point it
  at the live URL. Confirm which branch is deployed before assuming anything about
  the live site.

## 3. Order of work (each step ships independently)

**Step 1 — Foundations (no visual rewrite yet).** In `web/index.css` `@theme`
plus a new `shared/` token module: add a clean variable sans (Inter or Geist via
the existing Google-Fonts `@import`) for all reading text/labels; define a type
scale, a spacing scale, 2–3 radii, a 3-tier soft-elevation system, and motion
tokens ported from the iOS named curves in `vinodex-ios/Sources/VinodexUI/
DexTheme.swift`. Retune the category hues (lower chroma one step; add surface/
subtle/border/solid tint ramps per hue; add a neutral surface ramp) while keeping
dex-red + LCD-green identity and the per-skin system (`stylePalette.ts`,
`ChassisSkin`). Commit.

**Step 2 — Card/type primitives + the two hero screens.** Build a reusable
`Card`/`Tile` primitive: neutral/tinted surface, one soft layered shadow,
consistent radius, category color as an *accent* (icon chip / top hairline /
gradient wash) — not the whole fill; icon in a rounded tinted container; label in
the clean sans, single line; press/hover states via the motion tokens. Convert
`web/components/WebsitePortal.tsx` and `MainMenu.tsx` (highest visibility). Fix
every pixel-font wrap. Screenshot, commit.

**Step 3 — Chassis refinement.** `DeviceLayout.tsx`, `ChassisIsland.tsx`,
`ChassisLamp.tsx`, `DeviceBackPanel.tsx`, `DeviceFooter.tsx`, `src/services/
deviceFrame.ts`: tighten proportions/bezels, soften plastic gradients toward
premium matte, calm the lamp glows, unify corner radii (shell ↔ LCD ↔ footer). On
desktop, add a considered stage/backdrop so it's not a tiny phone in a black
void. Screenshot, commit.

**Step 4 — Screen-by-screen system rollout.** Apply the card/spacing/type system
to `EntryTile.tsx`, `EncyclopediaList.tsx`, `EntryDetail.tsx`, `PassportScreen.
tsx`, `ChipFilterScreen.tsx`, `BookmarksScreen.tsx`. Small batches, screenshot
each, commit.

**Step 5 — Motion & micro-interactions.** Press springs on tiles/buttons,
consistent screen transitions, smoother marquee, tasteful entrance animations —
all gated behind `prefers-reduced-motion`. Screenshot, commit.

## 4. Guardrails / definition of done

- Mobile (~390px) is the primary surface — verify there first, every step.
- Reading text and control labels use the clean sans; pixel/VT323 only as
  deliberate accents; no awkward wraps remain.
- Cards use the token system (surface + soft elevation + consistent radius +
  accent color); no raw max-chroma blocks or hard offset shadows left on the
  main surfaces.
- Chassis identity preserved but refined; desktop has a considered stage.
- Per-skin theming and light/dark still work; retuned colors pass AA contrast on
  their surfaces; hit targets ≥44px; motion respects reduced-motion.
- `tsc` + `vitest` + `build` green; data/coverage/quiz-golden untouched.
- Before/after screenshots captured at mobile + desktop for each step.
- Commits on `testing`; new branch + PR if the repo is authorized to push.

## 5. Taste guidance (so it doesn't drift generic)

- Restraint over decoration. One accent per card, one soft shadow, real
  whitespace. If it looks like a crypto dashboard, pull back.
- The retro identity should feel *intentional and premium*, like good hardware —
  not stripped away, and not laid on thick. When unsure, do what the iOS app does.
- Motion should be felt, not seen: short, springy, purposeful.
