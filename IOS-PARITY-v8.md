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
> record of that. This changes what `/` *is*, retires six files, deletes a
> persisted key, draws the repo's first web-authored asset and rewrites eleven
> pins; filing it as v7 §10 would bury a product ruling inside a parity sweep.
> Ids are per-document — cite them
> qualified (`v8#2`), and carried-forward ids keep their old spelling in
> parentheses.

---

## Status — one pass, executed and green (2026-08-20, on `testing`)

Gates, run in full on the committed tree, after both rounds:
**lint 21 warnings (cap 22) · typecheck clean · 625 tests / 56 files · build OK
(440 OG pages, 420 precache entries / 5,222 KiB) · check:refs zero dangling ·
playwright 130 passed.**

Vitest file count: `UnlockScreen.test.tsx` and `appUnlock.test.ts` deleted with
the door they tested; `appRoutes.test.ts` and `siteMarquee.test.ts` added.
Playwright gained `site.spec.ts` (ten tests) and traded one BIOS test for
three. The precache is unchanged at 420 entries: `globIgnores: ['**/art/**']`
keeps every drawn asset out of it, so the site's 404-byte mark is runtime-cached
by the existing `/art/*.png` CacheFirst rule like the 36 mirrored panels beside
it — which is the arrangement the caps already use, and one less thing for the
service-worker config to have an opinion about.

- **Done — all rulings:** v8#1 (the site becomes `/`, with redirects),
  v8#2 (the BIOS runs on every app entry), v8#3 (the access code is deleted),
  v8#4 (CLASSIC on the site), v8#5 (no screensaver on the site), v8#6 (the
  strapline goes), v8#7 (the bezel wordmark), v8#8 (the **landing** greets with
  WELCOME; every other site screen names itself), v8#9 (backing out returns to
  the site), v8#10 (the site's own marquee mark — **the first web-authored art
  in the repo**), v8#11 (the professor's bubble, and the walkthrough card, off
  the button band), v8#12 (Back on the site goes up the site — the pre-tag
  release blocker), v8#13 (the site mark's branch, pinned on the rendered
  element).
- **Deleted, properly:** `SplashScreen.tsx`, `UnlockScreen.tsx` +
  `UnlockScreen.test.tsx`, `appUnlock.ts` + `appUnlock.test.ts`,
  `useAppUnlock.ts`, the `unlockedAppIDs` storage key and its `keep`
  justification, the `booted` session key, the WEBSITE ACCESS settings section,
  `UNLOCK_CODE`, `DeviceLayout`'s dead `showWordmark` prop, the
  `ACCEPTED_FALLBACKS` allow-list, the `ALL_TRIGGERS_SEEN` fixture, and the
  duplicate `web/vinodex-logo.png` outside `public/`.
- **Added:** `web/src/services/appRoutes.ts` (+ its test),
  `web/e2e/site.spec.ts`, `enterDex` in the e2e fixtures,
  `theme.skinCssVars` / `SITE_SKIN`, `scripts/draw-site-marquee.py` +
  `web/public/art/site/` + `siteMarquee.test.ts`, and
  `deviceFrame.DEVICE_BAND_CLEARANCE` + its two pins.
