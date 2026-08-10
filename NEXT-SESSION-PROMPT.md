# Vinodex-web ↔ iOS parity — next session prompt

Copy everything below the line into a new Cowork session. **Before sending it**, make
sure the two repo resources named in step 0 are authorized for the session (that is the
one thing this session could not do itself — it's why 20+ finished commits are still
sitting unpushed).

---

## 0. Repo resources to authorize first (do this in the Cowork UI, not in chat)

Add both of these to this session's **sources / git-proxy authorized repositories**, with
**write (push)** access on the web repo:

- `blaikooz/vinodex-web` — the web PWA I'm working on (push target).
- `blaikooz/vinodex-ios` — the iOS app, used **read-only** as the parity reference.

If either isn't authorized, cloning and pushing will fail with
"…is not in this session's authorized repository set", and the whole task stalls. Confirm
both are added before continuing.

Also: a GitHub personal-access-token was exposed in an earlier chat. **Rotate it** and do
not paste any token into chat — rely on the authorized git proxy for auth.

## 1. What this is

`vinodex-web` is a retro, "wine-tasting handheld" PWA (React 19 + TypeScript + Vite +
Tailwind v4, deployed on Vercel at `https://vinodex.vercel.app/`). It's the browser twin
of the `vinodex-ios` app and is meant to be the **top of the acquisition funnel** — the
link you send someone so they can play instantly in a browser, then get nudged to install
iOS. Shared entry IDs are identical across platforms (G###, R###, S###, FLAVOR-*, CONT_*),
so shared/deep links resolve on both.

The reference is `vinodex-ios` at `origin/main` (**v0.8.94**, commit `a7ff9f9`). The web
has been catching up to it batch by batch.

## 2. Branch + workflow rules (follow exactly)

- Clone both repos. Do **all** work on the web repo's `testing` branch; the release branch
  is **`master`** (not `main`). When a batch is verified, fast-forward `testing` → `master`
  and push both.
- **First action once authorized:** push the existing backlog. `testing` is ~20+ commits
  ahead of `master` from prior sessions (dial menu, BIOS boot, acquisition funnel, 12-facet
  filter, passport tiers, region-dot fixes, and full catalogue parity). Verify it builds,
  fast-forward `master`, and push before starting new work.
- TypeScript is strict (`noUncheckedIndexedAccess`, `noUnusedLocals`): use `!` assertions,
  remove unused imports.
- Verify every change with: `npx tsc --noEmit` (filter pre-existing failures with
  `grep -vE "\.test\.tsx"`), `npx vitest run`, and `npm run build`. Commit only when all
  three are green.
- Node data scripts: run TS directly with `node --experimental-strip-types file.mjs`, or
  regenerate quiz goldens with `npx vite-node`. Clean up any temp `_*.ts`/`_*.mjs` after.
- Commit-message footer to use on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```
- **Budget discipline:** weekly usage is nearly exhausted (~2%). Be economical — prefer
  bounded, verifiable, single-file changes; avoid re-reading large files; don't screenshot
  unless a change is purely visual and untested by the suite.

## 3. Two ripple patterns you WILL hit on any catalogue/data change

1. **Coverage counts** (`web/src/services/coverage.test.ts`) pin per-category counts and
   the total. Update them when you add/remove entries.
2. **Quiz determinism golden** (`web/src/services/quiz.test.ts`) pins two "papers" for
   fixed seeds. Any change to the grape/region/style pools shifts the deterministic walk.
   Regenerate with a throwaway script that calls `quizQuestion(all, n, seed, 'ENTHUSIAST')`
   for seeds 777 and -13, n=0..9, and paste the new rows in. (Adding grapes shifts the
   whole walk; adding only regions/styles shifts just that question type.)
   Also: flavours are **derived** from grape tasting notes and pinned at 106 — before
   importing grapes, confirm their notes already exist among the 106 (else the count and
   flavour IDs move).

## 4. Current state (as of the handoff)

**Catalogue parity is COMPLETE** — all five counted categories match iOS main to the entry
(GRAPES 177, REGIONS 124, STYLES 33, FLAVORS 106, CONTINENTS 6; total **446**). The full
roadmap and a parity scoreboard live in `IOS-PARITY-v6.md` at the repo root — **read that
first**; it tracks what's done and what's left.

Done in prior sessions: dial main menu, BIOS boot, acquisition funnel (shareable entry
URLs + per-entry OG prerender + iOS install nudge), the full 12-facet chip filter (incl.
the SHELF facet), passport rank tiers, animated growth wave, region map-dot sync, and the
region/style/grape catalogue imports.

## 5. What to do this session

1. **Authorize repos (step 0), then push the backlog** (step 2) — this is the highest-value
   action; a lot of finished work is trapped.
2. Then continue down `IOS-PARITY-v6.md`, picking the next highest-value bounded items.
   Good candidates, roughly in priority order:
   - **Item 18** — import iOS's numeric `grapeCharacteristics` directly instead of deriving
     bars from text labels (also closes the last ~5 grape tannin-bar mismatches). Medium,
     high value, well-scoped.
   - **Item 19** — grape lineage/parentage graph on the grape detail page (iOS ships
     `lineage` data in `entries.json`; locate the web equivalent or import it).
   - **Item 9** — quiz "clue economy" (spend to reveal hints) in `TastingQuizScreen`.
   - **Item 3/4** — chrome polish: footer-cap/cog/home-lip re-cut, recessed lamps, scripted
     marquee.
   - Larger/deferred (scope with the user before building): Shop/cartridges (15), Device
     Workshop (16), Label Scan (17).
3. Work in small, independently-committable batches. After each: tsc + vitest + build green,
   commit to `testing`, fast-forward `master`, push.

Ask me one or two clarifying questions only if genuinely blocked; otherwise proceed
economically and report what you shipped.
