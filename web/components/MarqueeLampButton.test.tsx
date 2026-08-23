import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarqueeLampButton, { LEGEND_CHARS } from './MarqueeLampButton';
import { MARQUEE_PINS } from '../src/services/quickPins';

/**
 * One lamp button.
 *
 * The interesting assertions are all about the **secondary** gesture, because
 * that is the half iOS gets from a platform convention (press and hold, plus a
 * named VoiceOver action) and the web has to build. `contextmenu` is the whole
 * answer: a browser raises it for a right-click, for the Menu key and for
 * Shift+F10, so one handler serves a mouse, a keyboard and a screen reader.
 * A test that only clicked would pass on a control that no keyboard can
 * reassign, which is precisely the failure iOS's own note warns about — "the
 * whole of A1's customisation is unreachable with the screen reader on".
 */
const mount = (over: Partial<React.ComponentProps<typeof MarqueeLampButton>> = {}) => {
  const onActivate = vi.fn();
  const onReassign = vi.fn();
  render(
    <MarqueeLampButton
      slot={0}
      pin="TOOLS"
      fill="#dc2626"
      rim="#991b1b"
      ink="#540f0f"
      onActivate={onActivate}
      onReassign={onReassign}
      hintId="hint"
      {...over}
    />,
  );
  return { onActivate, onReassign, button: screen.getByRole('button') };
};

describe('<MarqueeLampButton />', () => {
  afterEach(cleanup);

  it('is announced as the pin it currently holds', () => {
    // iOS `accessibilityLabel(pin.displayName)`. The control means whatever it
    // was last pointed at, so a fixed name would be a lie.
    const { button } = mount({ pin: 'DATA' });
    expect(button.getAttribute('aria-label')).toBe('DATA');
    expect(button.textContent).toContain('DATA');
  });

  it('goes where the pin points when pressed', async () => {
    const { onActivate, onReassign } = mount();
    await userEvent.click(screen.getByRole('button'));
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onReassign).not.toHaveBeenCalled();
  });

  it('carries a tactile pressed-state treatment', () => {
    const { button } = mount();
    const classes = button.className.split(/\s+/);
    expect(
      classes.some(name => name.startsWith('active:translate-y-') || name.startsWith('active:scale-')),
      'the marquee pill does not move into the chassis when pressed',
    ).toBe(true);
    expect(
      classes.some(name => name.startsWith('active:brightness-') || name.startsWith('active:shadow-')),
      'the marquee pill face does not lose light when pressed',
    ).toBe(true);
  });

  it('opens the chooser on the context menu', () => {
    // Right-click, the Menu key and Shift+F10 all land on this one event.
    const { onActivate, onReassign, button } = mount();
    fireEvent.contextMenu(button);
    expect(onReassign).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('opens the chooser on a hold, and does not also navigate', () => {
    vi.useFakeTimers();
    try {
      const { onActivate, onReassign, button } = mount();
      fireEvent.pointerDown(button, { pointerType: 'touch' });
      vi.advanceTimersByTime(500);
      expect(onReassign).toHaveBeenCalledTimes(1);
      // The click the browser synthesises when the finger comes up must not
      // ALSO fire the primary action: the two gestures do different things and
      // exactly one of them should happen.
      fireEvent.pointerUp(button, { pointerType: 'touch' });
      fireEvent.click(button);
      expect(onActivate).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('a short press is still a press', () => {
    vi.useFakeTimers();
    try {
      const { onActivate, onReassign, button } = mount();
      fireEvent.pointerDown(button, { pointerType: 'touch' });
      vi.advanceTimersByTime(200);
      fireEvent.pointerUp(button, { pointerType: 'touch' });
      fireEvent.click(button);
      expect(onReassign).not.toHaveBeenCalled();
      expect(onActivate).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets a slow mouse click stay a click (W-2)', () => {
    // `pointerdown` does not care what pressed it. Unguarded, a 700ms
    // left-click opened the chooser AND swallowed the navigation — on the one
    // device that already reaches the chooser by its second button.
    vi.useFakeTimers();
    try {
      const { onActivate, onReassign, button } = mount();
      fireEvent.pointerDown(button, { pointerType: 'mouse' });
      vi.advanceTimersByTime(700);
      expect(onReassign).not.toHaveBeenCalled();
      fireEvent.pointerUp(button, { pointerType: 'mouse' });
      fireEvent.click(button);
      expect(onActivate).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reassigns from the keyboard on every desktop (W-3)', () => {
    // macOS keyboards have neither a Menu key nor Shift+F10, so `contextmenu`
    // never fires from a keyboard there and this binding is the only reassign
    // path a macOS keyboard-only user has. Declared as well as implemented, so
    // a screen reader can say what it is.
    const { onActivate, onReassign, button } = mount();
    expect(button.getAttribute('aria-keyshortcuts')).toBe('Alt+Enter');
    fireEvent.keyDown(button, { key: 'Enter', altKey: true });
    expect(onReassign).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('leaves a plain Enter to the primary action', () => {
    const { onReassign, button } = mount();
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onReassign).not.toHaveBeenCalled();
  });

  it('points at the shared hint rather than restating it', () => {
    const { button } = mount();
    expect(button.getAttribute('aria-describedby')).toBe('hint');
  });

  it('fits its legend to the longest pin, not to its own word', () => {
    // iOS 0.8.6 D1: fitting each label separately is what made two lamps side
    // by side wear two different types. `LEGEND_CHARS` is derived from the pin
    // list so a sixth pin moves the fitting rather than overflowing a cap.
    expect(LEGEND_CHARS).toBe(Math.max(...MARQUEE_PINS.map(p => p.length)));
    const { button } = mount({ pin: 'DATA' });
    const legend = button.querySelector('.lamp-legend') as HTMLElement;
    expect(legend.style.getPropertyValue('--legend-chars')).toBe(String(LEGEND_CHARS));
  });
});
