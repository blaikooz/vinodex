import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MinigamesScreen from './MinigamesScreen';
import { SettingsGrid } from './SettingsPanel';

afterEach(cleanup);

const noop = vi.fn();

describe('iOS-style LCD grids', () => {
  it('renders the Tools shelf in iOS order with illustrated art, not Lucide glyphs', () => {
    render(
      <MemoryRouter initialEntries={['/minigames']}>
        <MinigamesScreen
          onScanner={noop}
          onProfVino={noop}
          onQuiz={noop}
          onDailyChallenge={noop}
          onMoonDial={noop}
          onBack={noop}
          onHome={noop}
        />
      </MemoryRouter>,
    );

    const shelf = document.querySelector('[data-ios-grid="tools"]')!;
    const buttons = [...shelf.querySelectorAll('button')];
    expect(buttons.map(button => button.textContent?.replace('COMING SOON', '').trim())).toEqual([
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
  });

  it('renders the System shelf as the iOS 2-by-3 grid and keeps SHOP on the ACCESS route', () => {
    const onSection = vi.fn();
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsGrid
          onSection={onSection}
          onMinigames={noop}
          onFirmware={noop}
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

    fireEvent.click(buttons[4]!);
    expect(onSection).toHaveBeenCalledWith('ACCESS');
  });
});
