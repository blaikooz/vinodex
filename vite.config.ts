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
      includeAssets: ['vinodex-logo.png'],
      manifest: {
        name: 'VINODEX',
        short_name: 'VINODEX',
        description: 'A retro wine field guide for exploring grapes, regions, styles, and tasting profiles.',
        theme_color: '#DC0A2D',
        background_color: '#232323',
        display: 'standalone',
        orientation: 'portrait',
        // An installed PWA opens the app, not the splash. Someone who has
        // added Vinodex to their home screen has already made the choice the
        // splash exists to offer.
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
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
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
