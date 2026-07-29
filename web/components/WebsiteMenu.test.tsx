import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import WebsiteMenu from './WebsiteMenu';

/**
 * The four tiles, and that each one goes where it says.
 *
 * Worth testing rather than eyeballing because the four handlers have identical
 * shapes — a transposed pair would look perfect and route wrongly, which is a
 * mistake a screenshot cannot catch.
 */
const renderMenu = () => {
  const handlers = {
    onOurApps: vi.fn(),
    onWhoWeAre: vi.fn(),
    onContact: vi.fn(),
    onData: vi.fn(),
    onBack: vi.fn(),
  };
  render(
    <MemoryRouter>
      <WebsiteMenu {...handlers} />
    </MemoryRouter>,
  );
  return handlers;
};

describe('<WebsiteMenu />', () => {
  afterEach(() => {
    cleanup();
  });

  it('offers exactly the four advertised destinations', () => {
    renderMenu();
    for (const label of ['OUR APPS', 'WHO WE ARE', 'CONTACT US', 'DATA']) {
      expect(screen.getByRole('button', { name: label })).toBeDefined();
    }
  });

  it.each([
    ['OUR APPS', 'onOurApps'],
    ['WHO WE ARE', 'onWhoWeAre'],
    ['CONTACT US', 'onContact'],
    ['DATA', 'onData'],
  ] as const)('%s calls only its own handler', async (label, expected) => {
    const handlers = renderMenu();
    await userEvent.setup().click(screen.getByRole('button', { name: label }));

    expect(handlers[expected]).toHaveBeenCalledTimes(1);
    for (const [key, fn] of Object.entries(handlers)) {
      if (key !== expected) expect(fn).not.toHaveBeenCalled();
    }
  });

  it('leaves the section by the Back control', async () => {
    const handlers = renderMenu();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Back' }));
    expect(handlers.onBack).toHaveBeenCalledTimes(1);
  });

  /**
   * The centre disc is decorative — see the component. If it ever became a
   * button it would need a destination, and this is the check that would say so:
   * the tiles plus the chassis Back and Home are the whole live surface.
   */
  it('exposes no unlabelled control a user can reach', () => {
    renderMenu();
    const reachable = screen.getAllByRole('button').filter(b => !b.hasAttribute('disabled'));
    const names = reachable.map(b =>
      (b.getAttribute('aria-label') ?? b.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );

    // Four tiles, Back, Home — and nothing nameless among them. The chassis orb
    // is the one nameless button and is inert here (no flip handler), so it is
    // excluded above by being disabled rather than by being ignored.
    expect(names.sort()).toEqual(
      ['Back', 'CONTACT US', 'DATA', 'Home', 'OUR APPS', 'WHO WE ARE'].sort(),
    );
  });
});
