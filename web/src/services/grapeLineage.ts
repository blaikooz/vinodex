import { GrapeEntry, GrapeLineage, LineageRef, WineEntry, isGrapeEntry } from '@/shared/types';
import { normalizeLabel } from '@/shared/services/entryUtils';

/**
 * The pedigree index, ported from
 * `vinodex-ios/Sources/VinodexCore/GrapeLineageIndex.swift` (0.7.5 E,
 * 0.7.9 C2, 0.8.2) — v6#16.
 *
 * Only the child-facing direction is stored on the entries; everything else —
 * offspring, mutations, siblings, the reverse of `related` — is derived here.
 * `related` is reversed even where the catalog authors only one direction,
 * because the schema calls the relationship symmetric and "the data happens
 * not to do that yet" is not a property.
 */

export interface LineageNode {
  /**
   * `entry` is a grape in this build; `external` a variety the catalog does
   * not carry (terminal, untappable); `unrecorded` is **not a variety at
   * all** — the data states the parentage is undetermined, and this stands in
   * the place a parent would occupy. A third kind rather than an empty list,
   * because the tree has to draw a *difference* between "nobody knows" and
   * "nobody has authored it yet", and a difference has to be a thing.
   */
  kind: 'entry' | 'external' | 'unrecorded';
  /** Catalog id for `entry` nodes. */
  entryId?: string;
  /** What to print — the catalog's own name for an entry, never the ref. */
  name: string;
  /** Seed or pollen parent where the direction is established. */
  role?: 'mother' | 'father';
  /** The relationship is real; its direction or one party's identity is not. */
  contested: boolean;
  /** For a derived sibling: the parent the two share. */
  via?: string;
  /** The authored footnote of whichever lineage block produced this edge. */
  note?: string;
}

/** The one placeholder node (0.7.9, C2). */
export const UNRECORDED_PARENT: LineageNode = {
  kind: 'unrecorded',
  name: 'PARENTAGE UNDETERMINED',
  contested: false,
};

const nodeId = (n: LineageNode): string =>
  n.kind === 'entry' ? `e:${n.entryId}` : n.kind === 'external' ? `x:${normalizeLabel(n.name)}` : 'u';

export interface GrapeRelatives {
  /** Authored, in the order written — mother before father is meaning, never sorted. */
  parents: LineageNode[];
  mutationOf: LineageNode | null;
  /** Derived: grapes naming this one as a parent. Alphabetical. */
  offspring: LineageNode[];
  mutations: LineageNode[];
  /** Derived: grapes sharing a parent (or mutation source), each carrying it in `via`. */
  siblings: LineageNode[];
  related: LineageNode[];
  /** Every reachable authored footnote, de-duplicated, in encounter order. */
  notes: string[];
  /** Authored as genuinely undetermined — distinct from "not written down yet". */
  parentageUnknown: boolean;
}

export const relativesIsEmpty = (r: GrapeRelatives): boolean =>
  r.parents.length === 0 && r.mutationOf === null && r.offspring.length === 0 &&
  r.mutations.length === 0 && r.siblings.length === 0 && r.related.length === 0;

export const edgeCount = (r: GrapeRelatives): number =>
  r.parents.length + (r.mutationOf ? 1 : 0) + r.offspring.length +
  r.mutations.length + r.siblings.length + r.related.length;

const lineageIsEmpty = (l: GrapeLineage): boolean =>
  (l.parents ?? []).length === 0 && !l.mutationOf && (l.related ?? []).length === 0;

/** `id` where in-catalog, folded name where not; null for a malformed ref —
 *  worth losing an edge over, not a screen. */
const refKey = (ref: LineageRef): string | null => {
  if (ref.id) return ref.id;
  if (!ref.name) return null;
  const folded = normalizeLabel(ref.name);
  return folded.length > 0 ? folded : null;
};

interface Edge {
  id: string;
  ref: LineageRef;
}

