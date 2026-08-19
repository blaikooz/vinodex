# Web ↔ iOS parity plan — v7 (the shell, the caps, and the foundation)

_Follows `IOS-PARITY-v6.md`. This is an **execution pass**, not a survey: the
survey it executes is `SHELL-AND-UI-SCOPE.md` (uncommitted, written for review
at the head of this pass). Measured against iOS **v0.9.2**
(`vinodex-ios` @ `c0532a6`), on web branch `testing` from `9a1f1a6`,
2026-08-18. Severity: **cosmetic** (a glyph/word), **minor** (layout/order/
copy), **moderate** (a missing control or section), **structural** (a screen or
system that does not exist here)._

> **Sealed sweep record once executed.** The canonical standing document is
> `IOS-PARITY.md`. Items below are per-document ids — cite them qualified
> (`v7#S1`). Ids beginning `W` are cleanbot's audit numbers, `S`/`U` are
> `SHELL-AND-UI-SCOPE.md`'s; both are carried unchanged so the three documents
> can be read against each other.

---

## Status — both stages executed and green (2026-08-18, on `testing`)

Gates at close of pass, run in full after every commit:
**lint clean (cap 22) · typecheck clean · 569 tests / 49 files · build OK ·
check:refs zero dangling · playwright 84 passed.**

Test count moved 506 → 569 across the pass; file count 41 → 49. Lint warnings
63 → 22, all of them standing downgrades with stated reasons rather than
deferred defects — and the count is now a **cap** (`--max-warnings=22`),
because `eslint .` exits 0 on warnings and the baseline had been a contract
enforced by nothing (L2).

- **Stage 1 — foundation and correctness. Done:** W2 (the linter), W1 (the
  route-remount bug), W3 + W20 (the safety nets), W4 (orphan deletion), W14 /
  W15 / W16 (type safety), W25 (storage-key registry + profile wipe), W26 (one
  contact constant + release blockers), W18 (coverage pins), U7 (reduced
  motion) — plus **versioning ruling 2** (the web changelog and its gate).
