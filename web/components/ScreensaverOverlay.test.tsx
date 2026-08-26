import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEVICE_FRAME_BOX } from '../src/services/deviceFrame';
import ScreensaverOverlay, { ScreensaverProvider } from './ScreensaverOverlay';

describe('<ScreensaverOverlay />', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('paints only an LCD overlay, never a second viewport-sized chassis', () => {
    render(
      <ScreensaverProvider active onDismiss={vi.fn()}>
        <div data-testid="lcd-slot">
          <ScreensaverOverlay />
        </div>
      </ScreensaverProvider>,
    );

    const overlay = screen.getByRole('button', { name: 'Screensaver — touch to wake' });
    expect(screen.getByTestId('lcd-slot').contains(overlay)).toBe(true);
    expect(overlay.classList.contains('absolute')).toBe(true);
    expect(overlay.classList.contains('fixed')).toBe(false);
    expect(overlay.classList.contains('device-stage')).toBe(false);

    // DEVICE_FRAME_BOX is the complete outer chassis geometry. The idle view
    // belongs in DeviceLayout's LCD slot and must not paint another copy of it.
    const frameToken = DEVICE_FRAME_BOX.split(' ').find(token => token.startsWith('md:w-'))!;
    const duplicates = [...overlay.querySelectorAll<HTMLElement>('*')]
      .filter(node => node.classList.contains(frameToken));
    expect(duplicates).toHaveLength(0);
  });
});