/**
 * One index per catalog array (ledger I6): three screens were each building
 * their own walk of 177 grapes. Keyed by array identity — `getAllEntries()`
 * returns one cached array, so the whole app shares one index, and a test
 * passing a fixture gets a fresh one for free.
 */
const indexCache = new WeakMap<WineEntry[], GrapeLineageIndex>();

export const lineageIndexFor = (entries: WineEntry[]): GrapeLineageIndex => {
  const cached = indexCache.get(entries);
  if (cached) return cached;
  const built = new GrapeLineageIndex(entries);
  indexCache.set(entries, built);
  return built;
};

export class GrapeLineageIndex {
  private names = new Map<string, string>();
  private authored = new Map<string, GrapeLineage>();
  private childrenOf = new Map<string, Edge[]>();
  private mutantsOf = new Map<string, Edge[]>();
  private relatedBack = new Map<string, Edge[]>();
  private unknownParentage = new Set<string>();
  /** Every grape with at least one edge in any direction — what decides
   *  whether the encyclopedia offers the tree on an entry. */
  readonly connectedIDs = new Set<string>();

  constructor(entries: WineEntry[]) {
    const grapes = entries.filter(isGrapeEntry) as GrapeEntry[];
    for (const grape of grapes) this.names.set(grape.id, grape.name);

    for (const grape of grapes) {
      // Before the guard: a grape may state "parentage undetermined" and
      // author no edges at all — the common shape, and the one the guard drops.
      if (grape.lineage?.parentageUnknown === true) this.unknownParentage.add(grape.id);
      const lineage = grape.lineage;
      if (!lineage || lineageIsEmpty(lineage)) continue;
      this.authored.set(grape.id, lineage);

      for (const parent of lineage.parents ?? []) {
        const key = refKey(parent);
        if (!key) continue;
        const list = this.childrenOf.get(key) ?? [];
        list.push({ id: grape.id, ref: parent });
        this.childrenOf.set(key, list);
      }
      if (lineage.mutationOf) {
        const key = refKey(lineage.mutationOf);
        if (key) {
          const list = this.mutantsOf.get(key) ?? [];
          list.push({ id: grape.id, ref: lineage.mutationOf });
          this.mutantsOf.set(key, list);
        }
      }
      for (const other of lineage.related ?? []) {
        if (!other.id) continue;
        const list = this.relatedBack.get(other.id) ?? [];
        list.push({ id: grape.id, ref: other });
        this.relatedBack.set(other.id, list);
      }
    }

    for (const id of this.authored.keys()) this.connectedIDs.add(id);
    for (const [key, kids] of this.childrenOf) {
      if (this.names.has(key)) this.connectedIDs.add(key);
      for (const kid of kids) this.connectedIDs.add(kid.id);
    }
    for (const [key, mutants] of this.mutantsOf) {
      if (this.names.has(key)) this.connectedIDs.add(key);
      for (const m of mutants) this.connectedIDs.add(m.id);
    }
    for (const [key, others] of this.relatedBack) {
      if (this.names.has(key)) this.connectedIDs.add(key);
      for (const o of others) this.connectedIDs.add(o.id);
    }
  }

  /** "Is there a tree" — deliberately unaffected by `parentageIsUnknown`,
   *  which answers the different question "is the absence of one a fact". */
  hasLineage(id: string): boolean {
    return this.connectedIDs.has(id);
  }

  parentageIsUnknown(id: string): boolean {
    return this.unknownParentage.has(id);
  }

  private node(ref: LineageRef, note?: string): LineageNode | null {
    if (ref.id) {
      const name = this.names.get(ref.id);
      if (!name) return null;
      const out: LineageNode = { kind: 'entry', entryId: ref.id, name, contested: ref.contested === true };
      if (ref.role) out.role = ref.role;
      if (note) out.note = note;
      return out;
    }
    if (!ref.name) return null;
    const out: LineageNode = { kind: 'external', name: ref.name, contested: ref.contested === true };
    if (ref.role) out.role = ref.role;
    if (note) out.note = note;
    return out;
  }

