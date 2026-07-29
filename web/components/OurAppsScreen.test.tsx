import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import OurAppsScreen from './OurAppsScreen';
import { lockApp, unlockApp } from '../src/services/appUnlock';

/**
 * The shelf, and specifically that its lock badge follows the store.
 *
 * The badge is read from `appUnlock` rather than passed in, so it is only
 * correct if the `useSyncExternalStore` subscription actually fires — a
 * component that read the value once at mount would pass a static render check
 * and then show LOCKED forever after the code was accepted.
 */
const renderShelf = (onSelectVinodex = vi.fn()) => {
  render(
    <MemoryRouter>
      <OurAppsScreen onSelectVinodex={onSelectVinodex} onBack={vi.fn()} onHome={vi.fn()} />
    </MemoryRouter>,
  );
  return onSelectVinodex;
};

describe('<OurAppsScreen />', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('lists Vinodex and an honest placeholder for the rest', () => {
    renderShelf();
    expect(screen.getByText('VINODEX')).toBeDefined();
    expect(screen.getByText('MORE APPS')).toBeDefined();
    expect(screen.getByText('COMING SOON')).toBeDefined();
  });

  it('shows LOCKED before the code is given', () => {
    renderShelf();
    expect(screen.getByText('LOCKED')).toBeDefined();
    expect(screen.queryByText('UNLOCKED')).toBeNull();
  });

  it('shows UNLOCKED when the store already says so at mount', () => {
    unlockApp('vinodex', '0000');
    renderShelf();
    expect(screen.getByText('UNLOCKED')).toBeDefined();
  });

  /**
   * The subscription, not just the initial read.
   *
   * The store writes happen inside `act` because they originate outside React —
   * that is the whole point of `useSyncExternalStore` here — so without it the
   * re-render they schedule has not been flushed by the time we assert.
   */
  it('follows the store while mounted', () => {
    renderShelf();
    expect(screen.getByText('LOCKED')).toBeDefined();

    act(() => {
      unlockApp('vinodex', '0000');
    });
    expect(screen.getByText('UNLOCKED')).toBeDefined();

    act(() => {
      lockApp('vinodex');
    });
    expect(screen.getByText('LOCKED')).toBeDefined();
  });

  it('hands the selection back to its caller', async () => {
    const onSelectVinodex = renderShelf();
    await userEvent.setup().click(screen.getByRole('button', { name: /VINODEX/ }));
    expect(onSelectVinodex).toHaveBeenCalledTimes(1);
  });

  /** The placeholder must be inert — not a button that quietly does nothing. */
  it('offers no control for the app that does not exist yet', () => {
    renderShelf();
    expect(screen.queryByRole('button', { name: /MORE APPS/ })).toBeNull();
  });
});
