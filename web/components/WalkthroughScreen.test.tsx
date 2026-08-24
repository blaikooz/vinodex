import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WalkthroughScreen, { WALKTHROUGH_STEPS } from './WalkthroughScreen';

afterEach(cleanup);

describe('the map tutorial', () => {
  it('uses the current twelve-step iOS sequence and canonical menu art', () => {
    render(
      <MemoryRouter initialEntries={['/walkthrough']}>
        <WalkthroughScreen onBack={vi.fn()} onHome={vi.fn()} onGuidedRun={vi.fn()} />
      </MemoryRouter>,
    );

    expect(WALKTHROUGH_STEPS).toHaveLength(12);
    expect(WALKTHROUGH_STEPS.map(step => [step.id, step.highlight])).toEqual([
      ['screen', 'screen'], ['search', 'search'], ['entry', 'entry'], ['back', 'back'],
      ['home', 'home'], ['marquee', 'marquee'], ['settings', 'settings'], ['tools', 'tools'],
      ['passport', 'saved'], ['workshop', 'workshop'], ['shop', 'shop'], ['done', 'device'],
    ]);
    expect(screen.getByRole('progressbar', { name: 'Tour progress' }).getAttribute('aria-valuetext')).toBe('Step 1 of 12');
    expect(screen.getByText('START HERE')).toBeTruthy();
    expect([...document.querySelectorAll('[data-walkthrough-art]')].map(node => node.getAttribute('data-walkthrough-art')))
      .toEqual(['grapes', 'regions', 'styles', 'flavors', 'search']);
  });

  it('supports Back, Done, and the live guided-run handoff', () => {
    const onHome = vi.fn();
    const onGuidedRun = vi.fn();
    render(
      <MemoryRouter initialEntries={['/walkthrough']}>
        <WalkthroughScreen onBack={vi.fn()} onHome={onHome} onGuidedRun={onGuidedRun} />
      </MemoryRouter>,
    );

    for (let i = 1; i < WALKTHROUGH_STEPS.length; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'NEXT' }));
    }

    expect(screen.getByText("THAT'S IT.")).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('12');
    expect(screen.queryByRole('button', { name: 'FINISH' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'SHOW ME' }));
    expect(onGuidedRun).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: /^BACK$/ }));
    expect(screen.getByText('MORE OF IT')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'NEXT' }));
    fireEvent.click(screen.getByRole('button', { name: 'DONE' }));
    expect(onHome).toHaveBeenCalledOnce();
  });
});
