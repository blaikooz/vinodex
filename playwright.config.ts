import { defineConfig, devices } from '@playwright/test';

/**
 * Render smoke, and the screenshot gate.
 *
 * The standing gap this closes: every parity pass through v6 ran typecheck,
 * vitest and build, and none of them proves a screen *renders* — "green
 * typecheck is not evidence a screen renders" is the house rule, and the
 * chassis had gone whole releases unseen. These tests drive a real browser
 * over the routes the sweeps built, and fail on any console error.
 *
 * Against the preview server rather than dev: the service worker, the PWA
 * manifest and the lazy chunks only behave like production in a real build,
 * and those are exactly the seams a smoke test is for.
 */
export default defineConfig({
  testDir: './web/e2e',
  outputDir: './web/e2e/.artifacts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    // The device is a handheld; a desktop-wide viewport is not the product.
    viewport: { width: 420, height: 900 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 420, height: 900 } } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
