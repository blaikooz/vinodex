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
- **Open, carried forward:** S5, S6, S7b, U1–U6, U8–U10. See "Still open".

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
