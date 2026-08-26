import React from 'react';
import type { GrilleShapeId } from '../src/services/deviceParts';

/**
 * The speaker grille, in whichever pattern is fitted (v0.5.0) — the web twin
 * of iOS `ChassisGrille` (`DeviceParts.swift`), and the S5 tail the scoping
 * report folded into the workshop: the five patterns arrive with the axis
 * that chooses them, not before.
 *
 * One component rather than a shape per case in the chassis, for iOS's
 * reason: the vent has one size and one opacity wherever it is drawn, and
 * the workshop's schematic must not quietly become a different part. Every
 * pattern is centred in the slot the four slats have always occupied
 * (56 × 14 px), so swapping the vent cannot move the wordmark beside it.
 *
 * Faint on purpose at 0.5, unchanged from the capsules this replaces: the
 * vent is texture, not a feature. `NONE` holds the slot rather than
 * collapsing it — a zero-width vent would let the wordmark slide into the
 * corner the moment somebody removed the grille.
 */
const ChassisGrille: React.FC<{ shape: GrilleShapeId; className?: string }> = ({ shape, className = '' }) => {
  const ink = 'var(--chassis-grill)';
  const box = `w-14 h-3.5 shrink-0 flex items-center justify-center ${shape === 'NONE' ? 'opacity-0' : 'opacity-50'} ${className}`;

  switch (shape) {
    case 'BARS':
      // Thirteen bars at 2 with 3 between them — as near 56 as an odd count gets.
      return (
        <div className={`${box} flex-row gap-[3px]`} aria-hidden="true">
          {Array.from({ length: 13 }).map((_, i) => (
            <span key={i} className="w-0.5 h-full rounded-full" style={{ backgroundColor: ink }} />
          ))}
        </div>
      );
    case 'DOTS':
      // A perforated plate — the drilled-hole grille of a desk telephone.
      return (
        <div className={`${box} flex-col gap-[3px]`} aria-hidden="true">
          {Array.from({ length: 3 }).map((_, row) => (
            <span key={row} className="flex flex-row gap-[3px]">
              {Array.from({ length: 12 }).map((_, col) => (
                <span key={col} className="w-[2.4px] h-[2.4px] rounded-full" style={{ backgroundColor: ink }} />
              ))}
            </span>
          ))}
        </div>
      );
    case 'MESH':
      // One crosshatch background rather than stacked rules: overlapping
      // elements double the ink at every crossing, which at half opacity is a
      // grid of darker dots — the artefact that reads as damage, not weave.
      return (
        <div
          className={box}
          aria-hidden="true"
          style={{
            backgroundImage:
              `repeating-linear-gradient(0deg, ${ink} 0 1px, transparent 1px 4px), `
              + `repeating-linear-gradient(90deg, ${ink} 0 1px, transparent 1px 4px)`,
          }}
        />
      );
    case 'NONE':
      return <div className={box} aria-hidden="true" />;
    case 'SLATS':
    default:
      // Four horizontal capsules — the vent the device has always had.
      return (
        <div className={`${box} flex-col gap-0.5`} aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="w-full h-0.5 rounded-full" style={{ backgroundColor: ink }} />
          ))}
        </div>
      );
  }
};

export default ChassisGrille;
