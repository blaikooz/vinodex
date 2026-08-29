# Vinodex-web — PREMIUM RETRO direction + batch (Claude Code / VS Code)

Paste below the line into **Claude Code in VS Code** (`H:\vscode-projects\HGapps\
vinodex-web`, branch `testing`). Mechanics (git reconcile-before-push, `npm run
release` + two-clocks rule, verify-first) are in `WEB-BATCH-ROAD-TO-1x.md` and
`VINODEX-WEB-SESSION-BRIEF.md` — this prompt is the **design direction** and the
work that follows from it.

> **This SUPERSEDES the font guidance in `UI-MODERNIZATION-PLAN.md`.** That plan
> said to swap reading text to a clean sans. The owner has reversed that: **the
> retro type stays, everywhere.** Follow this document where the two disagree.

---

## The north star: PREMIUM RETRO

Think **Playdate / Teenage Engineering**: crisp, intentional, beautifully made —
but unmistakably a retro device. **Modern *execution*, retro *soul*.** The test for
every change: *does it still read as the handheld, or does it start to look like a
generic modern web app?* If the latter, pull back. Nothing here is about making it
"less retro" — it's about making the retro **excellent**.

### Type is sacred — ALL RETRO, ALWAYS
- **Press Start 2P** for headings, labels, chrome. **VT323** (the readable terminal
  font, `--font-mono` in `index.css`) for body and reading text. **No sans font
  anywhere.**
- **Revert the Inter that shipped** (task 1): remove the Inter import/bundle and any
  `font-sans`/Inter class usage; route reading text back to VT323, headings to Press
  Start. Update `designTokens.test.ts` / any font test to pin "no sans; VT323 body,
  Press Start headings."
- Make VT323 **read well** rather than swapping it out: it's crisp at larger sizes,
  so bump body size / line-height / letter-spacing until paragraphs are comfortable.
  If a truly dense legal block still fights you, the fix is size/spacing/leading — not
  a different font.

### What "modernize" means here (all four are welcome, in service of retro)
- **Spacing & layout** — the safest, highest-impact lever: real breathing room,
  alignment to a grid, clear hierarchy. Most of the "cleaner" feeling comes from here.
- **Depth & materials** — soft, layered shadows and subtle gradients for a premium
  feel, **but keep the chunky pixel borders, hard retro shadows, scanlines, and LCD
  treatment where they define the look.** Blend modern softness with retro edges;
  don't replace one with the other.
- **Motion** — smoother transitions + micro-interactions (press feedback, screen
  changes). Keep it **snappy and a little pixel-y**, not glossy/floaty; stepped or
  quick easings read more retro than long smooth ones. Gate on `prefers-reduced-
  motion`.
- **Color refinement** — calm the palette a step so it feels premium not garish, but
  **keep the retro hues, dex-red, and LCD-green** as the identity. Retune saturation;
  don't re-hue.

### Hard "don't"s (these keep it retro)
- No sans font. No flat minimalist "SaaS card" look. Don't remove the pixel borders,
  scanlines, LCD screen, chassis, lamps, or marquee. Don't round everything into soft
  modern cards — chunky corners are part of the identity. Don't trade the CRT/LCD
  vibe for clean white space.

## The batch (each item ships via `npm run release`)

1. **Revert Inter → all-retro type** (see above). Re-flow body copy to VT323 at a
   comfortable size; verify every screen still reads well. This is the headline
   change — screenshot heavy text screens (EntryDetail, privacy, passport) before/
   after at 390 + 1280.
2. **Premium-retro polish, screen by screen** — apply spacing/layout + depth +
   color-refinement + motion to the browse screens (`EntryTile`, lists,
   `EntryDetail`, `Passport`, `ChipFilter`, `Bookmarks`) and the landing, **keeping
   every retro signifier**. Audit first: note what already looks good vs. crude, then
   lift the crude ones. Small releases, before/after screenshots each.
3. **Screensaver color effect — iOS parity (mobile especially).** iOS's screensaver
   bounces the pixel wordmark and **gives it a new hue from a palette on every wall
   bounce** (DVD-logo style), drawn pixel-crisp with hard edges (`.interpolation
   (.none)`). The web (`ScreensaverOverlay.tsx`) currently bounces `/vinodex-logo.png`
   at a fixed color with no recolor. Match iOS: recolor the mark on each bounce from
   the **same palette**, deriving the palette index deterministically from the bounce
   count (the bounce/triangle-wave math already exists in the screensaver service —
   hook the color to it so it can't drift). Keep it **pixel-crisp** (`image-
   rendering: pixelated`, hard edges) and retro — a tintable/hue-shifted mark is fine
   given the iOS two-layer art wasn't transported to web (v6#2). Verify on a mobile
   viewport that the color changes on every bounce and stays crisp.
4. Fold in the still-open v1-gate items from `WEB-BATCH-ROAD-TO-1x.md` as you touch
   the relevant surfaces (SEO meta/sitemap/robots, PWA + search verify, a11y +
   404/offline, the Substack-subscribe nudge) — but the **retro-type revert + premium
   polish is the priority of this batch**.

## Guardrails & done
- Verify visually every step: `npm run build && npm run preview`, Playwright
  screenshots at **390×844** and **1280×800** (`npx playwright install chromium`
  once). The bar is "still obviously the device, now crisper."
- `npx tsc --noEmit`, `npx vitest run`, `npm run build` green each commit; the font
  test now pins all-retro; catalogue data/coverage/quiz-golden untouched.
- Keep shipping along the version path (no 1.0.0 stop); `npm run release` per piece,
  respect the two-clocks rule, never touch `firmware.ts`.
- Reconcile `origin/testing` before pushing. Report completed + new tasks (with the
  version each shipped in) for the TickTick "💻Vinodex Web" board.
