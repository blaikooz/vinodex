import React, { useCallback, useEffect, useRef, useState } from 'react';
import ChassisLamp from './ChassisLamp';

/**
 * The notch-level island strip (iOS `DeviceChassis.islandFlank`).
 *
 * The notch-level island strip (iOS v0.6.9 `islandFlank`): the orb sits
 * in the left corner, the three skin-tinted status lamps in the right
 * corner. The top branding is gone — the settings cog moved into the
 * footer button band, and the VINODEX wordmark moved to the bottom strip
 * of the screen housing (see `bottomVents`), so one device carries one
 * wordmark and it names the product on every screen.
 *
 * **Extracted from `DeviceLayout.tsx` (v7#W7).** The strip is one row with two
 * clusters in it, and the only thing it needs from the device is the flip
 * handler. It carried its own press state, its own hold timer and its own
 * teardown, all of which were sitting in the device component's body between a
 * theme read and a marquee script, so the move takes them with it.
 *
 * The `hideHeader` gate stays at the call site: whether the strip exists is the
 * device's question, not the strip's.
 */
export interface ChassisIslandProps {
  /** Hold the orb to flip the device. Absent disables the orb entirely. */
  onTitleTap?: () => void;
  /**
   * Out of reach while the lamp chooser is up (W-1), so the dialog's
   * `aria-modal` is a true statement about the device rather than a claim a
   * pointer can disprove.
   */
  inert?: boolean;
}

const ChassisIsland: React.FC<ChassisIslandProps> = ({ onTitleTap, inert = false }) => {
  const [orbHeld, setOrbHeld] = useState(false);
  const holdTimer = useRef<number | null>(null);

  const cancelOrbHold = useCallback(() => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setOrbHeld(false);
  }, []);

  const beginOrbHold = useCallback(() => {
    setOrbHeld(true);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      setOrbHeld(false);
      onTitleTap?.();
    }, 1000);
  }, [onTitleTap]);

  // A pointer released outside the orb still has to clear the timer, or the
  // device flips a beat after the user has given up and looked away.
  useEffect(() => cancelOrbHold, [cancelOrbHold]);

  return (
    <div
      className="island-strip shrink-0 flex items-center justify-between px-5 pt-2.5 pb-1"
      inert={inert}
    >
      {/*
        Hold the orb to flip the device — a deliberate easter egg. The orb
        depresses under the finger so the feedback arrives before the flip.
        Its bead and glow are the skin's own (iOS `skin.orb` / `.orbGlow`).
      */}
      {/*
        The orb: a stadium the length of the lamp trio, seated in the
        deck (S3).

        It was a 44px circle with a thick white bezel and a specular
        dot -- a bead standing proud. iOS's `RecessedLamp` note argues
        at length why the orb was deliberately NOT given the lamps'
        treatment (seating a part meant to catch the light inverts its
        lighting), and then records why that argument stopped applying:
        since 0.7.9 the orb is the length of the whole trio and exactly
        a lamp's height, in the same row, at the same distance from the
        eye. Two parts that alike, lit two different ways, read as one
        of them being wrong.

        **Both axes are derived now, and neither was.** The width came
        across as A1's number (5.4rem = iOS's 86.30pt at LARGE, an exact
        port) while the height stayed on the 0.9/1.05rem that C1 retired
        and the trio stayed at 0.625rem -- so the orb was five times
        longer than the trio it is supposed to equal, and the comment
        that used to sit here claimed the width was "three lamps and the
        two gaps between them" while three lamps and two gaps came to
        46px against the orb's 73.6.

        The two rules now live in `.island-orb` / `.island-lamp` in
        index.css, stated once each, which is the form iOS put them in
        for exactly this reason.
      */}
      <div className="relative shrink-0">
        <span
          aria-hidden="true"
          className="island-orb chassis-glow absolute left-1/2 top-1/2 rounded-full pointer-events-none"
          // Off the short axis (iOS 0.7.9, A1): the halo was authored at
          // a flat 9px blur on a 5rem box, which is a spread more than
          // twice the height of the part emitting it now that the orb is
          // as tall as a lamp. `0.7 x` the short axis is the same rule
          // the three status lamps beside it follow.
          style={{
            backgroundColor: 'var(--chassis-orb-glow)',
            filter: 'blur(calc(var(--island-lamp) * 0.7))',
            '--glow-period': '5.3s',
          } as React.CSSProperties}
        />
        <button
          type="button"
          aria-label={onTitleTap ? 'Hold to flip device' : undefined}
          aria-hidden={onTitleTap ? undefined : true}
          onPointerDown={onTitleTap ? beginOrbHold : undefined}
          onPointerUp={onTitleTap ? cancelOrbHold : undefined}
          onPointerLeave={onTitleTap ? cancelOrbHold : undefined}
          onPointerCancel={onTitleTap ? cancelOrbHold : undefined}
          disabled={!onTitleTap}
          className={`recessed-lamp island-orb relative rounded-full p-0 transition-transform duration-100 ${
            orbHeld ? 'scale-[0.88] brightness-75' : ''
          } ${onTitleTap ? 'cursor-pointer' : 'cursor-default'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
          style={{
            backgroundColor: 'var(--chassis-orb)',
            border: '1px solid var(--chassis-orb-glow)',
            // The short axis drives the recess: `.recessed-lamp` is a
            // set of fractions, so one class is correct on a 10px vent
            // dot and on this. C1: the orb's short axis IS a lamp.
            '--lamp-size': 'var(--island-lamp)',
          } as React.CSSProperties}
        >
          <span className="lamp-bead" aria-hidden="true" />
        </button>
      </div>

      {/* The status trio (S3): three lamps, `statusDotSpacing` apart, at
          `islandStatusDot`. Decoration and nothing else -- iOS's own note on
          `statusDots` says "these lamps carry no state", which is why the
          group is `aria-hidden` and why the pins went on the marquee pair
          instead. Sized by `.island-lamp` so the orb across the strip stays
          exactly their length. */}
      <div className="flex flex-row gap-[var(--island-gap)] items-center" aria-hidden="true">
        {[1, 2, 3].map((n, i) => (
          <ChassisLamp
            key={n}
            className="island-lamp rounded-full"
            size="var(--island-lamp)"
            fill={`var(--chassis-lamp${n})`}
            rim={`var(--chassis-lamp${n}-edge)`}
            period={[6.1, 7.4, 4.8][i]}
          />
        ))}
      </div>
    </div>
  );
};

export default ChassisIsland;
