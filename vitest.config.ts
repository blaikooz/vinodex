import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Separate from `vite.config.ts` on purpose.
 *
 * That config sets `root: web/` and mounts the PWA plugin, both of which the
 * unit tests neither need nor want — a service worker is generated on every run
 * otherwise, and the root shift puts the repo-root `shared/` outside the tree.
 * This one keeps the repo root and carries across the single thing the tests do
 * rely on: the `@/*` alias that `shared/` is imported through.
 *
 * jsdom rather than node: the stores under test are localStorage-backed, and
 * the Swift originals they are ported from run against a real `UserDefaults`
 * rather than a stub. Testing against a fake store would not exercise the JSON
 * round trip or the corrupt-value guards, which is where the bugs live.
 */
export default defineConfig({
  // Only the React transform, not the PWA plugin — the component tests render
  // real screens, so JSX has to compile, but nothing here wants a service
  // worker generated on every run.
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['web/**/*.test.ts', 'web/**/*.test.tsx'],
    // Each file gets a fresh jsdom, so one suite's localStorage cannot leak
    // into the next — the isolation the Swift suites get from a per-test
    // `UserDefaults(suiteName:)`.
    isolate: true,
    restoreMocks: true,
  },
});
