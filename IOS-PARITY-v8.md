# Web ↔ iOS parity plan — v8 (the site is the door)

_Follows `IOS-PARITY-v7.md`. This is **not a parity sweep**, and that is the
first thing to say about it: it is a **product-level rework of the entry
model**, ruled by the user and executed on `testing` from `e5b4689` (= `master`
= tag `v0.2.2`), 2026-08-20. Nothing here was measured against
`vinodex-ios`, because none of it has a Swift counterpart to be measured
against — iOS has no company site, no `/` fork, no access code and no notion of
"opening the app from somewhere else". The whole subject of this document is
web-only surface._

_Severity words are unchanged from v5–v7: **cosmetic** (a glyph/word), **minor**
(layout/order/copy), **moderate** (a missing control or section), **structural**
(a screen or system that does not exist here). They are used below to grade the
*size of each change*, since there is no gap being closed._

> **A new document rather than a v7 section.** v7 is eleven sections and 1,100
> lines of parity execution against iOS v0.9.2, and its Status block is a
> record of that. This changes what `/` *is*, retires two files, deletes a
> persisted key and rewrites nine pins; filing it as v7 §10 would bury a
> product ruling inside a parity sweep. Ids are per-document — cite them
> qualified (`v8#2`), and carried-forward ids keep their old spelling in
> parentheses.

---

## Status — one pass, executed and green (2026-08-20, on `testing`)

Gates, run in full on the committed tree:
**lint 21 warnings (cap 22) · typecheck clean · 616 tests / 55 files · build OK
(440 OG pages, 420 precache entries / 5,220 KiB) · check:refs zero dangling ·
playwright 127 passed.**

Vitest file count went 56 → 55: `UnlockScreen.test.tsx` and `appUnlock.test.ts`
deleted with the door they tested, `appRoutes.test.ts` added. Playwright gained
`site.spec.ts` (seven tests) and traded one BIOS test for three.

- **Done — all nine rulings:** v8#1 (the site becomes `/`, with redirects),
  v8#2 (the BIOS runs on every app entry), v8#3 (the access code is deleted),
  v8#4 (CLASSIC on the site), v8#5 (no screensaver on the site), v8#6 (the
  strapline goes), v8#7 (the bezel wordmark), v8#8 (the site marquee reads
  WELCOME), v8#9 (backing out returns to the site).
- **Deleted, properly:** `SplashScreen.tsx`, `UnlockScreen.tsx` +
  `UnlockScreen.test.tsx`, `appUnlock.ts` + `appUnlock.test.ts`,
  `useAppUnlock.ts`, the `unlockedAppIDs` storage key and its `keep`
  justification, the `booted` session key, the WEBSITE ACCESS settings section,
  `UNLOCK_CODE`, and `DeviceLayout`'s dead `showWordmark` prop.
- **Added:** `web/src/services/appRoutes.ts` (+ its test),
  `web/e2e/site.spec.ts`, `enterDex` in the e2e fixtures,
  `theme.skinCssVars` / `SITE_SKIN`.
- **Pins rewritten, not relaxed:** nine. Each is listed in §5 with why the new
  one is at least as strong.
- **Version:** **v0.3.0**, with an authored changelog entry; 0.2.2 promoted to
  `PREVIOUS`. Minor rather than patch because the entry model changed.
- **Not done, deliberately:** §6.

---

## 1 · The model

Before: `/` was a splash that forked to DEX or WEBSITE. The dex was the
product; the company portal was a side door at `/website`; an access code
stood between the portal and the app.

After: **the company site IS the landing experience, and Vinodex is an app you
open from within it.** The device chassis stays throughout — on the site it is
Horizon/Godot's device sitting on the desk, and opening Vinodex boots it.

The one piece of machinery this needed is
**`web/src/services/appRoutes.ts`**: two positive lists (site paths, dex
paths) and one pure `bootDecision(from, to)`. Five behaviours now ask "which
side of the line is this path on" — the BIOS, the chassis skin, the
screensaver, the bezel wordmark and the marquee — and asking it five times in
five components is how those five drift apart.

The lists are **positive on both sides**, which is not incidental. Under a
negative rule (`isDex = !isSite`) a mistyped URL is a dex path, so a visitor
who fat-fingered `/gapes` would get a 3.4-second power-on test and then be
dropped on the studio home — a boot for a screen they never reached.
`appRoutes.test.ts` reads `App.tsx`'s route table and fails if any `path=` in
it is on neither side, or on both, or if a classified prefix names no route.