- **Stage 2 — the chassis and the caps. Done:** S1 (the cap colour model), the
  cap art pipeline (88 baked caps + the drift gate + the sync leg), S2 (rim
  glow), S3 (recessed lamps + the stadium orb), S4 (the chamfer), S7a (the
  marquee lamps' colour half), S8 (the chassis press, folded into S1).
- **Deliberately not started:** cleanbot's **W7** (DeviceLayout decomposition)
  — sequenced after the chassis work, and it would have collided with every
  commit in Stage 2.
- **Round-six review fixes — done:** M1 (the wipe rule's `put(...)` hole),
  M2 (a failed cap PNG left a button with no glyph), M3 (`UnlockScreen`'s
  `Key`, wrongly baselined), M4 (the W1 test's non-vacuity guard), M5 (the
  reduced-motion rule was wrong for four of five selectors), L1–L10.
- **Rulings landed:** the **COLLECTION** button label; the bump to
  **v0.2.0** with its authored entry; and **FIRMWARE HISTORY now narrates the
  web's releases**.
- **Release review (2026-08-19), pre-tag:** blockers R-S1–R-S3 done (CI Node
  pin, lockfile version drift + its pin, the changelog's install-banner
  claim); follow-ups R-S4–R-S8 and R-S11 done. See §7.
  The v0.2.0 tag waits on these, which is why it still does not exist.
- **Open, carried forward:** S5, S6, U1–U6, U8–U10. See "Still open".
- **v0.2.1 pass (2026-08-19), §8 below:** **W7 done** (the `DeviceLayout`
  decomposition, unblocked as promised) and **S7b done** (the marquee lamps
  are the quick pins, on the ruling relayed this pass), plus four chassis
  geometry gaps the lamp survey turned up, plus one separation defect the
  feature would have introduced (L8). A **pre-tag review** then found nine
  more on the released feature — a false `aria-modal`, a mouse-hold that ate
  the navigation, a macOS keyboard with no reassign path, and six smaller —
  all landed (§8, "Pre-tag review"). Gates at close: lint 22/22 · typecheck
  clean · **614 tests / 53 files** · build OK · check:refs zero dangling ·
  **playwright 109 passed**. Version **v0.2.1**.

### Commits

| # | Commit | Items |
|---|---|---|
| 1 | `7d7dcf7` chore: the linter the repo never had | W2 |
| 2 | `c134d4e` fix: the routed subtree was remounting | W1 |
| 3 | `b97254d` refactor: delete five orphan components | W4 |
| 4 | `68e4c46` fix: narrow the union instead of casting past it | W14, W15, W16 |
| 5 | `ee137b1` feat: the registry, the changelog gate, the pins, reduced motion | W25, W26, W18, U7, ruling 2 |
| 6 | `3df0fc9` chore: drop VinoBubble from the lint baseline | (staging fix) |
| 7 | `1ce5174` test: the safety nets under the work that comes next | W3, W20 |
| 8 | `1cf4b0f` feat: the footer caps are painted by the skin | S1, S8 |
| 9 | `a81d23b` feat: the drawn moulded caps arrive, baked per skin | cap pipeline |
| 10 | `feb993b` feat: the chassis geometry catches up | S2, S3, S4, S7a |
| 11 | `f385c5b` docs(parity): v7 | this document |
| 12 | `2b49a8e` fix: cleanbot round six, and the COLLECTION label ruling | M1–M5, L1–L10, label ruling |
| 13 | *(this commit)* feat: v0.2.0, and the firmware log becomes the web's | rulings 1 and 2 |

---

## 1 · What the pass actually found

Three findings are worth stating separately from their commits, because each
corrects something the plan was built on.

### The linter found W1 on the day it was installed

`react-hooks/static-components` reported five hits in `App.tsx` on its first
run — the five route components declared inside the render body. That is the
argument for **v7#W2** in one line, and it is why the linter went first
despite W1 being the higher-severity item.

The defect: a component declared in a render body is a new function identity
every render, and React compares element types by identity, so the whole
routed subtree was unmounted and rebuilt on every `App` re-render. `App`
subscribes to the professor's queue, and `EntryDetail`'s TRIED handler fires
`firstTried` (and `firstStamp` on a badge) and then calls
`setCelebrations(queue)` in the same click — batched, so the render the
professor caused was the render that destroyed the celebration. **The first
passport stamp a player ever earns was the loudest case.**

Watched to fail before the fix (`expected 2 to be 1`, twice) and again with
the fix stashed out.

### `graft_home_skirt` is superseded — the home sprite defect is closed

The brief named 0.8.96's `graft_home_skirt` as the correction to carry across.
It is not the current one. **0.8.99's `rebuild_home_from_back`**
(`vinodex-ios/scripts/import-footer-art.py:331`) replaced the whole
0.8.92–0.8.98 band-surgery arc by rebuilding `home` as **back's drawing
verbatim** with back's chevron inpainted out and home's house transplanted in.

Measured on the shipped `Resources/FooterArt/footer-home.png` before mirroring
anything:

```
              y=222       y=230       y=238       y=246
  back    148 opaque   120 opaque    91 opaque   55 opaque
  home    148 opaque   120 opaque    91 opaque   55 opaque
```

Alpha-silhouette mismatch against `back`: **0 pixels of 65,024**. Materially
differing pixels: 3,858 (5.9%) — the house against the chevron. Face medians
245 vs 244. The "~21px skirt under an over-bright lit face" is gone at the
drawing level, so what the web now mirrors is already correct art.

### The web had iOS's Home fork frozen in Tailwind

Not inferred — measured. `<footer>` screenshotted at 420×900 across eight
shells, pixels sampled: the Home glyph rendered `rgb(123,51,6)` and the
Settings ring `rgb(59,55,52)` on CLASSIC, ORIGINAL, BURGUNDY, OAKED, PET NAT,
HALLOWEEN, W64 and PSVINO alike. Three hardcoded stone caps and one hardcoded
amber one with an inner lit disc — the exact `ChassisAccent`-lit disc iOS
deleted in 0.8.98, and the exact reason three consecutive iOS releases of cap
fixes each "missed the home button".

---

## 2 · Stage 1 — foundation

**v7#W2 — no linter existed.** _moderate — process._ **Done.**
eslint 9 flat config; typescript-eslint, react-hooks, jsx-a11y. `npm run lint`
runs **first** in `gates.yml`, ahead of the expensive steps. The tell that it
was missing: seven decorative `eslint-disable-next-line
react-hooks/exhaustive-deps` comments written against a rule that had never
run. First run: 70 problems, split into standing downgrades (the rule is wrong
here, stated why, does not shrink), a **baseline** scoped per-file and naming
the item that removes it, and trivia fixed on the spot. The baseline only ever
shrinks; three of its four blocks are already gone.

**v7#W1 — the routed subtree remounted on every `App` render.** _structural._
**Done.** See §1. Five route components hoisted to module scope with explicit
props; `web/App.routes.test.tsx` pins it with the leaves mocked (the first
attempt inferred remounts from the DOM and passed against the broken tree) and
the professor's queue drained before the poke (or the assertion is vacuous —
arrival lines already occupy the queue, so enqueuing behind them re-renders
nothing).

**v7#W3 + #W20 — the safety nets.** _moderate._ **Done.**
Six detail categories in a real browser plus the same six under vitest with
their **ordered section lists** pinned as exact arrays; the three uncovered
settings panels; `seedFreshDevice` and a first-run e2e test; the marquee title
gate. Recorded pins:

```
GRAPES        INFO, RARITY, CHARACTERISTICS, FLAVOR PROFILE, ALSO KNOWN AS, NOTABLE REGIONS
REGIONS       INFO, APPELLATION SYSTEM, APPELLATIONS, CLIMATE, SOIL COMPOSITION, NOTABLE GRAPES
STYLES        INFO, NOTABLE GRAPES, KEY REGIONS
FLAVORS       INFO, NOTABLE GRAPES
CONTINENTS    INFO, COUNTRIES
COUNTRY_GATE  INFO, MAIN GRAPES, APPELLATION SYSTEMS, KEY REGIONS
```

Those pins exist to make **U10** (the `EntryDetail` decomposition) provable
rather than hopeful: a split that drops a section from one branch is both the
obvious failure and invisible to the type checker.

The e2e URL guard earned its place immediately — `F001` and `C001` were
guesses, an unknown id redirects to `/dex`, and without the check both tests
would have passed while rendering the menu.

**Marquee fallbacks, ruled.** Eight titles had no panel. Five are literals and
are now an explicit `ACCEPTED_FALLBACKS` list, every one a `/website` portal
screen: **OUR WORK, CONTACT US, UNLOCK, UNLOCK VINODEX, HORIZON/GODOT**. That
is deliberate — marquee panels are dex chrome, and giving the company site its
own set is the leakage the separation rule forbids. **WHO WE ARE is not
listed**: it arrives through a `title` prop rather than a literal, so the gate
cannot see it, and listing it would make the list claim a completeness it does
not have. Six such expression call sites are named in the suite's header.

**v7#W4 — five orphan components.** _minor._ **Done.** 655 LOC nothing
rendered, plus 279 LOC of test keeping three of them looking alive.
`SettingsPanel`'s private `GrowthWave` is an independent second implementation
of `DataWave`'s chart and is the one that draws — so the repo had a tested
chart nobody saw and an untested chart everybody saw. **Adopting `DataWave`
would have been a visible change and was not done**; the survivor gets the
tests instead.

**v7#W14 / #W15 / #W16 — type safety.** _minor._ **Done.** 32 `any` casts, 3
unchecked `JSON.parse … as T`, and the one `.jsx` file. Two narrowings were
wrong on the first attempt and the tests said so, which is the argument for
the whole item: `notableOf()` dropped STYLES (which does declare
`notableGrapes`) and moved two golden quiz papers; `gCountry()` dropped a
fallback. Both caught by `quiz.test.ts`'s seeded papers.

`vite-env.d.ts` keeps its `any`s under a **standing exemption**, not a
baseline entry: that file *is* the three.js shim for a dependency shipping no
types, and `unknown` there would break every call site in `RetroGlobeScreen`
without making anything safer.

**v7#W25 — CLEAR ALL SAVED DATA did not clear all saved data.** _moderate._
**Done, with a ruling.** A hand-kept 27-key array against 36 key constants.
The two that mattered: `userProfilesIndex` and the five `userProfileSlot-N`
blobs were on **no list at all**, so a wipe left five complete snapshots of
the erased device — every shelf, every rating, the display name — in
localStorage, and the PROFILES panel went on offering to load them.

**The rule, stated once and now in code:** _everything the device remembers
about you goes; what stays is the grant that let you in._ That settles the
inconsistency the audit flagged — `textScale`/`uiScale`/`chassisSkin` wiped
while `hapticsEnabled`/`soundsEnabled` were not, which is not a rule but two
people's guesses. iOS wipes all five, so the web does.

Two `keep`s, each with a stated reason. `unlockedAppIDs` is a **deliberate
divergence from iOS**: iOS has no such key because iOS has no door, and wiping
it here would log the player out of the dex and drop them at the company
portal — a different destructive act from the one the button offers.

`storageKeys.test.ts` walks the source rather than counting: a hardcoded total
would have passed on the pre-fix tree, since 27 was a perfectly consistent
number for the old list to have. Watched to fail.

**v7#W26 — two contact addresses, two unregistered domains.** _minor._
**Done.** `hello@vinodex.app` on the portal and `hello@vinodex.com` in the
support service, both rendered as live `mailto:` links. One constant now — and
in a new **`brand.ts`**, not in `supportContact.ts`, because putting it there
would have made the portal import a dex service. The address is the studio's,
not either product's. **The domain is not chosen**; `releaseBlockers.ts`
registers it beside the App Store id and fails in both directions.

The contrast is the lesson: the App Store id was handled well because
`APP_STORE_LISTING_IS_LIVE` made the placeholder *observable* and the install
banner read it. The contact address was a string in a template. Same care,
different mechanism.

**v7#W18 — `coverage.test.ts` had three `toBeGreaterThan(0)` assertions.**
_minor._ **Done.** Pinned: 526 total, **80 COUNTRY_GATE** (the one category
nothing counted — and the whole of the web's divergence from iOS, so leaving
it unpinned meant the divergence itself was unobserved), 528 note instances,
26 region origins. **The divergence is pinned, not reconciled**: web reports
526 and iOS 446, both true about their own catalogue. The header claiming iOS
totalled 284 was three data batches stale while the assertion two lines below
already said 446.

**v7#U7 — no `prefers-reduced-motion` rule existed.** _moderate, a11y._
**Done.** Eight `@keyframes`, seven `infinite`, zero rules — while CLAUDE.md
names the query explicitly. Two were worse than unhandled: the orb halo and
the three lamp haloes were inline `animation:` in `DeviceLayout`, beyond the
reach of any selector, so the two most prominent moving things on the device
could not be switched off at all.

**Stopped, not slowed** — the setting is a request from someone for whom
motion is a symptom, so each animation is taken to the state it would have
ended in: lamps at their bright stop so the device still reads as powered, the
marquee parked at its start, the cursor visible. Plus a catch-all at 0.01ms,
not zero, so `transitionend` still fires.

`reducedMotion.test.ts` reads the CSS as text — a stylesheet containing no
rule is what needed catching and jsdom evaluates no media query — and fails on
any inline `animation:` in a component.

---

## 3 · Stage 2 — the shell

**v7#S1 — the four footer caps did not read the skin.** _structural._
**Done.** See §1 for the measurement. `theme.ts` gains `ChassisControl`'s 22
rows and `ChassisButtonSet`'s 4, hex for hex, plus `footerCap(skin, kind)` —
**the** path, the web twin of `ChassisLook.footerCap`. `applyTheme` writes 16
custom properties; `DeviceLayout` has one `capStyle()` and one `CAP_CLASS` for
all four controls and **no kind branch left for a future fix to miss**.

Three things fell out rather than being aimed at: the glyphs are
`currentColor` (a hardcoded white was invisible on the five pale-plastic
skins), the caps press like the shell (**S8** — `ChassisPress`'s 0.88 plus a
brightness drop, which the orb already used and the caps did not), and real
focus rings offset against `--chassis-footer`.

Gated three ways, because a colour table's real failure is a typo that
compiles: the invariant (`home` must equal `back` on every skin without an
authored set), the resolved custom properties per skin in the browser (a
renamed token resolves to the empty string and CSS treats that as nothing —
the band would silently lose its paint with no error anywhere), and **no two
shells wear the same band**, which is the shape of the defect as a user met it
and which every per-skin check would have passed on the broken tree.

**v7#S-caps — the drawn moulded caps.** _structural._ **Done.**
88 files, 22 skins × 4 caps, **608 KB**, average 7 KB, none over 12.
`scripts/bake-footer-caps.py` is a port of `ChassisCapLoader.fitCap` and
`.reink` with iOS's constants and names kept so the two diff by eye.

**Rulings applied:** pre-baked at **192px**, baked **web-side**, with a
**hash-pinned drift gate**. `sync-shared.ps1` gains one line
(`FooterArt → art/footer`) and stays ASCII.

**The `/MIR` trap, avoided and documented.** The art leg mirrors deletions, so
88 baked files in `art/footer/` — whose source side has four — would be
deleted by the next sync, silently, leaving the band on CSS circles. Baked
output lives in **`art/caps/`**, which no leg mirrors, and a test pins that
`art/footer/` holds exactly the four sprites.

**The revisit trigger, recorded as the ruling asks:** if the **Device
Workshop** lands (v6#35), its buttons axis offers 13 `PartColor` values, the
matrix becomes 13 × 4 = 1,144 files on top of the 88, and pre-baking stops
being viable — **canvas wins instead**. Nothing smaller than that flips it.
The trigger is written into the script's header as well as here.

**The duplication, accepted knowingly.** The re-ink now exists in Swift and in
Python, permanently. `capsManifest.test.ts` is the price: the output is
committed so no gate runs the bake, which makes stale art invisible — a cap
baked against last month's colours renders perfectly and is simply wrong. The
manifest records each source sprite's SHA-256 and a hash over the whole
resolved colour table, and both are recomputed. Watched to fail on a
one-digit hex change.

**Not ported, deliberately:** `lipBandTop` and the third `lipHex` ink (still
in the Swift, but 0.8.98 made every caller pass nil — anyone reading that file
cold would implement them), and 0.8.7's geodesic `outlineReach` trim (retired
in 0.8.91 because it fired on exactly one of its four inputs and destroyed
it).

**v7#S2 / #S3 / #S4 / #S7a — geometry.** _minor._ **Done.**
The keyed corner (a `clip-path` polygon, because iOS's 0.6.6 E1 records that a
clip and a stroke antialias independently and the fill leaks past the cut);
one `.recessed-lamp` class serving all eight lamps and the orb, every
measurement a fraction of `--lamp-size` so it is correct on an 8px vent dot
and a 15px orb; the orb as a stadium the length of the trio; NOCTURNE's rim
glow, which `applyTheme` had been writing to a variable nothing read.

The two housing lamps and the bottom-strip lamp **stay fixed red on every
shell**, matching iOS's `ventDot` — those are the chassis's plain power/link
indicators, not a skin surface.

---

## 4 · Versioning

**Ruling 1 — superseded: bumped to `v0.2.0`.** The earlier "do not bump yet"
held for most of the pass; the bump then landed as its own act rather than
drifting, which is the whole point of the discipline. `APP_VERSION` and
`package.json` both move (`appVersion.test.ts` already held the three
spellings equal), and `0.1.0` is promoted into `PREVIOUS`.

The entry covers the **whole programme**, not the last pass — written from
the running note below rather than reconstructed from `git log`. Fifteen
notes: the v6 parity sweep, the bundle merge, the rulings, the drawn art and
22 shells, the cap colour model and 88 baked caps, the chassis geometry, and
the foundation work. It passed the gate it was written for.

**Not tagged here.** The annotated `v0.2.0` tag is created at push time, per
the convention that git tags are the real release record.

**Ruling 2 — a changelog the version is tied to. Done.**
`web/src/services/webChangelog.ts` plus `webChangelog.test.ts`: the shipped
`APP_VERSION` must have an authored entry or the gate fails naming the
version. Watched to fail by bumping to `0.2.0` with no entry. It follows iOS's
shape — `CURRENT` + `PREVIOUS`, ALL-CAPS ≤24-char headline, terse ASCII notes,
newest-first, no duplicates — so the two repos' release discipline reads the
same.

**It is emphatically not the device firmware.** `shared/data/firmware.ts` is
the *device's* line, shared with iOS, and is what `FirmwareHistoryScreen`
prints; this is the *web shell's* own line, on its own clock. A test asserts
the two share no version, so a later edit cannot quietly merge them.

### Running note — now spent on 0.2.0

Kept as it was earned rather than reconstructed at the end, and this is what
the `0.2.0` entry was written from. **It restarts empty from here**; the
COLLECTION rename and the cap work are both in the entry above.

- **v6 parity push** — WINE EXAM on the shared bank, FIRMWARE, BLIND TASTING,
  MASTER SEARCH, recommendations, SUPPORT, the cheat console, stored-data
  export/restore, the lineage index, the rank ladder and stamp prompts, the
  marquee script, profiles, the screensaver, the demo tour.
- **The bundle merge** — share links and OG prerender, the BIOS, the
  professor's dialogue and the coachmark walkthrough.
- **The drawn art** — marquee panels, stamps, stickers, the professor's six
  expressions; and now the four moulded footer caps in all 22 colourways.
- **The chassis** — the footer cap colour model, the keyed corner, seated
  lamps, the stadium orb, NOCTURNE's charge, skin-tinted marquee lamps.
- **Foundation** — a linter and a fifth gate, the route-remount fix, the
  storage-key registry (profiles are wiped now), reduced motion, one contact
  constant, the release-blocker registry, and the changelog gate itself.

**Release shape, as performed:** one edit to `APP_VERSION`, one to
`package.json`, one new entry in `webChangelog.ts`, one `v<version>` git tag
at push time. The tag is the real record, as on the iOS side.

---

## 4a · Ruling 2 — the FIRMWARE screen narrates the web

**Decision: the screen reads `webChangelog.ts`. Nothing on the web renders
iOS's device-firmware line any more.**

The reasoning, since the ruling asked for it rather than for a swap:

**The app was contradicting itself, and the disclaimer was the tell.**
`VinodexBoot`'s POST has always printed `FIRMWARE: <APP_VERSION_DISPLAY>` —
the *web's* number — so the device's own power-on self-description already
said the firmware is the web's. `FirmwareHistoryScreen` said it was iOS's
v0.9.2 and then carried a line of copy explaining the discrepancy: *"Device
firmware, shared with the iOS build. This web shell is v0.1.0 — see the back
plate."* A page that has to tell you why it disagrees with the machine it is
running on is answering the wrong question, and that sentence was the
evidence rather than the fix.

**The reader settles it.** A web visitor has no phone. iOS's notes describe
builds they cannot install, behind an App Store listing that is not live, at
version numbers that will never match anything they see. That is noise dressed
as a changelog.

**What I did NOT strip.** The BIOS POST keeps its `FIRMWARE` row and is
unchanged — it was already correct, and it is the one place the shared *device
fiction* is stated. The fiction stays coherent because the device the player
is holding **is** the web app: one number, printed at power-on, engraved on
the back plate, and now headlining the firmware log.

**Knock-ons checked before committing.** Every consumer of
`FIRMWARE_RELEASES`/`FIRMWARE_VERSION` was enumerated: the screen, the DEV
panel's FIRMWARE LOG health row (now counts web releases), and one test. No
other copy anywhere drew the distinction. `shared/data/firmware.ts` is
**untouched** — it is iOS's authored line and not the web's to edit.

**The one remaining reference is deliberate**: `webChangelog.test.ts` still
imports `FIRMWARE_RELEASES` to assert the two release lines never share a
version. It is a test, so it is not bundled, and it is the fiction stated as a
check.

**A side benefit, measured.** Dropping the two runtime importers let Rollup
tree-shake iOS's 35.6 KB firmware table out of the eager chunk entirely:
`index-*.js` went **827,428 → 806,118 raw** and **250,924 → 243,086 gzipped**.
That is a slice of v7#U3 falling out of a correctness change.

**Supersedes v6#9**, which recorded the screen as reading the shared catalog.

---

## 5 · Deliberate improvements on iOS — for dexbot to carry back

Recorded per the design-authority ruling: the web may improve on iOS for
interaction and affordances, never for chassis geometry. Each of these is a
place the web is now ahead, and each is a candidate for the Swift side.

1. **`rgba()` cap inks are read properly.** GLOUGLOU, NOUVEAU and WALDGLAS
   author their caps as `rgba(...)`. iOS's `ChassisCapLoader.hsv(of:)` rejects
   anything that is not `#rrggbb` and falls through to a saturation of zero —
   its own note calls that "the honest failure, and the one a smoked shell
   wants anyway". The web's baker parses the channels, so the three smoke
   shells get their actual tint rather than a neutral grey. **Cosmetic,
   contained, and a small `Scanner` change on the Swift side.**
2. **Focus rings on the four moulded caps**, offset against the footer wash.
   No iOS counterpart is needed (no keyboard), so this is web-only by nature
   rather than a divergence to reconcile.
3. **A `prefers-reduced-motion` contract with a test that reads the
   stylesheet.** iOS reads `accessibilityReduceMotion` per-view; the web now
   has a single rule plus a gate that fails on any un-switchable animation.
   The *gate* is the transferable idea.

And one place the web is behind by decision, recorded so it is not read as an
oversight: **the marquee lamps are decoration here**, not quick-pin buttons.
See S7b below.

---

## 6 · Still open

Carried forward with their scope-document ids, so an item deferred twice is
visible as deferred twice.

| id | item | why it is still open |
|---|---|---|
| **v7#S5** (scope#S5) | Grille shape axis (SLATS/BARS/DOTS/MESH/NONE) | Blocked on the Device Workshop. Porting five shapes with no way to choose one is four dead code paths. Folds into **v6#35**. |
| **v7#S6** (scope#S6) | Translucent shells have no internals view | **Recommended as a deliberate deviation** rather than scheduled: iOS's `InternalsView` is 16 KB of drawn mock electronics, and a web original is poor value. Needs a ruling. |
| **v7#S7b** (scope#S7) | Marquee lamps as reassignable quick-pins | Needs a ruling. iOS's tap-to-go / hold-to-reassign does not transfer to a pointer device; the web idiom is a menu or a settings row. Colour half landed. |
| **v7#U1** | A shared `Section` primitive | `SettingsPanel:296` already has it, privately, while `EntryDetail` hand-rolls the same header 27 times — with a **different rule weight** (40% vs 100% accent). Unifying the two is a visible decision (scope#D9). |
| **v7#U2 + #U6** | Modal scrim primitive, and dialogs that are dialogs | 7 identical scrims; none has `role="dialog"`, traps focus, or closes on Escape. Keyboard users can tab out of a confirm-wipe dialog. |
| **v7#U3** | Bundle: `index-*.js` is 827 KB raw / 251 KB gz | `EntryDetail`, `EncyclopediaList`, `MainMenu` and the whole `WebsitePortal` are statically imported while 21 screens are lazy. `FIRMWARE_RELEASES` (35.6 KB) lands in the eager chunk though its only screen is lazy. |
| **v7#U5** | Inline `style={{ color: 'var(--lcd-*)' }}` → Tailwind arbitrary values | Tidying, not modernization. Listed because it reads as "basic code"; zero risk, low value. |
| **v7#U8** | **441 palette-utility uses escape the LCD remap** | The deepest structural weakness. 932 uses, 96 distinct classes, **16 remapped**. `text-green-500` follows the screen mode; `bg-green-500` and `border-green-500` do not. Worse, `EntryDetail` writes `#22c55e` — which *is* green-500 — as an inline style at 10 sites, which beats the cascade entirely. **Cannot be done by grep**: some escapes are deliberate (chassis furniture, the DexAlert-matching dialog at `index.css:229`, the portal). Needs ruling scope#D8 and its own multi-pass programme. |
| **v7#U9** | `SettingsSectionPanel` is a 697-line switch with 7 `useState` | Its primitives are good; the switch is the monolith. Section-title order is now pinned, which is what makes the split checkable. |
| **v7#U10** | `EntryDetail.tsx` is 1,549 lines | **Recommend not scheduling alone** — let it fall out of U1 + U8, which must pass through it. A standalone refactor with no functional goal is the silent refactor the brief forbids. |
| **v7#W7** | `DeviceLayout` decomposition | Explicitly deferred by the coordinator; would have collided with every Stage 2 commit. Now unblocked. |

---

## 7 · Release review — blockers before the `v0.2.0` tag (2026-08-19)

A pre-tag review found the release could not ship as committed. Ids here are
the review's own (`R-S1`…), cited qualified as `v7#R-S1`. Two commits: the
blockers, then the follow-ups.

### Commit 1 — blockers

| id | item | outcome |
|---|---|---|
| **v7#R-S1** | **CI has never passed.** `.nvmrc` pinned `20.18.0` while `jsdom@30` is ESM-only with engines `^22.22.2 \|\| ^24.15.0 \|\| >=26`; all three runs of `gates.yml` died at `npm test` with `ERR_REQUIRE_ESM`, so build / check:refs / Playwright have **never executed in CI** — every green tick the workflow badge implied was unearned. | **Done.** `.nvmrc` → **24.15.0**: same major as the local dev machine (24.14.1) so CI and local gates share a V8, current Active LTS, and exactly jsdom's stated floor for the 24 line. 22.22.2 was rejected because it puts CI on a major no local run uses. Lockfile regenerated (`npm install --package-lock-only`, npm 11.11.0, verified `npm ci --dry-run` clean); the 66 extra lines are npm 11 recording `@tailwindcss/oxide-wasm32-wasi`'s bundled optional deps, no dependency moved. |
| **v7#R-S2** | `package-lock.json` lines 3/9 still said `0.1.0` against package.json's `0.2.0` — the **third** occurrence of this exact drift (2f6effb caught the lockfile saying 0.0.0). | **Done.** The regenerate fixed the fields, and `appVersion.test.ts` now pins **both** lockfile version fields to `APP_VERSION`, so a fourth occurrence is a red test naming the fix command. |
| **v7#R-S3** | The 0.2.0 changelog entry claimed "and an install banner", but `InstallBanner.tsx:22` returns early while `APP_STORE_LISTING_IS_LIVE` is false (`shareLink.ts:30`, placeholder App Store id) — by design. Player-facing FIRMWARE HISTORY copy claiming a feature that cannot appear. | **Done.** Note reworded to what actually ships: the BIOS power-on test and the share funnel with link previews, both genuinely live. The banner re-enters the changelog when a real App Store id lands. |

**Dependency-ledger note (no sweep performed):** v6#42's hold — `@types/node`
22 → 26 "**do not** while `.nvmrc` pins 20.18.0" — is now stale on its stated
reason. With the pin at 24.15.0 the correct move is `@types/node` → the
**24.x line** (types track the pinned runtime; 26 still overshoots it). For
the next dependency pass, not this one.

### Commit 2 — review follow-ups (test-integrity, not gating)

| id | item | outcome |
|---|---|---|
| **v7#R-S4** | `storageKeys.test.ts` write-scan only matched `localStorage.setItem(` style; accessor-style calls (`ls()?.setItem(…)` in coachmarks / firstTimeTriggers / passportProgress, `storage?.removeItem(…)`) were invisible to the scan **and** to its `unresolved` reporter. A widened manual scan confirmed no key is currently missing — a hole, not a defect. | **Done.** Matcher widened to `(?:localStorage\|ls()?\|storage?)` receivers. |
| **v7#R-S5** | Nothing prevented overwriting `CURRENT` in `webChangelog.ts` without promoting the old entry — silently deleting a release from the player-facing log. | **Done.** New test: the log holds ≥ 2 releases, still contains `0.1.0`, and the floor ratchets with each release. |
| **v7#R-S6** | The two-lines-never-share-a-version test's comment cited "the distinction FirmwareHistoryScreen draws" — the screen no longer draws any (ruling §4a). And iOS's firmware line spans 0.6.2→0.9.2, so an ordinary web bump to 0.6.2 fails it by coincidence. | **Done.** Test kept; comment rewritten to say a collision means the web renumbers past the iOS-used number, not that something broke. |
| **v7#R-S7** | `reducedMotion.test.ts`'s `HANDLED` was hand-authored, so a new class reusing an existing keyframe (`.terminal-marquee-slow` is the live example) escaped the held-at-end-state check — the 0.01ms catch-all made it safety-net-only. | **Done.** The animated-class set is now derived by parsing `index.css`; each derived class must appear in `HANDLED`. `.terminal-marquee-slow` added with its own end state. |
| **v7#R-S8** | `App.routes.test.tsx:154,170` used `waitFor` after an awaited `act(…)` — a 1 s window in which an unrelated async render satisfies the assertion. | **Done.** Assertions made synchronous; the re-render is now provably caused by the poke. |
| **v7#R-S11** | `appVersion.ts:28,35` still used `v0.1.0` as the worked example. | **Done.** Version-neutral `v<version>` spelling / `v0.2.0` example. |

*(R-S9/R-S10 exist in the review but were not tasked to this pass; the gap in
the numbering is preserved rather than renumbered so the review and the ledger
can be read against each other.)*

---

## 8 · v0.2.1 — the lamps become buttons (2026-08-19)

A second execution pass on this ledger, opened by the user's instruction to
"make sure marquee status light buttons are updated" and widened by ruling to
the `DeviceLayout` decomposition and the remaining leftovers. Ids are this
section's, cited qualified as `v7#L1`. Measured against iOS **v0.9.2**
(`vinodex-ios` @ `c0532a6`), on `testing`.

### The finding that shaped the pass

**The device has three lamp groups, not one, and only one of them is a
control.** This was nearly mis-scoped twice, so it is written down:

| group | where | count | shape | colour | iOS | web before |
|---|---|---|---|---|---|---|
| the island trio | notch-level strip | **3** | circle | `skin.headerLights` | `statusDots` (`DeviceChassis.swift:945`) — pure decoration, "these lamps carry no state" | 3 decorative spans |
| the marquee pair | over the marquee, in the band | **2** | capsule | `skin.marqueeLights` [0] and [2] | `indicatorPills` → `lampButton` (`:1653`, `:1664`) — **buttons**, and reassignable quick pins | 2 decorative spans, 6px tall |
| housing + vent | white bezel, bottom strip | 2 + 1 | circle | fixed red on every shell | `ventDot` (`:1103`) | 3 flat dots, no halo |

**There is no two-versus-three discrepancy.** Both platforms carry both
groups. The three lamps that are easiest to see are the *island* trio and they
are decoration on both sides; the pins live on the *marquee* pair, which is a
separate pair further down the chassis. Nothing was dropped and nothing was
promoted to make the counts line up.

The colour tables were already exact: all 22 skins' `statusLights` triples
compared hex-for-hex against `ChassisSkins.swift:292` with zero mismatches.
The gap was never colour.

### Items

| id | item | severity | outcome |
|---|---|---|---|
| **v7#L1** (v7#W7) | `DeviceLayout.tsx` was 840 lines doing five jobs | minor, craft | **Done.** Split at cleanbot's four named seams into `marqueeArt.tsx`, `useMarqueeScript.ts`, `ChassisIsland.tsx` and `DeviceFooter.tsx`. 840 → 245 lines. Pure refactor, identical DOM, landed first so the feature below went into extracted components. The tell cleanbot named was real: two unit tests imported `MARQUEE_ART` out of a *component* file. |
| **v7#L2** | The island's **two derivations were both missing** | moderate, geometry | **Done.** iOS states them once each — the orb is as long as the whole trio (0.7.9, A1: `3 * lamp + 2 * spacing`) and as tall as one lamp (0.8.0, C1, an identity function on purpose so "a preview that writes `height: lamp` is a preview that agrees by coincidence"). The web had A1's md-breakpoint *width* (5.4rem = iOS's 86.30pt at LARGE, an exact port) against the **pre-C1** *height* (0.9/1.05rem — the 14.98/17.22pt C1 retired) and a trio at 0.625rem. So the orb was five times longer than the trio it is supposed to equal, while `DeviceLayout`'s own comment claimed the width was "three lamps and the two gaps between them" — which came to 46px against the orb's 73.6. Both rules now live in `.island-orb` / `.island-lamp`. Measured in Chromium after: orb 79.44 × 22, trio span 79.44, lamps 22 × 22 — iOS's SMALL figures exactly. |
| **v7#L3** | The marquee pair **never pulsed** | minor | **Done.** iOS: `PulseGlow(color: fill, period: 5.7, maxRadius: bandPillHeight)` (`DeviceChassis.swift:1765`). The web had no glow element on those two at all; `index.css` even listed the four live periods (5.3 / 6.1 / 7.4 / 4.8) with 5.7 conspicuously absent. |
| **v7#L4** | The housing and vent lamps were the group A6 reached last | minor | **Done.** 0.5rem against `ventDot`'s 0.65 and 0.625 against `bottomVentDot`'s 0.75, **no halo at all**, under a blanket `opacity-50`. iOS draws full-strength `Dex.red500` with a red halo at 80% — "a lamp that is lit throws light on the plastic around it". Half opacity with no halo is exactly the printed-dot reading 0.7.1's A6 exists to undo. `--lamp-halo` composes into `.recessed-lamp`'s box-shadow and is transparent at zero blur wherever it is not set. |
| **v7#L5** (v7#S7b) | The marquee lamps are decoration, not quick pins | structural | **Done, on the ruling.** See below. |
| **v7#L6** | The lamps were **invisible to every gate** | moderate, test | **Done.** The cap gate exists because "a colour-table port's real failure is a typo that compiles, and only a comparison against the table can see it"; that was equally true of the lamps and nothing checked them. 22 new per-skin Playwright cases assert the trio against `SKIN_LIGHTS`, the derived ink against `lampInk` *and* that it is genuinely a stop below its own rim, and that both lamp buttons announce their pins — plus one measured case holding A1 and C1 against the boxes the browser actually laid out. Playwright 84 → 107. |
| **v7#L8** | Making the lamps controls would have **leaked the dex into the portal** | moderate, separation | **Caught and closed in the same pass.** Every pin resolves to `/minigames` or `/settings/*`, so two moulded buttons wearing engraved TOOLS / CUSTOMIZE would have appeared on OUR WORK and CONTACT US — dex navigation and dex copy on a portal screen, and a way round the unlock doorman from a page meant to be in front of it. The lamps follow `showSystemButtons` now, exactly as SAVED and SETTINGS do. **The parts stay and the controls go:** the portal wears them unlabelled, `aria-hidden` and still breathing, because a shell that grows and loses pieces between the two products is the shared-chassis decision half-applied. `DeviceFooter.test.tsx` pins it from the route table rather than from a list of labels, so a sixth pin cannot slip past. |
| **v7#L7** | Was deleting `.dot-pulse-{red,yellow,green}` / `.lcd-pulse` a regression? | — | **No. Investigated and cleared.** They were the *pre-skin* hardcoded pulses — a blue orb and a red/yellow/green trio with the colours baked into eight keyframe stops each, at 5.3 / 6.1 / 7.4 / 4.8s. `chassis-throb` + `.chassis-glow` replaced them in `48f7759` and carry **the same four periods**, driven off the element's own `backgroundColor` so one keyframe serves all 22 shells. The names suggested red/amber/green status semantics; the CSS never had any, and neither does iOS — `statusDots`' own note says the trio carries no state. `2b49a8e` removed dead code, not intended behaviour. |

### The ruling, and what it cost

**The lamps are pressable.** iOS has had them as buttons since 0.7.2 (A9) and
as reassignable pins since 0.7.6 (A1); v7 landed the colour half and held the
behaviour half on one real question, which was that press-and-hold is a hidden
gesture with no affordance on a pointer device.

**`contextmenu` is the answer, and it is where the web deliberately goes past
iOS.** A browser raises that one event for a right-click, for the Menu key and
for Shift+F10 — so a single handler gives a mouse, a keyboard and a screen
reader the same second action without inventing a shortcut for any of them.
iOS needs a *named accessibility action* for the same job, because VoiceOver
cannot perform a long press and without one "the whole of A1's customisation
is unreachable with the screen reader on". The hold is kept for touch, where
it is the gesture iOS taught.

What came across whole, because the reasoning is iOS's and it transfers:

- **`QuickPinStore`** → `web/src/services/quickPins.ts`, with iOS's key
  spelling (`marqueeQuickPins`), cap (2), shipped pair (TOOLS, CUSTOMIZE) and
  decoder unchanged — including the padding rule ("a lamp cannot be empty; a
  dark one reads as a fault, not as an invitation") and the swap rule ("a
  device with two identical buttons is not a choice anybody made"). The
  vocabulary is the settings sections plus TOOLS, minus DEV, pinned by a test
  against `SETTINGS_SECTIONS` so a renamed section is a red test rather than a
  lamp pointing nowhere.
- **The chooser assigns and closes and does not navigate.** A surface that
  both configures a button and duplicates it is the duplication A1 deleted the
  drawer to remove. Pinned by a test that renders it with **no router at all**,
  so a stray `navigate` would throw before the first assertion ran.
- **Drawn inside the LCD**, in iOS's own slot — above the screen, below the
  scanlines — so it inherits the palette and the monochrome pass and reads as
  something the screen is doing rather than as a sheet the browser put there.
- **Three chip states**, including the middle one (the pin the *other* lamp
  holds, outlined and marked with that lamp's initial). Without it, assigning
  an already-used destination reads as the app losing a setting.
- **The pill is 30px now, not 6.** `bandPillHeight` is 30 and the 30 is
  load-bearing: iOS grew it from 24 in 0.8.5 when the pin's **name** went on
  the cap, because 24 "left `bandPillLabel` no room between `RecessedLamp`'s
  stroke stack above and the rim below". The legend is engraved — highlight
  below the letters, shade above — in `ink`, the rim mixed 45% toward black,
  **derived** (`lampInk`) rather than authored, so 22 skins get one derivation
  instead of 44 hand-picked hexes.
- **One legend size for both lamps** (0.8.6, D1), fitted to the longest word in
  the vocabulary rather than per-label, using `100cqw` so it stays fluid on a
  narrow phone. Measured: TOOLS and CUSTOMIZE both render at 11.83px.
  Per-label fitting is the exact defect D1 names — two lamps side by side
  wearing two different types.

Craft, beyond the port:

- The lamps stopped being `aria-hidden` spans and became `<button>`s announced
  as the pin they hold, which is iOS's `accessibilityLabel(pin.displayName)`.
  The **island trio stays `aria-hidden`**, correctly: iOS says outright that
  those carry no state, so hiding pure decoration is the right call and always
  was.
- The hit target reaches 44px through a pseudo-element, because `--band-pill`
  is a moulded dimension and padding would have moved it.
- The chooser is **the first dialog in this repo that is actually a dialog** —
  `role="dialog"`, `aria-modal`, initial focus, a Tab trap, Escape to close and
  focus returned to the lamp that raised it. v7#U2/U6 record seven scrims of
  which none did any of this; the pattern starts here rather than being
  retrofitted everywhere in a release about lamps.
- The moulding survives the semantics: the `<button>` is a transparent shell
  around `ChassisLamp` and no measurement moved. The lamp does not shrink under
  a finger, per iOS — "a moulded lamp that shrinks under a finger reads as
  loose. Arriving at the screen is the feedback."

Where the web could not follow, said plainly rather than approximated:

- **No workshop override.** iOS's 0.7.6 B1 split `marqueeLamps` from
  `headerLamps` into two Device Workshop axes, so recolouring the trio no
  longer repaints the pair. The web has no workshop, so both groups read the
  one `statusLights` table — which is what iOS itself does before an override
  is set. Not a deviation to fix; a screen that does not exist here yet, and
  it folds into **v7#S5**'s blocker.
- **No per-skin marquee phosphor.** iOS tints the chooser's top hairline with
  `skin.marqueeText`. The web's marquee letters are a fixed `text-green-500`
  on all 22 shells, so there is no per-skin colour to read; the hairline uses
  the LCD accent. Inventing a token would be a colour the panel below does not
  wear.

### Pre-tag review (cleanbot, 2026-08-19)

Nine findings on the released feature, all landed before the tag. Ids are the
review's own, cited qualified as `v7#W-1`.

| id | item | outcome |
|---|---|---|
| **v7#W-8** | The 0.2.1 release note said the chips read "TOOLS, CUSTOMIZE, SETTINGS, DATA or **SHOP**". They read **ACCESS**; SHOP exists only as Professor Vino's substitution (`vinoDialogue.ts:86`). Player-facing copy on the FIRMWARE screen. | **Done.** One word. |
| **v7#W-1** | `aria-modal="true"` was a **false claim**. The scrim covers only the LCD, so with the chooser open the review pressed the SETTINGS cap (went to `/settings`) and the other lamp (went to `/settings/CUSTOMIZE`). AT was told the surroundings were inert while a pointer proved otherwise. | **Done, by making it true rather than withdrawing it.** `inert` is threaded to the three surfaces outside the card — the island, the band, and the LCD content behind the scrim — from one `behindChooser` term in `DeviceLayout`. It removes a subtree from hit testing, focus and the accessibility tree in one attribute. Proved in Chromium on the two exact routes that were reachable; jsdom does not implement `inert`, so this had to be a browser test. |
| **v7#W-2** | `onPointerDown` is pointer-type-agnostic, so a 700ms **left-click** opened the chooser and swallowed the navigation — on the one device that already has a right button. | **Done.** Guarded to non-mouse pointers. The hold exists because a finger has no second button; a mouse does not need it. |
| **v7#W-3** | The keyboard-reassign claim was true on Windows and Linux and **false on macOS**, which has neither a Menu key nor Shift+F10 — so a macOS keyboard-only user had no reassign path at all, which is the exact hole iOS's named VoiceOver action exists to close. | **Done, by adding the binding rather than qualifying the claim.** **Alt+Enter**, declared in `aria-keyshortcuts` so a screen reader can announce it, and named in the shared hint. |
| **v7#W-4** | `DeviceFooter.test.tsx`'s header promised it was written from the route table "so a sixth pin pointing somewhere new cannot slip past", then iterated `DEFAULTS` — two of the five. It would have passed while a portal band offered SETTINGS, DATA or ACCESS. | **Done.** `MARQUEE_PINS` throughout. The test now enforces what it says. |
| **v7#W-5** | Two Swift→CSS radius conversions sixty lines apart, one doubled and one not, with no note saying why. | **Done.** They are not the same quantity: a SwiftUI `.shadow(radius:)` is a Gaussian sigma and a CSS `box-shadow` blur length is about twice its sigma, so it doubles; `PulseGlow.maxRadius` goes to `.blur(radius:)` and CSS `filter: blur()` takes a sigma too, so it crosses 1:1. Written down at both sites. |
| **v7#W-6** | `.lamp-legend` had iOS's `min()` cap but not its `max(…, 6)` **floor**, and `whitespace-nowrap` with no clip. Measured 6.28px at a 320px viewport with nothing to stop it going further. | **Done.** Floor added, plus `overflow: hidden` — because iOS truncates rather than shrinking on purpose: "a visible failure rather than the silent per-label refitting that was the bug". Pinned at 320px, including that D1's one-size rule still holds at the floor. |
| **v7#W-7** | `pinDisplayName` was exported, documented as the rule that stops a lamp wearing one name and landing on another, tested — and **called by nothing**. A dead seam documenting an invariant it does not enforce. | **Done, by calling it.** Three sites in `MarqueeLampButton` (accessible name, engraved legend, and the `LEGEND_CHARS` fitting width) and one in `MarqueeLampChooser`. |
| **v7#W-9** | `assignPin` never removed the key at defaults, where iOS's `persist()` does — on the stated principle that a stored value equal to the default and no stored value must not be two different states. | **Done, mirrored.** No observable difference on the web today, because `decodePins('')` returns `DEFAULTS` and every reader goes through it; mirrored anyway so the two stores answer to one description and a never-customised device looks like one in storage. Safe through profiles: restore clears every app-state key before writing a snapshot (`userProfiles.ts:186`), so an absent key restores to the factory pair. |

**One fragility found while proving W-1, and fixed with it.** Escape was bound
on the card, which works only while focus is inside it — and "the dialog is
open but Escape does nothing" is a trap, not a dialog. It is a capture-phase
document listener now; the Tab trap stays on the card, which is exactly the
region it wraps.

**Ledger note, not a fix.** The pins are correctly absent from SAVE/RESTORE —
iOS's `SavedDataKey` has no case for them either — but **profiles do carry
them**, because `userProfiles.ts:66` snapshots every app-state key rather than
an enumerated list. Worth stating plainly, since the release note says each
lamp "remembers it": switching profiles moves the lamps, and that is the
profile system working as designed rather than the pins leaking.

### Leftovers: closed, and deliberately left

| leftover | outcome |
|---|---|
| `footerCap.test.ts`'s tautological cap-token block | **Already closed** — the round-six review fixed it in `2b49a8e`. It exercises `applyTheme()` and reads the properties back off `:root`, which is a real round trip. Re-verified, not re-done. |
| S9's premultiply refinement | **Already closed.** `unpremultiply()` runs *before* the LANCZOS resize, which is the ordering the item asked for and which its own docstring argues for at length. |
| The `quantize(colors=64)` step | **Deliberately left.** Re-baking 88 PNGs moves every hash in `capsManifest.json` for no visible gain, in a release about lamps. Not a defect; a size optimisation working as intended. |
| Stale doc references | **Deliberately left.** The `DeviceLayout.tsx:NNN` line refs in `IOS-PARITY-v6.md` and `SHELL-AND-UI-SCOPE.md` are now wrong, and they are **sealed sweep records** — the house rule is that a shipped sweep's items are never edited. They are correct about the tree they measured. `README.md` carries no line-level refs and needed nothing. |
| The 4.5 MB copyrighted raw text under `web/data/encyclopedia/source/` | **Unchanged.** Surfaced in this pass's greps as it does in every one. The user's decision, not scheduled. |

### Commits

| # | Commit | Items |
|---|---|---|
| 14 | `1e5b45b` refactor: DeviceLayout decomposition | L1 (W7) |
| 15 | `66313ca` feat: the quick-pin store, ported from iOS QuickPinStore | L5, store half |
| 16 | `bd9655b` fix: the island derivation, and the lamps A6 never reached | L2, L4 |
| 17 | `0e2c91e` feat: the marquee lamps become the quick pins | L5, L3, L6 |
| 18 | `234bb9e` docs(parity): v0.2.1, the lamps section, and the portal fix | L8, this section, the bump |
| 19 | *(this commit)* fix: the pre-tag review | W-1 … W-9 |

---

## Deliberate deviations (carried forward, re-checked this sweep)

Unchanged from `IOS-PARITY.md` and v6 — **none re-raised above**:

- COLLECTION naming (not SAVED); interactive moon dial; web-only region map,
  splash and `/website` portal; scanner's flat country step; ACCESS helper
  paragraphs; no free-tier row gating (v5#20) / no mode-skin tile gating
  (v5#58); avatar as-is (v5#25); TUTORIAL keeps lucide `Flag` — no checkered
  flag exists (v5#56); web-wide mono normal-case convention (v5#32); no
  paywall; no iOS build/decode hardening; no scheduled notifications (v6#5,
  a PWA cannot keep the promise); LABEL SCAN stays COMING SOON (v6#4).

**Added this sweep:**

- **`unlockedAppIDs` survives a data wipe** (v7#W25). iOS has no counterpart;
  wiping it would log the player out of the dex, which is a different
  destructive act from the one the button offers.
- **Marquee panels are dex chrome.** The five portal titles fall through to
  the lucide glyph on purpose (v7#W3).
- **The re-ink algorithm exists in two languages**, Swift and Python, with a
  hash gate between them (v7#S-caps). Knowingly accepted.
- **The saved-shelves chassis button is labelled COLLECTION**, where iOS
  labels it **User** (0.8.5, A1). By ruling. iOS renamed it off "Saved
  entries" because the page behind it holds three shelves and the label named
  one of them — true here too. The web follows neither word, because it does
  not follow iOS's page *title* either: COLLECTION rather than SAVED is a
  long-standing deviation, and a chassis control announcing a name the page
  does not use is that deviation half applied.
- **FIRMWARE HISTORY narrates the web's releases, not the device firmware
  line** (ruling, §4a). iOS's `shared/data/firmware.ts` is untouched and
  unread by anything the web bundles.

**Added in the v0.2.1 pass (§8):**

- **The marquee lamps' second action is reached three ways, not by a long
  press alone.** iOS uses press-and-hold plus a named VoiceOver action. The web
  uses `contextmenu` (right-click, and the Menu key / Shift+F10 on Windows and
  Linux), **Alt+Enter** declared in `aria-keyshortcuts` — because a macOS
  keyboard has neither of those keys, and without it the "a mouse, a keyboard
  and a screen reader all reach it" claim is false on one of the three major
  desktops (v7#W-3) — and a long press on touch only, since a mouse already has
  a second button (v7#W-2). A deliberate improvement on interaction, under the
  standing rule that chassis *geometry* matches iOS while affordances may not.
- **The chooser's top hairline is the LCD accent, not the shell's marquee
  phosphor.** The web has no per-skin marquee text colour to read — its
  marquee letters are one green on all twenty-two shells — so the token iOS
  reads does not exist here. Recorded rather than invented.
- **The island trio and the marquee pair share one colour table.** iOS split
  them into two Device Workshop axes in 0.7.6 (B1); with no workshop on the
  web there is nothing to override, and both groups read `statusLights` —
  which is iOS's own behaviour until an override is set. Folds into v7#S5's
  blocker rather than standing as a gap.
- **The island trio stays `aria-hidden`.** Not an oversight and not a
  downgrade: iOS's `statusDots` says outright that those three lamps carry no
  state, so they are decoration on both sides and hiding them from the
  accessibility tree is correct. Only the marquee pair became controls.

Carried open from v5 as *skipped*, still portable if wanted:

- (v5#7) DATA LOAD ERROR state — still an edge case with no load-error signal
  to branch on.

---

## Notes

- **`SHELL-AND-UI-SCOPE.md` is uncommitted on purpose**, at the coordinator's
  instruction, as the review artifact for this pass. Its §2.4 carries the full
  option table and byte measurements behind the cap-art ruling; nothing in it
  is superseded by this document except the items marked Done above.
- **iOS's `CHANGELOG.md` has no 0.7.x–0.8.x entries** (it jumps 0.9.0 → 0.6.5).
  The entire chassis history is in commit bodies and doc comments, which is why
  this pass quotes commit messages. **A dexbot task**, not a web one.
- **A pre-existing stray BEL byte** in `sync-shared.ps1`'s comments (a `\a`
  escape from `web\public\art`) was fixed while adding the FooterArt leg. The
  file is verified byte-clean ASCII.
- The standing known issue — **4.5 MB of copyrighted raw text** under
  `web/data/encyclopedia/source/` — surfaced again in this pass's greps.
  Unchanged, the user's decision, not scheduled.
