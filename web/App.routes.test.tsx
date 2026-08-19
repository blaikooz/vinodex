import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
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
let detailRenders = 0;
let listMounts = 0;
let listRenders = 0;

// Named, and capitalised, so `react-hooks/rules-of-hooks` can see these for
// what they are — an anonymous `default:` arrow reads to the linter as a
// plain function calling a hook.
// Both counters live in effects, never in the render body: an empty dep array
// runs once per *mount*, no dep array runs once per *render*, and neither
// mutates anything during rendering — which `react-hooks/globals` flags, and
// rightly, since a counter incremented during render double-counts under
// StrictMode and concurrent replay.
const DetailStub: React.FC = () => {
  React.useEffect(() => { detailMounts += 1; }, []);
  React.useEffect(() => { detailRenders += 1; });
  return <div data-testid="detail-stub" />;
};

const ListStub: React.FC = () => {
  React.useEffect(() => { listMounts += 1; }, []);
  React.useEffect(() => { listRenders += 1; });
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
const professorSpeaks = async () => {
  // Drained first, and **awaited between the two writes**.
  //
  // `App` re-renders on the queue's *snapshot* going empty -> non-empty.
  // Arriving at a route fires its own lines, so the queue is usually already
  // occupied and enqueuing behind it changes no snapshot. Draining fixes
  // that — but `clearVino()` and `presentVinoLine()` in one tick are batched
  // by React, and a snapshot that leaves `false` and returns to `false` is
  // no change at all, so the pair netted to a silent no-op. The render
  // counter is what caught it; the awaited flush is what fixes it.
  await act(async () => {
    clearVino();
  });
  await act(async () => {
    presentVinoLine({ trigger: 'firstLaunch', line: 'TESTING.', expression: 'neutral' });
  });
};

describe('App route components keep their identity across re-renders (W1)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    seedPastFirstRun();
    resetVinoForTests();
    detailMounts = 0;
    detailRenders = 0;
    listMounts = 0;
    listRenders = 0;
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

    const rendersBefore = detailRenders;
    await professorSpeaks();

    // **The re-render is proved on the subtree itself, not on the bubble.**
    //
    // The first version waited for `VinoBubble`'s text and called that the
    // non-vacuity guard. It is not one: `VinoBubble` subscribes to the
    // presenter directly, so its text appearing says the *store* changed and
    // says nothing about whether `App` re-rendered. The test happened to be
    // correct only because `vinoIdle` sits in `App` today — and `vinoIdle`
    // renders nothing, so memoising the Routes subtree would have made this
    // pass while testing nothing at all.
    //
    // Counting renders of the routed leaf is exactly the property: it must
    // re-render (so the poke reached it) and must not remount (so it kept its
    // identity). Neither half can pass for the wrong reason.
    //
    // **Asserted synchronously, on purpose** (R-S8). `professorSpeaks`
    // awaits `act(...)`, so the re-render it causes has flushed by the time
    // it returns — a `waitFor` here would open a ~1s window in which any
    // unrelated async render satisfies the assertion, proving correlation
    // where this test exists to prove causation.
    expect(detailRenders).toBeGreaterThan(rendersBefore);
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

    const rendersBefore = listRenders;
    await professorSpeaks();
    // Synchronous for the same reason as the detail test above (R-S8).
    expect(listRenders).toBeGreaterThan(rendersBefore);
    expect(listMounts).toBe(1);
  });
});