---

## 2 · The nine rulings, as executed

| # | Ruling | Severity | Landed in |
|---|---|---|---|
| v8#1 | Portal moves to `/`; `/website/*` keeps working | **structural** | `App.tsx:566-620`, `WebsitePortal.tsx`, `appRoutes.ts` |
| v8#2 | BIOS on every dex entry, never on the site | **structural** | `App.tsx:282-310`, `appRoutes.ts:bootDecision` |
| v8#3 | Drop the access code; keep the Vinodex tile | **structural** | `WebsitePortal.tsx`, `storageKeys.ts`, `SettingsPanel.tsx`, 5 files deleted |
| v8#4 | The site is always CLASSIC | **moderate** | `theme.ts:skinCssVars`, `DeviceLayout.tsx:83-92` |
| v8#5 | No screensaver on the site | **moderate** | `App.tsx:369-400` |
| v8#6 | No strapline under the studio title | **cosmetic** | `WebsitePortal.tsx:151` |
| v8#7 | Bezel reads `HORIZON/GODOT` on the site | **cosmetic** | `DeviceLayout.tsx:286-306` |
| v8#8 | Site marquee reads `WELCOME` | **minor** | `DeviceFooter.tsx`, `DeviceLayout.tsx` |
| v8#9 | Back past the menu returns to the site | **minor** | `App.tsx:handleBack`, `MainMenu.tsx` |

### v8#1 — the site becomes `/`

The whole `/website` subtree moved up a level: `/`, `/apps`, `/project/:id`,
`/who-we-are`, `/contact`. Every v0.2.x spelling still resolves —
`<Navigate replace>` for the four flat ones, and a `LegacyProjectRedirect`
component for `/website/project/:id` so the id is *carried across* rather than
dropped by a flat redirect to `/apps`. `replace` on all of them, so Back does
not bounce off a dead URL forever. `/website/unlock` goes to `/dex`: that
link's entire purpose was to get into the app, and nothing stands in the way
now.

**What it did to the build artifacts, checked rather than assumed:**

- **The 440 prerendered OG pages: untouched.** `scripts/prerender-og.ts` only
  ever writes `dist/detail/<id>/index.html`, and `/detail/:id` did not move.
  Verified by build: `prerender-og: wrote 440 entry OG pages`.
- **`index.html`'s canonical/og:url: `og:url` is still `/` and still correct**
  — same URL, different contents. What *was* wrong afterwards is the card
  itself: the shell's `<title>`, description and OG/Twitter titles described
  the encyclopedia, and `/` is now the studio. Those are updated to
  HORIZON/GODOT, and `og:site_name` with them. The per-entry tags are injected
  into a *copy* of this file at build time, so the 440 share cards keep their
  own titles and are unaffected.
- **`apple-mobile-web-app-title` and the manifest still say VINODEX**, on
  purpose: `start_url` is `/dex`, so the installed PWA *is* the app. The site
  is the studio; the installed thing is Vinodex. (That start URL is a cold
  arrival on a dex route, so it boots — which is right: tapping the icon is the
  clearest "open Vinodex" there is.)
- **The service-worker precache: unchanged, 420 entries / 5,219 KiB.** The
  `globPatterns` are extension-based over `dist/`, and no file moved into or
  out of the glob. Note the precache is computed by `vite build` *before*
  `postbuild` runs, which is why the 440 detail pages have never been in it —
  pre-existing, correct, and worth writing down because it looks like an
  omission.
- **`App.tsx`'s deep-link handling:** the only in-app fallback that pointed at
  the old tree was `ProjectRoute`'s `Navigate to="/website/apps"`, now `/apps`.
  The catch-all still lands on `/`, and now cannot boot on the way through: an
  unknown path is in neither list, so `bootDecision` declines it.

### v8#2 — the boot, and the deep-link decision

The old model: `booting` initialised from `!sessionStorage.booted`, suppressed
for `/detail/` and `/website`, and the flag written on completion. That is
"boot is something that happens to you once when you show up".

The new model: **boot is what happens when you open the app.**
`bootDecision(from, to)` is three lines and one exception:

1. `to` is not a dex path → never.
2. Cold load (`from === null`) onto a dex path → **boot**, except `/detail/:id`.
3. Warm navigation → boot only if `from` was *not* a dex path.

Two trips in and out of the app in one page-load boot twice. The session flag
is deleted rather than defaulted: there is no longer a fact for it to remember.

