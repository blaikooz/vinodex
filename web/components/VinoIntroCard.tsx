import React, { useState } from 'react';
import VinoPortrait from './VinoPortrait';
import { VINO_NAME_MAX_LENGTH, chirpText, renderedLine, vinoLine } from '../src/services/vinoDialogue';
import { fireOnce } from '../src/services/firstTimeTriggers';
import { presentVinoLine, setSuspended } from '../src/services/vinoPresenter';
import { setDisplayName } from '../src/services/profile';
import { DEVICE_FRAME_BOX, DEVICE_FRAME_OVERLAY_STYLE, DEVICE_FRAME_STAGE } from '../src/services/deviceFrame';

interface VinoIntroCardProps {
  onDone: () => void;
}

/**
 * The name capture, ported from
 * `vinodex-ios/Sources/VinodexUI/VinoIntroCard.swift` (0.8.9d) — v6#26.
 * Draws `firstLaunch`'s ask above a text box; SUBMIT writes
 * `userDisplayName` and SKIP writes nothing, and **both** fire
 * `firstLaunchNamed` — the after-name line carries the division of labour
 * every later line assumes, so the player who skips must still hear it (with
 * the lowercase `explorer` fallback doing exactly the job it was written
 * for).
 *
 * The card claims the suspension seam while it is up, so the after-name
 * bubble lands as the card leaves rather than under it.
 */
const VinoIntroCard: React.FC<VinoIntroCardProps> = ({ onDone }) => {
  const [name, setName] = useState('');
  const ask = vinoLine('firstLaunch')!;

  // Raised means talking: hold the queue for the duration.
  React.useEffect(() => {
    setSuspended(true, 'introCard');
    return () => setSuspended(false, 'introCard');
  }, []);

  const finish = (submitted: string | null) => {
    if (submitted !== null && submitted.trim().length > 0) setDisplayName(submitted.trim());
    // The ask is consumed by being answered either way.
    fireOnce('firstLaunch');
    const named = fireOnce('firstLaunchNamed');
    if (named) presentVinoLine(named);
    onDone();
  };

  return (
    /*
      The scrim dims the device, not the desktop (v7#D5).
      `fixed inset-0 bg-black/85` blacked out the whole browser window around a
      centred 522px chassis — the dialog reading as something the *browser* put
      up rather than something the machine is doing, which is the distinction
      iOS states at `DeviceChassis.swift:1156`. The layer still covers the
      viewport so nothing outside is clickable; the ink is clamped to the frame.
    */
    <div className={`fixed inset-0 z-[85] ${DEVICE_FRAME_STAGE}`} style={DEVICE_FRAME_OVERLAY_STYLE} role="dialog" aria-modal="true" aria-label="Professor Vino introduces himself">
      <div className={`relative ${DEVICE_FRAME_BOX} bg-black/85 flex items-center justify-center p-6 overflow-hidden md:rounded-[2.5rem]`}>
        <div className="w-full max-w-sm bg-stone-900 border-2 border-amber-500 rounded-card p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-12 h-12 rounded-full border-2 border-amber-500 bg-stone-800 flex items-center justify-center overflow-hidden">
              <VinoPortrait expression={ask.expression} size={42} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-caption font-semibold tracking-widest text-amber-400">PROF. VINO</p>
              {ask.chirp && <p className="font-sans text-caption text-stone-500 normal-case mt-0.5">{chirpText(ask.chirp)}</p>}
              <p className="font-sans text-caption text-stone-100 normal-case leading-relaxed mt-1">{renderedLine(ask, null)}</p>
            </div>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              finish(name);
            }}
            className="flex flex-col gap-3"
          >
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={VINO_NAME_MAX_LENGTH}
              placeholder="YOUR NAME"
              aria-label="Your name"
              autoFocus
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-control bg-black/50 border-2 border-stone-700 px-3 py-2.5 font-sans text-body text-green-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => finish(null)}
                className="dex-pressable flex-1 font-sans text-caption font-semibold tracking-widest text-stone-300 border-2 border-stone-600 rounded-control py-3"
              >
                SKIP
              </button>
              <button
                type="submit"
                className="dex-pressable flex-1 font-sans text-caption font-semibold tracking-widest text-black bg-amber-400 rounded-control py-3"
              >
                SUBMIT
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VinoIntroCard;