- **Pins rewritten:** eleven, listed in §4 with how each compares — nine
  strictly stronger, one (#8) stronger for dex titles and weaker for site ones
  until v8#13 pinned the branch it delegates to, and that is stated inside the
  pin rather than glossed.
- **Pre-tag review (cleanbot):** one release blocker, **v8#12**, and one
  unpinned branch, **v8#13** — both fixed, both verified by reverting the fix
  and watching the new pin fail. Seven non-gating findings are recorded in §7
  as post-tag backlog, unfixed on purpose.
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

## 2 · The rulings, as executed

| # | Ruling | Severity | Landed in |
|---|---|---|---|
| v8#1 | Portal moves to `/`; `/website/*` keeps working | **structural** | `App.tsx`, `WebsitePortal.tsx`, `appRoutes.ts` |
| v8#2 | BIOS on every dex entry, never on the site | **structural** | `App.tsx`, `appRoutes.ts:bootDecision` |
| v8#3 | Drop the access code; keep the Vinodex tile | **structural** | `WebsitePortal.tsx`, `storageKeys.ts`, `SettingsPanel.tsx`, 5 files deleted |
| v8#4 | The site is always CLASSIC | **moderate** | `theme.ts:skinCssVars`, `DeviceLayout.tsx` |
| v8#5 | No screensaver on the site | **moderate** | `App.tsx` |
| v8#6 | No strapline under the studio title | **cosmetic** | `WebsitePortal.tsx` |
| v8#7 | Bezel reads `HORIZON/GODOT` on the site | **cosmetic** | `DeviceLayout.tsx` |
| v8#8 | The site's **landing** marquee reads `WELCOME` | **minor** | `DeviceFooter.tsx`, `DeviceLayout.tsx`, `appRoutes.ts` |
| v8#9 | Back past the menu returns to the site | **minor** | `App.tsx:handleExitToSite`, `MainMenu.tsx` |
| v8#10 | The site gets its own marquee mark | **moderate** | `scripts/draw-site-marquee.py`, `marqueeArt.tsx`, `sync-shared.ps1` |
| v8#11 | The bubble and the tutorial card clear the band | **moderate** | `deviceFrame.ts`, `VinoBubble.tsx`, `CoachmarkOverlay.tsx` |
| v8#12 | Back on the site goes up the site, never into the app | **structural** | `App.tsx:handleBack`, `WebsitePortal.tsx` |
| v8#13 | The site's mark is pinned on the rendered element | — (a pin) | `site.spec.ts` |

v8#8 was narrowed and v8#10/#11 were added by a second round of rulings after
the first pass reported; v8#12/#13 come from the pre-tag review (§2b). The five
are written up in §2a and §2b.

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

## 2a · The second round — v8#8 narrowed, v8#10, v8#11

### v8#8 — narrowed: the landing greets, the rest name themselves

The first pass read *"on the website the marquee reads WELCOME"* as covering
every site screen. **Ruled the other way**, and the narrower reading is the
better one: WELCOME is a greeting, and a greeting repeated on the fourth page
you open has stopped being a greeting and become a label that means nothing.
`/` says WELCOME; OUR WORK, WHO WE ARE, CONTACT US and the project splashes
name themselves on the panel, which is the same rule every dex screen but the
main menu already follows.

`isSiteLanding(path)` joins `appRoutes.ts` beside `isSitePath`. The narrowing
made `marqueeTitle` and the *mark* two different questions, which is what §v8#10
is built on: the text says which page you are on, the mark says whose device
you are holding.

### v8#10 — the site's own mark, and the sync trap it had to dodge

Every site screen fell through `MARQUEE_ART` to `marqueeGlyph`'s `default:
<Wine>`. **That wineglass is a leak** — the encyclopedia's own mark on the
studio's front page — and it is the kind the separation rule cannot catch,
because it arrives through a fallback branch rather than through an import.

So the site gets a drawn mark of its own: a sun over a horizon, with two
receding rules beneath it and two dashes of light either side. Horizon/Godot's
name, drawn.

**The trap, which is the interesting half.** `sync-shared.ps1`'s art leg runs
`robocopy <ios Resources>\MarqueeArt <web public/art>\marquee *.png /MIR`, and
`/MIR` mirrors *deletions*. A web-authored PNG dropped into
`web/public/art/marquee/` is removed by the very next sync — silently, with no
build failure and no console error, because the glyph simply falls back to the
wineglass again. The script's own comment records this hazard for the 88 baked
footer caps; this is the same hazard from the other side.

The answer is the caps' answer: **write where the leg cannot reach.**

- The art lives in `web/public/art/site/`, deliberately not one of the five
  `$WebArt` targets.
- `WEB_MARQUEE_ART` in `marqueeArt.tsx` holds a **full `src`** rather than a
  stem, because the stems resolve under the mirrored `/art/marquee/` by
  construction. It is consulted *before* `MARQUEE_ART`, so a title that later
  gains an iOS panel cannot silently displace a mark drawn here.
- `siteMarquee.test.ts` pins it two ways, and the second is the one that
  matters: it **reads `sync-shared.ps1`** and fails if `site` is ever added to
  the table, exactly as `capsManifest.test.ts` does for `caps` (v7#L9 — a
  contents check is a proxy that stays green until somebody else's next sync).
  It also fails if the explanatory note disappears from the script.
- `sync-shared.ps1` carries that note, naming the file and the reason, so the
  next person editing the table meets the argument before they meet the test.
  (ASCII-clean, verified byte-wise.)

**Authoring.** `scripts/draw-site-marquee.py`, committed with its output and a
hash manifest — the footer caps' arrangement, for the footer caps' reason:
committed art plus no gate running the generator means stale art renders
perfectly and is simply wrong. A generator rather than a binary dropped in also
makes the drawing reviewable as source.

It is styled to stand beside the mirrored panels rather than beside a logo, and
that was measured rather than guessed: the shipped panels are **single-colour
silhouettes** — `marquee-menu`, `marquee-tools` and `marquee-data` each resolve
to exactly one RGB, `#FAF4C8`, with a graded alpha — drawn on a coarse pixel
grid, 111–161px wide, rendered at 22px with `image-rendering: pixelated`. The
mark is one colour, the same one, on a 36 x 36 grid at 4x. Checked side by side
against `marquee-menu` at render size before committing.

### v8#11 — the professor off the button band (and the tutorial with him)

**Found by this pass's own render gate**, twice, before it was looked for: two
v0.3.0 navigation tests could not press Home. `VinoBubble` drew at `items-end
... pb-3` inside `DEVICE_FRAME_BOX` — the bottom of the *device*, which is the
button band. Its stage is `pointer-events-none` but the card is not and must
not be (it is tap-to-dismiss), so **while the professor was speaking, a click
aimed at Home or SETTINGS landed on him.** Shipped in every release since
v0.2.0.

`CoachmarkOverlay` has the identical geometry and is fixed with it. Not
opportunism — it is the same defect in the region the ruling names, its card is
`pointer-events-auto` and carries SKIP and GOT IT, and it is *worse* there:
`passportButton` is one of the walkthrough's own targets and it is the
Collection cap, **on the band**, so the card was covering the very control its
step was pointing at, spotlight ring and all. Fixing one and leaving its twin
would be the ruling half-applied.

`DEVICE_BAND_CLEARANCE` joins `deviceFrame.ts` — the module that exists so the
device's footprint is stated once — built from the same two constants
`DeviceLayout` reserves the LCD's space with, which moved there with it.
**Scaled by `--ui-scale`, unlike `DeviceLayout`'s own reservation**: the band
carries `zoom: var(--ui-scale)`, so at LARGE furniture it is genuinely taller,
and an overlay that must *never* overlap it cannot use the unscaled number or
the fault returns for exactly the players who chose the biggest buttons.

**Measured after, at three viewports.** Card bottom vs band top: desktop
624/637, mobile 748/777, short 524/537. No overlap with any cap or with either
quick-pin lamp, at any size. A hit-test at the Collection cap's centre returns
the cap.

**The collision check the ruling asked for, done rather than assumed.** The
stamp celebration and the rating prompt are `absolute inset-0 z-50` centred in
the LCD, and at 1280x700 the bubble's new box and the celebration's box overlap
by 25px on paper — so the question was real. They cannot co-occur: `EntryDetail`
already claims `setSuspended(modalUp, 'entryDetailPrompt')` for both, which is
the seam `vinoPresenter`'s own header names ("a first-run card, the stamp
celebration, the rating prompt, the coachmark spotlight"). Verified in a
browser rather than read: on arrival the bubble is up and the celebration is
not; on marking TRIED the celebration is up and the bubble is gone; after NICE
the rating prompt holds it. The coachmark is the same story from both ends — it
claims `'coachmark'` and stands down on `isSuspendedOtherThan`.

---

## 2b · The pre-tag review — v8#12 (release blocker) and v8#13

Cleanbot's review of the release. Everything else passed; these two did not.

### v8#12 — Back on the company site launched the app. **Release-gating.**

`handleBack`'s no-history fallback was a flat `navigate('/dex')`, carried
unchanged out of v0.2.x behind a comment that said *"the user is inside the
app"*. **That premise died the moment `/` became the company site**, and this
handler is wired to five site routes. Measured in a browser: cold `/` → Back →
`/dex`, BIOS and all; the same from `/apps` and `/who-we-are`.

The warm case is worse, and is the half a forwards-only test would have missed:
React Router keeps `key === 'default'` on the **initial** history entry, so
walking `/` → OUR WORK → Back pops you onto `/` *with the cold branch live
again*. There was no sequence in which Back on the landing did anything but
launch the encyclopedia — on the release whose entire thesis is that Vinodex is
something you open from inside the site.

**Why it slipped, which is the part worth keeping.** It is the one site/dex
difference in this release that was **not routed through `appRoutes.ts`**.
Every other one — the boot, the skin, the screensaver, the bezel, the marquee —
asks the classifier; this one remembered instead, and a remembered premise is
exactly what §1 says the classifier exists to stop. It asks now:

```ts
if (location.key !== 'default') { navigate(-1); return; }
navigate(isSitePath(location.pathname) ? '/' : '/dex', { replace: true });
```

`replace` because there is nothing to pop: this is a move *up*, not back, and
leaving the abandoned URL in the history lets the browser's own Back drop the
visitor straight into the screen they just left.

**`PortalHome` also loses its Back cap.** `/` is the top of the site; a Back
there could only be a no-op or a lie, and it was the lie. The cap stays moulded
into the shell and inert — the same answer the band already gives for SAVED and
SETTINGS on a site screen.

Pinned in `site.spec.ts`: the landing's cap is disabled, a **cold** site
sub-page falls back to `/`, and the **warm popped-back-onto-`/`** path still
does not boot — plus a second test for the other side of the same branch, that
a cold-opened dex screen still falls back to the menu.

The two started as one four-step test and were split by the full suite, which
is worth recording because isolation lied about it: five navigations plus a real
power-on walk passed comfortably alone and tipped past the 45s budget under
parallel load. Splitting is the right shape anyway — "the site's fallback goes
up the site" and "the dex's fallback is untouched" are different claims about
different products.

### v8#13 — the mark's branch was the thing holding v8#10 up, and nothing held it

`DeviceLayout`'s `marqueeMark={onSite ? SITE_MARK_TITLE : undefined}` was
unguarded. Deleting that one ternary put every site screen back on the
encyclopedia's wineglass **with all 625 vitest and 127 Playwright tests
green** — the silent downgrade v8#10 was written to remove, reintroduced one
level up. The `consoleErrors` fixture cannot see it either: the fallback is an
inline lucide SVG, so there is no 404 to catch.

`site.spec.ts` now reads the rendered `img` src on **two** site screens and
asserts no lucide SVG remains in the panel. Two, deliberately: the landing and
a sub-page reach the mark by different routes through `glyphTitle` — the
landing's own title *is* `HORIZON/GODOT`, and only its WELCOME text override
stops it resolving by accident — so either alone could pass while the branch
was broken for the other. The expected src is read from `WEB_MARQUEE_ART`
rather than written out, so a re-foldered asset fails here.

**Both pins were verified by reverting the fixes** and watching exactly these
two tests fail while the other seven passed — which is also the measurement
that confirms the suite was blind to both before.

---

## 3 · What was deleted, and what was checked before deleting it

| File | Checked |
|---|---|
| `components/SplashScreen.tsx` | Only referenced by `App.tsx:13/569`. Its `vinodex-logo.png` is **kept and still used** — `WebsitePortal`'s VINODEX row and project splash both draw it, and it is the favicon, the apple-touch-icon, the PWA icon and the OG image. |
| `components/UnlockScreen.tsx`, `.test.tsx` | Unrouted before this pass; only its own test imported it. |
| `services/appUnlock.ts`, `.test.ts`, `useAppUnlock.ts` | Consumers were `SettingsPanel`'s WEBSITE ACCESS section (deleted) and the two test fixtures (rewritten). |
| `WebsitePortal.UnlockVinodex`, `UNLOCK_CODE` | The `/website/unlock` route, now a redirect. |
| `DeviceLayout.showWordmark` | Dead since iOS v0.6.9 retired the island wordmark; the splash was its only caller. |
| `web/vinodex-logo.png` | Byte-identical duplicate of `web/public/vinodex-logo.png` (same MD5), sitting in the Vite root where nothing can reach it. All fourteen references resolve through `/` or `web/public/` — the favicon, the apple-touch-icon, the PWA icon, the OG image, the site's project rows, the screensaver mark and the README. |
| `marqueeTitles.ACCEPTED_FALLBACKS` | The allow-list of site titles permitted to show the wineglass. Deleted rather than shortened — v8#10 gives them all a real mark, so there is nothing left to grandfather. |
| `e2e.ALL_TRIGGERS_SEEN` | Lived for one commit. It seeded past the professor so two tests could press the chassis; v8#11 fixed the reason, so the helper left with the defect it was written around. |

---

## 4 · The pins that were rewritten — eleven, and how each compares

**None was relaxed, and none was deleted outright.** Where a pin asserted a
property of something that no longer exists, it was replaced by the property
that survives.

**Nine of the eleven are strictly narrower claims; one is not, and it is
labelled.** Pin #8 is stronger for dex titles and, as originally written,
weaker for site ones — see the correction inside it. The section header used to
say "why each is at least as strong", which was a claim the section did not
support.

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

8. **`marqueeTitles.test.ts` — the allow-list is gone, not shortened.** The
   first round removed `UNLOCK` and `UNLOCK VINODEX` from `ACCEPTED_FALLBACKS`
   with the screens they named (the suite's own honesty check forced it, which
   is the check working). v8#10 then removed the *list*: with the site stamping
   a real mark, no title is allowed to fall through to the wineglass, so the
   gate is now "every title resolves to a drawn panel" with no exemptions and
   nothing to add a sixth entry to. Which side a title is on is read from the
   file it is declared in — a fact about the source rather than a name somebody
   maintained. Two assertions were added with it: no site title may resolve to
   a *dex* panel (the DATA collision is live and would have borrowed one
   silently), and no title may hold both a web-authored mark and a mirrored
   one. `SITE_MARQUEE_TITLE` is still folded into the scanned set, since it is
   the one string on that panel which is not a `title=` literal.

   **Correction — this pin is not strictly stronger, and the first draft of
   this section said it was.** It is stronger for *dex* titles: an unmapped dex
   screen fails, exactly as before, with two new assertions beside it. For
   *site* titles it is weaker in one specific way, and the honest statement is
   worth more than the claim: the old list **enumerated who was permitted to
   fall through**, so a new site screen arriving without a panel failed the
   honesty check until somebody named it. The new gate does not check site
   titles for fallthrough at all. It delegates the guarantee to
   `DeviceLayout`'s route-derived `marqueeMark` branch — which is a *better*
   arrangement, because a new site screen inherits the mark with no maintenance
   at all rather than needing a line added to a list — but only if the branch
   is guaranteed. **It was not.** Deleting one ternary returned every site
   screen to the wineglass with all 625 vitest and 127 Playwright tests green
   (W3), which is the silent downgrade v8#10 existed to remove, reintroduced
   one level up. `site.spec.ts` now asserts the rendered `img` src on two site
   screens (v8#13), verified by reverting the branch and watching the pin fail.
   With that in place the arrangement is sound; the *claim* was wrong before it.

9. **`deviceFrame.test.ts` gained the band-clearance rule (v8#11).** Stated as
   a source scan rather than as two named files: any component anchoring a card
   to the bottom of `DEVICE_FRAME_BOX` must import `DEVICE_ABOVE_BAND_STYLE`.
   The failure mode is a Tailwind `pb-*` on an `items-end` row, which a type
   cannot see and a scan can. It carries its own non-vacuity guard — the scan
   must find exactly the two overlays that anchor this way — so a renamed
   constant cannot empty it into passing. A second assertion holds the clearance
   to the same two constants `DeviceLayout` reserves the LCD with, and requires
   the `--ui-scale` factor, which is the half a naive copy would drop.

10. **e2e fixtures** — `seedDevice` lost `unlockedAppIDs` and `booted`;
   `seedFreshDevice` lost `unlockedAppIDs` and is now genuinely empty. The
   replacement for the `booted` seed is **`enterDex(page, route)`, which
   presses the real skip**. This is a strengthening and worth being explicit
   about: the old seed meant ~40 specs never rendered the BIOS at all, which
   is half of why the v0.2.0 layering fault could hide. Every one of those
   specs now walks through a real power-on on its way in.

11. **The two tests that stepped around v8#11 now assert it.** They briefly
    seeded `ALL_TRIGGERS_SEEN` so the professor would not eat the click they
    needed — a fixture written around a bug. With the bug fixed, both go back
    to the plain seed, so `/detail/G001` fires `firstGrapeViewed` and
    `/passport` fires `firstPassport`, and each presses Home **with him
    mid-sentence**. Each asserts the bubble is visible *first*, so a bubble
    that stopped appearing could not make the press succeed for the wrong
    reason. A test that documented a defect is now the test that prevents it,
    and the helper was deleted so nobody reads it as a fact about the app.

**Pins deliberately left exactly as they were:** the 22-skin screenshot gate,
the footer-cap gate and the lamp gate all read `:root` and all run on `/dex`.
That is still correct and still the strongest available probe *for the app* —
and it is correct precisely *because* the site's override is scoped rather
than written to `:root`. The site's own colour claim is made in `site.spec.ts`
against the element the chassis actually paints. `deviceFrame.test.ts`, the
viewport gate's geometry assertions and `App.routes.test.tsx`'s mount-count
property are untouched in substance; only their seeds moved.

**New coverage:** `appRoutes.test.ts` (classification, the boot decision, and a
scan holding both against `App.tsx`'s route table), `site.spec.ts` (seven
browser tests over v8#1, #3, #4, #5, #6, #7, #8, #9), and `siteMarquee.test.ts`
(the mark's hash, its grid and ink, and the two-sided proof that it is out of
the sync leg's reach).

---

## 5 · Craft debt found and not fixed this pass

Three of the five items this section carried after the first round were then
ruled on and fixed — the stray logo (deleted, §3), the site's wineglass
(v8#10) and the professor on the button band (v8#11). What is left:

- **The bubble and the tutorial card overhang the screen housing's lower
  bezel.** Having cleared the band (v8#11) they now end a few pixels over the
  moulded strip that carries the wordmark and the vent lamp, rather than
  exactly on the LCD's edge. It is moulding, not a control, and iOS draws him
  at the foot of the screen too — so this is a look, not a fault. Raising them
  further starts covering the content they are talking about, which is a worse
  trade. Recorded because it is visible in the v0.3.0 screenshots and somebody
  will notice.
- **`DeviceLayout`'s LCD reservation does not scale with `--ui-scale`, but the
  band does.** The band carries `zoom: var(--ui-scale)`; the padding that
  reserves room for it is a flat `8.5rem`. At LARGE furniture the band is
  taller than its reservation and eats a little of the LCD's bottom edge.
  Pre-existing, and v8#11 deliberately did *not* fix it — changing that padding
  moves the screen on every device at every size, which is not a change to
  smuggle into a routing pass. The overlay clearance scales, so the v8#11 fault
  cannot return through this door; the LCD's own edge is the remaining part.
- **The `PROJECTS` array still carries `TODO(Harrison): confirm the two
  Substack URLs`** from v6. Unchanged.
- **`web/data/encyclopedia/source/`** — the standing 4.5 MB copyrighted-text
  issue. Unchanged, the user's decision, not scheduled.

---

## 6 · Not done, and why

- **The site is still one page of tiles.** The rework moved it to `/` and gave
  it its own shell; it did not write it any new content. WHO WE ARE and
  CONTACT US are the copy v6 wrote.
- **The site's marquee mark is one drawing, not a set.** Every site screen
  stamps the same sun-over-horizon; there are no per-screen site panels, and
  there should not be — those are dex chrome, drawn by iOS for iOS's routes,
  and giving the company site 36 of its own would be the leakage the separation
  rule forbids arriving from the other direction. If a second web-authored mark
  is ever wanted, `WEB_MARQUEE_ART` is a map and `siteMarquee.test.ts` already
  iterates the manifest, so it is a line in each.
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

## 7 · Post-tag backlog, from the pre-tag review

Cleanbot's findings that are **not** release-gating. Recorded here rather than
fixed, because each is either a decision, a test, or a change that should not
ride along inside a release it is not part of. Ids are cleanbot's.

- **W2 — `skinCssVars` duplicates `applyTheme`'s token table, and two dataset
  attributes cannot be shadowed at all.** The new function restates roughly 35
  custom properties that `applyTheme` also writes, with nothing holding the two
  together — the exact shape `capsManifest.test.ts` exists to guard for the cap
  colours. Worse in kind: `root.dataset.translucent` and `root.dataset.skin`
  are *attributes*, written from the **stored** skin, and an inherited custom
  property cannot shadow an attribute. So on a site screen those two still say
  NOCTURNE while the chassis paints CLASSIC. **Dormant today** — nothing in
  `index.css` or any component reads either (checked), which is why the site
  renders correctly — and **live the moment somebody writes a
  `[data-translucent="on"]` rule**. GLOUGLOU, NOUVEAU and WALDGLAS are the
  three shells that would show it, since they are the translucent ones. The
  fix is a shared table plus a test holding `applyTheme` and `skinCssVars`
  equal, and a decision about what the two attributes should say on a site
  screen.
- **W4 — the coachmark half of v8#11 has no behavioural test.** The maths is
  verified (the clearance is derived from the band's own constants and scales
  with `--ui-scale`, pinned in `deviceFrame.test.ts`) and the geometry was
  measured at three viewports, but **no test presses a chassis cap with the
  walkthrough card up**, the way the two un-seeded tests now do for the
  professor. The card is the half with SKIP and GOT IT on it and the half whose
  own step spotlights a cap on the band, so it is the half that deserves the
  test more.
- **W5 — the DATA tile boots the device.** `/settings/DATA` is a dex route, so
  a site tile that opens it is an app launch by the letter of v8#2 and the BIOS
  runs. That is arguably correct — it *is* opening the app — but DATA is
  presented as one of the site's own four tiles beside WHO WE ARE and CONTACT
  US, so a visitor pressing it gets a power-on test they did not ask for.
  Decide: accept and pin it, or exempt the one sanctioned crossing.
- **W6 — `unlockedAppIDs` is unregistered rather than tombstoned.** v8#3
  deleted the key from the registry entirely. For a *returning* v0.2.x visitor
  the value is already in localStorage, and an unregistered key is one CLEAR
  ALL SAVED DATA does not remove — so the registry's own sentence ("everything
  the device remembers about you goes") is not literally true for them. It is
  not user data and it is inert, so nothing behaves wrongly; it is a
  cleanliness gap with a one-release fix: register it `wipe` with a tombstone
  note, ship one release, then delete.
- **W7 — the share cards' `og:site_name` changed without being a decision.**
  Moving the shell's card to the studio (v8#1) also moved `og:site_name` and
  `application-name` from Vinodex to Horizon/Godot on **all 440 prerendered
  entry pages**, because `prerender-og.ts` copies the shell and overrides only
  `title`/`description`/`og:url`/images. Arguably right — the studio does
  publish them — but it was a side effect, not a ruling, and it changes how
  every shared wine entry unfurls.
- **W8 — `showSystemButtons` is still a prop while its four siblings are
  route-derived.** The skin, the bezel wordmark, the marquee text and the
  marquee mark all ask `appRoutes.ts`, precisely so a new site screen cannot
  forget one. `showSystemButtons={false}` is passed by hand on every site
  screen and a new one that omits it gets SAVED, SETTINGS and two dex-pointing
  lamps. It predates this release and its tests are written against the prop,
  which is why it was left; it is now the odd one out.
- **W10 — lint headroom is one.** 21 warnings against a `--max-warnings=22`
  cap, so a single new warning fails the build. Either burn down a few of the
  standing downgrades or raise the cap deliberately; leaving it at one is a
  trap for the next pass.

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
- **The site's marquee mark is web-authored — the only art in this repo that
  is (NEW, v8#10).** Every other piece of drawn chrome is mirrored one-way out
  of `vinodex-ios` by `sync-shared.ps1`'s art leg, under the v6#2 ruling: iOS
  owns it, the web consumes it, and ownership does not move. This one has no
  upstream to mirror, because iOS has no company site and will not have one, so
  it is drawn here by `scripts/draw-site-marquee.py` and lives in
  `web/public/art/site/` — outside every folder the leg touches. It does not
  weaken the ruling: nothing was copied in either direction, no folder was
  added to the leg, and the exception is the narrow one the ruling could not
  have covered. **If iOS ever gains a company-site screen, this is the item to
  revisit** — the mark should move upstream and the web should consume it like
  everything else.
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
  read: none of the rulings has a Swift counterpart. `vinodex-ios` remains
  read-only and unmodified.
- **`sync-shared.ps1` was edited** — one comment block, naming
  `web\public\art\site\` and why it is not in the `$WebArt` table. It is the
  only file outside `vinodex-web` this pass touched, it changes no behaviour,
  and it was verified byte-clean ASCII with CRLF endings preserved, per the
  house rule for HGapps `.ps1` files. `siteMarquee.test.ts` fails if the note
  is removed.
- **`shared/` is untouched.** No data moved, and `coverage.test.ts`'s pinned
  totals are unchanged — the build still reports 177 grapes / 124 regions / 33
  styles / 106 flavors / 30 countries, and `check:refs` still reports zero
  dangling.
- **The version is the web's own.** v0.3.0 names the web shell's release line;
  it says nothing about any iOS build, and `FIRMWARE_RELEASES` — the device
  line the BIOS POST and FIRMWARE HISTORY print — is untouched.
- **`SHELL-AND-UI-SCOPE.md` remains uncommitted**, as v7 recorded.
