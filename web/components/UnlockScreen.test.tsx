import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import UnlockScreen from './UnlockScreen';
import { isAppUnlocked } from '../src/services/appUnlock';

/**
 * The gate, driven the way someone actually uses it.
 *
 * `MemoryRouter` because `DeviceLayout` calls `useNavigate` for the chassis
 * controls — the screen under test does not route anywhere itself, but its
 * frame does, and rendering it bare throws.
 *
 * These are the first component tests in the repo. IOS-PARITY.md records that
 * nothing here had ever been rendered, only typechecked and built; a keypad
 * whose verdict fires from an effect is exactly the kind of thing that compiles
 * cleanly and still never advances.
 */
const renderScreen = (onUnlocked = vi.fn()) => {
  render(
    <MemoryRouter>
      <UnlockScreen onUnlocked={onUnlocked} onBack={vi.fn()} onHome={vi.fn()} />
    </MemoryRouter>,
  );
  return onUnlocked;
};

const type = async (digits: string) => {
  const user = userEvent.setup();
  for (const d of digits) {
    await user.click(screen.getByRole('button', { name: d }));
  }
};

describe('<UnlockScreen />', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a full keypad', () => {
    renderScreen();
    for (const d of '0123456789') {
      expect(screen.getByRole('button', { name: d })).toBeDefined();
    }
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
  });

  it('reports progress as digits are entered', async () => {
    renderScreen();
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('0 of 4 digits entered');
    await type('00');
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('2 of 4 digits entered');
  });

  it('unlocks on the right code and tells its caller once', async () => {
    const onUnlocked = renderScreen();
    await type('0000');
    expect(onUnlocked).toHaveBeenCalledTimes(1);
    expect(isAppUnlocked('vinodex')).toBe(true);
  });

  it('rejects a wrong code, says so, and stays locked', async () => {
    const onUnlocked = renderScreen();
    await type('1234');

    expect(onUnlocked).not.toHaveBeenCalled();
    expect(isAppUnlocked('vinodex')).toBe(false);
    expect(screen.getByRole('alert').textContent).toContain('INCORRECT CODE');
    // And it clears itself, so the next attempt starts from nothing.
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('0 of 4 digits entered');
  });

  it('lets a refused attempt be followed by a correct one', async () => {
    const onUnlocked = renderScreen();
    await type('1234');
    await type('0000');
    expect(onUnlocked).toHaveBeenCalledTimes(1);
    expect(isAppUnlocked('vinodex')).toBe(true);
  });

  it('clears the error as soon as the next digit lands', async () => {
    renderScreen();
    await type('1234');
    expect(screen.getByRole('alert').textContent).toContain('INCORRECT CODE');
    await type('0');
    expect(screen.getByRole('alert').textContent?.trim()).toBe('');
  });

  it('deletes the last digit', async () => {
    const onUnlocked = renderScreen();
    const user = userEvent.setup();

    await type('000');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('2 of 4 digits entered');

    // Two more would have been four without the delete; now it takes two.
    await type('00');
    expect(onUnlocked).toHaveBeenCalledTimes(1);
  });

  it('deleting on an empty code is harmless', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('0 of 4 digits entered');
  });

  it('accepts a physical keyboard', async () => {
    const onUnlocked = renderScreen();
    const user = userEvent.setup();
    await user.keyboard('0000');
    expect(onUnlocked).toHaveBeenCalledTimes(1);
    expect(isAppUnlocked('vinodex')).toBe(true);
  });

  it('accepts Backspace from the keyboard', async () => {
    renderScreen();
    const user = userEvent.setup();
    await user.keyboard('00{Backspace}');
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('1 of 4 digits entered');
  });

  /** A fifth tap must not overflow the code or re-fire the verdict. */
  it('ignores taps past the code length', async () => {
    const onUnlocked = renderScreen();
    await type('0000');
    await type('0');
    expect(onUnlocked).toHaveBeenCalledTimes(1);
  });
});
