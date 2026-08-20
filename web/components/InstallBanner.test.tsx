import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

/**
 * The install nudge, and the offset it publishes (v7#D8).
 *
 * The user's v0.2.2 batch reported this bar overlapping the top of the device.
 * It arrived already closed — the fault was cleanbot's H2, fixed in v0.2.0 by
 * having the bar publish its own height as `--install-banner-h` and having the
 * app shell pad itself down by exactly that (`App.tsx`, `InstallBanner.tsx:36`).
 * The batch was written against an older deploy.
 *
 * There was no test, which is why the report could not be answered by pointing
 * at one. This is that test. It pins the whole contract:
 *
 * - **Dormant while the listing is a placeholder.** `APP_STORE_LISTING_IS_LIVE`
 *   is derived from the App Store id still being `id0000000000`, so today the
 *   bar renders for nobody and publishes nothing. That is a release decision,
 *   not an accident, and it is the reason the reported overlap cannot occur at
 *   all in the shipped build.
 * - **When it does show, the shell is told how tall it is** — and told again,
 *   as nothing, the moment it is dismissed. A bar that published a height it
 *   never withdrew would leave a permanent 36px gap above the device.
 *
 * `isStandalone` is stubbed rather than driven through `matchMedia`: the point
 * under test is the offset contract, and an installed-PWA check is a different
 * test's business.
 */

const setLive = (live: boolean) => {
  vi.doMock('../src/services/shareLink', () => ({
    APP_STORE_URL: live
      ? 'https://apps.apple.com/app/vinodex/id1234567890'
      : 'https://apps.apple.com/app/vinodex/id0000000000',
    APP_STORE_LISTING_IS_LIVE: live,
    isStandalone: () => false,
  }));
};

const mount = async () => {
  const { default: InstallBanner } = await import('./InstallBanner');
  return render(<InstallBanner />);
};

const publishedHeight = () =>
  document.documentElement.style.getPropertyValue('--install-banner-h');

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
  document.documentElement.style.removeProperty('--install-banner-h');
});

afterEach(() => {
  cleanup();
  vi.doUnmock('../src/services/shareLink');
});

describe('InstallBanner', () => {
  it('renders nothing and publishes no offset while the listing is a placeholder', async () => {
    setLive(false);
    await mount();
    expect(screen.queryByRole('region', { name: /Get the Vinodex iOS app/i })).toBeNull();
    expect(publishedHeight()).toBe('');
  });

  it('publishes its height so the shell can pad down by exactly the bar', async () => {
    setLive(true);
    await mount();
    expect(screen.getByRole('region', { name: /Get the Vinodex iOS app/i })).toBeTruthy();
    expect(publishedHeight()).toBe('2.25rem');
  });

  it('withdraws the offset on dismiss, rather than leaving a gap', async () => {
    setLive(true);
    await mount();
    expect(publishedHeight()).toBe('2.25rem');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByRole('region', { name: /Get the Vinodex iOS app/i })).toBeNull();
    expect(publishedHeight()).toBe('');
    expect(window.localStorage.getItem('installNudgeDismissed')).toBe('1');
  });

  it('stays dismissed on a later visit', async () => {
    setLive(true);
    window.localStorage.setItem('installNudgeDismissed', '1');
    await mount();
    expect(screen.queryByRole('region', { name: /Get the Vinodex iOS app/i })).toBeNull();
    expect(publishedHeight()).toBe('');
  });
});

/**
 * The seam the fix depends on, asserted where it lives rather than assumed.
 *
 * The pad is only correct if the shell reads the same variable the bar writes,
 * with a `0px` fallback for the (currently universal) case where there is no
 * bar. A rename on either side would silently reopen the overlap.
 */
describe('the app shell offset', () => {
  it('pads by the published variable, with a zero fallback', () => {
    // From the vitest root (the repo root) rather than `import.meta.url`,
    // which under vitest is an http URL that `readFileSync` will not take.
    const src = readFileSync(resolve(process.cwd(), 'web/App.tsx'), 'utf8');
    expect(src).toContain('var(--install-banner-h, 0px)');
  });
});
