import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';
import { reportCount, resetReports } from '../src/services/errorReport';

/** The root boundary (v0.6.33): the LCD says so, once, with the ways out. */
afterEach(cleanup);
beforeEach(resetReports);

const Bomb: React.FC = () => {
  throw new Error('render went wrong');
};

describe('<ErrorBoundary />', () => {
  it('shows the broken screen with both exits and reports the render once', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const view = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(view.getByRole('alert')).toBeTruthy();
    expect(view.getByText('SOMETHING BROKE')).toBeTruthy();
    expect(view.getByRole('button', { name: 'RESTART VINODEX' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'BACK TO THE SITE' })).toBeTruthy();
    expect(reportCount()).toBe(1);
    quiet.mockRestore();
  });

  it('is invisible while nothing throws', () => {
    const view = render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>,
    );
    expect(view.getByText('fine')).toBeTruthy();
    expect(view.queryByRole('alert')).toBeNull();
    expect(reportCount()).toBe(0);
  });
});
