import { describe, expect, it } from 'vitest';
import { analyticsEnabled, initAnalytics, trackEvent } from './analytics';

/**
 * The gate, proved from the environments that must stay silent (v0.6.1).
 *
 * The interesting property is not that events send — only a real Vercel
 * deployment can prove that — it is that **nothing sends anywhere else**.
 * The Playwright render gate fails on any 404, and `/_vercel/insights/`
 * exists only on Vercel, so an analytics module that woke up under vitest,
 * `vite preview` or the e2e suite would fail gates that have nothing to do
 * with analytics. This suite runs in exactly one of those environments
 * (jsdom: a non-production build on localhost), so `analyticsEnabled()`
 * being false here is the contract, tested from inside.
 */
describe('analytics', () => {
  it('is disabled in the test environment, so no gate can ever see a beacon', () => {
    expect(analyticsEnabled()).toBe(false);
  });

  it('no-ops on every entry point while disabled', () => {
    // Would reject/throw if either touched the network or the DOM here.
    expect(() => {
      initAnalytics();
      trackEvent('landing-view');
      trackEvent('open-app');
      trackEvent('subscribe-nudge-click');
      trackEvent('substack-tap', { source: 'updates-card' });
      trackEvent('substack-tap', { source: 'landing' });
      trackEvent('store-tap', { source: 'install-banner' });
    }).not.toThrow();
  });
});
