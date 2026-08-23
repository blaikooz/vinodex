import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VinodexBootOverlay, VinodexBootProvider } from './VinodexBoot';

describe('the Vinodex BIOS overlay', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('mounts inside its LCD slot instead of covering the viewport', () => {
    const onDone = vi.fn();
    render(
      <VinodexBootProvider active entries={42} onDone={onDone}>
        <div data-testid="lcd-slot">
          <VinodexBootOverlay />
        </div>
      </VinodexBootProvider>,
    );

    const boot = screen.getByRole('button', { name: 'Skip boot' });
    expect(screen.getByTestId('lcd-slot').contains(boot)).toBe(true);
    expect(boot.classList.contains('absolute')).toBe(true);
    expect(boot.classList.contains('fixed')).toBe(false);

    fireEvent.keyDown(boot, { key: 'Enter' });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('waits for an explicit action before handing off', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    const view = render(
      <VinodexBootProvider active entries={42} onDone={onDone}>
        <VinodexBootOverlay />
      </VinodexBootProvider>,
    );

    act(() => vi.advanceTimersByTime(30_000));
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByText('PRESS ANY BUTTON TO CONTINUE')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Skip boot' }));
    expect(onDone).toHaveBeenCalledOnce();

    view.rerender(
      <VinodexBootProvider active={false} entries={42} onDone={onDone}>
        <VinodexBootOverlay />
      </VinodexBootProvider>,
    );
    expect(screen.queryByRole('button', { name: 'Skip boot' })).toBeNull();
  });
});
