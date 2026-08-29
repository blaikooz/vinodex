import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEVICE_FRAME_BOX } from '../src/services/deviceFrame';
import ScreensaverOverlay, { ScreensaverProvider } from './ScreensaverOverlay';
import { SCREENSAVER_PALETTE } from '../src/services/screensaver';

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

  /**
   * The mark is the two-layer wordmark, tinted (v0.6.14) — iOS parity for
   * the colour effect. A raster `<img>` cannot change colour, which is why
   * the web's saver bounced a fixed red tile for six releases.
   */
  it('draws the wordmark as two tintable layers, opening on the accent', () => {
    render(
      <ScreensaverProvider active onDismiss={vi.fn()}>
        <ScreensaverOverlay />
      </ScreensaverProvider>,
    );
    const mark = document.querySelector('svg[data-screensaver-mark]');
    expect(mark, 'the mark is not an inline SVG').not.toBeNull();
    expect(document.querySelector('img'), 'a raster mark is back').toBeNull();
    const face = mark!.querySelector('path[data-mark-face]')!;
    const shade = mark!.querySelector('path[data-mark-shade]')!;
    // Opens on palette[0] -- the LCD's own accent -- on every raise.
    expect(face.getAttribute('fill')).toBe(SCREENSAVER_PALETTE[0]);
    expect(shade.getAttribute('fill')).toBe(SCREENSAVER_PALETTE[0]);
    // The shade is the same ink dimmed, never a second colour.
    expect(shade.getAttribute('fill-opacity')).toBe('0.45');
    // Pixel art with hard corners: no anti-aliasing on either layer.
    expect(face.getAttribute('shape-rendering')).toBe('crispEdges');
    expect(shade.getAttribute('shape-rendering')).toBe('crispEdges');
  });
});
