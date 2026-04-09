# Vinodex

Vinodex is a retro-styled wine encyclopedia PWA built with React, TypeScript, and Vite.

![Vinodex logo](public/vinodex-logo.png)

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
vinodex-new/
components/   React UI screens and tiles
data/         Wine data sources and derived records
public/       Static assets and generated JSON
src/services/ Runtime data loading helpers
App.tsx       Top-level navigation state
constants.ts  Combined wine entry dataset
types.ts      Shared TypeScript types
```

## Notes

- `public/wine-entries.json` is the runtime dataset loaded by the app.
- Optional Supabase support is available behind env vars; see [supabase/README.md](./supabase/README.md).
- Local data mode is forced by default; set `VITE_FORCE_LOCAL_DATA=false` (with Supabase env vars) to re-enable Supabase.
- The repo no longer depends on a bundled platform-specific Node binary.
