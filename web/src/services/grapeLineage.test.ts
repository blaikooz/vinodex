import { describe, expect, it } from 'vitest';
import { getAllEntries } from './wineData';
import { WineEntry, isGrapeEntry } from '@/shared/types';
import { GrapeLineageIndex, edgeCount, relativesIsEmpty } from './grapeLineage';

/**
 * Ported from `vinodex-ios/Tests/VinodexCoreTests/GrapeLineageTests.swift` —
 * the live-catalog half; the fixture cases (malformed refs, both-ends
 * authoring) are exercised through the small hand-built entries below.
 */

const all = getAllEntries();
const index = new GrapeLineageIndex(all);
const byName = (name: string) => all.find(e => isGrapeEntry(e) && e.name === name)!;

describe('grape lineage', () => {
  it('Cabernet Sauvignon is Cabernet Franc x Sauvignon Blanc', () => {
    const cab = byName('Cabernet Sauvignon');
    const relatives = index.relatives(cab.id);
    expect(relatives.parents.map(p => p.name).sort()).toEqual(['Cabernet Franc', 'Sauvignon Blanc']);
    for (const parent of relatives.parents) expect(parent.kind).toBe('entry');
  });

  it('an off-catalog ancestor is a terminal node, not a broken link', () => {
    // A fixture rather than a live example: Gouais Blanc — the canonical
    // off-catalog ancestor when this suite was authored on iOS — earned an
    // entry (G176), which is exactly why the property must not depend on the
    // catalog continuing to contain an example.
    const fixture: WineEntry[] = [
      { ...(byName('Cabernet Franc') as object), id: 'GA', name: 'Alpha', lineage: { parents: [{ name: 'Lost Ancestor' }] } } as WineEntry,
      { ...(byName('Cabernet Franc') as object), id: 'GB', name: 'Beta', lineage: { parents: [{ name: 'Lost Ancestor' }] } } as WineEntry,
    ];
    const small = new GrapeLineageIndex(fixture);
    const relatives = small.relatives('GA');
    const external = relatives.parents[0]!;
    expect(external.kind).toBe('external');
    expect(external.entryId).toBeUndefined();
    // The shared external key still holds the half-siblings together.
    expect(relatives.siblings.map(s => s.name)).toEqual(['Beta']);
    expect(relatives.siblings[0]!.via).toBe('Lost Ancestor');
  });

  it('offspring and mutations are derived from the child-facing data', () => {
    const franc = byName('Cabernet Franc');
    const kids = index.relatives(franc.id).offspring.map(o => o.name);
    expect(kids).toContain('Cabernet Sauvignon');
    // Alphabetical — a derived list has no authored order to preserve.
    expect([...kids].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))).toEqual(kids);
  });

  it('half-siblings group through a shared parent, carried in via', () => {
    const cab = byName('Cabernet Sauvignon');
    const siblings = index.relatives(cab.id).siblings;
    for (const s of siblings) expect(s.via, `${s.name} carries no via`).toBeTruthy();
  });

  it('the connected gate agrees with the relatives it returns', () => {
    for (const g of all.filter(isGrapeEntry)) {
      const has = index.hasLineage(g.id);
      const empty = relativesIsEmpty(index.relatives(g.id));
      expect(has, `${g.name}: gate says ${has} but relatives ${empty ? 'empty' : 'present'}`).toBe(!empty);
      if (has) expect(edgeCount(index.relatives(g.id))).toBeGreaterThan(0);
    }
  });

  it('an unknown parentage is a stated fact and does not make a grape connected', () => {
    const stated = all.filter(isGrapeEntry).filter(g => index.parentageIsUnknown(g.id));
    expect(stated.length).toBeGreaterThan(0);
    const statedAndDisconnected = stated.filter(g => !index.hasLineage(g.id));
    // 0.8.2: 42 of the 56 no-edge grapes state their parentage is
    // undetermined — the two answers are different questions.
    expect(statedAndDisconnected.length).toBeGreaterThan(0);
    for (const g of statedAndDisconnected) {
      expect(relativesIsEmpty(index.relatives(g.id))).toBe(true);
      expect(index.relatives(g.id).parentageUnknown).toBe(true);
    }
  });

  it('an in-catalog related ref reverses, and a both-ends pair draws once', () => {
    const fixture: WineEntry[] = [
      { ...(byName('Cabernet Franc') as object), id: 'GA', name: 'Alpha', lineage: { related: [{ id: 'GB' }] } } as WineEntry,
      { ...(byName('Cabernet Franc') as object), id: 'GB', name: 'Beta', lineage: { related: [{ id: 'GA' }] } } as WineEntry,
    ];
    const small = new GrapeLineageIndex(fixture);
    const alpha = small.relatives('GA');
    expect(alpha.related.map(r => r.name)).toEqual(['Beta']);
    const beta = small.relatives('GB');
    expect(beta.related.map(r => r.name)).toEqual(['Alpha']);
  });

  it('a malformed ref costs one edge, not the screen', () => {
    const fixture: WineEntry[] = [
      { ...(byName('Cabernet Franc') as object), id: 'GA', name: 'Alpha', lineage: { parents: [{}, { name: 'Real External' }] } } as WineEntry,
    ];
    const small = new GrapeLineageIndex(fixture);
    const relatives = small.relatives('GA');
    expect(relatives.parents.map(p => p.name)).toEqual(['Real External']);
  });

  it('a contested edge reads as contested from both ends', () => {
    const fixture: WineEntry[] = [
      { ...(byName('Cabernet Franc') as object), id: 'GP', name: 'Parent', lineage: undefined } as WineEntry,
      { ...(byName('Cabernet Franc') as object), id: 'GC', name: 'Child', lineage: { parents: [{ id: 'GP', contested: true }] } } as WineEntry,
    ];
    const small = new GrapeLineageIndex(fixture);
    expect(small.relatives('GC').parents[0]?.contested).toBe(true);
    expect(small.relatives('GP').offspring[0]?.contested).toBe(true);
  });

  it('authored notes surface once, however many edges carry them', () => {
    const fixture: WineEntry[] = [
      { ...(byName('Cabernet Franc') as object), id: 'GP', name: 'Parent' } as WineEntry,
      { ...(byName('Cabernet Franc') as object), id: 'GC', name: 'Child', lineage: { parents: [{ id: 'GP' }], mutationOf: undefined, note: 'One disputed study.' } } as WineEntry,
    ];
    const small = new GrapeLineageIndex(fixture);
    const notes = small.relatives('GC').notes;
    expect(notes).toEqual(['One disputed study.']);
  });
});
