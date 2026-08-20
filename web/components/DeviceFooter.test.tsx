import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DeviceFooter from './DeviceFooter';
import { DEFAULTS, MARQUEE_PINS, pinRoute } from '../src/services/quickPins';
import { isDexPath } from '../src/services/appRoutes';

/**
 * The button band, and the one rule the lamps could quietly break.
 *
 * **Separation.** `/` and its pages are the company site; `/dex...` is the
 * encyclopedia. They deliberately share this chassis so the two read as one
 * brand — and, as of v0.3.0, so that the site reads as the studio's device with
 * the app not yet open on it. They must share nothing else.
 * `showSystemButtons={false}` is how every site screen says so, and it exists
 * because SAVED and SETTINGS are in-app controls.
 *
 * The marquee lamps are in-app controls too — **every pin resolves to
 * `/minigames` or `/settings/*`** — so making them buttons without following
 * that flag would have put dex navigation *and* dex copy (the engraved TOOLS /
 * CUSTOMIZE) on OUR WORK and CONTACT US.
 *
 * This is the test for that, and it is written from the route table rather
 * than from a list of labels, so a sixth pin pointing somewhere new cannot slip
 * past it.
 *
 * ## What changed in v0.3.0, and why the new pin is stronger
 *
 * The third test used to close with "...and offered a route around the unlock
 * doorman from a page that is meant to be in front of it". **There is no
 * doorman** (v8#3): the access code is gone, and `/dex` is reached from OUR
 * WORK by pressing a button. So the old premise — "no dex route is reachable
 * from the site without passing the gate" — is not weakened here, it is
 * *replaced*, because the thing it named no longer exists and a pin that
 * asserts a property of a deleted feature is a pin that can only rot.
 *
 * What replaces it is the property that actually still matters, and it is
 * strictly harder to satisfy: **no dex destination may appear on a site
 * screen's chassis at all.** The old wording allowed the question to be
 * answered with "it is fine, it goes through the door"; this one does not
 * admit that answer. It is also stated over `isDexPath` — the same classifier
 * the boot, the skin and the screensaver read — rather than over a hand-written
 * list of two prefixes, so a lamp pointed at a *new* dex route fails here
 * without this file being edited. The old version could not have said that.
 */
const mount = (showSystemButtons: boolean) =>
  render(
    <MemoryRouter>
      <DeviceFooter
        title="VINODEX"
        skin="CLASSIC"
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

  it('gives the site the moulded lamps and no controls', () => {
    // The parts stay — a shell that grows and loses pieces between the two
    // products is the shared-chassis decision half-applied — but they are
    // decoration there, exactly as they were before v0.2.1.
    mount(false);
    expect(document.querySelectorAll('.lamp-hit')).toHaveLength(0);
    expect(document.querySelectorAll('.band-pills .recessed-lamp')).toHaveLength(2);
    expect(document.querySelector('.band-pills')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('puts no dex destination on a site screen', () => {
    // Stated over the WHOLE vocabulary, not just the shipped pair. An earlier
    // draft iterated `DEFAULTS` — two of the five — which is a test that would
    // have passed while a site band offered SETTINGS, DATA or ACCESS.
    // `MARQUEE_PINS` is the set a lamp can actually hold.
    mount(false);
    for (const route of MARQUEE_PINS.map(pinRoute)) {
      expect(
        isDexPath(route),
        `${route} is not a dex route — this test's premise has moved`,
      ).toBe(true);
    }

    const named = [...document.querySelectorAll('button')]
      .map(b => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim());
    for (const pin of MARQUEE_PINS) {
      expect(named, `${pin} reached a site screen`).not.toContain(pin);
    }
  });

  it('hides SAVED and SETTINGS on the site, as it always did', () => {
    // The rule the lamps now follow, restated so the two cannot drift apart.
    mount(false);
    expect(screen.queryByRole('button', { name: 'Collection' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
  });

  it('prints the marquee override, and its glyph, rather than the screen name', () => {
    // The site's one-word panel (v8#8). Asserted on the band because the
    // override is the band's job — `useMarqueeScript` is untouched, and a
    // regression here would be a site screen quietly showing dex copy.
    render(
      <MemoryRouter>
        <DeviceFooter
          title="HORIZON/GODOT"
          marqueeTitle="WELCOME"
          skin="CLASSIC"
          showBack
          onBack={vi.fn()}
          onHome={vi.fn()}
          showSystemButtons={false}
        />
      </MemoryRouter>,
    );
    const marquee = document.querySelector('.terminal-marquee');
    expect(marquee?.textContent).toContain('WELCOME');
    expect(marquee?.textContent).not.toContain('HORIZON/GODOT');
  });
});
