import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GitBranch, BookOpen, ChevronDown, ChevronUp, ChevronRight, CircleSlash } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { WineEntry, isGrapeEntry } from '@/shared/types';
import {
  GrapeRelatives,
  LineageNode,
  UNRECORDED_PARENT,
  lineageIndexFor,
  relativesIsEmpty,
} from '../src/services/grapeLineage';
import { artSprite, resolveGrapeArtStem } from '../src/services/artSprites';

/**
 * One grape's pedigree, drawn as a family tree — v10#1 (v0.6.25), replacing
 * v6#16's sectioned rows.
 *
 * Ported from `vinodex-ios/Sources/VinodexUI/GrapeLineageScreen.swift`
 * (0.7.5 E1, 0.7.9 C2, 0.8.1 C3). The rows were "the idiomatic
 * translation" of a tree; what they lost was the one thing a tree gives that
 * a list cannot — **direction**. Parents sit above the grape you are on with
 * rails running down into it, descendants below with rails running out of
 * it, and everything sideways (half-siblings, unresolved relatives) is a
 * labelled section underneath. A column, not a canvas: the LCD is ~2.5
 * inches wide and a pan-and-zoom graph on it is a worse list.
 *
 * The four kinds of node, and the difference between them is the design:
 * - **the subject** — accent border, not a button; tapping where you are is
 *   not navigation;
 * - **an entry** — surface fill, art well, pressable: it refocuses the tree;
 * - **external** — an ancestor the catalog does not carry, drawn on the well
 *   with a dashed border and no art: obviously a different kind of thing and
 *   obviously not a door;
 * - **unrecorded** — no variety at all: the data says the parentage is
 *   undetermined. Dashes, a slashed circle, `subtext` throughout.
 *
 * A **contested** edge (two readings, neither picked by the data) draws a
 * dashed rail and a `?` badge on the node; its sentence lands in FOOTNOTES.
 * Every tier is capped at `TIER_LIMIT` with SHOW ALL, because Gouais Blanc
 * fathers thirteen catalog grapes and four rows of tiles is a wall.
 *
 * The connector repeats the tier's own packing arithmetic (tile width, gap,
 * measured width) so its legs land on tile centres rather than near them —
 * iOS 0.8.1 C3's lesson, learned once.
 */

const TILE_W = 116;
const TILE_GAP = 6;
const TIER_LIMIT = 6;
const CONNECTOR_H = 26;

interface GrapeLineageScreenProps {
  entry: WineEntry;
  allEntries: WineEntry[];
  /** Refocus the tree on another catalog grape. */
  onFocus: (entry: WineEntry) => void;
  /** Open the focused grape's own page. */
  onOpenEntry: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
}

/** Tile centres for the row the trunk touches, in the container's coordinates. */
export const connectorCentres = (width: number, count: number, touchesFirstRow: boolean): number[] => {
  const step = TILE_W + TILE_GAP;
  const perRow = Math.max(1, Math.floor((width + TILE_GAP) / step));
  const rows = Math.max(1, Math.ceil(count / perRow));
  const onRow = touchesFirstRow ? Math.min(count, perRow) : count - (rows - 1) * perRow;
  const n = Math.max(onRow, 1);
  const mid = width / 2;
  return Array.from({ length: n }, (_, i) => mid + (i - (n - 1) / 2) * step);
};

/**
 * The rails between a tier and the subject. Drawn for the *ancestors* case
 * (legs up to the tier, trunk down to the subject) and flipped for the
 * descendants. `contested` dashes the whole thing, as iOS does.
 */