**The deep-link decision, and the reasoning — the answer is "no, they should
not boot", agreeing with the brief.**

`/detail/:id` is the app's share surface. 440 prerendered pages exist for
exactly these URLs, each with its own canonical link and unfurl card, built so
a stranger who taps a shared link lands on the entry. Putting a 3.4-second
power-on test in front of the thing they clicked is the classic
interstitial-before-content mistake, and this is the *one* route where an
arrival is reliably from outside. Every other dex URL is typed, bookmarked, or
the PWA's launch target — and all three of those are somebody opening Vinodex.

The half worth stating explicitly is what happens *after*: once they are there
they are inside the device, so nothing power-cycles under them mid-browse. A
related grape, a filter chip, Home to the menu are all in-app navigation.

**The considered alternative, and why it lost.** Treat a share page as *not
yet* inside the app, so the visitor's first step into the app proper boots it.
It is defensible — it means every visitor eventually meets the BIOS, and the
shared link reads as an advert for a device you then switch on. It was
rejected because `EntryDetail`'s own filter chips navigate to `/list/*`: under
that rule, tapping a flavour chip on a shared page power-cycles the device
mid-read. It also needs a third state (`outside` / `page` / `app`) where the
shipped rule needs none. The cost accepted is that a deep-link visitor may not
see the BIOS at all in that session — fine, because the BIOS is a launch
ceremony and they did not launch.

**The `setSuspended(booting, 'boot')` seam is untouched** and still means what
it meant: while the POST owns the device the professor holds his tongue, and
`showIntroCard` / the coachmark auto-start still carry their own `!booting`
because they draw above it. What changed is only *when* `booting` becomes
true — and it becomes true more often now, so the seam is exercised more, not
less.

### v8#3 — the door comes off

`UnlockScreen.tsx` was already unrouted before this pass — `/website/unlock`
mounted `UnlockVinodex`, a *second* keypad living inside `WebsitePortal.tsx`
that never called `unlockApp` at all. So the persisted `unlockedAppIDs` grant
was written by nothing a user could reach, and the SETTINGS → ACCESS readout
that reported it was reporting a flag no one could set. Both keypads, both
code constants, the store, its hook and its tests are deleted.

**`unlockedAppIDs`'s `keep` had to be revisited, and the answer was to delete
the entry, not to re-justify it.** Its note read: *"everything the device
remembers about you goes; what stays is the grant that let you in"*. There is
no grant. A key that records a permission nothing asks for is not a `keep`
with a stale reason — it is a key with nothing to record. `storageKeys.ts`'s
stated rule is reworded to **"everything the device remembers about you goes;
what stays is only what is not about you at all"**, which leaves exactly one
survivor (`installNudgeDismissed`, a fact about the *browser*). Anything still
sitting in a returning visitor's localStorage under the old name is inert: not
read, not wiped, and no more this app's business than any other origin's data.

`PROJECTS[0].locked` became `inApp`, which is the honest distinction and was
always the real one: every other row leaves for Substack, and this one opens an
app that is already here. CHECK IT OUT becomes **OPEN VINODEX** on that row,
because the button does not take you to another site.

### v8#4 — CLASSIC on the site, without fighting the theme system

`theme.skinCssVars(skin)` returns the chassis tokens as an inline style object,
and `DeviceLayout` spreads it onto the device stage when the route is a site
path. **Custom properties inherit**, so declaring them on one element shadows
`:root` for that subtree and for nothing else.

The two obvious implementations are both wrong and both were rejected:
`setSkin('CLASSIC')` *destroys the user's choice*; writing the `:root`
properties on entry and putting them back on exit is the same destruction with
a race in it — a reload on a site page strands the override as the stored
value. The scoped version has no state to get out of step, nothing to restore,
and `site.spec.ts` asserts the survival directly: with `chassisSkin=NOCTURNE`
stored, the site paints CLASSIC red while `:root` still resolves NOCTURNE's
`#C9F2BE` and localStorage still says `NOCTURNE`.

**Chassis only, deliberately.** The LCD palette, text scale and UI scale are
not overridden: a player who reads at LARGE text or in a monochrome screen
mode chose that for their eyes, and the device's *colour* is the only thing the
ruling is about.

The drawn cap sprites are the one thing that cannot inherit — they are an
image URL, `/art/caps/{SKIN}-{kind}.png` — so `DeviceFooter` takes the
effective skin id as a prop and stopped reading `useTheme()` itself.

### v8#5 — the screensaver, and what the marquee idle does on the site

