import path from 'path';
import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const gitCommitCount = (() => {
  try {
    return execSync('git rev-list --count HEAD').toString().trim();
  } catch {
    return '0';
  }
})();

// The Vite app is one of three peers under this repo root (`web/`, `shared/`,
// `ios/`), so `root` points at `web/` while the toolchain config, node_modules
// and the build output stay at the repo root. `fs.allow` has to name the repo
// root explicitly: the app legitimately imports from outside `web/` — the
// `@/shared/*` data and colour tables, and `package.json` for the app *name*
// on the back plate — and the dev server refuses to serve those otherwise.
// (Not the version: that is a constant in `appVersion.ts`, and `pkg.version`
// is read nowhere in the app.)
export default defineConfig({
  root: path.resolve(__dirname, 'web'),
  publicDir: path.resolve(__dirname, 'web/public'),
  define: {
    __GIT_COMMIT_COUNT__: JSON.stringify(gitCommitCount),
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    fs: {
      allow: [path.resolve(__dirname)],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // `script-defer` rather than the default synchronous `<script src=
      // "/registerSW.js">` in <head>: the registration is 400 bytes but it
      // is a render-blocking request on the critical path of every route,
      // and Lighthouse charged it ~300ms of LCP on a throttled phone
      // (v0.6.18). Deferred, it runs after parse and the worker registers
      // exactly as before -- `registerType: 'autoUpdate'` is unaffected.
      injectRegister: 'script-defer',
      includeAssets: ['vinodex-logo.png'],
      manifest: {
        name: 'VINODEX',
        short_name: 'VINODEX',
        description: 'A retro wine field guide for exploring grapes, regions, styles, and tasting profiles.',
        theme_color: '#DC0A2D',
        background_color: '#232323',
        display: 'standalone',
        orientation: 'portrait',
        // An installed PWA opens the app, not the studio site. Someone who
        // added Vinodex to their home screen installed *the app*; "/" is
        // Horizon/Godot's front page and there is no longer a splash asking
        // which they meant (v8#1).
        //
        // This is a cold arrival on a dex route, so it boots — which is right:
        // tapping the icon is the clearest "open Vinodex" there is (v8#2).
        start_url: '/dex',
        icons: [
          {
            src: 'vinodex-logo.png',
            sizes: '650x650',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      // Terser crashes when minifying the generated SW; keep it unminified for a reliable build.
      minify: false,
      workbox: {
        // Force dev mode output to avoid Workbox/terser minify crash while generating the SW.
        mode: 'development',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // The pixel-art portraits (254 PNGs) are large and only some are seen
        // in a session — cache them on demand rather than force-precaching the
        // whole set into the service-worker install (which otherwise pushes the
        // precache past 6 MB). Runtime rule below caches each art PNG on first
        // view. The glyph icon bundle stays precached (offline-first).
        globIgnores: ['**/art/**'],
        runtimeCaching: [
          {
            urlPattern: /\/art\/.*\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'vinodex-art-cache',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 90
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
          // The two `CacheFirst` rules for fonts.googleapis.com and
          // fonts.gstatic.com are DELETED (v0.4.0, m1). Press Start 2P, VT323
          // and Inter are self-hosted under `public/fonts/` now, so those two
          // origins are never requested and the rules matched nothing.
          //
          // They are removed rather than kept "just in case" because a
          // runtime rule for an origin the app does not use is a claim that
          // it does: the next person reading this config would conclude the
          // fonts are still third-party and offline-fragile, which was the
          // whole thing m1 fixed. `globPatterns` above already names `woff2`,
          // so the six subsets are precached with the rest of the shell --
          // +190 KB on a 5.2 MB precache, in exchange for typography that
          // works with no network at all.
          //
          // The art rule above stays exactly as it was: 254 portraits are
          // runtime-cached on purpose, and this change does not touch that.
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    target: 'es2019',
    // Keep the build output at the repo root rather than web/dist, so the
    // existing .gitignore entry and any deploy step still find it.
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.js')
  }
});