const Connector: React.FC<{ count: number; contested: boolean; flipped: boolean; touchesFirstRow: boolean }> = ({
  count,
  contested,
  flipped,
  touchesFirstRow,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const stemY = CONNECTOR_H / 2;
  const mid = width / 2;
  const centres = width > 0 ? connectorCentres(width, count, touchesFirstRow) : [];
  let d = `M ${mid} ${stemY} V ${CONNECTOR_H}`;
  if (centres.length > 1) {
    d += ` M ${centres[0]} ${stemY} H ${centres[centres.length - 1]}`;
    for (const x of centres) d += ` M ${x} ${stemY} V 0`;
  } else if (centres.length === 1) {
    const x = centres[0]!;
    d += ` M ${x} 0 V ${stemY}`;
    if (Math.abs(x - mid) > 0.5) d += ` M ${x} ${stemY} H ${mid}`;
  }
  return (
    <div ref={ref} className="w-full px-2.5" style={{ height: CONNECTOR_H }} data-lineage-connector={contested ? 'contested' : 'settled'}>
      {width > 0 && (
        <svg
          width={width}
          height={CONNECTOR_H}
          viewBox={`0 0 ${width} ${CONNECTOR_H}`}
          aria-hidden="true"
          style={flipped ? { transform: 'scaleY(-1)' } : undefined}
        >
          <path
            d={d}
            fill="none"
            stroke="var(--lcd-accent)"
            strokeOpacity={0.55}
            strokeWidth={2}
            strokeDasharray={contested ? '4 3' : undefined}
            shapeRendering="crispEdges"
          />
        </svg>
      )}
    </div>
  );
};

/** One node in the tree. */
const LineageTile: React.FC<{
  node: LineageNode;
  target?: WineEntry;
  isSubject?: boolean;
  onPress?: () => void;
}> = ({ node, target, isSubject = false, onPress }) => {
  const kind = isSubject ? 'subject' : node.kind;
  const solid = kind === 'subject' || kind === 'entry';
  const stem = target && isGrapeEntry(target) ? resolveGrapeArtStem(target) : undefined;
  const border = kind === 'subject'
    ? 'border-2 border-[var(--lcd-accent)]'
    : solid
      ? 'border border-[var(--surface-line-strong)]'
      : 'border border-dashed border-[var(--surface-line-strong)]';
  const ground = solid ? 'bg-[var(--surface-raised)]' : 'bg-[var(--lcd-well,var(--surface-sunken))]';
  const body = (
    <>
      <span className="relative flex h-10 w-10 items-center justify-center rounded-control bg-[var(--surface-sunken,var(--lcd-surface))]" aria-hidden="true">
        {kind === 'unrecorded' ? (
          <CircleSlash size={22} className="text-[var(--lcd-subtext)]" />
        ) : kind === 'external' ? (
          <span className="h-5 w-5 rounded-[3px] border border-dashed border-[var(--lcd-subtext)]" />
        ) : stem ? (
          artSprite('grape', stem, 36)
        ) : (
          <GitBranch size={20} className="text-[var(--lcd-accent)]" />
        )}
        {node.contested && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--livery-amber)] font-retro text-[8px] text-black"
            title="Contested"
            data-lineage-contested
          >
            ?
          </span>
        )}
      </span>
      <span
        className={`block w-full text-center font-retro text-[9px] leading-[1.35] tracking-wide ${kind === 'unrecorded' ? 'text-[var(--lcd-subtext)]' : 'text-[var(--lcd-text)]'}`}
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {kind === 'unrecorded' ? 'UNRECORDED' : node.name.toUpperCase()}
      </span>
      {node.role && (
        <span className="block text-[9px] normal-case text-[var(--lcd-subtext)]">{node.role === 'mother' ? 'seed parent' : 'pollen parent'}</span>
      )}
      {kind === 'external' && <span className="block text-[9px] normal-case text-[var(--lcd-subtext)]">not in catalog</span>}
    </>
  );
  const shell = `flex flex-col items-center gap-1.5 rounded-card px-1.5 py-2 ${border} ${ground}`;
  if (onPress && kind === 'entry') {
    return (
      <button type="button" onClick={onPress} className={`dex-pressable ${shell} shadow-elev-1`} style={{ width: TILE_W }} data-lineage-node={kind}>
        {body}
        <ChevronRight size={12} className="text-[var(--lcd-accent)]" aria-hidden="true" />
      </button>
    );
  }
  return (
    <div className={shell} style={{ width: TILE_W }} data-lineage-node={kind}>
      {body}
    </div>
  );
};

