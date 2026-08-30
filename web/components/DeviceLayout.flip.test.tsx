import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { buildWineEntries } from '@/shared/constants';
import StampCollectionScreen from './StampCollectionScreen';

/**
 * The orb hold flips the device on every dex screen, not only the menu
 * (v0.6.30). A screen that never wires `backFace` gets the steel plate from
 * `DeviceLayout` itself, so the passport album stands in for "any screen".
 */
afterEach(cleanup);
beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const noop = () => undefined;

describe('the orb hold on an ordinary screen', () => {
  it('turns the device over and the plate turns it back', async () => {
    const view = render(
      <MemoryRouter initialEntries={['/passport']}>
        <StampCollectionScreen allEntries={buildWineEntries()} onBack={noop} onHome={noop} />
      </MemoryRouter>,
    );
    const orb = view.getByLabelText('Hold to flip device');
    // Nothing is mounted behind the chassis until it is first turned over.
    expect(view.queryByLabelText('Flip device back to front')).toBeNull();

    fireEvent.pointerDown(orb);
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    // The plate is a lazy chunk: real time for its import to settle.
    vi.useRealTimers();
    const plate = await view.findByLabelText('Flip device back to front');
    expect(plate).toBeTruthy();

    fireEvent.click(plate);
    // The plate stays mounted for the next flip; it is the face that turns.
    expect(view.getByLabelText('Flip device back to front')).toBeTruthy();
  });
});