The idle effect is gated on `isDexPath(location.pathname)`. A bouncing mark
taking over the studio's front page after a minute is the app's behaviour
appearing on a page that is not the app.

**The marquee's idle clock needed nothing, and here is why** (the brief asked
for a decision, and the decision is "it already does the right thing"):
`useMarqueeScript` arms its timers only when `title === 'VINODEX'`, i.e. the
dex main menu. It has therefore never run on a site screen, before or after
this pass — the shared `IDLE_ACTIVITY_EVENTS` list is *what counts as
activity*, not a second clock that runs everywhere. v8#8 then makes the site's
panel a constant string rather than a script output, so there is no state
machine on the site at all. The unified reckoning (v0.2.0, review L4) survives
intact for the dex, which is the only place it was ever meaningful.

### v8#7 / v8#8 — whose device it is

The lower bezel's engraved wordmark reads `HORIZON/GODOT` on the site and
`VINODEX` in the dex — one wordmark, two owners, and the fastest way to tell
at a glance which one you are holding. The marquee panel reads `WELCOME` on
the site.

The site's panel is an **override of the printed text**, not a second mode in
`marqueeScript.ts`. That is the point: the site never enters the state
machine, so it cannot consume the once-per-launch `WELCOME!` a player is owed
when they open the app. `marqueeTitles.test.ts` — the gate that every rendered
title has a panel or an accepted fallback — was extended to include the
override, which is a string the panel can show that a `title=` scan could not
see.

### v8#9 — the way out

Home is unchanged: an in-app control that lands on the dex menu. Back gained
one case. With history it is still `navigate(-1)`, which from `/dex` lands
wherever you came in from — the VINODEX splash, OUR WORK, the front page —
better than a fixed destination. Without history (`location.key ===
'default'`, a cold-opened URL) the fallback is `/dex` everywhere *except on the
menu itself*, where it is `/`: a cold-opened `/dex` is exactly the installed-PWA
case, and closing the app back onto the site it came from is the honest answer.

`MainMenu` gained `showBack` and an `onExit`; it had none before, because
under the old model Back would have landed on a fork nobody wanted to see
twice. SETTINGS' **EXIT TO SPLASH** is **EXIT TO SITE**.

---

## 3 · What was deleted, and what was checked before deleting it

| File | Checked |
|---|---|
| `components/SplashScreen.tsx` | Only referenced by `App.tsx:13/569`. Its `vinodex-logo.png` is **kept and still used** — `WebsitePortal`'s VINODEX row and project splash both draw it, and it is the favicon, the apple-touch-icon, the PWA icon and the OG image. |
| `components/UnlockScreen.tsx`, `.test.tsx` | Unrouted before this pass; only its own test imported it. |
| `services/appUnlock.ts`, `.test.ts`, `useAppUnlock.ts` | Consumers were `SettingsPanel`'s WEBSITE ACCESS section (deleted) and the two test fixtures (rewritten). |
| `WebsitePortal.UnlockVinodex`, `UNLOCK_CODE` | The `/website/unlock` route, now a redirect. |
| `DeviceLayout.showWordmark` | Dead since iOS v0.6.9 retired the island wordmark; the splash was its only caller. |

---

## 4 · The pins that were rewritten — nine, and why each is at least as strong

**None was relaxed, and none was deleted outright.** Where a pin asserted a
property of something that no longer exists, it was replaced by the property
that survives — in every case a strictly narrower claim.

1. **`storageKeys.test.ts` — "keeps exactly the two keys the rule allows"** →
   **"...the one key"**. The allowed list went from two entries to one, and
   `unlockedAppIDs` cannot be quietly re-added. Two *new* pins were added
   beside it: `ALL_REGISTERED_KEYS` may not contain `unlockedAppIDs` (the door
   returning without the ruling being revisited), and `SESSION_KEYS` must be
   empty (the once-per-session boot creeping back). Net: one weaker claim
   replaced by three stronger ones.

2. **`DeviceFooter.test.tsx` — "puts no dex destination on a portal screen"**.
   The old wording closed with *"...and offered a route around the unlock
   doorman from a page that is meant to be in front of it"*, and the premise
   check was `route.startsWith('/minigames') || route.startsWith('/settings')`
   — a hand-written list of two prefixes. There is no doorman, so that framing
   admits the answer *"it is fine, it goes through the door"*. The new pin
   states the property that actually matters — **no dex destination may appear
   on a site screen's chassis at all** — and states it over `isDexPath`, the
   same classifier the boot, the skin and the screensaver read. A lamp pointed
   at a *new* dex route now fails here without this file being edited; under
   the old spelling it would have passed.