const GrapeLineageScreen: React.FC<GrapeLineageScreenProps> = ({ entry, allEntries, onFocus, onOpenEntry, onBack, onHome }) => {
  const index = lineageIndexFor(allEntries);
  const relatives: GrapeRelatives = useMemo(() => index.relatives(entry.id), [index, entry.id]);
  const byId = useMemo(() => new Map(allEntries.map(e => [e.id, e])), [allEntries]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [allSiblings, setAllSiblings] = useState(false);

  const targetOf = (node: LineageNode) => (node.entryId ? byId.get(node.entryId) : undefined);
  const press = (node: LineageNode) => {
    const t = targetOf(node);
    return t ? () => onFocus(t) : undefined;
  };

  // The unknown-parentage node stands where a parent would, and only where
  // one is actually missing (iOS 0.7.9 C2): two authored ancestors is a
  // settled cross, and a third tile would render a data contradiction as fact.
  const authored = [...relatives.parents, ...(relatives.mutationOf ? [relatives.mutationOf] : [])];
  const ancestors = relatives.parentageUnknown && authored.length < 2 ? [...authored, UNRECORDED_PARENT] : authored;
  const descendants = [...relatives.offspring, ...relatives.mutations];

  const tier = (nodes: LineageNode[], caption: string, trunkBelow: boolean) => {
    const open = expanded.has(caption);
    const shown = open ? nodes : nodes.slice(0, TIER_LIMIT);
    const label = <span className="font-retro text-[10px] tracking-[0.15em] text-[var(--lcd-subtext)]">{caption}</span>;
    const overflow = nodes.length > TIER_LIMIT && (
      <button
        type="button"
        onClick={() => setExpanded(prev => { const next = new Set(prev); if (open) next.delete(caption); else next.add(caption); return next; })}
        className="dex-pressable inline-flex h-[30px] items-center gap-1.5 rounded-full border border-[var(--surface-line)] bg-[var(--lcd-well,var(--surface-sunken))] px-3 font-retro text-[10px] tracking-wide text-[var(--lcd-accent)]"
        data-lineage-overflow={caption}
      >
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {open ? 'SHOW FEWER' : `SHOW ALL ${nodes.length}`}
      </button>
    );
    const tiles = (
      <div className="flex w-full flex-wrap justify-center" style={{ gap: TILE_GAP }} data-lineage-tier={caption}>
        {shown.map((n, i) => <LineageTile key={`${caption}-${i}`} node={n} target={targetOf(n)} onPress={press(n)} />)}
      </div>
    );
    return (
      <div className="flex w-full flex-col items-center gap-2 px-2.5">
        {trunkBelow ? <>{label}{overflow}{tiles}</> : <>{tiles}{overflow}{label}</>}
      </div>
    );
  };

  const row = (node: LineageNode, key: string) => {
    const t = targetOf(node);
    const label = (
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-label tracking-widest text-[var(--lcd-text)] truncate">
          {node.name}
          {node.contested && <span className="text-[var(--livery-amber)]" title="Contested"> ?</span>}
        </span>
        {node.via && <span className="block text-caption text-[var(--lcd-subtext)] normal-case mt-0.5">via {node.via}</span>}
      </span>
    );
    return t ? (
      <button key={key} type="button" onClick={() => onFocus(t)} className="dex-pressable w-full flex items-center gap-2.5 rounded-card border border-[var(--surface-line-strong)] bg-[var(--surface-raised)] shadow-elev-1 px-3 py-2.5 hover:border-[var(--lcd-accent)]">
        <GitBranch size={15} className="text-[var(--lcd-accent)] shrink-0" />
        {label}
        <ChevronRight size={14} className="text-[var(--lcd-accent)] shrink-0" aria-hidden="true" />
      </button>
    ) : (
      <div key={key} className="w-full flex items-center gap-2.5 rounded-card border border-dashed border-[var(--surface-line)] bg-[var(--lcd-well,var(--surface-sunken))] px-3 py-2.5">
        <GitBranch size={15} className="text-[var(--lcd-subtext)] shrink-0" />
        {label}
        <span className="text-caption text-[var(--lcd-subtext)] normal-case shrink-0">not in catalog</span>
      </div>
    );
  };

  // Half-siblings bucketed by the relative they came through, in insertion
  // order, so the buckets follow the parent order the tree above drew.
  const siblingGroups = useMemo(() => {
    const groups: { via: string; members: LineageNode[] }[] = [];
    for (const s of relatives.siblings) {
      const via = s.via ?? 'a shared parent';
      const g = groups.find(x => x.via === via);
      if (g) g.members.push(s); else groups.push({ via, members: [s] });
    }
    return groups;
  }, [relatives.siblings]);
  const siblingOverflow = siblingGroups.some(g => g.members.length > 3);

  const sectionHead = (title: string) => (
    <h2 className="text-label uppercase tracking-widest text-[var(--lcd-accent)] border-b pb-1 mb-2" style={{ borderColor: 'color-mix(in srgb, var(--lcd-accent) 45%, transparent)' }}>{title}</h2>
  );

  return (
    <DeviceLayout title="LINEAGE" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-heading tracking-wide text-[var(--lcd-text)] truncate">{entry.name}</div>
            <div className="text-caption text-[var(--lcd-subtext)] normal-case mt-0.5">the pedigree, as the markers record it</div>
          </div>
          <button type="button" onClick={() => onOpenEntry(entry)} className="dex-pressable flex min-h-11 items-center gap-1 rounded-control bg-[var(--lcd-accent)] px-2.5 py-2 text-micro tracking-widest text-[var(--lcd-on-accent)] shrink-0">
            <BookOpen size={12} /> ENTRY
          </button>
        </div>

        {(ancestors.length > 0 || descendants.length > 0) && (
          <section aria-label="Family tree">
            {sectionHead('FAMILY TREE')}
            <div className="flex flex-col items-center rounded-card border border-[var(--surface-line)] bg-[var(--lcd-surface,var(--surface-base))] py-3.5" data-lineage-tree>
              {ancestors.length > 0 && (
                <>
                  {tier(ancestors, relatives.mutationOf == null ? 'PARENTS' : (relatives.parents.length === 0 ? 'MUTATION OF' : 'PARENTS + SOURCE'), true)}
                  <Connector count={Math.min(ancestors.length, expanded.has('PARENTS') || expanded.has('PARENTS + SOURCE') || expanded.has('MUTATION OF') ? ancestors.length : TIER_LIMIT)} contested={ancestors.some(n => n.contested)} flipped={false} touchesFirstRow={false} />
                </>
              )}
              <div className="px-2.5"><LineageTile node={{ kind: 'entry', entryId: entry.id, name: entry.name, contested: false }} target={entry} isSubject /></div>
              {descendants.length > 0 && (
                <>
                  <Connector count={Math.min(descendants.length, expanded.has('OFFSPRING') || expanded.has('MUTATIONS') || expanded.has('OFFSPRING + MUTATIONS') ? descendants.length : TIER_LIMIT)} contested={descendants.some(n => n.contested)} flipped touchesFirstRow />
                  {tier(descendants, relatives.mutations.length === 0 ? 'OFFSPRING' : (relatives.offspring.length === 0 ? 'MUTATIONS' : 'OFFSPRING + MUTATIONS'), false)}
                </>
              )}
            </div>
          </section>
        )}

        {siblingGroups.length > 0 && (
          <section aria-label="Half-siblings">
            {sectionHead('HALF-SIBLINGS')}
            <div className="flex flex-col gap-3">
              {siblingGroups.map(g => (
                <div key={g.via} className="flex flex-col gap-1.5">
                  <span className="font-retro text-[10px] tracking-[0.12em] text-[var(--lcd-subtext)]">THROUGH {g.via.toUpperCase()}</span>
                  {(allSiblings ? g.members : g.members.slice(0, 3)).map((n, i) => row(n, `${g.via}-${i}`))}
                </div>
              ))}
              {siblingOverflow && (
                <button type="button" onClick={() => setAllSiblings(v => !v)} className="dex-pressable self-start inline-flex h-[30px] items-center gap-1.5 rounded-full border border-[var(--surface-line)] bg-[var(--lcd-well,var(--surface-sunken))] px-3 font-retro text-[10px] tracking-wide text-[var(--lcd-accent)]">
                  {allSiblings ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {allSiblings ? 'SHOW FEWER' : `SHOW ALL ${relatives.siblings.length}`}
                </button>
              )}
            </div>
          </section>
        )}

        {relatives.related.length > 0 && (
          <section aria-label="Related">
            {sectionHead('RELATED')}
            <div className="flex flex-col gap-1.5">{relatives.related.map((n, i) => row(n, `related-${i}`))}</div>
          </section>
        )}

        {relativesIsEmpty(relatives) && !relatives.parentageUnknown && (
          <p className="text-caption text-[var(--lcd-subtext)] normal-case text-center mt-4">No recorded relatives yet.</p>
        )}

        {relatives.notes.length > 0 && (
          <section aria-label="Footnotes" className="mt-2">
            <h2 className="text-label uppercase tracking-widest text-[var(--lcd-subtext)] border-b border-[var(--surface-line)] pb-1 mb-2">FOOTNOTES</h2>
            {relatives.notes.map((note, i) => (
              <p key={i} className="text-caption text-[var(--lcd-subtext)] normal-case leading-relaxed mb-1.5">? {note}</p>
            ))}
          </section>
        )}
      </div>
    </DeviceLayout>
  );
};

export default GrapeLineageScreen;
