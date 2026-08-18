import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

/**
 * The routed subtree must survive an App re-render (W1).
 *
 * **The defect this pins.** All five route components — `ListRoute`,
 * `SettingsSectionRoute`, `LineageRoute`, `DetailRoute`, `ProjectRoute` —
 * were declared *inside* `App`'s render body. A component declared there is a
 * new function identity on every render, and React compares element types by
 * identity: a new type is a different component, so the old one is unmounted
 * and a fresh one mounted with fresh state. Nothing about that shows in the
 * markup, which is why it survived every gate the repo had — and why the
 * linter installed one commit earlier found it on its first run
 * (`react-hooks/static-components`, five hits in `App.tsx`).
 *
 * **Why it was not merely wasteful.** `App` subscribes to the professor's
 * queue through `useSyncExternalStore(subscribeToVino, vinoQueueIsEmpty)`, so
 * *any* line he speaks re-renders `App`. `EntryDetail`'s TRIED handler fires
 * `firstTried` and — when a badge is earned — `firstStamp`, then in the same
 * click calls `setCelebrations(queue)`. Both land in one batch, so the render
 * the professor causes is the render that remounts `EntryDetail`, and the
 * celebration queue is destroyed at the exact moment it should appear. The
 * first passport stamp a player ever earns is the loudest case.
 *
 * **Why the screen is mocked.** The assertion is about *mount count*, and the
 * honest way to count mounts is to be the thing being mounted. Rendering the
 * real `EntryDetail` and inferring remounts from the DOM cannot distinguish
 * "remounted with identical markup" from "never re-rendered" — the first
 * attempt at this test passed against the broken tree for exactly that
 * reason. The mock keeps `App`'s own routing, state and subscriptions real,
 * which is where the defect lives; only the leaf is a stand-in.
 */

let detailMounts = 0;
let listMounts = 0;

// Named, and capitalised, so `react-hooks/rules-of-hooks` can see these for
// what they are — an anonymous `default:` arrow reads to the linter as a
// plain function calling a hook.
const DetailStub: React.FC = () => {
  React.useEffect(() => { detailMounts += 1; }, []);
  return <div data-testid="detail-stub" />;
};

const ListStub: React.FC = () => {
  React.useEffect(() => { listMounts += 1; }, []);
  return <div data-testid="list-stub" />;
};

vi.mock('./components/EntryDetail', () => ({ default: DetailStub }));
vi.mock('./components/EncyclopediaList', () => ({ default: ListStub }));

const { default: App } = await import('./App');
const { getAllEntries } = await import('./src/services/wineData');
const { clearVino, presentVinoLine, resetVinoForTests } = await import('./src/services/vinoPresenter');

/** A real catalog id, so the route resolves instead of redirecting to /dex. */
const someGrapeId = () => {
  const entry = getAllEntries().find(e => e.category === 'GRAPES');
  if (!entry) throw new Error('catalog has no grapes; fixture assumption broken');
  return entry.id;
};

const seedPastFirstRun = () => {
  window.localStorage.setItem('unlockedAppIDs', JSON.stringify(['vinodex']));
  window.localStorage.setItem('firstTimeTriggersSeen', 'firstLaunch,firstLaunchNamed');
  window.localStorage.setItem('coachmarkOffered', 'true');
  window.sessionStorage.setItem('booted', '1');
};

/**
 * The professor speaks, and the caller can prove he was heard.
 *
 * `App` subscribes through `useSyncExternalStore(subscribeToVino,
 * vinoQueueIsEmpty)`, so what re-renders it is the queue going **empty ->
 * non-empty**. Arriving at a detail route fires its own arrival lines, so the
 * queue may already be occupied — in which case enqueuing another changes no
 * snapshot, `App` never re-renders, and a remount assertion would pass for
 * entirely the wrong reason. Draining first is what makes the poke real.
 */
const professorSpeaks = () => {
  clearVino();
  presentVinoLine({ trigger: 'firstLaunch', line: 'TESTING.', expression: 'neutral' });
};

describe('App route components keep their identity across re-renders (W1)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    seedPastFirstRun();
    resetVinoForTests();
    detailMounts = 0;
    listMounts = 0;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not remount the detail screen when the professor speaks', async () => {
    render(
      <MemoryRouter initialEntries={[`/detail/${someGrapeId()}`]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('detail-stub')).toBeTruthy());
    expect(detailMounts).toBe(1);

    professorSpeaks();

    // The re-render has to have actually happened, or the assertion below is
    // vacuous: the bubble is rendered by `App` off the same subscription.
    await waitFor(() => expect(screen.getByText('TESTING.')).toBeTruthy());

    expect(detailMounts).toBe(1);
  });

  it('does not remount the list screen when the professor speaks', async () => {
    render(
      <MemoryRouter initialEntries={['/list/GRAPES']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('list-stub')).toBeTruthy());
    expect(listMounts).toBe(1);

    professorSpeaks();
    await waitFor(() => expect(screen.getByText('TESTING.')).toBeTruthy());

    expect(listMounts).toBe(1);
  });
});
