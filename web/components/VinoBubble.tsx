import React, { useSyncExternalStore } from 'react';
import { GraduationCap, Smile, ThumbsUp, Wine, Zap, Brain } from 'lucide-react';
import { VinoExpression, VinoLine, chirpText, renderedLine } from '../src/services/vinoDialogue';
import { currentVinoLine, dismissVino, subscribeToVino } from '../src/services/vinoPresenter';
import { displayName } from '../src/services/profile';

/**
 * Professor Vino's speech bubble, ported from
 * `vinodex-ios/Sources/VinodexUI/VinoBubble.swift` — v6#26 (dialogue half).
 *
 * **The portrait gap:** iOS fronts each line with one of six drawn `VinoArt`
 * portraits; those ride the v6#2 art-transport ruling, so the web draws the
 * expression as a chrome glyph in a disc meanwhile. Same six-expression
 * vocabulary, so the ruling lands as an asset swap, not a rewrite.
 *
 * The bubble reads the presenter's queue directly — hosts only decide
 * suspension. Tap anywhere on it to dismiss; announced as a status so a
 * screen-reader user hears the line the sighted user is being charmed by.
 */
const EXPRESSION_GLYPH: Record<VinoExpression, React.ComponentType<{ size?: number; className?: string }>> = {
  neutral: GraduationCap,
  smiling: Smile,
  goodjob: ThumbsUp,
  raiseaglass: Wine,
  surprised: Zap,
  thinking: Brain,
};

const VinoBubble: React.FC = () => {
  const line: VinoLine | null = useSyncExternalStore(subscribeToVino, currentVinoLine, () => null);
  if (!line) return null;

  const Icon = EXPRESSION_GLYPH[line.expression];
  const text = renderedLine(line, displayName());

  return (
    <div className="fixed inset-x-0 bottom-3 z-[70] flex justify-center px-4 pointer-events-none">
      <button
        onClick={dismissVino}
        role="status"
        aria-label={`Professor Vino: ${text}`}
        className="pointer-events-auto w-full max-w-sm flex items-start gap-3 rounded-2xl border-2 border-amber-500 bg-stone-900/95 p-3.5 text-left shadow-[0_4px_0_rgba(0,0,0,0.5)]"
      >
        <span className="shrink-0 w-11 h-11 rounded-full border-2 border-amber-500 bg-stone-800 flex items-center justify-center text-amber-400">
          <Icon size={22} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-retro text-[0.5rem] tracking-widest text-amber-400">PROF. VINO</span>
          {line.chirp && (
            <span className="block font-mono text-[0.62rem] text-stone-500 normal-case mt-0.5">{chirpText(line.chirp)}</span>
          )}
          <span className="block font-mono text-sm text-stone-100 normal-case leading-snug mt-0.5">{text}</span>
          <span className="block font-retro text-[0.45rem] tracking-widest text-stone-500 mt-1.5">TAP TO DISMISS</span>
        </span>
      </button>
    </div>
  );
};

export default VinoBubble;
