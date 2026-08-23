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
import { CONTACT_ADDRESS } from '../src/services/brand';

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

    expect(screen.getByText('PLAYFUL TOOLS, MADE WELL.')).toBeTruthy();
    for (const action of ['OPEN VINODEX', 'OUR WORK', 'WHO WE ARE', 'CONTACT US']) {
      expect(screen.getByRole('button', { name: action })).toBeTruthy();
    }
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

  it('names both founders and keeps the contact invitation concise', () => {
    const view = inRouter(<WhoWeAre onBack={noop} onHome={noop} />);
    expect(screen.getByText('HORIZON')).toBeTruthy();
    expect(screen.getByText('CREATIVE + DESIGN LEAD')).toBeTruthy();
    expect(screen.getByText('GODOT')).toBeTruthy();
    expect(screen.getByText('FINANCIALS + OPERATIONS')).toBeTruthy();

    view.unmount();
    inRouter(<ContactUs onBack={noop} onHome={noop} />);
    expect(screen.getByText(/Product feedback, collaboration ideas/)).toBeTruthy();
    const contact = screen.getByRole('link', { name: CONTACT_ADDRESS });
    expect(contact.getAttribute('href')).toBe('mailto:vinodex@substack.com');
  });
});
