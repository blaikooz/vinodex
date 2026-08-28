import React, { useSyncExternalStore } from 'react';
import { VinoLine, chirpText, renderedLine } from '../src/services/vinoDialogue';
import VinoPortrait from './VinoPortrait';
import { currentVinoLine, dismissVino, subscribeToVino } from '../src/services/vinoPresenter';
import { displayName } from '../src/services/profile';
import {
  DEVICE_ABOVE_BAND_STYLE,
  DEVICE_FRAME_BOX,
  DEVICE_FRAME_OVERLAY_STYLE,
  DEVICE_FRAME_STAGE,
} from '../src/services/deviceFrame';

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
      className={`fixed inset-0 z-[70] ${DEVICE_FRAME_STAGE} pointer-events-none`}
      style={DEVICE_FRAME_OVERLAY_STYLE}
      role="status"
      aria-live="polite"
    >
      {/*
        Bottom of the *device*, not bottom of the window (v7#D4).
        `fixed inset-x-0 bottom-3` put the professor at the foot of the
        browser: on a tall desktop window the chassis is a centred column with
        neutral backdrop below it, and his bubble floated on that backdrop,
        detached from the machine he lives in. Clamped to `DEVICE_FRAME_BOX` he
        sits over the LCD at every size, which is where iOS draws him.

        **And above the button band, not on it (v8#11).** `pb-3` put the card
        over the caps. The container is `pointer-events-none` but the card is
        not — it has to be, it is tap-to-dismiss — so while he spoke, a click
        aimed at Home or SETTINGS landed on him. Two of v0.3.0's own navigation
        tests walked into it before they reached their first assertion, which
        is how it was found after shipping in every release since v0.2.0.

        `DEVICE_ABOVE_BAND_STYLE` rather than a Tailwind `pb-*`: the clearance
        is the band's real height scaled by the UI-size axis, which is a
        `calc()` no utility class expresses. He sits over the LCD's lower edge
        now — the same place, one band higher.
      */}
      <div
        className={`relative ${DEVICE_FRAME_BOX} flex items-end justify-center px-4`}
        style={DEVICE_ABOVE_BAND_STYLE}
      >
        <button
          onClick={dismissVino}
          aria-label={`Dismiss Professor Vino: ${text}`}
          className="dex-pressable pointer-events-auto w-full max-w-sm flex items-start gap-3 rounded-card border-2 border-amber-500 bg-stone-900/95 p-3.5 text-left shadow-elev-3"
        >
          <span className="shrink-0 w-11 h-11 rounded-full border-2 border-amber-500 bg-stone-800 flex items-center justify-center overflow-hidden">
            <VinoPortrait expression={line.expression} size={38} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-micro tracking-widest text-amber-400">PROF. VINO</span>
            {line.chirp && (
              <span className="block text-caption text-stone-500 normal-case mt-0.5">{chirpText(line.chirp)}</span>
            )}
            <span className="block text-caption text-stone-100 normal-case leading-relaxed mt-0.5">{text}</span>
            <span className="block text-micro tracking-widest text-stone-500 mt-1.5">TAP TO DISMISS</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default VinoBubble;
