import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { IosUpdatesPromptOverlay, IosUpdatesPromptProvider } from './IosUpdatesPrompt';
import {
  IOS_UPDATES_PROMPT_DELAY_MS,
  VINODEX_SUBSTACK_EMBED_URL,
  VINODEX_SUBSTACK_URL,
} from '../src/services/iosUpdatesPrompt';

const Harness: React.FC<{ active?: boolean }> = ({ active = true }) => (
  <IosUpdatesPromptProvider active={active}>
    <div className="relative">
      <IosUpdatesPromptOverlay />
    </div>
  </IosUpdatesPromptProvider>
);

describe('the iOS updates invitation', () => {
  let hidden = false;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-23T12:00:00Z'));
    window.localStorage.clear();
    hidden = false;
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('appears after 90 seconds of visible active use and links to Substack', () => {
    render(<Harness />);

    act(() => { vi.advanceTimersByTime(IOS_UPDATES_PROMPT_DELAY_MS - 1); });
    expect(screen.queryByRole('region', { name: 'Vinodex iOS updates' })).toBeNull();

    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByRole('region', { name: 'Vinodex iOS updates' })).toBeTruthy();
    const embed = screen.getByTitle('Subscribe to Vinodex on Substack');
    expect(embed.getAttribute('src')).toBe(VINODEX_SUBSTACK_EMBED_URL);
    expect(embed.getAttribute('width')).toBe('480');
    expect(embed.getAttribute('height')).toBe('320');

    const link = screen.getByRole('link', { name: /OPEN SUBSTACK/ });
    expect(link.getAttribute('href')).toBe(VINODEX_SUBSTACK_URL);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(window.localStorage.getItem('iosUpdatesPromptSeen')).toBe('1');
  });

  it('pauses while the document is hidden', () => {
    render(<Harness />);
    act(() => { vi.advanceTimersByTime(45_000); });

    hidden = true;
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    act(() => { vi.advanceTimersByTime(120_000); });
    expect(screen.queryByRole('region', { name: 'Vinodex iOS updates' })).toBeNull();

    hidden = false;
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    act(() => { vi.advanceTimersByTime(44_999); });
    expect(screen.queryByRole('region', { name: 'Vinodex iOS updates' })).toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByRole('region', { name: 'Vinodex iOS updates' })).toBeTruthy();
  });

  it('pauses when the Vinodex experience is not active', () => {
    const view = render(<Harness />);
    act(() => { vi.advanceTimersByTime(45_000); });

    view.rerender(<Harness active={false} />);
    act(() => { vi.advanceTimersByTime(120_000); });
    expect(screen.queryByRole('region', { name: 'Vinodex iOS updates' })).toBeNull();

    view.rerender(<Harness />);
    act(() => { vi.advanceTimersByTime(44_999); });
    expect(screen.queryByRole('region', { name: 'Vinodex iOS updates' })).toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByRole('region', { name: 'Vinodex iOS updates' })).toBeTruthy();
  });

  it('can be dismissed and never rearms once marked as seen', () => {
    const first = render(<Harness />);
    act(() => { vi.advanceTimersByTime(IOS_UPDATES_PROMPT_DELAY_MS); });
    fireEvent.click(screen.getByRole('button', { name: 'NOT NOW' }));
    expect(screen.queryByRole('region', { name: 'Vinodex iOS updates' })).toBeNull();

    first.unmount();
    render(<Harness />);
    act(() => { vi.advanceTimersByTime(IOS_UPDATES_PROMPT_DELAY_MS * 2); });
    expect(screen.queryByRole('region', { name: 'Vinodex iOS updates' })).toBeNull();
  });
});