3. **`DeviceFooter.test.tsx` — the mount helper** now passes `skin`, and a
   fifth case was added asserting the marquee override prints instead of the
   screen name. Pure addition.

4. **smoke: "the BIOS boots once a session and hands the device over"** →
   **"the BIOS runs on entering the app, and never on the site"** plus **"...
   again the second time you open the app"**. The old test's second half
   (`goto('/passport')`, expect no boot) *was* the `sessionStorage` contract,
   which is gone. The old test could not distinguish "booted once" from
   "booted never again", and said nothing about the site — where half the
   ruling lives. The replacement walks the real journey (site → OUR WORK →
   VINODEX → OPEN VINODEX → POST → `/dex`), asserts the site does not boot,
   asserts in-app navigation does not boot, and then asserts the *second*
   entry does — the claim the old model made impossible to state.

5. **smoke: a third new test, "a shared entry link does not boot the
   device"**, pins the deep-link exception and its aftermath. There was no pin
   on the old `/detail/` suppression at all.

6. **smoke: "the BIOS runs alone on a genuinely fresh device"** and **"a
   returning untoured player is not spotlit over the BIOS"** — both **kept,
   both still meaningful**, and both now reach the boot window *through* the
   model instead of around it. They used to depend on the seeds carefully
   omitting `booted`; now a cold arrival on `/dex` boots by rule, so the window
   they need exists by construction rather than by a fixture's restraint. The
   assertions inside them are unchanged.

7. **`SettingsSectionPanel.test.tsx` — "renders both tier sections"** →
   **"renders the tier section, and no longer a website gate"**. It now
   asserts the *absence* of WEBSITE ACCESS and of the RE-LOCK button, rather
   than dropping the mention. A heading reappearing would mean the door came
   back without the ruling being revisited.

8. **`marqueeTitles.test.ts`** — `UNLOCK` and `UNLOCK VINODEX` left
   `ACCEPTED_FALLBACKS` with the screens they named (the suite's own honesty
   check forced it, which is the check working), and `SITE_MARQUEE_TITLE` was
   folded into the scanned set. The gate's claim — *every* title the panel can
   show is mapped or listed — was previously false for the one string that is
   not a `title=` literal.

9. **e2e fixtures** — `seedDevice` lost `unlockedAppIDs` and `booted`;
   `seedFreshDevice` lost `unlockedAppIDs` and is now genuinely empty. The
   replacement for the `booted` seed is **`enterDex(page, route)`, which
   presses the real skip**. This is a strengthening and worth being explicit
   about: the old seed meant ~40 specs never rendered the BIOS at all, which
   is half of why the v0.2.0 layering fault could hide. Every one of those
   specs now walks through a real power-on on its way in.

**Pins deliberately left exactly as they were:** the 22-skin screenshot gate,
the footer-cap gate and the lamp gate all read `:root` and all run on `/dex`.
That is still correct and still the strongest available probe *for the app* —
and it is correct precisely *because* the site's override is scoped rather
than written to `:root`. The site's own colour claim is made in `site.spec.ts`
against the element the chassis actually paints. `deviceFrame.test.ts`, the
viewport gate's geometry assertions and `App.routes.test.tsx`'s mount-count
property are untouched in substance; only their seeds moved.

