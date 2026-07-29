# Vinodex — web

Vinodex is a retro-styled wine encyclopedia PWA built with React, TypeScript, and Vite.

![Vinodex logo](web/public/vinodex-logo.png)

> ## The iOS app moved out
>
> **[`blaikooz/vinodex-ios`](https://github.com/blaikooz/vinodex-ios) is the iOS
> app's home as of 2026-07-29.** It owns its source, its data and its tooling,
> and nothing is copied between the two repos in either direction.
>
> Until then it was *generated* from this repo by `scripts/publish-swift.mjs`,
> which emptied that repo's tree and rebuilt it on every run — so a commit made
> there did not survive. That script, the `swift` remote, the `swift-main` branch
> and the `publish:swift*` npm scripts are all deleted.
>
> **These paths are now frozen leftovers. Do not edit them:**
>
> | Frozen | Live copy |
> |---|---|
> | `ios/` | the whole of `vinodex-ios` |
> | `shared/` | `vinodex-ios/shared/` |
> | `pixelflags/` | `vinodex-ios/pixelflags/` |
> | `scripts/generate-ios-data.ts`, `scripts/rasterize-icons.sh` | `vinodex-ios/scripts/` |
>
> They are still here only because the web app currently imports `shared/`
> (7 files under `web/src/services/`). As this app is pivoted to a landing page
> that dependency goes away, and these can be deleted outright — that cleanup
> belongs to the pivot, not to the split. The `generate:ios` / `icons:ios` npm
> scripts have been removed so nothing here can regenerate the frozen copies;
> **an iOS data change is made in `vinodex-ios`.**

## Features

- Grape varieties with tasting profiles and rarity tiers
- Wine regions with map-driven exploration
- Wine style and flavor reference entries
- Installable PWA experience
- Retro handheld-inspired UI

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Lucide React
- Iconify React with game-icons icon set
- `vite-plugin-pwa`

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm

The repo includes an `.nvmrc` pinned to `20.18.0` if you use `nvm`.

### Install

```bash
npm install
```

### Run the app

```bash
npm run dev
```

The Vite dev server will print the local URL it is using, typically `http://localhost:5173`.

### Validate the project

```bash
npm run typecheck
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Project Structure

```text
vinodex-web/
  web/               The Vite/React PWA — the live part of this repo
    App.tsx          Top-level navigation state
    components/      React UI screens and tiles
    src/services/    Web-only rendering helpers (icons, display formatting)
    data/            Web-only data (flag image imports, encyclopedia)
    public/          Static assets

  shared/            FROZEN — see the banner above. Live copy in vinodex-ios.
  ios/               FROZEN — the SwiftUI app now lives in vinodex-ios
  pixelflags/        FROZEN — live copy in vinodex-ios
  scripts/           Encyclopedia tooling (live) + two frozen iOS generators
```

The web app still imports `shared/` through the `@/shared/*` alias, which is the
only reason the frozen folders are still here. Removing that dependency is part
of the landing-page pivot.

### Working on the data or colours

**For the iOS app, edit `shared/` in
[`vinodex-ios`](https://github.com/blaikooz/vinodex-ios)** and regenerate there
(`npm run generate`). The copy in this repo feeds the web app only, and changing
it has no effect on iOS.

## Notes

- `shared/constants.ts` is the runtime source of truth for app entries.
- `web/public/wine-entries.json` remains a generated/static artifact and is not the active runtime loader.
- The repo no longer depends on a bundled platform-specific Node binary.

## Icon Attribution

- **Lucide React**: UI and utility icons (lucide.dev)
- **game-icons**: Thematic wine, flavor, and regional icons sourced via Iconify (game-icons.net)
