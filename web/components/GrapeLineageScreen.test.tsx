import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { buildWineEntries } from '@/shared/constants';
import { lineageIndexFor } from '../src/services/grapeLineage';
import GrapeLineageScreen, { connectorCentres } from './GrapeLineageScreen';

/**
 * The family tree (v10#1, v0.6.25): direction, capped tiers, the four kinds
 * of node, contested edges and footnotes — pinned on real catalogue trees
 * rather than fixtures, because the tree's shape is a property of the data.
 */
afterEach(cleanup);

// jsdom has no ResizeObserver; the connector measures nothing and draws nothing.
class RO { observe() {} disconnect() {} unobserve() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;

const entries = buildWineEntries();
const index = lineageIndexFor(entries);
const byId = new Map(entries.map(e => [e.id, e]));
const noop = () => undefined;

const mount = (id: string, onFocus = vi.fn()) =>
  render(
    <MemoryRouter>
      <GrapeLineageScreen entry={byId.get(id)!} allEntries={entries} onFocus={onFocus} onOpenEntry={noop} onBack={noop} onHome={noop} />
    </MemoryRouter>,
  );

describe('the lineage tree', () => {
  it('draws the subject between its parents above and its offspring below, and refocuses on a tap', () => {
    // Cabernet Sauvignon: Cabernet Franc x Sauvignon Blanc, both in the catalogue.
    const onFocus = vi.fn();
    const view = mount('G001', onFocus);
    const tree = within(view.container.querySelector('[data-lineage-tree]')!);
    const parents = view.container.querySelector('[data-lineage-tier="PARENTS"]')!;
    expect(parents.querySelectorAll('[data-lineage-node="entry"]').length).toBe(2);
    expect(view.container.querySelectorAll('[data-lineage-node="subject"]').length).toBe(1);
    expect(view.container.querySelectorAll('[data-lineage-connector]').length).toBeGreaterThanOrEqual(1);
    // The subject is not a door; a parent is.
    expect(view.container.querySelector('[data-lineage-node="subject"]')!.tagName).toBe('DIV');
    fireEvent.click(tree.getAllByRole('button').find(b => b.getAttribute('data-lineage-node') === 'entry')!);
    expect(onFocus).toHaveBeenCalledOnce();
  });

  it('caps a big tier at six with SHOW ALL, and opens it', () => {
    const big = entries.find(e => e.category === 'GRAPES' && index.relatives(e.id).offspring.length > 6);
    expect(big, 'no grape with more than six offspring in the catalogue').toBeTruthy();
    const view = mount(big!.id);
    const tier = () => view.container.querySelector('[data-lineage-tier^="OFFSPRING"], [data-lineage-tier="MUTATIONS"]')!;
    expect(tier().querySelectorAll('[data-lineage-node]').length).toBe(6);
    const button = view.container.querySelector<HTMLButtonElement>('[data-lineage-overflow]')!;
    expect(button.textContent).toContain('SHOW ALL');
    fireEvent.click(button);
    expect(tier().querySelectorAll('[data-lineage-node]').length).toBe(index.relatives(big!.id).offspring.length + index.relatives(big!.id).mutations.length);
    expect(button.textContent).toContain('SHOW FEWER');
  });

  it('draws an external ancestor as a terminal tile and unknown parentage as its own kind', () => {
    const external = entries.find(e => e.category === 'GRAPES' && index.relatives(e.id).parents.some(p => p.kind === 'external'));
    expect(external).toBeTruthy();
    const v1 = mount(external!.id);
    expect(v1.container.querySelectorAll('[data-lineage-node="external"]').length).toBeGreaterThan(0);
    expect(v1.getAllByText('not in catalog').length).toBeGreaterThan(0);
    v1.unmount();
    const unknown = entries.find(e => e.category === 'GRAPES' && index.relatives(e.id).parentageUnknown && index.relatives(e.id).parents.length < 2);
    expect(unknown).toBeTruthy();
    const v2 = mount(unknown!.id);
    expect(v2.container.querySelectorAll('[data-lineage-node="unrecorded"]').length).toBe(1);
    expect(v2.getByText('UNRECORDED')).toBeTruthy();
  });

  it('marks a contested edge with a ? badge, a dashed rail, and a footnote', () => {
    const contested = entries.find(e => e.category === 'GRAPES' && index.relatives(e.id).parents.some(p => p.contested));
    expect(contested, 'no contested parentage in the catalogue').toBeTruthy();
    const view = mount(contested!.id);
    expect(view.container.querySelectorAll('[data-lineage-contested]').length).toBeGreaterThan(0);
    expect(view.container.querySelector('[data-lineage-connector="contested"]')).toBeTruthy();
    expect(view.getByRole('region', { name: 'Footnotes' })).toBeTruthy();
  });

  it('lands the rails on tile centres, packed the way the tier packs', () => {
    // Two tiles in a 300px box: one row, centred, 122px apart.
    expect(connectorCentres(300, 2, false)).toEqual([150 - 61, 150 + 61]);
    // Seven tiles in a 400px box (three per row): parents hang off the LAST row (one tile), offspring off the FIRST (three).
    expect(connectorCentres(400, 7, false)).toEqual([200]);
    expect(connectorCentres(400, 7, true)).toEqual([200 - 122, 200, 200 + 122]);
  });
});
