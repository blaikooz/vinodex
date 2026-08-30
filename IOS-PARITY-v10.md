# Web ↔ iOS parity plan — v10 (Phase 5 audit)

_Follows `IOS-PARITY-v9.md`. Surveyed on `testing` at `297e991` (= `master` =
tag `v0.6.24`), 2026-08-30, against iOS `main`/`testing` at **v0.9.2**
(`c0532a6`). Read-only: nothing here is executed; the ranked list below is the
Phase 5 work order, taken in this order once the owner says which._

_Severity words are unchanged from v5–v9: **cosmetic** (a glyph/word),
**minor** (layout, order, copy), **moderate** (a missing control or section),
**structural** (a screen or system that does not exist here). They grade the
**size of each change**. Under v9's §0 ruling, a visual difference is not a
finding; what is graded here is behaviour, product scope and data._

_Ids are per-document. Cite them qualified — `v10#3`, not `#3`._

---

## Status — surveyed, nothing executed (2026-08-30)

**Scope:** the three Phase 5 board rows (lineage, "clue economy", collection /
passport) plus every iOS system with no web counterpart, re-checked against
iOS 0.9.0–0.9.2's changelog. Method: the iOS source read beside the web
component for each, file:line cited; the v9 deliberate-deviations list checked
before writing a finding.

**Rulings this audit was written under (2026-08-30):** port *mechanics*,
never *gates* — nothing on web is locked behind a purchase, Shop/IAP seams
stay off; error monitoring first-party only; the front page stays the
studio's.

