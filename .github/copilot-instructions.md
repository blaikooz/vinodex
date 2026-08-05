# Copilot Instructions for Vinodex

## Overview
Vinodex is a retro-styled wine encyclopedia. **This repo is the web app** — a React/Vite PWA, installable, with a map-driven exploration interface. It is being pivoted toward a landing page for the iOS app.

**The iOS app lives in [`blaikooz/vinodex-ios`](https://github.com/blaikooz/vinodex-ios) and is not built from here.** The two iOS scripts in `scripts/` are **frozen leftovers** — do not edit them and do not regenerate iOS data here; an iOS change is made in `vinodex-ios`.

**`shared/` is mirrored, not frozen.** Its master is `HGapps\shared`, pushed into both repos by `sync-shared.ps1`. The web app genuinely depends on it — `web/src/services/` imports it in 7 files and `web/data/flagImages.ts` imports `shared/pixelflags/`. Edit the **master**: a change made to this copy is silently overwritten on the next sync.

## Key Conventions
- **React 19 + TypeScript**: All web UI is built with React function components and TypeScript types.
- **Vite**: Use `npm run dev` for local development, `npm run build` for production, and `npm run preview` to test the build. Vite's `root` is `web/`; config, `node_modules` and the `dist/` output stay at the repo root.
- **Tailwind CSS v4**: Styling is handled via Tailwind utility classes. No CSS-in-JS or SCSS.
- **Data**: All runtime wine data is sourced from `shared/constants.ts` and the `shared/data/` directory. Do not load from `web/public/wine-entries.json` at runtime.
- **The `@/` alias points at the repo root.** Cross-tree imports use it — `@/shared/types`, `@/shared/data/grapes`, `@/shared/services/chipColors`. Imports *within* `web/` stay relative.
- **`shared/` here is a mirror.** The master is `HGapps\shared`; `sync-shared.ps1` pushes it into both repos, so an edit made here is lost on the next sync and never reaches iOS. It must stay dependency-free while the web app reads it.
- **Icons**: SVG icons are in `web/public/icons/`. Use Lucide React for UI icons, and custom SVGs for wine/flavor visuals.
- **Component Structure**: UI screens and tiles are in `web/components/`. Rendering helpers are in `web/src/services/`.

## Build & Test Commands
- Install: `npm install`
- Start dev server: `npm run dev`
- Type check: `npm run typecheck`
- Build: `npm run build`
- Preview: `npm run preview`

## Project Structure
- `shared/` — **Single source of truth.** Entry types, dataset, colour and classification lookups
- `web/components/` — React UI screens and tiles
- `web/src/services/` — Web-only rendering helpers
- `web/data/` — Web-only data (flag image imports, the encyclopedia corpus)
- `web/public/` — Static assets and generated JSON
- `scripts/` — encyclopedia tooling and the catalog ref checker; all live
- `shared/`, `shared/pixelflags/` — **mirrored** from `HGapps\shared`; edit the master, not these

## Pitfalls & Tips
- **Do not edit `web/public/wine-entries.json` directly.**
- **Always update `shared/constants.ts` and `shared/data/` for new entries.**
- **iOS data and icon generation is not done here.** `generate-ios-data.ts` and `rasterize-icons.sh` were frozen forks of the `vinodex-ios` originals and were deleted in v0.7.8; the live copies are `vinodex-ios/scripts/`.
- **Do not edit `shared/` here** — including `shared/pixelflags/`. It is a mirror of `HGapps\shared`; `sync-shared.ps1` overwrites it, so an edit here is lost rather than shared.
- **`blaikooz/vinodex-ios` takes direct commits and pull requests.** The old warning that it was a generated mirror is obsolete — the publish script that overwrote it has been deleted.
- **Use only Tailwind for styling.**
- **SVG icons:** Add new icons to `web/public/icons/` and reference them in UI components.
- **PWA:** Test installability after build with `npm run preview`.

## Example Prompts
- "Add a new grape variety to the encyclopedia."
- "Update the tasting profile for an existing grape."
- "Add a new SVG icon for a wine flavor."
- "Refactor a component to use a new TypeScript type."

## See Also
- [README.md](../README.md) for setup and structure
- [REPO-STATUS.md](../REPO-STATUS.md) for what is live here and what is mirrored (was `KNOWN-ISSUES.md` until v0.7.8)
- [`vinodex-ios`](https://github.com/blaikooz/vinodex-ios) for the iOS app and its build/deploy runbook
- [web/public/icons/README.md](../web/public/icons/README.md) for icon usage

---
This file guides Copilot and other AI agents to follow Vinodex-specific conventions. For advanced agent customization, consider creating agent hooks for data validation or UI consistency checks.
