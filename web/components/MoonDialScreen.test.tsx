import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MoonDialScreen from './MoonDialScreen';
import { DEFAULTS } from '../src/services/quickPins';
import {
  isGoodForDrinking,
  moonDay,
  moonElement,
  moonQuote,
  moonVerdict,
  zodiacName,
} from '../src/services/moonService';

/**
 * The readout, on a fixed day.
 *
 * `now` is injectable purely so this can exist: the screen otherwise reads the
 * clock, and a test that asserted "FRUIT DAY" would pass or fail depending on
 * the afternoon it ran. Values are checked against the service rather than
 * hardcoded, so the suite pins that the screen *shows what the calendar says*
 * without duplicating the calendar's own cases — those live in
 * `moonService.test.ts`.
 */
const renderDial = (now: Date) => {
  render(
    <MemoryRouter>
      <MoonDialScreen onBack={vi.fn()} onHome={vi.fn()} now={now} />
    </MemoryRouter>,
  );
};

// A spread of dates, so the suite covers more than one day type between them.
const DAYS = [
  new Date(2026, 0, 5),
  new Date(2026, 2, 14),
  new Date(2026, 6, 28),
  new Date(2026, 10, 3),
];

describe('<MoonDialScreen />', () => {
  afterEach(() => {
    cleanup();
  });

  it.each(DAYS)('shows the day type, element and sign for %s', date => {
    renderDial(date);
    const day = moonDay(date);

    expect(screen.getByText(`${day} DAY`)).toBeDefined();
    expect(screen.getByText(moonElement(day))).toBeDefined();
    expect(screen.getByText(zodiacName(date))).toBeDefined();
  });

  it.each(DAYS)('shows the verdict and its line for %s', date => {
    renderDial(date);
    const day = moonDay(date);

    expect(screen.getByText(moonVerdict(day))).toBeDefined();
    expect(screen.getByText(moonQuote(date))).toBeDefined();
  });

  it('words the verdict from whether the day is good for drinking', () => {
    const date = DAYS[0]!;
    renderDial(date);
    const expected = isGoodForDrinking(moonDay(date)) ? 'GOOD DAY TO DRINK' : 'MAYBE NOT TODAY';
    expect(screen.getByText(expected)).toBeDefined();
  });

  it('prints the date it was given, not today', () => {
    renderDial(new Date(2026, 6, 28));
    // Locale-dependent formatting, so the year is the stable part to assert.
    expect(screen.getByText(/2026/)).toBeDefined();
  });

  /**
   * The iOS screen is deliberately a readout with no interaction — the
   * draggable dial and its week/day toggle are gone. The only buttons left
   * should be the chassis controls.
   */
  it('offers no controls beyond the chassis', () => {
    renderDial(DAYS[0]!);
    const named = screen
      .getAllByRole('button')
      .filter(b => !b.hasAttribute('disabled'))
      .map(b => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim());

    // The full chassis control set and nothing else. Since the v0.6.9 chrome
    // port Back and Collection are separate buttons in the left well rather
    // than one slot that swaps label, so all four are present whenever there
    // is somewhere to go back to.
    //
    // "Collection", not "Saved entries" and not iOS's "User" (ruling, v7):
    // the page behind that button is titled COLLECTION here, which is a
    // long-standing deliberate deviation from iOS's SAVED, and a chassis
    // control announcing a name the page does not use is that deviation half
    // applied.
    //
    // **The two marquee lamps joined the set in v0.2.1.** Each is announced as
    // the pin it currently holds (iOS `accessibilityLabel(pin.displayName)`),
    // so what they are called is a property of the device's state rather than
    // a label in the markup. Read from `DEFAULTS` rather than written down: a
    // device whose lamps have been pointed elsewhere names something else, and
    // hardcoding TOOLS/CUSTOMIZE here would pin the shipped pair by accident
    // in a test about the control *set*.
    expect(named.sort()).toEqual(
      ['Back', 'Collection', 'Home', 'Settings', ...DEFAULTS].sort(),
    );
  });
});
