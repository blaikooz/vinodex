import React, { useMemo } from 'react';
import { GitBranch, CircleHelp, BookOpen } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { WineEntry } from '@/shared/types';
import {
  LineageNode,
  lineageIndexFor,
  relativesIsEmpty,
} from '../src/services/grapeLineage';

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

/**
 * One grape's pedigree, ported from
 * `vinodex-ios/Sources/VinodexUI/GrapeLineageScreen.swift` (0.7.5, E1) —
 * v6#16. The iOS screen draws a positioned family tree; the web reads the
 * same `GrapeRelatives` as sectioned rows — the idiomatic translation, since
 * every list on this side is rows (and the data, not the drawing, is what
 * the two apps share).
 *
 * Tapping a catalog relative **refocuses the tree**; OPEN ENTRY leaves it.
 * An off-catalog ancestor is a flat, untappable node — a terminal fact, not
 * a broken link. PARENTAGE UNDETERMINED renders in the place a parent would
 * occupy, because "nobody knows" and "nobody has authored it yet" have to
 * *look* different.
 */
const GrapeLineageScreen: React.FC<GrapeLineageScreenProps> = ({ entry, allEntries, onFocus, onOpenEntry, onBack, onHome }) => {
  const index = lineageIndexFor(allEntries);
  const relatives = useMemo(() => index.relatives(entry.id), [index, entry.id]);
  const byId = useMemo(() => new Map(allEntries.map(e => [e.id, e])), [allEntries]);

  const nodeRow = (node: LineageNode, key: string) => {
    const target = node.entryId ? byId.get(node.entryId) : undefined;
    const label = (
      <span className="flex-1 min-w-0 text-left">
        <span className="block font-retro text-[0.65rem] tracking-widest text-stone-100 truncate">
          {node.name}
          {node.contested && <span className="text-yellow-400" title="Contested"> *</span>}
        </span>
        {(node.role || node.via) && (
          <span className="block font-mono text-[0.62rem] text-stone-400 normal-case mt-0.5">
            {node.role ? (node.role === 'mother' ? 'seed parent' : 'pollen parent') : `via ${node.via}`}
          </span>
        )}
      </span>
    );
    if (target) {
      return (
        <button
          key={key}
          onClick={() => onFocus(target)}
          className="w-full flex items-center gap-2.5 rounded-lg border-2 border-green-800 bg-stone-900/70 px-3 py-2.5 transition-colors hover:border-green-500"
        >
          <GitBranch size={15} className="text-green-400 shrink-0" />
          {label}
        </button>
      );
    }
    // Terminal: a variety the catalog does not carry.
    return (
      <div key={key} className="w-full flex items-center gap-2.5 rounded-lg border border-stone-700 bg-stone-900/40 px-3 py-2.5">
        <GitBranch size={15} className="text-stone-500 shrink-0" />
        {label}
        <span className="font-mono text-[0.55rem] text-stone-500 normal-case shrink-0">not in catalog</span>
      </div>
    );
  };

  const section = (title: string, nodes: LineageNode[]) =>
    nodes.length > 0 && (
      <div key={title}>
        <div className="font-retro text-[0.6rem] tracking-widest text-green-400 border-b border-green-800 pb-1 mb-2">{title}</div>
        <div className="flex flex-col gap-1.5">{nodes.map((n, i) => nodeRow(n, `${title}-${i}`))}</div>
      </div>
    );

  return (
    <DeviceLayout title="LINEAGE" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }}>
        {/* The focused grape. */}
        <div className="rounded-xl border-2 border-green-700 bg-stone-900/80 p-3.5 flex items-center gap-3">
          <GitBranch size={22} className="text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-retro text-sm tracking-widest text-stone-100 truncate">{entry.name}</div>
            <div className="font-mono text-[0.62rem] text-stone-400 normal-case mt-0.5">the pedigree, as the markers record it</div>
          </div>
          <button
            onClick={() => onOpenEntry(entry)}
            className="flex items-center gap-1 rounded-lg bg-green-600 border-b-2 border-green-800 active:translate-y-0.5 px-2.5 py-2 font-retro text-[0.5rem] tracking-widest text-white shrink-0"
          >
            <BookOpen size={12} /> ENTRY
          </button>
        </div>

        {relatives.parentageUnknown && relatives.parents.length === 0 && (
          // The statement standing in the place a parent would occupy.
          <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-stone-600 bg-stone-900/40 px-3 py-2.5">
            <CircleHelp size={15} className="text-stone-400 shrink-0" />
            <span className="flex-1 font-mono text-xs text-stone-300 normal-case">
              Parentage undetermined — the sources that would know were asked, and no parent pair is established.
            </span>
          </div>
        )}

        {section('PARENTS', relatives.parents)}
        {relatives.mutationOf && section('MUTATION OF', [relatives.mutationOf])}
        {section('OFFSPRING', relatives.offspring)}
        {section('MUTATIONS', relatives.mutations)}
        {section('SIBLINGS', relatives.siblings)}
        {section('RELATED', relatives.related)}

        {relativesIsEmpty(relatives) && !relatives.parentageUnknown && (
          <p className="font-mono text-xs text-stone-500 normal-case text-center mt-4">
            No recorded relatives yet.
          </p>
        )}

        {relatives.notes.length > 0 && (
          <div className="mt-2">
            <div className="font-retro text-[0.6rem] tracking-widest text-stone-400 border-b border-stone-700 pb-1 mb-2">NOTES</div>
            {relatives.notes.map((note, i) => (
              <p key={i} className="font-mono text-[0.65rem] text-stone-400 normal-case leading-relaxed mb-1.5">* {note}</p>
            ))}
          </div>
        )}
      </div>
    </DeviceLayout>
  );
};

export default GrapeLineageScreen;
