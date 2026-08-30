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
   * The mark is iOS's two-layer V, tinted (v0.6.14 for the colour effect;
   * v0.6.19 for the art). A raster `<img>` cannot change colour, which is why
   * the web's saver bounced a fixed red tile for six releases -- and v0.6.14
   * then bounced the site's H mark for one, having inlined the wrong SVG.
   * The layers are the same two masks the BIOS draws, so the saver and the
   * boot can never disagree about what the logo is.
   */
  it('draws the V mark as the two BIOS masks, tintable, opening on the accent', () => {
    render(
      <ScreensaverProvider active onDismiss={vi.fn()}>
        <ScreensaverOverlay />
      </ScreensaverProvider>,
    );
    const mark = document.querySelector<HTMLElement>('[data-screensaver-mark]');
    expect(mark, 'no mark').not.toBeNull();
    expect(document.querySelector('img'), 'a raster mark is back').toBeNull();
    expect(document.querySelector('svg[data-screensaver-mark]'), 'the H-mark SVG is back').toBeNull();
    const face = mark!.querySelector<HTMLElement>('[data-mark-face]')!;
    const shade = mark!.querySelector<HTMLElement>('[data-mark-shade]')!;
    // The same two masks the BIOS uses -- the V, not the site's H.
    expect(face.style.maskImage).toContain('/art/logo/vinodex-mark-face.png');
    expect(shade.style.maskImage).toContain('/art/logo/vinodex-mark-shade.png');
    // Opens on palette[0] -- the LCD's own accent -- on every raise.
    expect(mark!.dataset.tint).toBe(SCREENSAVER_PALETTE[0]);
    expect(face.style.backgroundColor).toBe(SCREENSAVER_PALETTE[0]);
    expect(shade.style.backgroundColor).toBe(SCREENSAVER_PALETTE[0]);
    // The shade is the same ink dimmed, never a second colour.
    expect(shade.style.opacity).toBe('0.45');
    // No background of its own: the V alone, never the red tile.
    expect(mark!.style.backgroundColor).toBe('');
  });
});
