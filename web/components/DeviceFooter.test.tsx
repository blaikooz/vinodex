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
 * Since v0.6.49 the whole footer is the separation: `DeviceLayout` renders it
 * only off-site (`!onSite`), so no site screen carries these controls at all --
 * the per-prop half-measures (`showSystemButtons`, the marquee overrides) went
 * with the ruling that deleted the dead site-mode branch.
 *
 * The marquee lamps are in-app controls too — **every pin resolves to
 * `/minigames` or `/settings/*`** — so making them buttons without following
 * the footer at all would have put dex navigation and dex copy on OUR WORK.
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
const mount = () =>
  render(
    <MemoryRouter>
      <DeviceFooter
        title="VINODEX"
        skin="CLASSIC"
        showBack
        onBack={vi.fn()}
        onHome={vi.fn()}
        onReassignLamp={vi.fn()}
      />
    </MemoryRouter>,
  );

describe('<DeviceFooter />', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it('gives the dex two lamp buttons, named for their pins', () => {
    mount();
    for (const pin of DEFAULTS) {
      expect(screen.getByRole('button', { name: pin })).toBeTruthy();
    }
    expect(document.querySelectorAll('.lamp-hit')).toHaveLength(2);
  });

  it('every pin in the vocabulary resolves to a dex route', () => {
    // Stated over the WHOLE vocabulary, not just the shipped pair, and over
    // `isDexPath` -- the same classifier the boot, the skin and the
    // screensaver read. Since v0.6.49 the site never renders this band at
    // all (DeviceLayout gates it on `!onSite`), so "no dex destination on a
    // site screen" is structural; this pin keeps the half that can still
    // drift, which is a lamp pointed somewhere that stops being the app.
    for (const route of MARQUEE_PINS.map(pinRoute)) {
      expect(
        isDexPath(route),
        `${route} is not a dex route — this test's premise has moved`,
      ).toBe(true);
    }
  });

});
