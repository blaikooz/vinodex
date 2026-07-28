# Vinodex

Vinodex is a retro-styled wine encyclopedia PWA built with React, TypeScript, and Vite.

![Vinodex logo](web/public/vinodex-logo.png)

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

This is a monorepo with three peers — a shared dataset and two apps that render
it.

```text
VINODEX/
  shared/            Single source of truth. Pure TypeScript, zero dependencies.
    types.ts         Entry types
    constants.ts     buildWineEntries() — the combined dataset
    stylePalette.ts  Style tone palette
    data/            grapes, regions, styles, countries, continents, climates
    services/        Colour + classification lookups (chips, flavours, soils)

  web/               The Vite/React PWA
    App.tsx          Top-level navigation state
    components/      React UI screens and tiles
    src/services/    Web-only rendering helpers (icons, display formatting)
    data/            Web-only data (flag image imports, encyclopedia)
    public/          Static assets

  ios/               The SwiftUI app — see KNOWN-ISSUES.md
    Sources/VinodexCore/Resources/*.json   generated from shared/, committed

  pixelflags/        Pixel-art flags, consumed by both apps
  scripts/           Generators and the vinodex-swift publish script
```

The web app imports `shared/` directly through the `@/shared/*` alias. The iOS
app can't run TypeScript, so `scripts/generate-ios-data.ts` renders `shared/`
into JSON that ships inside the Swift package. Same tables, one definition.

### Working on the data or colours

Edit under `shared/`, then regenerate the iOS side:

```bash
npm run generate:ios       # rewrites ios/Sources/VinodexCore/Resources/*.json
npm run icons:ios          # re-rasterises icons + flags (needs network)
```

Generation is deterministic — check `git diff --stat` on the resources directory
afterwards; a wider diff than you expected means the change was wider than you
intended.

### Publishing the iOS repo

`github.com/blaikooz/vinodex-swift` is a generated mirror assembled from `ios/`,
`shared/`, `pixelflags/` and two scripts, so it builds *and* regenerates without
this repo:

```bash
npm run publish:swift:check
npm run publish:swift
```

Never commit directly in that repo — it is overwritten on each publish. Details
in [KNOWN-ISSUES.md](KNOWN-ISSUES.md#repo-layout).

## Notes

- `shared/constants.ts` is the runtime source of truth for app entries.
- `web/public/wine-entries.json` remains a generated/static artifact and is not the active runtime loader.
- The repo no longer depends on a bundled platform-specific Node binary.

## Icon Attribution

- **Lucide React**: UI and utility icons (lucide.dev)
- **game-icons**: Thematic wine, flavor, and regional icons sourced via Iconify (game-icons.net)
