# Copilot Instructions for Vinodex

## Overview
Vinodex is a retro-styled wine encyclopedia PWA built with React, TypeScript, and Vite. It features grape varieties, wine regions, styles, and a retro handheld-inspired UI. The app is installable as a PWA and uses a map-driven exploration interface.

## Key Conventions
- **React 19 + TypeScript**: All UI is built with React function components and TypeScript types.
- **Vite**: Use `npm run dev` for local development, `npm run build` for production, and `npm run preview` to test the build.
- **Tailwind CSS v4**: Styling is handled via Tailwind utility classes. No CSS-in-JS or SCSS.
- **Data**: All runtime wine data is sourced from `constants.ts` and the `data/` directory. Do not load from `public/wine-entries.json` at runtime.
- **Icons**: SVG icons are in `public/icons/`. Use Lucide React for UI icons, and custom SVGs for wine/flavor visuals.
- **Component Structure**: UI screens and tiles are in `components/`. Shared logic is in `src/services/`.

## Build & Test Commands
- Install: `npm install`
- Start dev server: `npm run dev`
- Type check: `npm run typecheck`
- Build: `npm run build`
- Preview: `npm run preview`

## Project Structure
- `components/` — React UI screens and tiles
- `data/` — Wine data sources and derived records
- `public/` — Static assets and generated JSON
- `src/services/` — Runtime data loading helpers
- `constants.ts` — Source of truth for app entries
- `types.ts` — Shared TypeScript types

## Pitfalls & Tips
- **Do not edit `public/wine-entries.json` directly.**
- **Always update `constants.ts` and `data/` for new entries.**
- **Use only Tailwind for styling.**
- **SVG icons:** Add new icons to `public/icons/` and reference them in UI components.
- **PWA:** Test installability after build with `npm run preview`.

## Example Prompts
- "Add a new grape variety to the encyclopedia."
- "Update the tasting profile for an existing grape."
- "Add a new SVG icon for a wine flavor."
- "Refactor a component to use a new TypeScript type."

## See Also
- [README.md](README.md) for setup and structure
- [public/icons/README.md](public/icons/README.md) for icon usage

---
This file guides Copilot and other AI agents to follow Vinodex-specific conventions. For advanced agent customization, consider creating agent hooks for data validation or UI consistency checks.
