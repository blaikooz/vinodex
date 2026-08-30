import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  ContactUs,
  OurAppsList,
  PortalHome,
  PROJECTS,
  ProjectSplash,
  WhoWeAre,
} from './WebsitePortal';
import { CONTACT_ADDRESS, VINODEX_SUBSTACK_URL } from '../src/services/brand';
import { trackEvent } from '../src/services/analytics';

vi.mock('../src/services/analytics', () => ({ trackEvent: vi.fn() }));

const inRouter = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);
const noop = () => undefined;

describe('the Horizon/Godot website', () => {
  it('introduces the studio and exposes the four planned actions', () => {
    const onOpenApp = vi.fn();
    inRouter(
      <PortalHome
        onHome={noop}
        onOpenApp={onOpenApp}
        onOpenApps={noop}
        onWhoWeAre={noop}
        onContactUs={noop}
      />,
    );

    // The hero is the studio's (v0.6.19): its line, then one sentence that
    // names the product as the thing to open.
    expect(screen.getByText('PLAYFUL TOOLS, MADE WELL.')).toBeTruthy();
    expect(screen.getByText(/two-person NYC studio .* Vinodex/)).toBeTruthy();
    expect(screen.queryByText('EVERY GRAPE, REGION AND STYLE, IN YOUR POCKET.')).toBeNull();
    // The quiet Substack door, and the funnel event it records.
    const updates = screen.getByRole('link', { name: /GET iOS UPDATES/ });
    expect(updates.getAttribute('href')).toBe(VINODEX_SUBSTACK_URL);
    expect(updates.getAttribute('target')).toBe('_blank');
    expect(updates.getAttribute('rel')).toContain('noopener');
    fireEvent.click(updates);
    expect(trackEvent).toHaveBeenCalledWith('substack-tap', { source: 'landing' });
    const actions = ['OUR WORK', 'WHO WE ARE', 'OPEN VINODEX', 'CONTACT US'];
    for (const action of actions) {
      expect(screen.getByRole('button', { name: action })).toBeTruthy();
    }
    expect(
      screen.getAllByRole('button')
        .map(button => button.textContent?.trim())
        .filter(label => label && actions.includes(label)),
    ).toEqual(actions);
    expect(screen.queryByRole('button', { name: 'DATA' })).toBeNull();
    const openVinodex = screen.getByRole('button', { name: 'OPEN VINODEX' });
    expect(openVinodex.style.backgroundColor).toBe('var(--tint-solid)');
    const iconWell = openVinodex.querySelector('span');
    expect(iconWell?.className).not.toContain('bg-[var(--tint-subtle)]');
    expect(openVinodex.querySelector('svg')?.getAttribute('width')).toBe('44');
    expect(document.querySelector<HTMLElement>('.device-screen-space')?.style.paddingBottom)
      .toBe('max(0.5rem, env(safe-area-inset-bottom))');
    fireEvent.click(screen.getByRole('button', { name: 'OPEN VINODEX' }));
    expect(onOpenApp).toHaveBeenCalledOnce();
  });

  it('lists Vinodex first and includes Château with its supplied logo', () => {
    expect(PROJECTS.map(project => project.id)).toEqual([
      'vinodex',
      'chateau-earth',
      'focuspond',
      'varied-mix',
    ]);
    expect(PROJECTS[0]?.featured).toBe(true);
    expect(PROJECTS[1]).toMatchObject({
      name: 'CHÂTEAU',
      href: 'https://chateauearth.substack.com/',
      logo: '/projects/chateau.png',
    });

    const view = inRouter(<OurAppsList onBack={noop} onHome={noop} onSelectProject={noop} />);
    expect(screen.getByRole('button', { name: /CHÂTEAU/ })).toBeTruthy();
    expect(screen.getByText('FEATURED PROJECT')).toBeTruthy();
    expect(view.container.querySelector('img[src="/projects/chateau.png"]')).toBeTruthy();
    expect(view.container.querySelector('.site-pixel-copy')).toBeTruthy();
    expect(view.container.querySelector('footer')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Screen navigation' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });

  it('shows a clear, safe outbound handoff for publications', () => {
    const project = PROJECTS.find(candidate => candidate.id === 'chateau-earth');
    if (!project) throw new Error('missing Château fixture');
    inRouter(<ProjectSplash project={project} onBack={noop} onHome={noop} onOpenApp={noop} />);

    const link = screen.getByRole('link', { name: /VISIT PUBLICATION/ });
    expect(link.getAttribute('href')).toBe('https://chateauearth.substack.com/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('presents both founders with concise roles and playful studio facts', () => {
    const view = inRouter(<WhoWeAre onBack={noop} onHome={noop} />);
    expect(screen.getByText('HORIZON')).toBeTruthy();
    expect(screen.getByText('CO-FOUNDER + CREATIVE DIRECTOR')).toBeTruthy();
    expect(screen.getByText('GODOT')).toBeTruthy();
    expect(screen.queryByText(/ERICK GUZMAN/i)).toBeNull();
    expect(screen.getByText('CO-FOUNDER + DIRECTOR OF STRATEGY & OPERATIONS')).toBeTruthy();
    expect(screen.getByText('WINE OBSESSED')).toBeTruthy();
    expect(screen.getByText('SERIOUS ABOUT PLAY')).toBeTruthy();
    expect(screen.getByText(/Pixels \+ prototypes/)).toBeTruthy();
    expect(screen.getByText(/Systems that scale/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'HOW WE WORK' })).toBeTruthy();
    const founderScroll = screen.getByRole('region', { name: 'WHO WE ARE content' });
    expect(founderScroll.className).toContain('min-h-0');
    expect(founderScroll.className).toContain('w-full');
    expect(founderScroll.className).toContain('overflow-y-auto');
    expect(founderScroll.className).toContain('pb-[calc(var(--pad-screen)+0.5rem)]');
    expect(founderScroll.className).not.toContain('max-w-prose');
    expect(founderScroll.getAttribute('tabindex')).toBe('0');

    view.unmount();
    inRouter(<ContactUs onBack={noop} onHome={noop} onPrivacy={noop} />);
    expect(screen.getByText(/Product feedback, collaboration ideas/)).toBeTruthy();
    const contact = screen.getByRole('link', { name: CONTACT_ADDRESS });
    expect(contact.getAttribute('href')).toBe('mailto:vinodex@substack.com');
    // The legal door (v0.6.0): the screen that invites mail offers the small print.
    expect(screen.getByRole('button', { name: 'PRIVACY + TERMS' })).toBeTruthy();
  });
});
