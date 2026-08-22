import React, { useEffect, useState, useSyncExternalStore } from 'react';
import VinoPortrait from './VinoPortrait';
import {
  COACHMARK_STEPS,
  coachmarkPosition,
  currentCoachmark,
  renderedStep,
  reportCoachmark,
  skipCoachmarks,
  subscribeToCoachmarks,
} from '../src/services/coachmarks';
import { isSuspendedOtherThan, setSuspended, subscribeToVino } from '../src/services/vinoPresenter';
import { displayName } from '../src/services/profile';
import {
  DEVICE_ABOVE_BAND_STYLE,
  DEVICE_FRAME_BOX,
  DEVICE_FRAME_OVERLAY_STYLE,
  DEVICE_FRAME_STAGE,
} from '../src/services/deviceFrame';

/**
 * The spotlight, ported from
 * `vinodex-ios/Sources/VinodexUI/CoachmarkOverlay.swift` (0.8.9d, G1) —
 * v6#23. iOS cuts the hole from SwiftUI anchor preferences; here the two
 * ends agree via `data-coachmark` attributes and the dim is four rectangles
 * around the target's rect, which leaves the target itself clickable — the
 * step advances by the player doing the thing, not by reading about it.
 *
 * A missing anchor is a legal state, not a failure: the card still names the
 * control (`menuTile` runs card-only — the bundle owns `MainMenu.tsx`, so
 * the GRAPES tile is untagged until the merge; recorded in the ledger).
 *
 * The overlay suspends Vino's queue under its own reason while it runs — he
 * cannot remark over his own tutorial — and stands down for the rating
 * prompt and stamp celebration a spotlit TRIED tap raises, read off the same
 * set from the other end.
 */
const CoachmarkOverlay: React.FC = () => {
  const step = useSyncExternalStore(subscribeToCoachmarks, currentCoachmark, () => null);
  const othersTalking = useSyncExternalStore(subscribeToVino, () => isSuspendedOtherThan('coachmark'), () => false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Claim the queue for exactly as long as a step is up.
  useEffect(() => {
    setSuspended(step !== null, 'coachmark');
    return () => setSuspended(false, 'coachmark');
  }, [step]);

  // Resolve the target's rectangle, re-measured while the step is up so a
  // late layout or a resize cannot strand the hole.
  useEffect(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-coachmark="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    const poll = setInterval(measure, 400);
    window.addEventListener('resize', measure);
    return () => {
      clearInterval(poll);
      window.removeEventListener('resize', measure);
    };
  }, [step]);

  if (!step || othersTalking) return null;

  const text = renderedStep(step, displayName());
  const position = coachmarkPosition();
  const pad = 6;

  // Four dim panels around the hole; the hole itself takes no pointer
  // events, so the spotlit control works. No target (or none found) dims
  // nothing — the card alone carries the step.
  const panels =
    rect === null
      ? []
      : [
          { top: 0, left: 0, right: 0, height: Math.max(rect.top - pad, 0) },
          { top: rect.bottom + pad, left: 0, right: 0, bottom: 0 },
          { top: Math.max(rect.top - pad, 0), left: 0, width: Math.max(rect.left - pad, 0), height: rect.height + pad * 2 },
          { top: Math.max(rect.top - pad, 0), left: rect.right + pad, right: 0, height: rect.height + pad * 2 },
        ];

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none" role="dialog" aria-label={`Tutorial step ${position} of ${COACHMARK_STEPS.length}`}>
      {panels.map((style, i) => (
        <div key={i} className="absolute bg-black/70 pointer-events-auto" style={style as React.CSSProperties} />
      ))}
      {rect && (
        <div
          className="absolute rounded-xl border-2 border-amber-400 pointer-events-none"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      )}

      {/*
        The spotlight stays on the viewport; the card comes back to the device
        (v7#D6). The four dim panels and the hole are drawn from
        `getBoundingClientRect`, which is viewport space, so `fixed inset-0` is
        exactly right for them and they are left alone. The card was not — at
        `absolute inset-x-0 bottom-4` it sat at the foot of the *browser*, and
        on a tall desktop window that is below the chassis, on the neutral
        backdrop, pointing at a control several hundred pixels above it.

        `DEVICE_FRAME_OVERLAY_STYLE` on the stage is **not decoration** (R1).
        `DeviceLayout` overrides `md:p-4`'s top padding with an inline
        `env(safe-area-inset-top)`, which is 0 on a desktop, so the chassis
        centres inside `100vh - 16px` and lands at y=8. A stage that keeps the
        full `p-4` centres inside `100vh - 32px` and lands at y=16 — the card
        sat **8px above where the device was**, on the one overlay that was
        given the box but not the insets. Measured, not assumed: 16 against
        the chassis's 8 at 1280x800, before this line.
      */}
      {/*
        Above the button band, for the professor's reason and one of its own
        (v8#11). The card is `pointer-events-auto` — it carries SKIP and GOT IT
        — and at `pb-4` it sat on the caps, so the tutorial ate clicks aimed at
        Home and SETTINGS exactly like the bubble did.

        Worse here: `passportButton` is one of the walkthrough's own targets and
        it is the Collection cap, **on the band**. The card was covering the
        control the step was pointing at, with the spotlight ring drawn
        underneath it.
      */}
      <div className={`absolute inset-0 ${DEVICE_FRAME_STAGE}`} style={DEVICE_FRAME_OVERLAY_STYLE}>
        <div
          className={`relative ${DEVICE_FRAME_BOX} flex items-end justify-center px-4`}
          style={DEVICE_ABOVE_BAND_STYLE}
        >
          <div className="pointer-events-auto w-full max-w-sm rounded-card border-2 border-amber-500 bg-stone-900/95 p-3.5 flex flex-col gap-2.5 shadow-elev-3">
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-10 h-10 rounded-full border-2 border-amber-500 bg-stone-800 flex items-center justify-center overflow-hidden">
                <VinoPortrait expression={step.expression} size={34} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-caption font-semibold tracking-widest text-amber-400">
                  TUTORIAL {position}/{COACHMARK_STEPS.length}
                </p>
                <p className="font-sans text-caption text-stone-100 normal-case leading-relaxed mt-1">{text}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={skipCoachmarks}
                className="dex-pressable flex-1 font-sans text-caption font-semibold tracking-widest text-stone-400 border-2 border-stone-700 rounded-control py-2.5"
              >
                SKIP
              </button>
              {step.advancesOn === 'acknowledged' && (
                <button
                  onClick={() => reportCoachmark('acknowledged')}
                  className="dex-pressable flex-1 font-sans text-caption font-semibold tracking-widest text-black bg-amber-400 rounded-control py-2.5"
                >
                  CONTINUE
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachmarkOverlay;
