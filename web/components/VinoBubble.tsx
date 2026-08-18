import React, { useSyncExternalStore } from 'react';
import { VinoLine, chirpText, renderedLine } from '../src/services/vinoDialogue';
import VinoPortrait from './VinoPortrait';
import { currentVinoLine, dismissVino, subscribeToVino } from '../src/services/vinoPresenter';
import { displayName } from '../src/services/profile';

/**
 * Professor Vino's speech bubble, ported from
 * `vinodex-ios/Sources/VinodexUI/VinoBubble.swift` — v6#26 (dialogue half).
 *
 * Fronted by his drawn face since the v6#2 art ruling (see `VinoPortrait`):
 * the six-expression vocabulary was already threaded through here, so the
 * ruling landed as the asset swap it was promised to be.
 *
 * The bubble reads the presenter's queue directly — hosts only decide
 * suspension. Tap anywhere on it to dismiss; announced as a status so a
 * screen-reader user hears the line the sighted user is being charmed by.
 */

const VinoBubble: React.FC = () => {
  const line: VinoLine | null = useSyncExternalStore(subscribeToVino, currentVinoLine, () => null);
  if (!line) return null;

  const text = renderedLine(line, displayName());

  return (
    // `role="status"` belongs on the region, not on the control (U7's a11y
    // batch; found by `jsx-a11y/no-interactive-element-to-noninteractive-role`
    // on the linter's first run). It was on the `<button>`, which overrides
    // the button role entirely — so the bubble announced as a status message
    // and the fact that it can be dismissed was not discoverable to anyone
    // using assistive tech. The live region wraps it now and the button is a
    // button again.
    <div
      className="fixed inset-x-0 bottom-3 z-[70] flex justify-center px-4 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <button
        onClick={dismissVino}
        aria-label={`Dismiss Professor Vino: ${text}`}
        className="pointer-events-auto w-full max-w-sm flex items-start gap-3 rounded-2xl border-2 border-amber-500 bg-stone-900/95 p-3.5 text-left shadow-[0_4px_0_rgba(0,0,0,0.5)]"
      >
        <span className="shrink-0 w-11 h-11 rounded-full border-2 border-amber-500 bg-stone-800 flex items-center justify-center overflow-hidden">
          <VinoPortrait expression={line.expression} size={38} />
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
