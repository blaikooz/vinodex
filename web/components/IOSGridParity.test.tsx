import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MinigamesScreen from './MinigamesScreen';
import { SettingsGrid } from './SettingsPanel';

afterEach(cleanup);

const noop = vi.fn();

describe('iOS-style LCD grids', () => {
  it('renders the Tools shelf in iOS order with illustrated art, not Lucide glyphs', () => {
    const onScanner = vi.fn();
    const onProfVino = vi.fn();
    const onQuiz = vi.fn();
    const onDailyChallenge = vi.fn();
    const onMoonDial = vi.fn();
    render(
      <MemoryRouter initialEntries={['/minigames']}>
        <MinigamesScreen
          onScanner={onScanner}
          onProfVino={onProfVino}
          onQuiz={onQuiz}
          onDailyChallenge={onDailyChallenge}
          onMoonDial={onMoonDial}
          onBack={noop}
          onHome={noop}
        />
      </MemoryRouter>,
    );

    const shelf = document.querySelector('[data-ios-grid="tools"]')!;
    const buttons = [...shelf.querySelectorAll('button')];
    expect(buttons.map(button => button.querySelector('.ios-grid-tile-label')?.textContent)).toEqual([
      'BLIND TASTING',
      'LABEL SCAN',
      'WINE EXAM',
      'DAILY CHALLENGE',
      'PROF. VINO',
      'MOON DIAL',
    ]);
    expect([...shelf.querySelectorAll('img')].map(img => img.getAttribute('src'))).toEqual([
      '/art/button/blindtasting.png',
      '/art/button/labelscanner.png',
      '/art/button/wineexam.png',
      '/art/button/dailychallenge.png',
      '/art/vino/vino-neutral.png',
      '/art/button/moondial.png',
    ]);
    expect(shelf.querySelectorAll('svg')).toHaveLength(0);
    const labelScan = buttons[1]!;
    expect(labelScan.disabled).toBe(true);
    const statusId = labelScan.getAttribute('aria-describedby');
    expect(statusId).toBeTruthy();
    expect(document.getElementById(statusId!)?.textContent).toBe('Coming soon — not built yet.');

    for (const button of buttons) fireEvent.click(button);
    expect(onScanner).toHaveBeenCalledOnce();
    expect(onQuiz).toHaveBeenCalledOnce();
    expect(onDailyChallenge).toHaveBeenCalledOnce();
    expect(onProfVino).toHaveBeenCalledOnce();
    expect(onMoonDial).toHaveBeenCalledOnce();
  });

  it('renders the System shelf as the iOS 2-by-3 grid and keeps SHOP on the ACCESS route', () => {
    const onSection = vi.fn();
    const onMinigames = vi.fn();
    const onFirmware = vi.fn();
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsGrid
          onSection={onSection}
          onMinigames={onMinigames}
          onFirmware={onFirmware}
          onExitToSite={noop}
          onBack={noop}
          onHome={noop}
        />
      </MemoryRouter>,
    );

    const shelf = document.querySelector('[data-ios-grid="system"]')!;
    const buttons = [...shelf.querySelectorAll('button')];
    expect(buttons.map(button => button.textContent?.trim())).toEqual([
      'TOOLS', 'CUSTOMIZE', 'SETTINGS', 'DATA', 'SHOP', 'FIRMWARE',
    ]);
    expect([...shelf.querySelectorAll('img')].map(img => img.getAttribute('data-button-art'))).toEqual([
      'tools', 'customize', 'settings', 'data', 'shop', 'firmware',
    ]);
    expect(shelf.querySelectorAll('svg')).toHaveLength(0);

    for (const button of buttons) fireEvent.click(button);
    expect(onMinigames).toHaveBeenCalledOnce();
    expect(onFirmware).toHaveBeenCalledOnce();
    expect(onSection.mock.calls.map(([section]) => section)).toEqual([
      'CUSTOMIZE', 'SETTINGS', 'DATA', 'ACCESS',
    ]);
  });
});
