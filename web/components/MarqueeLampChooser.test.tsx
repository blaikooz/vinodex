import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarqueeLampChooser from './MarqueeLampChooser';
import { assignPin, pins } from '../src/services/quickPins';

/**
 * The chooser, driven the way someone actually uses it.
 *
 * The three things worth a test are the three things iOS's own header argues
 * for, and each would compile perfectly while being wrong:
 *
 * 1. **It assigns and closes — it does not navigate.** A chooser that took you
 *    to the page would be the duplication A1 deleted the drawer to remove. The
 *    test asserts on `onClose` firing and the store moving, and would catch a
 *    stray `navigate(...)` because the component is rendered with no router at
 *    all — `useNavigate` outside a router throws.
 * 2. **The three chip states.** The middle one — the pin the *other* lamp
 *    holds, outlined and marked with that lamp's initial — is what makes the
 *    swap rule legible, and it is the one a naive two-state implementation
 *    silently drops.
 * 3. **It is a real dialog.** Escape closes it and Tab cannot leave it. v7#U2
 *    records seven scrims in this repo of which none did either.
 */
const open = (slot = 0) => {
  const onClose = vi.fn();
  render(<MarqueeLampChooser slot={slot} onClose={onClose} />);
  return onClose;
};

describe('<MarqueeLampChooser />', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Back to the shipped pair, through the store's own door rather than by
    // reaching into its cache.
    assignPin('TOOLS', 0);
    assignPin('CUSTOMIZE', 1);
  });

  afterEach(cleanup);

  it('names the lamp by the side it is on, not by a number', () => {
    // "The two buttons are physical objects on the shell and the user is
    // looking straight at them."
    // `getByRole(..., { name })` resolves the accessible name, which is what
    // `aria-labelledby` on the card is for. The repo has no jest-dom matchers.
    open(0);
    expect(screen.getByRole('dialog', { name: 'LEFT BUTTON' })).toBeTruthy();
    cleanup();
    open(1);
    expect(screen.getByRole('dialog', { name: 'RIGHT BUTTON' })).toBeTruthy();
  });

  it('offers exactly the five pins', () => {
    open();
    for (const pin of ['TOOLS', 'CUSTOMIZE', 'SETTINGS', 'DATA', 'ACCESS']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${pin}`) })).toBeTruthy();
    }
    // DEV is developer plumbing reached by a button, not a place to point a
    // lamp — the one section the vocabulary deliberately does not carry.
    expect(screen.queryByRole('button', { name: /^DEV/ })).toBeNull();
  });

  it('assigns and closes, and does not navigate', async () => {
    // Rendered with no `MemoryRouter`: any `useNavigate` in this component
    // would have thrown before the first assertion ran.
    const onClose = open(0);
    await userEvent.click(screen.getByRole('button', { name: /^DATA/ }));
    expect(pins()).toEqual(['DATA', 'CUSTOMIZE']);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('swaps when the chosen pin is on the other lamp', async () => {
    const onClose = open(0);
    await userEvent.click(screen.getByRole('button', { name: /^CUSTOMIZE/ }));
    expect(pins()).toEqual(['CUSTOMIZE', 'TOOLS']);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("marks this lamp's pin, and the other lamp's, differently", () => {
    open(0);
    const mine = screen.getByRole('button', { name: /^TOOLS/ });
    const other = screen.getByRole('button', { name: /^CUSTOMIZE/ });
    const spare = screen.getByRole('button', { name: /^DATA/ });

    expect(mine.getAttribute('aria-pressed')).toBe('true');
    expect(other.getAttribute('aria-pressed')).toBe('false');
    expect(spare.getAttribute('aria-pressed')).toBe('false');

    // The middle state, spelled out: the OTHER lamp is the right one, so its
    // pin wears an R. Without it, assigning an already-used destination reads
    // as the app losing a setting rather than as a swap.
    expect(within(other).getByText('R')).toBeTruthy();
    expect(within(spare).queryByText('R')).toBeNull();
    expect(within(mine).queryByText('R')).toBeNull();
  });

  it('tells a screen reader what choosing each chip will do', () => {
    open(0);
    expect(screen.getByRole('button', { name: /Already on the left button/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Choosing it swaps the two/ })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Point the left button here/ })).toHaveLength(3);
  });

  it('closes on Escape and on the CLOSE button', async () => {
    let onClose = open();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();

    onClose = open();
    await userEvent.click(screen.getByRole('button', { name: 'CLOSE' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('takes focus, and will not let Tab leave', async () => {
    open();
    const buttons = within(screen.getByRole('dialog')).getAllByRole('button');
    expect(document.activeElement).toBe(buttons[0]);

    // Forward off the end wraps to the front rather than escaping to the scrim
    // or to the document — a dialog a keyboard can tab out of is modal for a
    // mouse and for nothing else.
    buttons[buttons.length - 1]!.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(buttons[0]);

    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('leaves a way out for a pointer that never reaches the card', async () => {
    // The scrim is a real button, not a div with a click handler, so it is
    // announced and reachable rather than being a pointer-only affordance.
    const onClose = open();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
