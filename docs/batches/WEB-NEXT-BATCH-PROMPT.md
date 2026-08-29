# Vinodex-web — next batch prompt (with proper versioning)

Copy below the line into a Vinodex-web Cowork session. Companion context:
`VINODEX-WEB-SESSION-BRIEF.md` (project, status, tools, gotchas) and
`UI-MODERNIZATION-PLAN.md` (design direction). This batch (1) makes versioning
cheap and mandatory, then (2) runs the next work through that release discipline.

---

## 0. Setup (see the session brief for detail)

- Repo `blaikooz/vinodex-web`, work on **`testing`** off the **latest**
  `origin/master`/`origin/testing` (v0.4.2, moves fast — fetch first). Release
  branch `master`. Push requires the repo be in the session's authorized git-proxy
  sources; if blocked, hand Harrison a `git bundle` (don't fight it with tokens).
- Prefer the **desktop bridge** to work the copy on his Mac
  (`~/Desktop/vinodex-web-master`) when his app is open; otherwise a sandbox clone.
- Gate before every commit: `npx tsc --noEmit` (ignore pre-existing `*.test.tsx`),
  `npx vitest run`, `npm run build`. Commit footer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## 1. TASK A — Proper versioning (do this FIRST; it gates the rest)

The mechanism already exists and is good — **respect it, don't reinvent it**:
- `web/src/services/appVersion.ts` → `APP_VERSION` is the **single source of
  truth** (3-part semver). `appVersion.test.ts` pins `APP_VERSION` ==
  `package.json` version == display form.
- `web/src/services/webChangelog.ts` → authored release history;
  `webChangelog.test.ts` enforces **the current `APP_VERSION` has an entry**.
- `shared/data/firmware.ts` is the **device** firmware line (shared with iOS, the
  BIOS POST) — **separate** from the web shell version. Do not conflate them.
- Releases are tagged `v<version>`; `vite.config.ts` injects a commit-count build
  stamp (a build stamp, not the release number).

**What to add — make bumping a release a single cheap step** (the whole reason it
went stale is that bumping cost effort):

1. A **release script** (`scripts/release.ts` + an npm `release` script) that, given
   a bump type or explicit version: updates `APP_VERSION` in `appVersion.ts` **and**
   `package.json` in one shot; requires a `webChangelog.ts` entry for the new
   version (fail if missing); runs `appVersion.test.ts` + `webChangelog.test.ts`;
   prints the exact `git tag v<version>` command to run after merge. Keep it
   dependency-light (esbuild-to-node or vite-node, per repo convention).
2. A short **`RELEASING.md`** (repo root) documenting the semver policy below and the
   one-command flow, so any agent/human releases the same way.
3. **Semver policy for the web shell** (write it into RELEASING.md):
   - **patch** (`0.4.x`): fixes, copy, perf, a11y, analytics/infra wiring — no new
     user-facing surface.
   - **minor** (`0.x.0`): a new screen/route, a visible redesign, a new feature or
     facet.
   - **major** (`1.0.0`): the v1 launch (Phase 3), and thereafter breaking IA/UX
     changes.
4. **CI/verify hook**: ensure `vitest` (which includes the two version tests) is the
   gate — a version bump without a changelog entry must fail the suite.

**Cut a release for Task A itself** once the tooling lands (patch bump, e.g.
`0.4.3`, changelog entry: "release tooling + versioning policy").

## 2. TASK B — the next work, each shipped as a proper versioned release

Pull the exact scope from the TickTick board (project `💻Vinodex Web`,
`6a8d22a68f087c81d0daf521`) — these map to **Phase 1** and the cheap **Phase 3**
gate items. Do them in small, independently-shippable batches; **each batch =
code + tests green + `APP_VERSION` bump + changelog entry + `v<version>` tag**.

1. **Design foundations (Phase 1)** → suggest **minor → `0.5.0`**.
   Clean variable sans + type scale + spacing/radii + soft-elevation + motion
   tokens (port iOS named curves); a `Card`/`Tile` primitive; convert
   `WebsitePortal` + `MainMenu` hero screens to it (accent color, not full-fill;
   labels in the sans, fix pixel-font wraps). Presentation-layer only — keep
   data/coverage/quiz-golden green. Verify with headless screenshots at 390 + 1280.
   Changelog entry names the visible change ("modern type + card system; restyled
   home").
2. **/privacy + terms route** → **minor → `0.6.0`** (new route). Currently missing;
   `/support` exists — mirror it in `appRoutes.ts` (`SITE_EXACT`). Required for App
   Store + PWA.
3. **Wire privacy-friendly analytics** → **patch → `0.6.1`** (infra). Vercel
   Analytics / Plausible / Umami + the core funnel events (landing view → open-app →
   install-nudge click → store tap).

After each release: mark the matching TickTick subtask complete
(`mcp__TickTick__complete_task`), and add any newly-found work as a dated subtask
under the right phase. Report the version shipped.

## 3. Definition of done for the batch

- `scripts/release.ts` + `RELEASING.md` exist; bumping is one command and a version
  without a changelog entry fails `vitest`.
- Task A released (~`0.4.3`); design foundations (~`0.5.0`), privacy route
  (~`0.6.0`), analytics (~`0.6.1`) each shipped with matching changelog + `v<tag>`.
- `tsc` + `vitest` + `build` green throughout; data/coverage/quiz-golden untouched
  by the UI work.
- Device `firmware.ts` NOT touched by any web-version bump (they're separate lines).
- TickTick updated; before/after screenshots for the UI change.
- If push is authorized: `testing → master` fast-forward + push the tags; else hand
  over a bundle and list the tags to create.

## 4. Reminders (full list in the session brief)

- Sandbox can't reach `vinodex.vercel.app` (egress-blocked) — local `npm run
  preview` or Claude-in-Chrome only. Chromium at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (`--no-sandbox`).
- Catalogue is at full iOS parity (446); the two ripple patterns (coverage counts,
  quiz goldens; flavours pinned at 106) apply to any data change — but this batch is
  UI + routes + infra, so it shouldn't touch data.
- v1 (Phase 3, ~Sep 15) is the `1.0.0` release; Phase 6 closes with `1.1.0`.
