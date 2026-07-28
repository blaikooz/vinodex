# Copilot Instructions for Vinodex

## Overview
Vinodex is a retro-styled wine encyclopedia. This is a **monorepo with three peers**: a shared dataset (`shared/`) rendered by two apps — a React/Vite PWA (`web/`) and a SwiftUI iOS app (`ios/`). The web app is installable as a PWA and uses a map-driven exploration interface.

## Key Conventions
- **React 19 + TypeScript**: All web UI is built with React function components and TypeScript types.
- **Vite**: Use `npm run dev` for local development, `npm run build` for production, and `npm run preview` to test the build. Vite's `root` is `web/`; config, `node_modules` and the `dist/` output stay at the repo root.
- **Tailwind CSS v4**: Styling is handled via Tailwind utility classes. No CSS-in-JS or SCSS.
- **Data**: All runtime wine data is sourced from `shared/constants.ts` and the `shared/data/` directory. Do not load from `web/public/wine-entries.json` at runtime.
- **The `@/` alias points at the repo root.** Cross-tree imports use it — `@/shared/types`, `@/shared/data/grapes`, `@/shared/services/chipColors`. Imports *within* `web/` stay relative.
- **`shared/` must stay dependency-free.** It is read both by the web app and by the iOS generator running under plain ts-node, where `react` is not installed. No framework imports, no JSX, no asset imports.
- **Icons**: SVG icons are in `web/public/icons/`. Use Lucide React for UI icons, and custom SVGs for wine/flavor visuals.
- **Component Structure**: UI screens and tiles are in `web/components/`. Web-only rendering helpers are in `web/src/services/`; anything the iOS app also needs belongs in `shared/services/`.

## Build & Test Commands
- Install: `npm install`
- Start dev server: `npm run dev`
- Type check: `npm run typecheck`
- Build: `npm run build`
- Preview: `npm run preview`
- Regenerate iOS data after editing `shared/`: `npm run generate:ios`

## Project Structure
- `shared/` — **Single source of truth.** Entry types, dataset, colour and classification lookups
- `web/components/` — React UI screens and tiles
- `web/src/services/` — Web-only rendering helpers
- `web/data/` — Web-only data (flag image imports, the encyclopedia corpus)
- `web/public/` — Static assets and generated JSON
- `ios/` — SwiftUI package; its bundled JSON is generated from `shared/`
- `pixelflags/` — Pixel-art flags, consumed by both apps
- `scripts/` — Data generators and the `vinodex-swift` publish script

## Pitfalls & Tips
- **Do not edit `web/public/wine-entries.json` directly.**
- **Always update `shared/constants.ts` and `shared/data/` for new entries.**
- **A change under `shared/` is not finished until `npm run generate:ios` has been run** and the resulting diff under `ios/Sources/VinodexCore/Resources/` reviewed. Generation is deterministic, so an unexpectedly wide diff means the change was wider than intended.
- **Never add a colour or lookup table to `web/src/services/` if the iOS app needs it too** — it belongs in `shared/services/`, or the two apps drift.
- **Do not commit in `blaikooz/vinodex-swift`.** It is a generated mirror, overwritten by `npm run publish:swift`.
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
- [KNOWN-ISSUES.md](../KNOWN-ISSUES.md) for the iOS build/deploy runbook and repo layout
- [web/public/icons/README.md](../web/public/icons/README.md) for icon usage

---
This file guides Copilot and other AI agents to follow Vinodex-specific conventions. For advanced agent customization, consider creating agent hooks for data validation or UI consistency checks.
