import { defineConfig, devices } from '@playwright/test';

/**
 * The cross-engine half of the QA matrix (Phase 4, v0.6.51): the render
 * smoke on Gecko and WebKit, run on demand with `npm run test:cross` --
 * deliberately not part of `test:all`, which stays the chromium gate. Real
 * iOS/Android devices remain the hand-held half of the matrix.
 */
export default defineConfig({
  testDir: './web/e2e',
  outputDir: './web/e2e/.artifacts-cross',
  fullyParallel: true,
  retries: 1,
  workers: 4,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'off',
    viewport: { width: 420, height: 900 },
  },
  projects: [
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 420, height: 900 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 420, height: 900 } } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