**Shape:** 9 findings — 2 structural, 3 moderate, 1 minor, 1 bug (data
logic), 2 not-for-web (recorded so they are not re-raised). One board row is
**stale**: the "clue economy" no longer exists on iOS (v10#4).

---

## 1. Ranked work order

| # | Screen / system | Grade | What iOS has (file) | What the web has (file) | One-line fix |
|---|---|---|---|---|---|
| **v10#1** | Grape lineage | **moderate** | A positioned family tree: parents above the subject with lines running down, descendants below, siblings sideways; contested edges as a dashed connector + `?` badge with their authored sentence in footnotes; off-catalog ancestors as terminal tiles (`GrapeLineageScreen.swift:5-40`, 724 lines) | Sectioned rows — PARENTS / MUTATION OF / OFFSPRING / MUTATIONS / SIBLINGS — with refocus and OPEN ENTRY (`GrapeLineageScreen.tsx:104-118`, 140 lines). v6#16 called rows "the idiomatic translation"; the board asks for iOS quality. | Keep the rows as the *data*, add the *direction*: an SVG column-tree (subject centred, parents above with connectors down, offspring below, siblings beside), dashed connector + `?` for contested edges, and a FOOTNOTES section for their sentences. Same `GrapeRelatives`; no data change. |
| **v10#2** | Stamp collection | **structural** | `StampCollectionScreen` (0.8.6 C3/C4): every stamp of the series, earned or not, drawn at collection size; unearned as a desaturated silhouette with what it would take; a page where the drawing is the content (`StampCollectionScreen.swift:5-23`) | `PassportScreen` shows RANK / TASTINGS / BY COLOUR / BY RARITY / YOU MIGHT LIKE with the badges as small tiles (`PassportScreen.tsx:111-172`); no collection page | A `/passport/stamps` screen: `StampArt` at ~96px, earned in colour, unearned dimmed + grayscale with the requirement as caption; reached from a STAMPS row on the passport. Reads the same `computePassport`; layout only. |
| **v10#3** | Share cards | **structural** | Three rendered cards (`ShareCards.swift`): **B1** an entry framed in the device, **B2** the profile (rank, completion, counts, streak, in the player's colours), **B3** an earned stamp; plus the daily-challenge result string (0.7.8 B/C) | `shareEntry()` shares the entry **URL** (`EntryDetail.tsx:720`), which since v0.6.24 unfurls with the entry's own baked card — so B1's *purpose* (a good-looking entry share) is met by the link. No profile or stamp card; no daily result string. | **Needs a ruling before building.** B2/B3 are images of *the player's* state, so they cannot be prebaked; the web equivalent is a `<canvas>` render (the fonts are already loaded) handed to `navigator.share({ files })` or downloaded. Medium build. The daily-challenge result string is small and self-contained (correctness-only tiles, never the answers). |
| **v10#4** | "Clue economy" (board row) | **stale** | WHAT'S THAT…?'s priced clues shipped in 0.8.8 — and **the game was deleted in iOS 0.8.93**; PROF. VINO holds its slot (`MinigamesScreen.tsx:21-23`, ruling v6#6). `grep -ri clue Sources/` finds nothing. | Nothing to port: the web deleted it in the same ruling. | Close the board row as stale. Under "port mechanics, never gates" there is no surviving mechanic to port. |
| **v10#5** | Tool intro cards | **moderate** | `ToolIntroCard` (0.8.8 D1): the first time a tool opens, a card with the tool's drawing at size, a tagline, a body, and a third control — `DexAlert`'s scrim and motion, not `DexAlert` (`ToolIntroCard.swift:5-14`) | None. The professor's `firstTimeTriggers` cover screens with a line, not a card. | One `ToolIntroCard` component fed by a per-tool table (art stem, tagline, body), gated by a `toolIntroSeen:<id>` flag in the trigger store (a strict superset — nobody's stored set changes). |
| **v10#6** | Colour inference matches substrings | **bug** | Fixed in 0.9.0: "*Prosecco was labelled a rosé* — the colour inference matched substrings, and 'rose' sits inside 'p**rose**cco'. Colour words are matched whole now." Also: Rosé and Orange Wine's COLOR chip led to an empty list; now leads to the grapes the style is made from. | The same substring test is live in two places: `colorHelpers.ts:44` (`t.includes('rose')` → `'rosé'`) and `chipColors.ts:93`. Whether the COLOR-chip → empty-list half also reproduces needs a check on `/list` with the Rosé and Orange Wine chips. | Match colour words whole (`\brose\b|rosé`) in both places, pin Prosecco → DUAL and a real rosé → ROSÉ in `colorHelpers.test.ts`; then reproduce and fix the chip-target half the way iOS did. |
| **v10#7** | Collection / passport enhancements (board row) | **minor** | The iOS collection is three shelves with a journal line on TRIED; the board's "sorting, sharing, milestones" maps onto B2 (sharing, = v10#3) and the stamp series (milestones, = v10#2). No iOS sort control was found in the survey (`grep -i sort` over the shelf UI: none). | `BookmarksScreen.tsx`: SAVED / WANT / TRIED shelves, star/note journal on TRIED — at parity with the shelves themselves. | Fold the row into v10#2 and v10#3; nothing separate to build. |
| **v10#8** | Text size HUGE (0.9.0 M49) | **verify** | Three steps, the largest 1.30×; smallest text 11pt on the default | `TextScaleId = 'SMALL' \| 'LARGE'` (`theme.ts:46`) — two steps | Read the two scales against iOS's three and the 11pt floor before deciding; a third step is a token change, not a redesign. |
| **v10#9** | Back up & restore (0.9.0 M35) | **at parity** | `SavedDataArchive`, 20 keys, exhaustive | SETTINGS ▸ DATA EXPORT / RESTORE BACKUP (`SettingsPanel.tsx`) with the same refusal cases | Nothing. Recorded so the changelog line is not re-audited. |

## 2. Not for the web — recorded, not to be re-raised

- **Daily reminder notifications** (0.7.8 D1, `NotificationScheduler`): the
  web equivalent is the Push API, which needs a server to send from; this app
  has no server and the privacy page promises none. Out unless that changes.
- **Label Reader / OCR** (`LabelReaderView`, `OCRService`): still the product
  decision v6 and v9 left open — a web OCR dependency the repo does not carry.
  The hub tile says so. Not a Phase 5 item without a ruling.
- **Expansion packs, cartridges, the Shop, cosmetic entitlements**
  (`ExpansionPackMembers`, `PackCartridge`, `CosmeticEntitlements`): off the
  web by the standing free-tier ruling, restated 2026-08-30.
- **`AgedMaterial` / `SketchRender`** (Device Workshop cosmetics): the
  workshop spike was closed on the board; not re-opened here.

## 3. Deliberate deviations — carried forward from v9 §5, unchanged

COLLECTION not SAVED; the interactive moon dial, the web-only region map and
the scanner's flat country step; the un-gated free tier; the company site;
the site's marquee mark as the one web-authored art; the island trio
`aria-hidden`; `starterOnly` vs `starterTierOnly`. Plus, since v9: the
studio-led front page (v0.6.19) and Substack as the funnel's bottom
(v0.6.16) — product decisions, not gaps.

## 4. Suggested order

v10#6 first (a bug with a known fix and a test to pin it), then v10#1 and
v10#2 (the two rows the board named, both self-contained), then v10#5. v10#3
waits on a ruling: whether a canvas-rendered profile/stamp card is worth
building for a web that already shares good links. v10#4 and v10#7 close on
the board with no code.

## 5. Notes

- **iOS is untouched.** Every Swift file named above was read, not modified.
- **`shared/` is untouched.** v10#6 lives in the web's own services
  (`colorHelpers.ts`, `chipColors.ts` is in `shared/services` — that one is
  a master edit via `HGapps/shared` + the sync, and is flagged as such).
- **Nothing was pushed for this document** beyond the document itself.
