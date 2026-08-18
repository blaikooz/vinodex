# Web ↔ iOS parity plan — v6 (the v0.9.2 sweep)

_Follows `IOS-PARITY-v5.md`. This is a **full-app structural sweep** against
iOS **v0.9.2** (**`origin/testing` @ `c0532a6`** — `origin/main` sits at
`328861b`, the v0.9.1 merge; corrected per review R1), measured 2026-08-17.
The web side surveyed is branch `batch4-into-testing` (`8f4ef9d`), working tree
clean. Severity: **cosmetic** (a glyph/word), **minor** (layout/order/copy),
**moderate** (a missing control or section), **structural** (a screen or
system that does not exist here)._

> **Sealed sweep record once executed.** The canonical standing document is
> `IOS-PARITY.md`. Items below are per-document ids — cite them qualified
> (`v6#12`). Carried-forward items name their old id in parentheses.

## Why this sweep is shaped differently from v5

v5 was a page-by-page polish pass: 63 small items against iOS v0.6.x. Since
then iOS shipped v0.7.x → v0.9.2 — **355 files changed in
`Sources/VinodexUI` + `VinodexCore` alone, ~28,700 insertions** since the
v0.7.7 shape recorded in `IOS-PARITY.md`. The gap is no longer polish; it is
whole systems, plus a chassis redesign, plus a hand-drawn art layer that
replaced most SF-symbol chrome. So v6 leads with **rulings and structural
items**, and the fine-grained cosmetic diffing of any screen it ports is done
*at port time*, not enumerated here.

---

## Status — first execution pass done (2026-08-18, on `batch4-into-testing`)

Cleanbot's corrections R1–R5 are applied above. Gates at close of pass:
typecheck clean · **417 tests / 30 files** · build OK · check:refs zero
dangling.

- **Done:** #1 (sync landed; plus an unplanned **repair** — the v0.9.2 master
  removed exports only the web read: `getStylePalette`/`isLightColor`/
  `darkenHex` → `web/src/services/colorHelpers.ts`, `extractTagAbbrev` →
  `entryDisplay.ts`, `WINE_ENTRIES` → `buildWineEntries()`, and `check:refs`
  learned the iOS authored-blurb rule for coming-soon country gates);
  **#8** (WINE EXAM on the shared bank — `examPaper.ts`, `examProgress.ts`,
  `WineExamScreen`, `/quiz` repointed, quiz engine now daily-only, 30 ported
  ExamTests cases, bank pinned 420 = 144/151/125); **#9** (FIRMWARE screen +
  grid tile; TUTORIAL moved into SETTINGS per iOS 0.7.6 F1); **#10, #11, #13**
  (BLIND TASTING, orb → MASTER SEARCH chip filter with L35 focus, LABEL SCAN
  COMING SOON slot, derived walkthrough sentence); **#15** (palate profile +
  recommendations engine with 8 ported tests, passport strip + SHOW ALL +
  `/recommendations`); **#25** (SUPPORT screen + service + tests); **#29**
  (cheat console — the three codes whose effects exist); **#31** (stored-data
  archive with export/restore UI, 9 ported tests, forward-compat parsing per
  the review note); **#39** (accessible names); **#40** (ScreenLoading
  consolidated, landed first); **#41** (safe dep batch, own commit, gates
  before/after); **#42/#43** (cadence + holds recorded, nothing bumped).
- **Done in the second execution pass (2026-08-18, continued):** #16 (the
  lineage index, `/lineage/:entryId`, the entry-page door — 10 ported cases,
  with the off-catalog-ancestor property moved onto a fixture because Gouais
  Blanc earned an entry); #17+#21 (rank ladder at the bundle's exact
  thresholds verified against `Passport.swift:91-97`, announce ledgers on the
  iOS storage keys, RANK card, StampUnlockedPrompt queue wired at the TRIED
  pill — the passport's insight-panel lines remain the open tail of #21);
  #20-script (the marquee state machine whole; DeviceLayout retires the
  hardcoded 0.6.9 cheers loop); #22 (SETTINGS section order); #30 (demo
  tour); #32 (profiles); #33 (screensaver + the one 60 s idle threshold);
  #34 (DEV health delta); plus cleanbot's batch-1 fixes (M1-M3, L1-L2, I1
  answered).
- **Deferred to the next pass:** **#23 + #26-dialogue as one unit** — the
  dialogue bank is keyed by `FirstTimeTrigger` (`VinoDialogue.line(for:)`),
  so the coachmark/trigger engine and the professor's lines are one system:
  17 triggers, a 605-line authored bank, `Coachmark.swift` (537 lines),
  `ProfVinoScreen`, and per-screen wiring. Sized like the exam port; wants
  its own pass, not a tail. **#19-geometry** — the five shared skins verify
  unchanged at the token level (`ChassisSkins.swift:384-388` still names the
  same five colours the web tables carry); the 0.8.9x mass is 17 new skins +
  the cap colour model + the moulded skirt, whose own approval names the
  screenshot gate in both screen modes, and no headless browser exists in
  this repo's deps to run it. Blind chassis edits were declined.
- **Reassigned external:** #24 (BIOS boot) — the pending bundle carries a
  `VinodexBoot` implementation; do not build a second one.
- **Blocked pending user rulings (untouched):** #2–#7, #12, #14,
  #26-portrait and all drawn-art halves, #27, #28, #35–#38.
- **Ledger notes from execution:** the web archive accepts the iOS app tag on
  import but iOS accepts only its own — a web archive does not restore on
  iOS; if that matters it is a dexbot change. `SavedDataKey` divergence:
  web's `starterOnly` vs iOS `starterTierOnly` storage key, confined to the
  never-imported field, recorded here rather than renamed (a rename resets
  stored state).
- **Verified during survey (no change needed):** catalog parity — the mirror
  carries all 446 entries and `coverage.test.ts` pins them (177/124/33/6/106,
  updated by the 0.8.x batch syncs with comments); recently-viewed, daily
  challenge, sounds, haptics, UI scale, and the entitlement test harness all
  already ported and wired; deliberate-deviation list re-checked — nothing
  below re-raises a settled deviation.

---

## 0 · Preconditions

1. **The `shared/` mirror is stale.** Master
   `HGapps\shared\data\firmware.ts` is 35,631 bytes (carries the 0.9.x
   releases); the web mirror's copy is 26,944 bytes, last synced at iOS
   v0.8.91 (`8f4ef9d`). **User action:** run `sync-shared.ps1` (and
   `npm run generate` in vinodex-ios if `Resources/*.json` moves). Any moved
   coverage pins get updated with a comment naming the batch. This must land
   before v6#9 (firmware screen) reads the data. _moderate — process._

## Phase 0 · Rulings needed before their items can be scheduled

These are product decisions, not ports. Each blocks the items listed.

