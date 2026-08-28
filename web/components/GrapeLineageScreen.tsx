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
        <span className="block text-label tracking-widest text-[var(--lcd-text)] truncate">
          {node.name}
          {node.contested && <span className="text-[var(--livery-amber)]" title="Contested"> *</span>}
        </span>
        {(node.role || node.via) && (
          <span className="block text-caption text-[var(--lcd-subtext)] normal-case mt-0.5">
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
          className="dex-pressable w-full flex items-center gap-2.5 rounded-card border border-[var(--surface-line-strong)] bg-[var(--surface-raised)] shadow-elev-1 px-3 py-2.5 hover:border-[var(--lcd-accent)]"
        >
          <GitBranch size={15} className="text-[var(--lcd-accent)] shrink-0" />
          {label}
        </button>
      );
    }
    // Terminal: a variety the catalog does not carry.
    return (
      <div key={key} className="w-full flex items-center gap-2.5 rounded-card border border-[var(--surface-line)] bg-[var(--surface-raised)] opacity-80 px-3 py-2.5">
        <GitBranch size={15} className="text-[var(--lcd-disabled-text)] shrink-0" />
        {label}
        <span className="text-caption text-[var(--lcd-subtext)] normal-case shrink-0">not in catalog</span>
      </div>
    );
  };

  const section = (title: string, nodes: LineageNode[]) =>
    nodes.length > 0 && (
      <div key={title}>
        <h2 className="text-label uppercase tracking-widest text-[var(--lcd-accent)] border-b pb-1 mb-2" style={{ borderColor: 'color-mix(in srgb, var(--lcd-accent) 45%, transparent)' }}>{title}</h2>
        <div className="flex flex-col gap-1.5">{nodes.map((n, i) => nodeRow(n, `${title}-${i}`))}</div>
      </div>
    );

  return (
    <DeviceLayout title="LINEAGE" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }}>
        {/* The focused grape. */}
        <div className="rounded-card border border-[var(--surface-line-strong)] bg-[var(--surface-raised)] shadow-elev-1 p-3.5 flex items-center gap-3">
          <GitBranch size={22} className="text-[var(--lcd-accent)] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-heading tracking-wide text-[var(--lcd-text)] truncate">{entry.name}</div>
            <div className="text-caption text-[var(--lcd-subtext)] normal-case mt-0.5">the pedigree, as the markers record it</div>
          </div>
          <button
            onClick={() => onOpenEntry(entry)}
            className="dex-pressable flex items-center gap-1 rounded-control bg-[var(--lcd-accent)] px-2.5 py-2 text-micro tracking-widest text-[var(--lcd-on-accent)] shrink-0"
          >
            <BookOpen size={12} /> ENTRY
          </button>
        </div>

        {relatives.parentageUnknown && relatives.parents.length === 0 && (
          // The statement standing in the place a parent would occupy.
          <div className="flex items-center gap-2.5 rounded-card border border-dashed border-[var(--surface-line-strong)] bg-[var(--surface-raised)] px-3 py-2.5">
            <CircleHelp size={15} className="text-[var(--lcd-subtext)] shrink-0" />
            <span className="flex-1 text-caption text-[var(--lcd-text)] normal-case leading-relaxed">
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
          <p className="text-caption text-[var(--lcd-subtext)] normal-case text-center mt-4">
            No recorded relatives yet.
          </p>
        )}

        {relatives.notes.length > 0 && (
          <div className="mt-2">
            <h2 className="text-label uppercase tracking-widest text-[var(--lcd-subtext)] border-b border-[var(--surface-line)] pb-1 mb-2">NOTES</h2>
            {relatives.notes.map((note, i) => (
              <p key={i} className="text-caption text-[var(--lcd-subtext)] normal-case leading-relaxed mb-1.5">* {note}</p>
            ))}
          </div>
        )}
      </div>
    </DeviceLayout>
  );
};

export default GrapeLineageScreen;
