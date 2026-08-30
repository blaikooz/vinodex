import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ToolIntroHost } from './ToolIntroCard';
import { TOOL_INTROS, seenToolIntros } from '../src/services/toolIntro';
import { isSuspendedOtherThan } from '../src/services/vinoPresenter';

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ToolIntroHost />
    </MemoryRouter>,
  );

describe('the tool intro card', () => {
  it('is raised on a tool route the first time, says what the tool is, and START spends it', () => {
    const view = at('/moon-dial');
    const card = view.getByRole('dialog', { name: /MOON DIAL/ });
    expect(card.getAttribute('data-tool-intro')).toBe('moonDial');
    expect(view.getByText('What kind of day the biodynamic calendar says it is.')).toBeTruthy();
    // The professor holds his tongue while it is up.
    expect(isSuspendedOtherThan('')).toBe(true);
    fireEvent.click(view.getByRole('button', { name: 'START' }));
    expect(view.queryByRole('dialog')).toBeNull();
    expect([...seenToolIntros()]).toEqual(['moonDial']);
    expect(isSuspendedOtherThan('')).toBe(false);
  });

  it('SKIP THESE spends every tool at once', () => {
    const view = at('/scanner');
    fireEvent.click(view.getByRole('button', { name: 'SKIP THESE' }));
    expect(view.queryByRole('dialog')).toBeNull();
    expect(seenToolIntros().size).toBe(TOOL_INTROS.length);
    view.unmount();
    expect(at('/quiz').queryByRole('dialog')).toBeNull();
  });

  it('renders nothing off the tool routes', () => {
    expect(at('/dex').queryByRole('dialog')).toBeNull();
    expect(at('/').queryByRole('dialog')).toBeNull();
  });
});
