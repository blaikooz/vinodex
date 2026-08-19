import React, { useCallback, useEffect, useRef } from 'react';
import ChassisLamp from './ChassisLamp';
import { MARQUEE_PINS, type MarqueePin } from '../src/services/quickPins';

/**
 * One marquee lamp button: its pin's name, its pin's destination, and a
 * secondary gesture that opens the chooser for this slot.
 *
 * Ported from `lampButton` in
 * `vinodex-ios/Sources/VinodexUI/Chassis/DeviceChassis.swift:1664`.
 *
 * ## What iOS does, and what the web does differently
 *
 * iOS: **tap** goes to the pin's destination; **press and hold** for 0.45s
 * opens `MarqueeLampChooser` for this slot; VoiceOver gets a named "Reassign"
 * action, because a screen reader cannot perform a long press and without it
 * "the whole of A1's customisation is unreachable".
 *
 * The web keeps the primary action and the hold, and adds the **context
 * menu** as the secondary gesture. That is a deliberate improvement, not a
 * drift, and it is one line's worth of reasoning: `contextmenu` is the one
 * event a browser already raises for a right-click, for the Menu key **and**
 * for Shift+F10, so a single handler gives a mouse, a keyboard and a screen
 * reader the same second action without inventing a shortcut for any of them.
 * A long press is retained for touch, where it is the gesture iOS taught.
 *
 * ## The moulding survives the semantics
 *
 * The `<button>` is a transparent shell around `ChassisLamp`; every measurement
 * of the recess, the keyline and the halo is unchanged, and the lamp does not
 * shrink under a finger. That last one is iOS's rule and it is worth keeping:
 * "these read as parts of the shell, and a moulded lamp that shrinks under a
 * finger reads as loose. Arriving at the screen is the feedback."
 *
 * The hit target is grown by a pseudo-element rather than by padding
 * (`.lamp-hit`), so a 30px pill answers to a 44px touch without any of the
 * moulded geometry moving.
 */
export interface MarqueeLampButtonProps {
  /** 0 is the left lamp, 1 the right — iOS's `QuickPinStore.pins` order. */
  slot: number;
  pin: MarqueePin;
  fill: string;
  rim: string;
  /**
   * The legend colour: iOS's `ink`, the `border` stop mixed 45% toward black.
   * A shade the lamp is already wearing, one stop below the rim it is drawn
   * with, so the word reads as cut into the cap rather than printed on it.
   */
  ink: string;
  /** Go where the pin points. */
  onActivate: () => void;
  /** Open the chooser for this slot. */
  onReassign: () => void;
  /** The id of the shared visually-hidden hint, for `aria-describedby`. */
  hintId: string;
}

/** iOS's `LongPressGesture(minimumDuration: 0.45)`. */
const HOLD_MS = 450;

/**
 * The widest legend any lamp can ever carry.
 *
 * Taken from the pin list rather than written down as "CUSTOMIZE", so a sixth
 * pin — or a section renamed to something longer — moves the fitting instead
 * of silently overflowing a cap. This is `LampLegend.longest`, and the
 * arithmetic it feeds lives in `.lamp-legend` in index.css.
 */
export const LEGEND_CHARS = Math.max(...MARQUEE_PINS.map(p => p.length));

const MarqueeLampButton: React.FC<MarqueeLampButtonProps> = ({
  slot,
  pin,
  fill,
  rim,
  ink,
  onActivate,
  onReassign,
  hintId,
}) => {
  const holdTimer = useRef<number | null>(null);
  // Set when the hold fires, so the click the browser synthesises after the
  // pointer comes back up does not also navigate — the two gestures do
  // different things and exactly one of them should happen.
  const held = useRef(false);

  const clearHold = useCallback(() => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  useEffect(() => clearHold, [clearHold]);

  const beginHold = useCallback(() => {
    held.current = false;
    clearHold();
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      held.current = true;
      onReassign();
    }, HOLD_MS);
  }, [clearHold, onReassign]);

  return (
    <button
      type="button"
      // The pin's name is the accessible name, exactly as iOS's
      // `accessibilityLabel(pin.displayName)` — the control means whatever it
      // was last pointed at, so anything more permanent would be a lie.
      aria-label={pin}
      aria-describedby={hintId}
      title={`${pin} — right-click or hold to point this button somewhere else`}
      onClick={() => {
        if (held.current) { held.current = false; return; }
        onActivate();
      }}
      onPointerDown={beginHold}
      onPointerUp={clearHold}
      onPointerLeave={clearHold}
      onPointerCancel={clearHold}
      onContextMenu={e => {
        // Right-click, the Menu key and Shift+F10 all arrive here.
        e.preventDefault();
        clearHold();
        onReassign();
      }}
      className="lamp-hit relative flex-1 min-w-0 h-[var(--band-pill)] rounded-full p-0 bg-transparent border-0
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1
                 focus-visible:ring-offset-[color:var(--chassis-footer)]"
    >
      <ChassisLamp
        className="w-full h-full rounded-full"
        size="var(--band-pill)"
        fill={fill}
        rim={rim}
        // No bead (iOS 0.7.2, A4): it would sit directly on the legend.
        bead={false}
        // iOS gives the pills a full `bandPillHeight` of glow where the island
        // trio gets 0.7 of its diameter, so they breathe proportionally wider.
        period={5.7}
        glow={1}
      >
        <span
          className="lamp-legend font-retro leading-none whitespace-nowrap select-none pointer-events-none"
          style={{ color: ink, '--legend-chars': LEGEND_CHARS } as React.CSSProperties}
        >
          {pin}
        </span>
      </ChassisLamp>
      {/* The slot, for the chooser's own copy and for the render pins. Never
          announced: `aria-label` already carries the name, and "left" is a fact
          about the shell that a screen-reader user is not looking at. */}
      <span hidden data-lamp-slot={slot} />
    </button>
  );
};

export default MarqueeLampButton;
