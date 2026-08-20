<div align="center">

<img src="web/public/vinodex-logo.png" alt="Vinodex" width="132" />

# VINODEX

### A wine encyclopedia that looks like a 90s handheld.

**284 grapes, regions, styles and flavours** — colour-coded, cross-linked, and
wrapped in a plastic shell you can re-skin five different ways.

### **[Open the app →](https://vinodex.vercel.app)**

`React 19` · `TypeScript` · `Vite` · `Tailwind v4` · `PWA`

<p>
<img src="shared/pixelflags/Europe/france/france.png" alt="France" height="26" />
<img src="shared/pixelflags/Europe/italy/italy.png" alt="Italy" height="26" />
<img src="shared/pixelflags/Europe/spain/spain.png" alt="Spain" height="26" />
<img src="shared/pixelflags/Europe/portugal/portugal.png" alt="Portugal" height="26" />
<img src="shared/pixelflags/Europe/germany/germany.png" alt="Germany" height="26" />
<img src="shared/pixelflags/Europe/austria/austria.png" alt="Austria" height="26" />
<img src="shared/pixelflags/Europe/greece/greece.png" alt="Greece" height="26" />
<img src="shared/pixelflags/North%20America/united_states/united_states.png" alt="United States" height="26" />
<img src="shared/pixelflags/South%20America/argentina/argentina.png" alt="Argentina" height="26" />
<img src="shared/pixelflags/South%20America/chile/chile.png" alt="Chile" height="26" />
<img src="shared/pixelflags/Oceania/australia/australia.png" alt="Australia" height="26" />
<img src="shared/pixelflags/Oceania/new_zealand/new_zealand.png" alt="New Zealand" height="26" />
<img src="shared/pixelflags/Africa/south_africa/south_africa.png" alt="South Africa" height="26" />
</p>

*Hand-drawn pixel flags, one per wine-producing country and state in the atlas.*

</div>

---

## What's in it

| | |
|---|---|
| **The dex** | Grapes, regions, styles and flavours. Every entry cross-links to the others — a grape names its regions, a region names its grapes, and both resolve. |
| **Globe scan** | A draggable 3D globe. Pick a continent, drill to a country, land on its regions. |
| **Scanner** | Four questions about the glass in front of you — colour, body, origin, flavours — then a deduction. Flavours are ANDed, so three notes narrow 80 grapes to a handful. |
| **Moon dial** | The biodynamic day — fruit, root, leaf or flower — for anyone who plans a tasting around it. |
| **Saved** | Bookmark anything. Stored as ids, so a data update never leaves you looking at stale text. |
| **Five chassis skins** | Vinodex Classic, Côte de Nuits, Blanc de Blancs, Burgundy Velour, Electric Riesling. Plus a light screen mode and two text sizes. |
| **The website** | `/` **is** Horizon/Godot: a four-page site wearing the same chassis — OUR WORK, WHO WE ARE, CONTACT US, and the DATA readout. Vinodex is an app you open from inside it, and the device boots when you do. |

Every entry is unlocked. There is no account, no paywall, no access code and no
tracking; your saved entries and your chosen skin live in your own browser's
storage.

There used to be a code in front of the app. It was removed in v0.3.0: it lived
in the client bundle and `/dex` was reachable directly anyway, so it withheld
nothing and cost every visitor four taps to find that out. The BIOS does the job
it was really there for — pressing OPEN VINODEX powers the device on, so the app
is handed over rather than stumbled into.

On the site the chassis is always the red Vinodex CLASSIC shell and the wordmark
under the screen reads HORIZON/GODOT; in the app it is whichever skin you chose,
and it reads VINODEX.

## The iOS app is the sibling, not the source

<img src="ios/AppIcon.png" alt="Vinodex for iOS" width="76" align="left" hspace="16" vspace="4" />