  /** The far end of a reversed edge — always a catalog grape. Alphabetical:
   *  a derived list has no authored order to preserve. Contested carries
   *  through the reverse pass, so an edge reads contested from both ends. */
  private derived(edges: Edge[]): LineageNode[] {
    const out: LineageNode[] = [];
    for (const edge of edges) {
      const name = this.names.get(edge.id);
      if (!name) continue;
      const node: LineageNode = { kind: 'entry', entryId: edge.id, name, contested: edge.ref.contested === true };
      const note = this.authored.get(edge.id)?.note;
      if (note) node.note = note;
      out.push(node);
    }
    return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }

  relatives(id: string): GrapeRelatives {
    const lineage = this.authored.get(id);

    const parents = (lineage?.parents ?? [])
      .map(p => this.node(p, lineage?.note))
      .filter((n): n is LineageNode => n !== null);
    const mutationOf = lineage?.mutationOf ? this.node(lineage.mutationOf, lineage.note) : null;

    const offspring = this.derived(this.childrenOf.get(id) ?? []);
    const mutations = this.derived(this.mutantsOf.get(id) ?? []);

    // Sideways: the other children of each parent and the other mutations of
    // the mutation source — both through the same key, which is what lets an
    // ancestor with no entry still hold its half-siblings together.
    const siblings: LineageNode[] = [];
    const seenSibling = new Set<string>();
    const sources = [...(lineage?.parents ?? []), ...(lineage?.mutationOf ? [lineage.mutationOf] : [])];
    for (const source of sources) {
      const key = refKey(source);
      if (!key) continue;
      const sourceName = (source.id ? this.names.get(source.id) : undefined) ?? source.name ?? '';
      for (const candidate of [...(this.childrenOf.get(key) ?? []), ...(this.mutantsOf.get(key) ?? [])]) {
        if (candidate.id === id) continue;
        const name = this.names.get(candidate.id);
        if (!name) continue;
        const siblingId = `${candidate.id}@${sourceName}`;
        if (seenSibling.has(siblingId)) continue;
        seenSibling.add(siblingId);
        const node: LineageNode = {
          kind: 'entry',
          entryId: candidate.id,
          name,
          contested: candidate.ref.contested === true || source.contested === true,
        };
        if (sourceName) node.via = sourceName;
        const note = this.authored.get(candidate.id)?.note;
        if (note) node.note = note;
        siblings.push(node);
      }
    }
    siblings.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    // De-duplicated on node identity: authored refs and the reverse pass
    // overlap the moment two grapes name each other, and the authored copy is
    // inserted first and wins — it carries the grape's own role and note.
    const related: LineageNode[] = [];
    const seenRelated = new Set<string>();
    const relatedCandidates = [
      ...(lineage?.related ?? []).map(r => this.node(r, lineage?.note)).filter((n): n is LineageNode => n !== null),
      ...this.derived(this.relatedBack.get(id) ?? []),
    ];
    for (const node of relatedCandidates) {
      const key = nodeId(node);
      if (seenRelated.has(key)) continue;
      seenRelated.add(key);
      related.push(node);
    }

    // Collected from the nodes rather than alongside them — one ordered
    // de-dupe that cannot fall out of step with what the tree actually drew.
    const notes: string[] = [];
    const edgeNodes = [...parents, ...(mutationOf ? [mutationOf] : []), ...offspring, ...mutations, ...siblings, ...related];
    for (const note of [lineage?.note, ...edgeNodes.map(n => n.note)]) {
      if (note && note.length > 0 && !notes.includes(note)) notes.push(note);
    }

    return {
      parents,
      mutationOf,
      offspring,
      mutations,
      siblings,
      related,
      notes,
      parentageUnknown: this.unknownParentage.has(id),
    };
  }
}
