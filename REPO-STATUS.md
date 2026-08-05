# Repo status — what is live here, and what moved out

Operational knowledge for the **web** app: which paths this repo owns, which are
mirrored in from elsewhere, and where the things that used to be here went.

> **Renamed in v0.7.8.** This file was `KNOWN-ISSUES.md` until v0.7.8. So is the
> one in [`vinodex-ios`](https://github.com/blaikooz/vinodex-ios/blob/main/KNOWN-ISSUES.md),
> and the two were entirely different documents — that one is the iOS device
> runbook, this one is a repo-status note. Same filename holding different
> content is a trap for anyone told to "check KNOWN-ISSUES", so this one took a
> name that says what it is. `git log --follow -- REPO-STATUS.md` has the
> history across the rename.

- [iOS deployment and build gotchas](#ios-deployment-wsl-and-build-gotchas--moved) — moved to `vinodex-ios`
- [Repo layout](#repo-layout) — what is live here and what is mirrored

---

## iOS deployment, WSL and build gotchas — moved

All of it now lives in
[`vinodex-ios/KNOWN-ISSUES.md`](https://github.com/blaikooz/vinodex-ios/blob/main/KNOWN-ISSUES.md),
alongside the app it describes: the 27015 port race, the free-profile App ID cap,
the WSL rsync mirror, `swift test` not seeing UI code, the traps that produce
false readings, and the data-regeneration workflow.

It was duplicated here because this repo used to build and publish the iOS app.
It no longer does, and a runbook kept next to code it cannot affect is worse than
no runbook — it drifts and nobody notices. The full text stays in this repo's git
history if you need it (`git log --follow -- REPO-STATUS.md`, which crosses the
v0.7.8 rename from `KNOWN-ISSUES.md`).

---

## Repo layout

This is the **web** app. The iOS app moved to
[`blaikooz/vinodex-ios`](https://github.com/blaikooz/vinodex-ios) on 2026-07-29
and owns itself completely.

| Path | Status |
|---|---|
| `web/` | live — the Vite/React PWA |
| `scripts/{cleanEncyclopediaText,buildEncyclopediaReference}.ts` | live |
| `shared/` | **mirrored** — master is `HGapps\shared`, pushed here by `sync-shared.ps1`. Edit the master, never this copy |
| `shared/pixelflags/` | **live and mirrored** — `web/data/flagImages.ts` imports these; master is `HGapps\shared\pixelflags` |
| ~~`scripts/{generate-ios-data.ts,rasterize-icons.sh}`~~ | **deleted v0.7.8** — they were frozen forks ~50 KB behind `vinodex-ios/scripts/`, invoked by nothing here |

`shared/` stays because `web/src/services/` imports it in 7 files and
`web/data/flagImages.ts` imports the flags. It is **not** frozen: a
`sync-shared.ps1` run overwrites this copy from the master, so an edit made
here is lost on the next sync. `ios/` — the 419-file frozen copy of the Swift
package — was removed in the 0.6.5 cleanup; the app lives entirely in
`vinodex-ios`.

One remote, `origin` → `blaikooz/vinodex-web`.

### The publish path is gone

Everything above used to be mirrored into `vinodex-swift` by
`scripts/publish-swift.mjs`. That script **emptied the mirror's tree and rebuilt
it** on every run, so anything committed there directly was deleted — which is
what happened to `AUDIT.md`, added by a merged PR and destroyed by the next
publish on 2026-07-29.

Deleted in the same change: the script, `scripts/swift-mirror/`, the
`publish:swift` and `publish:swift:check` npm scripts, the `swift` remote and the
`swift-main` branch. The `generate:ios` / `icons:ios` scripts went too — not
because they mirror anything, but because running them here would rewrite a
frozen copy and invite exactly the drift this split exists to prevent.

If you are looking for the iOS deployment runbook — the 27015 port race, the WSL
build setup, the traps that produce false readings — it lives in
[`vinodex-ios/KNOWN-ISSUES.md`](https://github.com/blaikooz/vinodex-ios/blob/main/KNOWN-ISSUES.md).

### Web-side note

`web/data/encyclopedia/source/sothebys-wine-encyclopedia-2005.raw.txt` (4.5 MB of
a copyrighted book) is committed and public in this repo. It was never among the
mirrored paths, so it never reached the iOS repo — but it is still here.
