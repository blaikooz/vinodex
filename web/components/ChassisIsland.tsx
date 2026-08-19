import React, { useCallback, useEffect, useRef, useState } from 'react';

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
}

const ChassisIsland: React.FC<ChassisIslandProps> = ({ onTitleTap }) => {
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
    <div className="shrink-0 flex items-start justify-between px-5 pt-2.5 pb-1">
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

        The width is derived, not authored -- three lamps and the two
        gaps between them, which is iOS's own rule stated once so a
        mockup can obey it too. The height is the short axis and drives
        every measurement in `.recessed-lamp`.
      */}
      <div className="relative shrink-0">
        <span
          aria-hidden="true"
          className="chassis-glow absolute left-1/2 top-1/2 w-20 h-10 md:w-24 md:h-12 rounded-full pointer-events-none"
          style={{ backgroundColor: 'var(--chassis-orb-glow)', filter: 'blur(9px)', '--glow-period': '5.3s' } as React.CSSProperties}
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
          className={`recessed-lamp relative w-[4.6rem] h-[0.9rem] md:w-[5.4rem] md:h-[1.05rem] rounded-full p-0 transition-transform duration-100 ${
            orbHeld ? 'scale-[0.88] brightness-75' : ''
          } ${onTitleTap ? 'cursor-pointer' : 'cursor-default'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80`}
          style={{
            backgroundColor: 'var(--chassis-orb)',
            border: '1px solid var(--chassis-orb-glow)',
            // The short axis drives the recess: `.recessed-lamp` is a
            // set of fractions, so one class is correct on a 10px vent
            // dot and on this.
            '--lamp-size': '0.95rem',
          } as React.CSSProperties}
        >
          <span className="lamp-bead" aria-hidden="true" />
        </button>
      </div>

      {/* The three skin-tinted lamps, trailing-aligned in the right corner. */}
      {/* The status trio, seated (S3). Same recess as every other lamp
          on the device -- see `.recessed-lamp`. */}
      <div className="flex flex-row gap-2 items-center pt-1.5" aria-hidden="true">
        {[1, 2, 3].map((n, i) => (
          <span
            key={n}
            className="recessed-lamp relative w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
            style={{
              backgroundColor: `var(--chassis-lamp${n})`,
              border: `1px solid var(--chassis-lamp${n}-edge)`,
              '--lamp-size': '0.75rem',
            } as React.CSSProperties}
          >
            <span className="lamp-bead" />
            <span
              className="chassis-glow absolute left-1/2 top-1/2 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full pointer-events-none"
              style={{ backgroundColor: `var(--chassis-lamp${n})`, filter: 'blur(4px)', '--glow-period': `${[6.1, 7.4, 4.8][i]}s` } as React.CSSProperties}
            />
          </span>
        ))}
      </div>
    </div>
  );
};

export default ChassisIsland;