**[`blaikooz/vinodex-ios`](https://github.com/blaikooz/vinodex-ios)** is a native
SwiftUI build of the same device — same chassis, same screens, same rules. This
web app is kept deliberately close to it, and the Swift source is the reference
when the two disagree.

<br clear="left" />

> ### Frozen paths — do not edit
>
> The iOS app moved out on 2026-07-29 and now owns its source, data and
> tooling. Nothing is copied between the repos in either direction. Until then
> it was *generated* from here by `scripts/publish-swift.mjs`, which emptied
> that repo's tree on every run, so a commit made there did not survive. That
> script, the `swift` remote, the `swift-main` branch and the `publish:swift*`
> npm scripts are all deleted.
>
> | Path | Status | Master |
> |---|---|---|
> | `shared/` | mirrored — do not edit here | `HGapps\shared`, via `sync-shared.ps1` |
> | `shared/pixelflags/` | live, and mirrored | `HGapps\shared\pixelflags` |
> | ~~`scripts/generate-ios-data.ts`, `scripts/rasterize-icons.sh`~~ | **deleted v0.7.8** | `vinodex-ios/scripts/` |
>
> `shared/` is here because the web app imports it — 7 files under
> `web/src/services/`, plus `web/data/flagImages.ts` for the flags — and it
> still will: `/` is the company site and the encyclopedia opens from inside it,
> so the catalogue stays rather than being replaced by a landing page.
> It is **mirrored, not frozen**: `sync-shared.ps1` overwrites this copy from
> the master, so an edit made here is lost on the next sync. The `generate:ios`
> / `icons:ios` scripts are gone, so **an iOS data change is made in
> `vinodex-ios`.** `ios/` — the frozen 419-file copy of the Swift package — was
> removed in the 0.6.5 cleanup, and the last two frozen scripts followed in
> v0.7.8: nothing here generates for iOS any more.

## Running it

Node 20 or newer (`.nvmrc` pins `20.18.0`).

```bash
npm install
npm run dev        # Vite dev server, port 3000
```

```bash
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run build      # production build into dist/
npm run preview    # serve that build
```

`typecheck`, `test`, `build`, `check:refs` and `test:e2e` are the gates —
`npm run test:all` runs the five in order, and `.github/workflows/gates.yml`
runs them on every push to `master` and `testing`.

The last one is the render gate: Playwright drives a real browser over the
routes and fails on a console error, a failed request or any 4xx, and
captures every surface in both screen modes. It exists because the other
four never prove a screen *renders* — a screen that throws on mount
typechecks and passes Vitest, and this repo went whole releases without
anyone looking at the chassis. It found three real faults the day it landed.
See [`playwright.config.ts`](playwright.config.ts); note that
`reuseExistingServer` is on outside CI, so a stale server already on :4173
will be tested instead of your build.

Tests are Vitest under jsdom, configured by [`vitest.config.ts`](vitest.config.ts)
and colocated with what they cover (`*.test.ts` beside the service, `*.test.tsx`
beside the component). The service suites are ports of the XCTest suites in
`vinodex-ios/Tests/VinodexCoreTests/`, and each file's header records which
Swift cases were adapted or dropped and why. `npm run test:watch` for the
watcher.

## Deploying

Vercel, configured by [`vercel.json`](vercel.json):

- **SPA rewrite** so `/dex`, `/detail/<id>` and the site's own pages (`/apps`,
  `/who-we-are`, `/contact`, `/project/<id>`) resolve on a cold load instead of
  404ing — as do the v0.2.x `/website/...` URLs, which the router redirects.
  Anything with a file extension, plus `assets/` and `icons/`, is left alone and
  served statically.
- **Immutable caching** on hashed assets; **no-cache** on `sw.js` and
  `manifest.webmanifest`, so a returning browser picks up a new build rather
  than serving yesterday's shell forever.
- Output directory is the repo-root `dist/`, which is where `vite.config.ts`
  writes — not `web/dist`.

## Layout

```text
vinodex-web/
  web/               The Vite/React PWA — the live part of this repo
    App.tsx          Routing and navigation handlers
    components/      Screens, the device chassis, tiles
    src/services/    Theme, screen state, bookmarks, daily pick, scanner
    data/            Web-only data (flag imports, encyclopedia)
    public/          Static assets

  shared/            MIRRORED from HGapps\shared — edit the master, not this
    pixelflags/      Pixel-art flags, imported by web/data/flagImages.ts
  scripts/           Encyclopedia tooling (live) + two frozen iOS generators
```

`shared/constants.ts` is the runtime source of truth for entries.
`web/public/wine-entries.json` is a static artifact and **not** the active
runtime loader.

### Working on data or colours

For the iOS app, edit `shared/` in
[`vinodex-ios`](https://github.com/blaikooz/vinodex-ios) and regenerate there
(`npm run generate`). The copy in this repo feeds the web app only, and changing
it has no effect on iOS.

## Credits

- **Lucide** — UI and utility icons ([lucide.dev](https://lucide.dev))
- **game-icons** — wine, flavour and regional glyphs, via Iconify
  ([game-icons.net](https://game-icons.net))
- **Press Start 2P** and **VT323** — the retro and terminal faces
