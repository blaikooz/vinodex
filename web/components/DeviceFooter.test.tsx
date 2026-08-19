import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DeviceFooter from './DeviceFooter';
import { DEFAULTS, pinRoute } from '../src/services/quickPins';

/**
 * The button band, and the one rule the lamps could quietly break.
 *
 * **Separation.** `/dex...` is the encyclopedia and `/website...` is the
 * company portal; they deliberately share this chassis so the two read as one
 * brand, and they must share nothing else. `showSystemButtons={false}` is how
 * every portal screen says so, and it exists because SAVED and SETTINGS are
 * in-app controls.
 *
 * The marquee lamps are in-app controls too — **every pin resolves to
 * `/minigames` or `/settings/*`** — so making them buttons without following
 * that flag would have put dex navigation *and* dex copy (the engraved TOOLS /
 * CUSTOMIZE) on OUR WORK and CONTACT US, and offered a route around the unlock
 * doorman from a page that is meant to be in front of it.
 *
 * This is the test for that, and it is written from the route table rather
 * than from a list of labels, so a sixth pin pointing somewhere new cannot slip
 * past it.
 */
const mount = (showSystemButtons: boolean) =>
  render(
    <MemoryRouter>
      <DeviceFooter
        title="VINODEX"
        showBack
        onBack={vi.fn()}
        onHome={vi.fn()}
        showSystemButtons={showSystemButtons}
        onReassignLamp={vi.fn()}
      />
    </MemoryRouter>,
  );

describe('<DeviceFooter />', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it('gives the dex two lamp buttons, named for their pins', () => {
    mount(true);
    for (const pin of DEFAULTS) {
      expect(screen.getByRole('button', { name: pin })).toBeTruthy();
    }
    expect(document.querySelectorAll('.lamp-hit')).toHaveLength(2);
  });

  it('gives the portal the moulded lamps and no controls', () => {
    // The parts stay — a shell that grows and loses pieces between the two
    // products is the shared-chassis decision half-applied — but they are
    // decoration there, exactly as they were before v0.2.1.
    mount(false);
    expect(document.querySelectorAll('.lamp-hit')).toHaveLength(0);
    expect(document.querySelectorAll('.band-pills .recessed-lamp')).toHaveLength(2);
    expect(document.querySelector('.band-pills')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('puts no dex destination on a portal screen', () => {
    // Stated from the routes rather than from the labels: every pin lands in
    // the dex, so a portal band offering ANY of them is the leak.
    mount(false);
    const dexRoutes = new Set(DEFAULTS.map(pinRoute));
    expect([...dexRoutes].every(r => r.startsWith('/minigames') || r.startsWith('/settings'))).toBe(true);

    const named = [...document.querySelectorAll('button')]
      .map(b => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim());
    for (const pin of DEFAULTS) {
      expect(named, `${pin} reached a portal screen`).not.toContain(pin);
    }
  });

  it('hides SAVED and SETTINGS on the portal, as it always did', () => {
    // The rule the lamps now follow, restated so the two cannot drift apart.
    mount(false);
    expect(screen.queryByRole('button', { name: 'Collection' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
  });
});