2. **Drawn-art transport.** From 0.8.1 (J3) onward iOS replaced SF-symbol
   chrome with hand-drawn PNGs: `Resources/ButtonArt` (31 files),
   `MarqueeArt` (36), `GlyphArt` (22), `FooterArt` (4), `StampArt` (10),
   `StickerArt` (20), `CartridgeArt` (17), `VinoArt` (6 Prof Vino
   portraits). House rule: drawn art lives in `vinodex-ios\art\` and never
   comes here; pixelflags are the sole exception, made because the web
   imports them. Options: **(a)** keep the lucide idiom and record the whole
   art layer as a deliberate deviation; **(b)** promote selected art dirs
   into `HGapps\shared` (an explicit `sync-shared.ps1` edit — user's call).
   Blocks the drawn-art halves of v6#14, #19, #20, #21, #26, #36 and #37
   (list corrected per review R4). _ruling._
3. **The Shop.** iOS's ACCESS tile is labelled SHOP (`DexRoute.swift:152–157`)
   and opens a purchase UI over `PurchaseProvider` / `EntitlementStore`. The
   web tier is deliberately free and un-gated (standing "Out of scope" in
   `IOS-PARITY.md`), and the web ACCESS panel already models entitlements as
   a test harness (`web/src/services/access.ts`). Reconfirm out-of-scope, or
   rule otherwise. Blocks v6#24, #25, #26 gating, and the ACCESS→SHOP label
   (which I recommend **keeping as ACCESS** on web — the honest label for a
   panel that sells nothing). _ruling._
4. **Label Reader OCR.** `LabelReaderView` + `OCRService` /
   `LabelRecognitionService` need a web OCR dependency (e.g. tesseract.js,
   ~2 MB wasm) plus `getUserMedia` camera plumbing. New dependency = user's
   call. Blocks v6#27. _ruling._
5. **Notifications.** iOS DAILY REMINDER (`SettingsPanel.swift:1003`,
   `NotificationScheduler`, 0.7.8 D1). The web equivalent is the Notifications
   API + service-worker scheduling — partial support, permission-prompt UX
   cost, and our SW config is deliberately tuned and fragile to touch. Options:
   port, or record as platform-unavailable like haptics. Blocks v6#28.
   _ruling._
6. **WHAT'S THAT…? / daily reveal.** iOS deleted the guessing game outright in
   0.8.93 ("screen, engine and record" — `ToolsScreen.swift:142–147`); the web
   still ships it (`DailyGrapeScreen.tsx`, `/daily`, `dailyPick.ts` + tests,
   the tools-hub tile at `MinigamesScreen.tsx:73`). Delete to match, or keep
   as a deliberate deviation. My recommendation: **delete** — iOS's reasoning
   (Prof Vino supersedes it) applies equally here, and a tool iOS killed will
   otherwise be rediscovered as drift forever. _ruling._
7. **Web-portable share.** iOS share cards (`ShareCards.swift`, 0.7.8 B;
   `VinodexWeb.swift` even builds share strings against *this app's* URL).
   Web path: render the card to canvas + Web Share API with clipboard
   fallback. No new dependency needed — this ruling is only "do we want share
   affordances on the free web app at all". Blocks v6#12. _ruling (cheap)._

## Phase 1 · Data already synced, unread — the sharpest gap

8. **WINE EXAM runs on the shared question bank.** `shared/data/exam.ts`
   (293 KB, 407+ questions) is re-exported and has **zero web importers** —
   verified this sweep. iOS `WineExamScreen.swift` (1,151 lines) assembles
   seeded papers via `ExamPaper` (fixed length, pass mark, category tallies
   via `ExamProgress`), while `TastingQuizScreen` keeps only the daily
   challenge (`WineExamScreen.swift:18`). The web's `/quiz` route is titled
   WINE EXAM (`TastingQuizScreen.tsx:107`) but generates its own questions
   from the catalog (`quiz.ts`) — the title claims a product the screen
   isn't. Port: `examPaper.ts` service (port `ExamPaper`/`ExamProgress` +
   their XCTest cases), new `WineExamScreen.tsx`, `/quiz` route points at it;
   the quiz engine stays solely behind `/daily-challenge`, matching iOS.
   _structural — the highest-value item in this document._
9. **FIRMWARE HISTORY screen.** `FIRMWARE_RELEASES` / `FIRMWARE_VERSION`
   re-exported at `shared/constants.ts:33`, zero web importers.
   `FirmwareHistoryScreen.swift` (159 lines — small) renders the installed
   version and every release, newest first. Web: `/firmware` route +
   settings-grid tile (iOS moved the tile beside SHOP in 0.8.92,
   `SettingsPanel.swift:55,141`). Depends on v6#1 (stale mirror). Note the
   two-version rule: the panel describes the *iOS device firmware* narrative;
   the web back plate keeps its own v0.x web version. Copy needs one line
   saying which number this is. _structural — small, data waiting._

## Phase 2 · Existing screens that drifted

### Tools hub (`MinigamesScreen.tsx` vs `ToolsScreen.swift`)

10. **SCANNER → BLIND TASTING.** iOS renamed twice since (0.7.0 I3, 0.7.1
    E3); UI string + glyph only (`ToolsScreen.swift:91` vs
    `MinigamesScreen.tsx:66`); routes/persisted names stay, per iOS's own
    convention. _minor._
11. **FILTER SEARCH leaves the shelf; the menu orb opens it.** iOS 0.7.0
    (I1/I2): master search *is* the chip-filter screen, reached from the main
    menu's central button (`MainMenuScreen.swift:412–415` →
    `.chipFilter`); the web orb still opens the plain search list
    (`MainMenu.tsx:75` → `MASTER_SEARCH`) and keeps a FILTER SEARCH tile on
    the shelf (`MinigamesScreen.tsx:67`). Change the orb target to
    `/chip-filter`, drop the shelf tile, keep `/list/MASTER_SEARCH` alive for
    existing links. _moderate._
12. **Share pill + share cards** on entry detail / passport / daily result
    (`EntryDetailScreen.swift:79–80,189,380`; `ShareCards.swift`). Web has no
    share affordance anywhere. Blocked on v6#7. _moderate._
13. **Shelf slots after the above:** WINE EXAM (v6#8) and DAILY CHALLENGE
    stay; LABEL SCAN takes a slot when v6#27 unblocks; PROF. VINO takes the
    WHAT'S THAT…? slot per v6#6/v6#14. Until then the web shelf runs
    four/five tiles — iOS's own COMING SOON treatment
    (`ToolsScreen.swift:177–191`) is the documented interim for an announced
    slot. _minor._

### Entry detail (`EntryDetail.tsx` 1,421 lines vs `EntryDetailScreen.swift` + `Rows` + `Sections`)

14. **Prof Vino presenter hooks** (`EntryDetailScreen.swift:86`) — the
    professor comments on entries via `VinoDialogue`. Part of v6#26; recorded
    here so the detail-screen diff is complete. _structural (system)._
15. **YOU MIGHT LIKE.** Recommendation strip on detail + full screen
    (`RecommendationsScreen.swift`, 116 lines, 0.8.91 B3; engine in
    `VinodexCore/Insight.swift` + `Discovery.swift`). Web has neither strip
    nor screen — no `recommend` hit anywhere in `EntryDetail.tsx`. Port the
    engine with its tests, then the strip + screen. _structural._
16. **GRAPE LINEAGE door.** Grape details link into the pedigree tree
    (`EntryDetailScreen.swift:75` — "Only LINEAGE reaches it from here");
    screen is `GrapeLineageScreen.swift` (724 lines), index in
    `GrapeLineageIndex.swift`, pedigree authored on the grape cards (data
    already in the catalog). iOS gates it behind an entitlement — on web it
    ships un-gated per the standing free-tier rule. _structural._
17. **Passport stamp announcements from marking tried**
    (`EntryDetailScreen.swift:436–457` — `announceTier` / `announce` +
    `StampUnlockedPrompt`). Web marking-tried updates counts silently. Lands
    with v6#21. _moderate._
18. **Coachmark reporting** (`EntryDetailScreen.swift:430`) — part of v6#23.
    _noted for completeness._

### Main menu & chassis

19. **Chassis 0.8.9x redesign.** iOS rebuilt the chassis into
    `Chassis/` (all eight files added since v0.7.7): moulded skirt (0.8.96),
    a single colour model for the four footer caps (0.8.94–0.8.99), a full
    button pass (0.8.98), drawn footer/button faces (`FooterArt`,
    `ButtonArt`), and `AgedMaterial` weathering. The web `DeviceLayout.tsx`
    (444 lines) is the pre-0.8.9 geometry. **Split:** the geometry/colour-
    model half is portable now (compare `ChassisSkins.swift` /
    `ChassisStyle.swift` hex tables against `theme.ts` at port time); the
    drawn-face half is blocked on v6#2. _moderate (geometry) + blocked
    (art)._
20. **Marquee: script + lamp buttons.** iOS's marquee runs
    `MarqueeScript` (per-screen text with rules) and its two lamps became
    **buttons** pointed at `QuickPins` targets (0.7.6 A1,
    `MarqueeLampChooser.swift`); pin vocabulary is `MarqueePin`. Web marquee
    is a repeating title with a per-route lucide glyph
    (`DeviceLayout.tsx:131–146`) and three decorative lamps
    (`DeviceLayout.tsx:239–245`). Script parity is portable now; drawn
    marquee art blocked on v6#2; lamp-pin cosmetics interact with v6#3.
    _moderate._

### Passport & collection

21. **Passport depth.** iOS `PassportScreen.swift` is 740 lines — "what the
    tried shelf adds up to, plus the stamps": ranks/tiers, stamp wall,
    share. Web `PassportScreen.tsx` is 126 lines (counts + best streak).
    Port alongside **stamp collection** (`StampCollectionScreen.swift`, 238
    lines, 0.8.6 C3/C4; `StampFrame.swift`; `BackPlateStamps` exists on web
    already) and **StampUnlockedPrompt** (v6#17). Stamp art blocked on v6#2;
    structure and logic are not. _structural._

### Settings (`SettingsPanel.tsx` 820 lines vs `SettingsPanel.swift` 2,798)

22. **SETTINGS section missing six rows/doors.** iOS's system-settings panel
    carries DEVICE WORKSHOP (`SettingsPanel.swift:1849`), DAILY REMINDER
    (`:1003`), SUPPORT (`:2042`), CHEAT CODES (`:2071`), DEMO MODE
    (`:2088`), STORED DATA (`:2103`). Web has sounds + haptics + clear-data
    only. Each door lands with its system (v6#28, #29, #30, #31, #32, #25);
    this item is the section's final layout parity check. _moderate._

## Phase 3 · Missing systems, portable without rulings

Ordered by value-for-effort.

23. **Coachmarks / first-run triggers.** `CoachmarkOverlay.swift` (0.8.9d G1),
    `VinodexCore/Coachmark.swift`, `FirstTimeTriggers.swift`. Web has no
    onboarding nudges at all beyond the walkthrough screen. _structural._
24. **BIOS boot.** `VinodexBootView.swift` (673 lines; 0.7.7 BIOS redesign,
    0.8.91 G3 palette), `VinodexCore/Bios.swift` + `BootSequence.swift`
    (power-on self test lines). Web cold-start goes straight to the splash.
    Natural web shape: a once-per-session boot on entering `/dex`, honouring
    `prefers-reduced-motion`. _structural._
25. **Support screen.** `SupportScreen.swift` (0.8.91 F1) +
    `SupportContact.swift` — the in-app contact door. **Separation rule
    applies:** this is a dex screen; it must not import or link the portal's
    `ContactScreen`, and vice versa. _structural (small)._
26. **Prof Vino.** `ProfVinoScreen.swift` (282 lines, 0.8.93),
    `VinoDialogue.swift` (character rules), `VinoBubble` / `VinoIntroCard` /
    `ToolIntroCard`. Portrait art (`VinoArt`) blocked on v6#2 — the dialogue
    engine, page and tools-shelf slot are not (interim: lucide
    `GraduationCap`). _structural._
27. **Label reader.** `LabelReaderView` + VM, `OCRService`,
    `LabelReading` / `LabelTextScan` / `LabelRecognitionService` matching
    pipeline. Blocked on v6#4. _structural._
28. **Daily reminder.** Blocked on v6#5. _structural (small)._
29. **Cheat console.** `CheatConsoleScreen.swift` (203 lines) +
    `CheatCodes.swift` — codes grant entitlements through the access store;
    the web access store already exists, so this ports cleanly and gives the
    un-gated web tier its easter-egg door. _structural (small)._
30. **Demo mode.** `DemoMode.swift` — the unattended tour over `DexRoute`
    stops (0.7.3 A2). Ports as a route-driving timer. _structural (small)._
31. **Stored data archive.** `SavedDataArchive.swift` — export/import of the
    whole saved state as one user-owned file (`SettingsPanel.swift:517–530`
    restore flow, `:2103` section). Web shape: JSON download/upload. Note the
    shared persisted-vocabulary rule: the archive format is cross-app
    currency — keys must match the Swift raw values exactly. _structural._
32. **User profiles.** `UserProfiles.swift` — up to five named snapshots of
    saved state (0.8.92). Builds directly on v6#31's serialize path.
    _structural._
33. **Screensaver + idle monitor.** `Screensaver.swift`, `IdleMonitor.swift`,
    `ScreensaverBounce.swift`. Web: idle timer + bouncing mark overlay,
    `prefers-reduced-motion` honoured. _structural (small)._
34. **Diagnostics.** `DiagnosticsReport.swift` + `InternalsView.swift`. Web's
    DEV panel already carries health rows (v5 #59–62); this is the gap
    between those and iOS's full report/internals view — diff at port time.
    _moderate._

## Phase 4 · Blocked on the Shop ruling (v6#3)

35. **Device Workshop.** `DeviceWorkshopScreen.swift` (897 lines) +
    `CustomDevices.swift` — the premium device builder (0.7.3 B1/B2).
    _structural — blocked._
36. **Expansion packs / cartridges.** `PackCartridge.swift`,
    `ExpansionPackMembers.swift`, `ExpansionPacks.swift`, `CartridgeArt`
    (also touches v6#2). _structural — blocked._
37. **Cosmetic entitlements** (`CosmeticEntitlements.swift`, `SkinEmblem`,
    `SkinSticker`, sticker/emblem art). _structural — blocked (v6#2 + v6#3)._
38. **The Shop itself** (ACCESS panel becomes a purchase UI,
    `SettingsPanel.swift:662` `case .access: shop`). _structural — blocked,
    and my standing recommendation is out-of-scope stays._

## Craft debt (recorded, not opportunistically fixed)

39. **Literal newlines in accessible names.** The tools tiles pass
    `'FILTER\nSEARCH'` etc. through `whitespace-pre-line`
    (`MinigamesScreen.tsx:46,67–74`) — the same accessible-name bug Block 10
    fixed for `WHO WE\nARE`. Fix pattern exists: let the browser wrap.
    _minor._
40. **Duplicated Suspense fallbacks.** `App.tsx:326–346,362–377` hand-roll
    the loading chassis for moon dial and globe; `ScreenLoading` (App.tsx:62)
    already exists for exactly this. _cosmetic._

## Dependencies (`npm outdated`, 2026-08-17)

41. **Safe batch — take as one change:** `@tailwindcss/postcss` 4.3.3,
    `tailwindcss` 4.3.3, `@testing-library/user-event` 14.6.5, `@types/node`
    22.20.1, `@types/react` 19.2.18, `@types/react-dom` 19.2.4,
    `autoprefixer` 10.5.4, `postcss` 8.5.26, `react`/`react-dom` 19.2.8,
    `react-router-dom` 6.30.4, `vite` 6.4.3, `vite-plugin-pwa` 1.3.0. All
    patch/minor inside current majors. Own branch, four gates before/after.
42. **Majors — each its own branch, own pass, migration notes read first:**
    - `lucide-react` 0.554 → **1.31**: a 1.0 landed; glyph renames/removals
      would hit every screen's chrome. Needs a full icon-name audit before
      proposing.
    - `react-router-dom` 6 → 7: route-definition changes across `App.tsx`.
    - `vite` 6 → 8 **with** `@vitejs/plugin-react` 5 → 6 (paired): must
      re-verify the tuned PWA/SW config (unminified SW, runtime-cached art,
      `server.fs.allow` repo root) survives.
    - `typescript` 5.8 → 7: two majors; hold until the toolchain
      (vite/vitest) declares support.
    - `three` 0.183 → 0.185: 0.x minor-as-major; globe smoke test required.
    - `@types/node` 22 → 26: **do not** while `.nvmrc` pins 20.18.0 — types
      should track the pinned runtime, and changing the pin is a decision.
43. **Do not touch:** `jsdom` reports latest 29.1.1 *below* current 30.0.1 —
    dist-tag artifact; never "upgrade" backwards.
    Environment note (not a repo change): the local shell ran node v24.14.1
    against the 20.18.0 pin; gates for any dependency work should run under
    the pinned version.

---

## Execution order (proposed)

| Stage | Items | Gate |
|---|---|---|
| 0 · user actions | v6#1 sync; rulings v6#2–#7 | — |
| 1 · data-ahead-of-UI | v6#8 exam, v6#9 firmware | four gates + route smoke each |
| 2 · hub & menu realignment | v6#10, #11, #13, #6 outcome, #39 | gates + screenshots |
| 3 · entry-detail systems | v6#15, #16, then #12 (if ruled) | gates + screenshots |
| 4 · passport & stamps | v6#21, #17 | gates + screenshots |
| 5 · frame & feel | v6#19 (geometry half), #20 (script half), #24, #33, #23 | gates + screenshots both screen modes |
| 6 · settings systems | v6#31, #32, #29, #30, #25, #34, #22, #28 (if ruled) | gates |
| 7 · ruled-on ports | v6#26, #27, #35–#38 as rulings allow | gates |
| 8 · dependencies | v6#41 first; majors from v6#42 one at a time, never mixed with feature work | gates before/after each |

All work on `testing` (branched per stage), never `master`; merging to
`master` is a publish to vinodex.vercel.app and is the user's call. Each
stage: `npm run typecheck` → `npm test` → `npm run build` →
`npm run check:refs`, then a headless smoke of every touched route and a
screenshot of anything visual.

## Deliberate deviations (carried forward, re-checked this sweep)

Unchanged from `IOS-PARITY.md` — none re-raised above:

- COLLECTION naming (not SAVED); interactive moon dial; web-only region map,
  splash, and `/website` portal; scanner's flat country step; ACCESS helper
  paragraphs; no free-tier row gating (v5#20) / no mode-skin tile gating
  (v5#58); avatar as-is (v5#25); TUTORIAL keeps lucide `Flag` — no checkered
  flag exists (v5#56); web-wide mono normal-case convention (v5#32); no
  paywall; no iOS build/decode hardening.

Carried open from v5 as *skipped*, still portable if wanted:

- (v5#10) APPELLATION full spelled-out name — **since closed** by Block 13's
  `entryDisplay.ts`; verified present this sweep. No longer open.
- (v5#7) DATA LOAD ERROR state — still open, still an edge case with no
  load-error signal to branch on.

## Notes

- iOS `Screens/` also split `CatalogScreen` / `ContinentScreen` /
  `CountryScreen` / `StateScreen` out of one list screen; the web's single
  `EncyclopediaList` + routes covers the same surface and is the web idiom —
  not raised as drift. Interior diffs of those lists belong to the stage-2/3
  port passes.
- `VinodexCore/VinodexWeb.swift` — iOS now builds share strings against
  *this app's* public URL (0.8.94 D1). Any route rename on the web breaks
  links iOS users share; treat web route paths as shared vocabulary from now
  on.
- The standing known issue (4.5 MB copyrighted raw text under
  `web/data/encyclopedia/source/`) surfaced again in this sweep's greps;
  unchanged, user's decision, not scheduled.

---

## Review — cleanbot (2026-08-17, read-only spot-check pass)

**Overall verdict: approve with corrections.** Claims were spot-checked against
both trees. Every cited iOS line ref resolved (`DexRoute.swift:155` SHOP,
`ToolsScreen.swift:91/142–147/177–191`, `MainMenuScreen.swift:412–415`,
`EntryDetailScreen.swift:75/79–80/86/430/436–457`,
`SettingsPanel.swift:55/141/517–530/662/1003/1849/2042/2071/2088/2103`); all
30 cited iOS source files exist at the named paths; the byte sizes
(firmware.ts 35,631 vs 26,944; exam.ts 293 KB, 421 prompts — "407+" holds),
line counts (WineExamScreen 1,151; FirmwareHistory 159; Recommendations 116;
GrapeLineage 724; Passport 740/126; StampCollection 238; Boot 673; ProfVino
282; CheatConsole 203; DeviceWorkshop 897; SettingsPanel 2,798/820;
EntryDetail 1,421; DeviceLayout 444; Chassis/ 8 files), the web line refs
(TastingQuizScreen:107, MinigamesScreen:46/66–74, MainMenu:75, App:62/326–346/
362–377, DeviceLayout:131–146/239–245), the coverage pins (446 =
177/124/33/6/106), `.nvmrc` 20.18.0, and current package.json versions all
verified. Zero web importers of `shared/data/exam.ts` and of
`FIRMWARE_RELEASES` confirmed; no share affordance on web confirmed.

### Corrections (fix before execution)

- **R1 — header claim wrong about `main`.** Locally, `origin/testing` is at
  `c0532a6` (v0.9.2) but `origin/main` is at `328861b` (the v0.9.1 merge);
  the branches diverge 1↔12. Either the local remote refs are stale or the
  header's "both `main` and `testing`" is wrong. The reference point for this
  sweep should read **`origin/testing` @ `c0532a6`** until re-fetched.
- **R2 — GlyphArt is 22 files, not 23** (counted on disk at `c0532a6`,
  `Sources/VinodexUI/Resources/GlyphArt/`). Cosmetic, but the ruling doc
  should carry the right inventory.
- **R3 — v6#6's deletion scope would break three live systems.**
  `web/src/services/dailyPick.ts` is not solely the guessing game's engine:
  `dayIndex` is imported by `dailyChallenge.ts`, `moonService.ts`, and
  `bookmarks.ts`, and `TastingQuizScreen.tsx:80` seeds the daily challenge
  from `revealCursor() + dayIndex()`. If delete is ruled: remove
  `DailyGrapeScreen.tsx`, the `/daily` route, and the tools tile — but **trim**
  `dailyPick.ts` to the shared primitives (`dayIndex`, `revealCursor`) rather
  than deleting the file and its tests wholesale.
- **R4 — v6#2's cross-reference list has suspect ids.** It blocks "the
  drawn-art halves of v6#14, #26, #32, #33, and the tile faces of v6#30" —
  but #32 (user profiles) and #30 (demo mode) do not declare an art
  dependency in their own entries, while #19 (chassis faces), #20 (marquee
  art), #21 (stamp art) and #36 (cartridge art) *do* self-declare a v6#2
  block and are missing from this list. Reconcile the list with the entries.
- **R5 — v6#17 appears in both stage 3 and stage 4** of the execution table;
  its own text says it lands with v6#21 (stage 4). Remove it from stage 3.

### Per-item verdicts

| Item | Verdict |
|---|---|
| #1 | **approve** — sizes verified byte-exact; `sync-shared.ps1` scope confirmed (syncs both repos; note it also dirties `vinodex-ios/shared`, which is the user's/dexbot's side to commit). |
| #2 | **block-pending-ruling** — apply R2/R4 first. |
| #3 | **block-pending-ruling** — refs verified; the keep-ACCESS recommendation is sound (honest label). |
| #4 | **block-pending-ruling** — if ruled yes, the ~2 MB wasm must be lazy-loaded and explicitly handled in the tuned SW precache config, which the plan itself calls fragile. |
| #5 | **block-pending-ruling** — the platform-unavailable option is the lower-risk path given the SW fragility note. |
| #6 | **block-pending-ruling** — and apply R3 to whichever way it is ruled. |
| #7 | **block-pending-ruling** — cheap, as stated. |
| #8 | **approve** — highest-value confirmed. Fold in: once `/quiz` repoints, strip the exam mode out of `TastingQuizScreen.tsx` (its `mode === 'daily'` ternary at :107 becomes dead) so the quiz engine is genuinely daily-challenge-only. |
| #9 | **approve** — gated on #1, as stated. |
| #10 | **approve** — both sides verified. |
| #11 | **approve-with-note** — also update `WalkthroughScreen.tsx:28`, whose tools blurb ("Scanner, filter search, wine exam, the daily challenge, and the moon dial") drifts on four counts once #10/#11/#6/#8 land. Fold into stage 2. |
| #12 | **blocked** on #7. |
| #13 | **approve** — COMING SOON precedent verified at `ToolsScreen.swift:177–191`. |
| #14 | **blocked** — rides #26 (system) and #2 (portrait). |
| #15 | **approve-with-note** — engine files verified. Implement as an extracted strip component + `recommendations.ts` service with ported tests; `EntryDetail.tsx` is already 1,421 lines and #14–#17 all press on it. New detail systems land as imports, not inline growth. |
| #16 | **approve** — un-gated web ship is consistent with the standing free-tier deviation (v5#20). |
| #17 | **approve** — stage 4 only (R5). |
| #18 | noted, no action. |
| #19 | **approve (geometry half) / blocked (art half)** — screenshots in both screen modes, as the table says. |
| #20 | **approve (script half) / blocked (art half)**. |
| #21 | **approve (structure/logic) / blocked (stamp art)**. |
| #22 | **approve** — as the final layout check it correctly lands last in stage 6. |
| #23 | **approve** — all three files verified; sequencing after stages 3–4 is right since triggers reference those screens. |
| #24 | **approve** — once-per-session + `prefers-reduced-motion` is the right web shape. |
| #25 | **approve** — separation rule noted and endorsed. |
| #26 | **approve (dialogue/page/slot) / blocked (VinoArt)** — lucide interim matches the deviation idiom. |
| #27 | **blocked** on #4. |
| #28 | **blocked** on #5. |
| #29 | **approve** — web access store confirmed present with tests. |
| #30 | **approve** (see R4 about the stray art ref). |
| #31 | **approve-with-note** — add the forward-compat parsing rule explicitly: on import, missing keys default rather than fail (the web analogue of the iOS `decodeIfPresent` rule that near-missed three times), and cross-check key names against `SavedDataArchive.swift` raw values at port time with a round-trip test. |
| #32 | **approve** — correctly sequenced after #31. |
| #33 | **approve** — all three files verified. |
| #34 | **approve** — diff-at-port-time is the right scope. |
| #35–#38 | **blocked** on #3; the #38 out-of-scope recommendation is endorsed. |
| #39 | **approve** — safe now, verified. |
| #40 | **approve, move earlier** — land before new routes are added (stages 1–2 add several), or every new route copies the hand-rolled fallback pattern `ScreenLoading` exists to kill. |
| #41 | **approve-with-note** — versions consistent with package.json; run gates under pinned node 20.18.0 (the plan's own env note). Consider running this stage *before* the feature stages so new code is written once against current deps — either order is defensible. |
| #42 | **approve** — cadence (own branch, own pass, migration notes first) is correct; the @types/node hold against the verified `.nvmrc` pin is right. |
| #43 | **approve** — never downgrade; dist-tag read is plausible. |

### Sequencing verdict

Sound overall. Four tweaks: (a) drop #17 from stage 3 (R5); (b) pull #40
into stage 2 or earlier; (c) fold the `WalkthroughScreen` copy fix into
stage 2 (#11 note); (d) optionally front-run #41. Dependency chains
(#1→#9, #31→#32, rulings→phases 2b/6/7) all hold as written.

### External bundle pending merge (recorded 2026-08-18, mid-execution)

A 19-commit parity bundle exists in another local clone, branched from
`origin/master` @ `5925b64` (see `C:\Users\StreetPC\Downloads\
BUNDLE-CHANGES.md`); it merges into this line later. Its catalogue work is
already covered here (177 grapes / 124 regions incl. dot re-syncs / 33
styles / Brazil C029 / IP appellation in `entryDisplay` / coverage pins /
the GROWTH wave). Its web-side work maps onto this document as follows —
**none of it was implemented in this pass, to avoid divergence**:

| Bundle item | v6 mapping | Merge disposition |
|---|---|---|
| `shareLink.ts`, EntryDetail SHARE button, `prerender-og.ts`, OG tags, prerender scripts | the share funnel — v6#7/v6#12 scope | Bundle effectively implements the #7 ruling; treat as the arriving implementation, not a conflict. |
| `VinodexBoot` BIOS boot + `App.tsx` mount | v6#24 | Reassigned external — no second implementation here. |
| chipFilter 12-facet expansion + SHELF facet | new (no v6 id — post-dates the survey) | Arrives with bundle. This pass retitled `ChipFilterScreen` to MASTER SEARCH + `autoFocus` (v6#11); expect a small, mechanical conflict there. |
| dial `MainMenu` rewrite (quadrant tiles) | v6#19-adjacent menu geometry | Arrives with bundle; this pass deliberately did not touch `MainMenu.tsx` (orb repoint lives in `App.tsx`). |
| `InstallBanner` | web-only, no v6 id | Arrives with bundle. |
| PassportScreen RANK tier card (APPRENTICE 5 / MASTER 25 / GRANDMASTER 100 / LEGENDARY 250 / WINE MONK 400) | v6#21 | The fuller #21 port **must include these tiers with exactly these thresholds** (verify against iOS `PassportProgress` at port time) so the bundle's smaller card becomes strictly redundant. This pass added the YOU MIGHT LIKE strip to `PassportScreen` (v6#15); expect a section-ordering conflict, both sides additive. |
| `quiz.test.ts` golden re-pins | — | Will conflict regardless; the bundle doc says regenerate after merge. This pass did not re-pin goldens. |

### Cleanbot batch-1 findings — folded in (2026-08-18)

- **M1** — noted in `examPaper.ts`: exam seeds are deterministic per platform,
  **not portable across platforms** (the web Fisher–Yates does not reproduce
  Swift's draw sequence). Nothing persists a seed today; unify the shuffles
  before any archive ever carries one.
- **M2** — `examPaper.test.ts` now pins every `noteKeys` / `image.key`
  against the icon manifest (56 aroma keys + 11 image keys resolve).
- **M3** — `MinigamesScreen` tiles are now *driven by* `TOOL_ROSTER`; the
  titles, faces and walkthrough sentence all read one constant.
- **L1** — a missing `format` header is refused on decode, matching iOS's
  non-optional Codable field. **L2** — ratings are rebuilt field-by-field on
  decode.
- **I1 answered:** iOS counts found codes via raw `access.granted`
  membership (`CheatConsoleScreen.swift:39-41` — "granted, not isUnlocked"),
  and the web's `isGranted` is the same raw `grantedIds()` membership with no
  subsumption — GRANDCRU alone reads 1 OF 3 on both platforms. Already
  matched; no change.
- **Decomposition candidate:** `SettingsPanel.tsx` crossed 1,000 lines this
  pass. Next structural touch should extract the section panels
  (block-8-style: extract first, then edit), not grow the file further.

### Third execution pass — the professor and the spotlight (2026-08-18)

**v6#23 + v6#26-dialogue are done**, ported at the exam pass's fidelity:

- `vinoDialogue.ts` — the seventeen authored lines byte-for-byte, the full
  copy gate (name contract with the ask's named exemption, printable ASCII,
  20-word cap, 1-in-4 gag budget, retired-terms word-boundary matcher,
  expression coverage). Two web-side deferrals ride iOS's own deferral
  mechanism: `firstScan` waits on the label reader (v6#27) and
  `firstInsight` on the insight panel (v6#21's open tail) — keys reserved,
  lines gated, turning each on is deleting one string.
- `firstTimeTriggers.ts` / `vinoPresenter.ts` — the store (fire-once marked
  on request, silence as filter-not-consumption, three-trigger history seed)
  and the queue with the reasons-keyed suspension seam. **Merge note:** the
  bundle's `VinodexBoot` host should claim `setSuspended(true, 'boot')`
  while it runs, so the intro card and the walkthrough queue behind it.
- `coachmarks.ts` + `CoachmarkOverlay` — the six-step walkthrough verbatim,
  anchors/resume, action-gated advance, monotonic history seed; the web
  spotlight resolves `data-coachmark` rects (user button, listing, TRIED
  pill tagged). **`menuTile` runs card-only** — `MainMenu.tsx` is the
  bundle's file, so the GRAPES tile is untagged until the merge; one
  attribute closes it.
- `ProfVinoScreen` (`/prof-vino`, the tools shelf's seventh tile until
  ruling v6#6 returns the six, and its iOS slot on the demo loop), the
  silence switch's **one** home per iOS 0.8.93.
- **v6#26-portrait stays blocked on v6#2:** the six `VinoArt` portraits and
  the bubble/intro/ProfVino heroes render the same six-expression vocabulary
  as chrome glyphs; the ruling lands as an asset swap.
- Cleanbot pass-2 fixes folded in (M4 catalog-resolved rank count + test;
  L3 marquee transition off teardown; L4 one idle event list; L5 profiles
  seed off the render path; I3 dead branches; I5 demo counter reset; the two
  ledger tests). **I4 answered:** iOS's own profiles UI passes no name and
  offers no delete (`SettingsPanel.swift:1085` saves nameless; the confirm
  enum is overwrite/load only) — the web matches the shipped surface; the
  deleted-profiles state the seed defends is reachable only by hand-edited
  storage on both platforms. **I2 recorded:** SettingsPanel must be
  decomposed before its next structural growth (this pass touched only
  WIPE_KEYS and the L5/I3 fixes there; the silence switch went to the
  professor's page, not settings). **I6 recorded:** three
  `GrapeLineageIndex` builds (EntryDetail, LineageScreen, DEV panel) — a
  consolidation watch item for a shared memo, no action yet.

This closes the cleared list. Still blocked on rulings: #2–#7, #12, #14,
#26-portrait, #27, #28, #35–#38; #19-geometry stays declined on the
unrunnable screenshot gate; #24 external.

### Fourth execution pass — two rulings land, the #21 tail closes (2026-08-18)

On `testing` (the repo is down to `master` + `testing`; all phase branches
folded).

**v6#21 is now fully done.** `insight.ts` ports the panel half of
`Insight.swift` — the reliability-ordered depth ladder (0/1/5/15/40), seven
depth-gated line kinds, resolvable-only rosters, the Jaccard similar-to, the
derived-only rule — and `InsightSection` renders it on the entry page after
INFO, live-updating on the shelf, tagged as the walkthrough's `insightPanel`
target. `bookmarks.ts` gains iOS's `triedEntryDays` log at the one place
membership changes. `firstInsight`'s web deferral lifts — the line is live,
its event site is the panel drawing a line, exactly as the deferral
mechanism promised. 11 ported InsightTests cases.

**Ruling v6#6 taken: WHAT'S THAT…? deleted**, matching iOS 0.8.93. Screen,
`/daily` route and shelf tile removed; PROF. VINO holds the slot and the
shelf is the fixed six; the derived roster/sentence updated themselves.
R3 applied strictly: `dailyPick.ts` trimmed to the two primitives —
`dayIndex` (read by the daily challenge, moon dial, tried-day log, exam
record, archive) and `revealCursor` (the exam-seeding counter, key
unrenamed and archived on both platforms, exactly iOS's surviving
`RevealCursor`). The reveal arithmetic and its tests went with the game.

**Ruling v6#3 taken: the Shop stays out of scope for the web.** The web
tier remains deliberately free and un-gated; the ACCESS panel keeps its
ACCESS label (the honest name for a panel that sells nothing — iOS's SHOP
is a `displayName` over the same stored `ACCESS` raw value, so the two apps
still agree on storage). Dispositions:

- **v6#38 (the Shop itself): closed — out of scope.** The standing
  "Access tiers / entitlements" position in `IOS-PARITY.md`, now ruled.
- **v6#36 (expansion packs / cartridges): closed — out of scope.** Packs
  are purchased content bundles and the web ships the whole catalog; there
  is nothing to sell or install. The cartridge-art collectible presentation
  would be v6#2-blocked and is not planned.
- **v6#37 (cosmetic entitlements / emblems / stickers): closed as
  commerce.** The gating dies with the shop; the emblem/sticker art and
  its chassis rendering re-file under **v6#2** (+ the #19 screenshot gate).
- **v6#35 (Device Workshop): unblocked from #3, re-blocked on #2/#19.**
  Not commerce — the free-tier precedent (v5#20, lineage un-gated) says the
  web would ship it un-gated — but it is built of drawn device parts and
  chassis art, so it waits on the art ruling and the screenshot gate.
  GARAGISTE joins the cheat table when it lands, per the table's rule.

**v6#14 re-checked:** nothing in it was gated on #6 — what #6 freed was the
professor's shelf slot (now his). #14's system half (the presenter hooks,
fire sites and suspension seam on the entry page) landed with #23/#26, and
`firstInsight` went live this pass; **#14 is closed except its portrait
half, which rides v6#2** with the rest of the drawn art.

**Ledger I6 executed:** `lineageIndexFor` — one index per catalog array,
keyed by identity; the three per-screen builds now share it.

#### Cleanbot review of the fourth pass — fixes landed

M1 README row dropped (the deletion sweep's one user-facing miss; the
ledger and firmware-changelog mentions are history and stay). M2
`triedLine` gated to grapes-and-styles as iOS gates it — a region or
flavour id can only reach the tried shelf from a restored or legacy shelf,
and the panel must not assert a tasting that never happened. M3 the two
dropped roster cases ported (`rosterCountsResolvableOnly`,
`emptyRosterIsSilent`, the latter with a synthetic style so the rule is
exercised even when every shipped style resolves a grape) and
`referenceEntriesAreQuiet` widened to regions. L4 `applyArchive` prunes
`triedEntryDays` against the restored shelf — the log is not archived on
either platform, and the restore writes the shelf directly, so a stale log
would otherwise outlive its install. L1 catalog buckets memoized per array
behind a WeakMap (mirroring `lineageIndexFor`) with `push` instead of a
spread. L2 `add()` takes a thunk, so a depth-rejected line is never
computed. L3 name tie-break through `localeCompare('en')` rather than UTF-16
code units. L5 ladder lower bounds at 14 and 39. I1 the surviving
`revealCursor` comment now says what is true — nothing increments it, and
that matches iOS (`RevealCursor.advance()` has had no call site since
0.8.93). I2 dead `'DAILY'` marquee case removed. I4 `toolSentence` carries
iOS's `count > 1` guard.

**I3 — an iOS-side gap worth reporting to dexbot, no web change.** iOS
documents `firstInsight`'s source as an event fired from the entry screen
(`FirstTimeTriggers.swift:84`) but has no `fireOnce(.firstInsight)` call
anywhere; the line is authored, live and unreachable there. The web fires
it from `InsightSection` now that the panel exists, which is the deferral
contract working as designed — web is correctly ahead, and iOS is missing
one call site.

## Fifth execution pass — every ruling taken (2026-08-18)

The bundle merged first (`33762bb`), so the art landed on final file shapes.

### v6#2 art transport: APPROVED as a named subset — DONE

`sync-shared.ps1` gains a **web art leg**: an enumerated list, one line per
directory, copying vinodex-ios's baked `Resources` into
`vinodex-web/web/public/art`. Three rules of that script honoured exactly:

- **Not a folder under `shared/`.** `shared/` syncs into *both* repos, so art
  placed there would land in `vinodex-ios/shared/` as well — precisely the
  shape audit H12 deleted. The leg is one-way, ios → web, and the run
  verified `vinodex-ios` stayed clean.
- **Never a whole-tree `/MIR`**, and the 271 retired files are not
  resurrected — only four named directories move.
- **Masters stay owned by `vinodex-ios/art/`.** The *source* is the baked
  Resources rather than the masters, because those are the already-downscaled
  assets iOS itself renders (~20 KB against the masters' 157 KB), so one bake
  serves both platforms and the two apps draw pixel-identical chrome. It is
  the arrangement `web/public/icons/` has always had with `Resources/Icons/`.

72 files: 6 expressions, 10 stamps, 36 marquee panels, 20 stickers. Art stays
runtime-cached — `globIgnores: ['**/art/**']` already excludes it from
precache, so the 6 MB precache ceiling is untouched.

**#14-portrait and #26-portrait: DONE** — `VinoPortrait` replaces the
chrome-glyph disc in the bubble, the intro card, the spotlight and the
professor's hero and FACES grid. The asset swap the ruling was promised to
be: the six-expression vocabulary was already threaded through, so nothing
was rewritten. **Stamps** draw the passport grid and the celebration card,
unearned greyed rather than locked. **Marquee** stamps its drawn panel per
route, falling through to lucide where iOS has no panel. **#37: DONE** —
stickers wear the picker's emblem slot, which iOS had marked in a comment.

### v6#19-geometry: OFF DECLINED — DONE

Declined for four passes on one thing: the item's own approval names a
screenshot gate in both screen modes and none could run. With Playwright
live it is portable, and the seven 0.8.9x shells land (web now ships iOS's
twenty-two). WALDGLAS is composited over iOS's own translucent underlay.

### Playwright: APPROVED — DONE

32 render-smoke tests failing on any console error, plus a 19-case
screenshot gate across both modes and every new shell. It found three real
faults on its first run, all fixed: the walkthrough auto-starting over the
professor's queued after-name line; both suites measuring the BIOS instead
of the screens behind it; and the gate itself seeding `lcdMode` lowercase so
"both modes" was dark twice.

### The remaining rulings

- **v6#4 OCR: COMING SOON kept.** No web OCR dependency is taken. The tile
  keeps iOS's own announced-but-unbuilt treatment, which is honest about
  what it is. **#27 closed — deferred with reason.** `firstScan` stays
  deferred in the dialogue bank for the same reason and by the same
  mechanism; its key is reserved and the line is gate-checked.
- **v6#5 notifications: SKIPPED, recorded as a deliberate deviation.** A PWA
  cannot reliably fire a scheduled local notification when it is closed —
  the one moment a DAILY REMINDER exists for — and the permission prompt
  costs a real interruption for a promise the platform will not keep. iOS
  keeps `NotificationScheduler`; the web does not pretend to. **#28 closed —
  won't-port**, on the same footing as haptics.
- **v6#7 share: closed as implemented-by-bundle.** `shareLink.ts`, the
  entry SHARE button, the OG tags and `prerender-og.ts` all arrived with the
  user's bundle; nothing was built here. **#12 closed** the same way.
- **#35 Device Workshop: still open, and now only on its own size.** The #2
  and #3 blocks are gone — the art ruling passed and the workshop is a
  feature rather than a storefront, so the web would ship it un-gated on the
  free-tier precedent. What remains is an 897-line screen plus
  `CustomDevices`, which wants its own pass. GARAGISTE joins the cheat table
  when it lands.

### Standing notes

- **`App.tsx:24` statically imports `SETTINGS_SECTIONS`/`SettingsSectionId`
  from `SettingsPanel` while lines 65/67 lazy-import the same module**, so
  the build warns and the SettingsPanel chunk never splits. Pre-existing on
  both merge sides. The fix is to move those constants to their own module,
  and it pairs with the standing SettingsPanel decomposition note (I2).
- The BIOS reports **526 entries** where iOS reports 284: the web ships
  `COUNTRY_GATE` rows as real entries and iOS filters them out. Both numbers
  are honest about their own catalogue; `coverage.test.ts` says so already.

### Cleanbot review of the fifth pass — fixes landed

Two user-facing bugs, a weak gate, and a defect my merge dropped.

**H1 — the intro card and the spotlight drew over the BIOS.** Neither was
gated on `booting`, and both sit above it (z-85 and z-80 against z-70), so a
genuinely fresh visitor met the name prompt with the POST hidden behind it,
and a returning-but-untoured player got the spotlight painted over the boot.
The presenter was already suspended under `'boot'`; these are the two hosts
that do not read that seam, and they now check `!booting` directly. **The
hole that hid it was the test seeding:** the professor's test seeded past the
BIOS and the BIOS test seeded past the professor, so the two were never up at
once. Two tests now put them up together, and both were confirmed to fail
against the un-fixed code before the fix was restored.

**H2 — the install banner advertised a placeholder listing.** `GET APP`
pointed at `id0000000000` for every visitor. No id was invented: the banner
gates on `APP_STORE_LISTING_IS_LIVE` and returns by itself when a real id
lands. Its fixed bar was also clipping the status orb in every capture the
gate produced, so it publishes its height and the shell pads down by exactly
that, back to zero when dismissed.

**M1** `shareEntry` now falls through to the clipboard on a cancelled share
sheet, as its own comment always claimed — dismissing the sheet throws
`AbortError` on both mobile platforms, which is the common path, and it was
flashing COULD NOT SHARE at everyone who changed their mind. **M2** the main
menu reads `var(--lcd-page)` like every other screen; the dial rewrite had
carried a fixed dark `bg-dex-screen` through, so the two menu captures were
identical apart from the rim and the "both modes" gate was blind on the
most-visited surface.

**M3/M4/M5 — the gate itself.** The console fixture lived inside
`smoke.spec.ts` and applied to nothing else, so the screenshot suite ran with
no error checking at all; it is hoisted to `e2e/fixtures.ts` and now also
fails on failed requests and any 4xx, **filtering on the request URL rather
than the word "404"** — Chrome logs a broken `<img>` as a 404, and this range
added 72 `/art/` references, so the old text filter would have hidden exactly
the mistyped-stem failure the gate exists for. The screenshot suite asserted
only `body height > 200` (a blank page passes) and the shell loop asserted
nothing; every case now checks the mode reached the LCD, and **every shell
compares the computed `--chassis-body` against its own row in
`CHASSIS_SKINS`**, which is the failure a colour-table port actually has.
`.github/workflows/gates.yml` runs all five gates on `master` and `testing`,
`npm run test:all` runs them locally, and the README says so — #19-geometry
waited four passes for a gate and must not land on one nobody runs.

**M6 — a live parity defect, re-recorded.** Taking this document "ours" in
the merge dropped a measured finding from the bundle's doc, re-verified as
still true: **the web derives grape characteristic bars from text labels**
(`shared/data/grapeCards.ts` `levelFromText`/`bodyFromText`, over strings
like "Medium-High") **while iOS carries numeric `grapeCharacteristics`.** On
the 31 grapes the bundle imported, tannin matches iOS on **26/31**, acid
**31/31**, body **30/31**. The bars are a headline readout on every grape
page, so a five-grape disagreement is visible. Fixing it means carrying the
numbers in the shared catalogue rather than re-deriving them per platform,
which is a `HGapps/shared` change and a `sommbot`/data decision, not a web
one. **Open, unowned, and now written down.**

**L1** three display names caught up with iOS 0.9.2 (BURGUNDY VELOUR →
BURGUNDY, ELECTRIC RIESLING → VIN JAUNE, SMART GRAPE → FIELD BLEND); the
other 19 and all seven new ones already matched. **L2** `BADGE_ICON` retired
— dead since the drawn stamps landed. **L3** the marquee map gained the nine
filter-mode scan titles and the eleven other unmapped screens, and
`marqueeArt.test.ts` now holds the map and the directory to each other in
both directions, with a named `DRAWN_AHEAD` list for the two panels mirrored
ahead of their screens (workshop, label scanner) on iOS's own discipline —
so "the screen does not exist yet" and "somebody forgot to wire it" stop
being the same observation. **L4** `matches` defaults to a live
`shelfSnapshot()` like its two siblings; the empty-snapshot constant went
with the disagreement, and the screen's snapshot memo is keyed `[]`. **L5**
leftovers cleared and `NEXT-SESSION-PROMPT.md` deleted. **L6**
`SETTINGS_SECTIONS`/`SettingsSectionId` moved to
`web/src/services/settingsSections.tsx`: `App.tsx` imported them statically
while lazily importing the same module, so the static edge won and the
SettingsPanel chunk never split. It splits now (45.49 kB out of the entry
bundle) and the build warning is gone — the first cut of the standing
decomposition note.

**The art leg's `/MIR` purges.** Scoped with a `*.png` mask, it still mirrors
deletions inside the four web targets: a web-authored PNG dropped into
`web/public/art/marquee/` would be removed by the next sync. That is the
point of `/MIR` and it is now stated in the script's own comment.