**New coverage:** `appRoutes.test.ts` (24 assertions over classification and
the boot decision, plus the `App.tsx` route-table scan) and `site.spec.ts`
(seven browser tests covering v8#1, #3, #4, #5, #6, #7, #8, #9).

---

## 5 · Craft debt found and not fixed this pass

Recorded, not opportunistically rewritten:

- **`web/vinodex-logo.png` sits outside `public/`** and appears to be
  unreferenced — `/vinodex-logo.png` resolves from `web/public/`. A duplicate
  650×650 PNG in the Vite root. Not deleted here because deleting an asset in
  a pass about routing is the kind of unrelated change that makes a diff hard
  to review.
- **The site marquee's glyph is the generic wineglass**, because `WELCOME` has
  no `MARQUEE_ART` entry and the lucide fallback is `<Wine>`. This is not a
  regression — `HORIZON/GODOT` fell through to the same glyph before — but a
  wineglass on the studio's front page is dex iconography on a site screen, and
  a small deliberate mark (or none) would be better. Needs a ruling on what
  the site's own glyph should be; recording rather than inventing one.
- **The professor's bubble covers the button band.** Found by this pass's own
  render gate, not looked for: `VinoBubble` draws a viewport-fixed layer whose
  container is `pointer-events-none` but whose *card* is not, and the card
  overlaps the footer caps — so while he is speaking, a click aimed at Home or
  SETTINGS lands on the bubble. Two new browser tests hit it before their
  first assertion, which is how it surfaced. It is a real usability fault (a
  chassis control that stops answering for the duration of a line) and it
  predates this pass entirely. Not fixed here: it is `VinoBubble`'s geometry,
  it is nothing to do with the entry model, and the fix has a choice in it
  (move the card off the band, or let clicks through and dismiss on the way).
  The two tests seed past every trigger via `ALL_TRIGGERS_SEEN` and say why.
- **The `PROJECTS` array still carries `TODO(Harrison): confirm the two
  Substack URLs`** from v6. Unchanged.
- **`web/data/encyclopedia/source/`** — the standing 4.5 MB copyrighted-text
  issue. Unchanged, the user's decision, not scheduled.

---

## 6 · Not done, and why

- **The site is still one page of tiles.** The rework moved it to `/` and gave
  it its own shell; it did not write it any new content. WHO WE ARE and
  CONTACT US are the copy v6 wrote.
- **No `document.title` per route.** The shell's static title now says
  HORIZON/GODOT, which is right for `/` and for a crawler, and stale in the
  tab once you are three screens into the dex. Fixing it properly means a
  per-route title effect, which is a separate change with its own opinions
  (does `/detail/:id` restate the prerendered title? does the tab say VINODEX
  or the screen name?). Worth doing; not smuggled in here.
- **The 440 `dist/detail/*/index.html` pages are still absent from the SW
  precache**, because `vite build` computes the manifest before `postbuild`
  writes them. Pre-existing and arguably correct (they are crawler artifacts;
  a real visitor gets the SPA shell), but it is a genuine "documented, not
  chosen" and should be one or the other.

---

## Deliberate deviations (carried forward, re-checked this sweep)

Every one of v7's still holds and none was re-raised. Re-checked because this
pass touched the chassis and the separation rule, which is where four of them
live:

- **COLLECTION, not SAVED / User**, on the chassis button and the page it
  opens. Unchanged.
- **The interactive moon dial**, the **web-only region map** and the
  **scanner's flat country step**. Unchanged; untouched by this pass.
- **The un-gated free tier.** The paywall harness defaults off, and v8#3 makes
  this *more* coherent rather than less: with the access door gone, the ACCESS
  panel now contains only the tier switch, which is the one thing on it that
  was ever about entitlements.
- **The web-only splash** — this one is now **retired rather than deviating**.
  It was listed as a deliberate deviation from v5 onward ("iOS has no splash
  because iOS has no second product"). The web no longer has one either. iOS
  still has no company site, so the *deviation* survives in a different shape:
  the web's landing is a product iOS does not have. Restated here so the next
  sweep does not go looking for `SplashScreen.tsx`.
- **The island trio stays `aria-hidden`**; **the chooser's hairline is the LCD
  accent**; **one colour table for the trio and the marquee pair**. All three
  unchanged.
- **`starterOnly` differs from iOS's `starterTierOnly`** in spelling. Still
  deliberate — a rename resets stored state.

Carried open from v5 as *skipped*, still portable if wanted:

- (v5#7) DATA LOAD ERROR state — still an edge case with no load-error signal
  to branch on.

Carried open from v7:

- (v7#S5) the Device Workshop's per-axis lamp overrides; (v7#S6);
  (v7#U1–U6, U8–U10). None touched this pass.

---

## Notes

- **iOS is untouched and was not read for this pass.** There was nothing to
  read: none of the nine rulings has a Swift counterpart. `vinodex-ios` remains
  read-only and unmodified.
- **`shared/` is untouched.** No data moved, and `coverage.test.ts`'s pinned
  totals are unchanged — the build still reports 177 grapes / 124 regions / 33
  styles / 106 flavors / 30 countries, and `check:refs` still reports zero
  dangling.
- **The version is the web's own.** v0.3.0 names the web shell's release line;
  it says nothing about any iOS build, and `FIRMWARE_RELEASES` — the device
  line the BIOS POST and FIRMWARE HISTORY print — is untouched.
- **`SHELL-AND-UI-SCOPE.md` remains uncommitted**, as v7 recorded.
