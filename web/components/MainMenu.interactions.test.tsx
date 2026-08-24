import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import MainMenu from './MainMenu';

// This test owns the five LCD actions. DeviceLayout's footer routing, timers
// and skin stores have their own tests and make a menu callback check both
// slower and sensitive to unrelated shell work.
vi.mock('./DeviceLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

afterEach(cleanup);

describe('MainMenu button interactions', () => {
  it('keeps every illustrated control wired to its category action', () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} onExit={vi.fn()} />);

    const controls = [
      ['GRAPES', 'GRAPES', '/art/button/grapes.png'],
      ['REGIONS', 'REGIONS', '/art/button/regions.png'],
      ['STYLES', 'STYLES', '/art/button/styles.png'],
      ['FLAVORS', 'FLAVORS', '/art/button/flavors.png'],
      ['Search', 'MASTER_SEARCH', '/art/button/search.png'],
    ] as const;

    for (const [name, , src] of controls) {
      const button = screen.getByRole('button', { name });
      expect(button.querySelector('img')?.getAttribute('src')).toBe(src);
      fireEvent.click(button);
    }
    expect(onNavigate.mock.calls.map(([category]) => category)).toEqual(
      controls.map(([, category]) => category),
    );
  });
});
