# Vinodex-web — next batch (Claude Code / VS Code)

Paste below the line into **Claude Code inside VS Code**, working the local repo
at `H:\vscode-projects\HGapps\vinodex-web`. Repo-root context to read first:
`VINODEX-WEB-SESSION-BRIEF.md`, `UI-MODERNIZATION-PLAN.md`, `RELEASING.md`.

---

You are working the **Vinodex-web** repo in VS Code (`H:\vscode-projects\HGapps\
vinodex-web`), branch `testing`, currently **v0.6.10**. This is a normal local
checkout with your own git credentials — pushes work (no Cowork proxy). A parallel
worker also pushes to `origin/testing`, so **always `git fetch` + reconcile before
you push**, and land work as small commits/releases, not one big drop.

## Direction & non-negotiables

- Product: a retro-handheld wine PWA, **top of the funnel** for the TestFlight iOS
  app. UI direction: **sleek modern app on the screen, refined retro chassis as the
  shell** (see UI-MODERNIZATION-PLAN.md). iOS is the identity anchor.
- **Versioning: keep going along the path — do NOT stop at 1.0.0.** Every shippable
  change is a release via `npm run release` (bumps `APP_VERSION` + `package.json`,
  requires a `webChangelog.ts` entry, runs the version tests, prints the `v<ver>`
  tag). The **two-clocks rule** is real: the device `firmware.ts` line owns some
  numbers (e.g. it refused `0.6.2`), so if the release tool rejects a version, take
  the next free one it allows — don't fight it, and never touch `firmware.ts` for a
  web bump.
- **Gate every commit:** `npx tsc --noEmit` (ignore pre-existing `*.test.tsx`),
  `npx vitest run`, `npm run build` — all green. Data/coverage/quiz-golden stay
  green (this batch is UI + routes + infra; don't touch catalogue data).
- **Verify UI visually:** `npm run build && npm run preview`, then Playwright
  screenshots at **390×844** and **1280×800** (run `npx playwright install
  chromium` once if needed). You can also open the live/preview URL directly — this
  machine has normal network access.
- Commit footer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## The batch (each item ships as its own versioned release)

**1. Audit the core screens first (decide the real work).**
The Card/type design system, Inter, and motion tokens already exist (`Card.tsx`,
`IOSGridTile.tsx`, `designTokens.test.ts`). Audit whether the browse screens
actually use them: `EntryTile`, `EncyclopediaList`, `EntryDetail`, `PassportScreen`,
`ChipFilterScreen`, `BookmarksScreen`. Write a short findings note (which are on the
new system, which are still flat). **Then convert only the flat ones** — accent
color not full-fill, labels in the sans (fix pixel-font wraps), consistent
spacing/radius/soft-elevation, press states. Screenshot before/after. Ship in 1-2
releases (e.g. EntryTile+lists, then detail/passport/chip/bookmarks).

**2. Funnel — Substack-subscribe conversion (NOT an App Store link).**
iOS is TestFlight-only, so the nudge converts to **"Subscribe on Substack for
updates"** (you'll post the TestFlight invite to subscribers later). Sharpen the
landing hero to one value line + one primary CTA, keep browser-play frictionless,
and turn the install nudge into a Substack-subscribe prompt. **Reuse the tap-gated
Substack embed from v0.6.10** — load the third-party iframe only behind an explicit
tap, and keep the PRIVACY + TERMS copy honest (name the one opt-in exception). Defer
the real App Store URL + `apple-itunes-app` smart banner until the app is public;
leave a one-line TODO where the URL will go.

**3. SEO.**
Per-route OG/Twitter meta on the site routes (entry OG prerender already exists);
add `sitemap.xml` and `robots.txt`. Verify a shared site URL previews correctly.

**4. PWA + master-search verification.**
PWA (vite-plugin-pwa) and master search (orb → `MASTER_SEARCH`) are coded — verify
the install prompt fires, offline actually serves, and search facets/recents behave;
fix gaps you find. Note anything that needs real-device testing.

**5. Accessibility + 404/offline states.**
Contrast passes AA on the new surfaces, hit targets ≥44px, motion gated on
`prefers-reduced-motion`; add proper **404** and **offline fallback** screens.

## Tracking

The roadmap lives in Harrison's TickTick "💻Vinodex Web" board. If a TickTick MCP is
configured in this Claude Code, mark the matching subtasks complete as you finish
them and add any newly-found work. If not, **list the completed items + any new
tasks at the end of your run** (with the version each shipped in) so they can be
synced to the board.

## Definition of done

- Core-screen audit note written; flat screens converted and screenshotted.
- Funnel nudge = Substack subscribe (privacy-honest, tap-gated); hero sharpened;
  App Store URL left as a documented one-line swap.
- `sitemap.xml` + `robots.txt` + per-route meta live; PWA/offline/search verified;
  a11y + 404/offline shipped.
- Each piece shipped via `npm run release` with a changelog entry and `v<ver>` tag;
  `tsc`/`vitest`/`build` green throughout; `firmware.ts` untouched.
- `origin/testing` reconciled and pushed; completed/added tasks reported for TickTick.
