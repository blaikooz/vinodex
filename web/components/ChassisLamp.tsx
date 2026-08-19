import React from 'react';

/**
 * One indicator lamp, seated in a milled recess.
 *
 * Ported from `RecessedLamp` in
 * `vinodex-ios/Sources/VinodexUI/Chassis/DeviceChassis.swift:1928`, whose own
 * note is the reason this is one component rather than four copies: every lamp
 * on the chassis was drawn the same wrong way — a flat disc of colour with a
 * 1px keyline — and iOS's 0.7.1 A6 is the instruction to make all of them look
 * like a part *fitted into* the shell. One modifier there, one component here,
 * "because the next lamp added should be right by default".
 *
 * **The device carries eight of them, in three groups**, and it is worth
 * naming them because they are easy to conflate:
 *
 * | group | count | shape | colour | pulse |
 * |---|---|---|---|---|
 * | the island trio (`ChassisIsland`) | 3 | circle | the skin's `statusLights` | 6.1 / 7.4 / 4.8s |
 * | the marquee pair (`DeviceFooter`) | 2 | capsule | `statusLights` [0] and [2] | 5.7s |
 * | the housing + vent lamps | 2 + 1 | circle | fixed red on every shell | none |
 *
 * Plus the orb, which since iOS 0.8.0 (C2) comes through here too — the
 * paragraph that used to say the orb was deliberately *not* given the lamps'
 * treatment was overturned once the orb became a stadium exactly a lamp's
 * height, because two parts that alike lit two different ways read as one of
 * them being wrong.
 *
 * ## The construction
 *
 * Everything is a fraction of `--lamp-size` with a floor, so one rule is
 * correct on an 8px vent dot and a 30px marquee pill. Nothing here is
 * skin-coloured: shading is a property of the light, not of the plastic, which
 * is what lets one component serve all twenty-two shells. The measurements live
 * in `.recessed-lamp` in `index.css`; see there for the wall / lip / keyline /
 * bead / seat stack.
 *
 * `--lamp-size` is the **short axis** — a diameter for a circle, a height for a
 * capsule — which is iOS's `size:` contract verbatim, and is what makes the
 * generic-over-shape trick work in both languages.
 */
export interface ChassisLampProps {
  /**
   * The short axis, as a CSS length. Drives every measurement in the recess.
   * The element's own width/height still come from `className`, because a
   * capsule's long axis is the layout's business and not the lamp's.
   */
  size: string;
  /** The lit plastic. A CSS colour, usually a `var(--chassis-lamp*)`. */
  fill: string;
  /** The lamp's own dark keyline — the `border` half of the skin's pair. */
  rim: string;
  /**
   * The specular bead.
   *
   * **Off on the marquee pair** (iOS 0.7.2, A4): those two carry a legend, and
   * a blurred white dot directly above the word is the specular fighting the
   * label. The island trio and the vent lamps keep theirs — nothing sits on
   * top of them to compete, and a chassis lamp with no highlight at all is a
   * painted circle.
   */
  bead?: boolean;
  /**
   * The breathing halo's period in seconds, or absent for a lamp that does not
   * pulse. iOS `PulseGlow.period`; the vent lamps pass nothing, because a
   * power indicator that breathes is saying something a power indicator does
   * not say.
   */
  period?: number;
  /**
   * How far the halo spreads, as a fraction of the short axis — iOS's
   * `maxRadius`. 0.7 for the island trio and the orb; 1.0 for the marquee
   * pills, which iOS gives a full `bandPillHeight` rather than a fraction of
   * one.
   */
  glow?: number;
  /** Shape and footprint: `rounded-full w-3 h-3`, `flex-1 h-[1.875rem]`, … */
  className?: string;
  /** Anything drawn on the face — the marquee pair's engraved legend. */
  children?: React.ReactNode;
}

/**
 * The lit part, its recess and its halo — without any opinion about whether it
 * is pressable. `ChassisLamp` renders a `<span>`; `MarqueeLampButton` wraps
 * this in a `<button>` and keeps the moulding identical, which is the whole
 * reason the drawing and the semantics are separated here.
 */
const ChassisLamp: React.FC<ChassisLampProps> = ({
  size,
  fill,
  rim,
  bead = true,
  period,
  glow = 0.7,
  className = '',
  children,
}) => (
  // A wrapper, so the halo can sit genuinely *behind* the lamp the way iOS's
  // `.background { Circle().fill(color).blur(maxRadius) }` does. It cannot be a
  // child: `.recessed-lamp` declares `isolation: isolate`, so a negative
  // z-index inside it lands behind the content and still in front of the
  // opaque fill — which would wash out the marquee pair's legend. This is the
  // same shape the orb already used.
  <span className={`relative inline-flex ${className}`} style={{ '--lamp-size': size } as React.CSSProperties}>
    {period !== undefined && (
      // A class rather than an inline `animation:` — an inline one is beyond
      // the reach of any selector, including the reduced-motion query, which
      // is the hole `reducedMotion.test.ts` fails the build over (v7#U7). The
      // per-lamp stagger is a custom property, which is what varies.
      <span
        aria-hidden="true"
        className="chassis-glow absolute left-1/2 top-1/2 w-full pointer-events-none"
        style={{
          height: 'var(--lamp-size)',
          backgroundColor: fill,
          borderRadius: 'inherit',
          filter: `blur(calc(var(--lamp-size) * ${glow}))`,
          '--glow-period': `${period}s`,
        } as React.CSSProperties}
      />
    )}
    <span
      className="recessed-lamp relative w-full h-full flex items-center justify-center"
      style={{
        backgroundColor: fill,
        border: `1px solid ${rim}`,
        borderRadius: 'inherit',
      } as React.CSSProperties}
    >
      {bead && <span className="lamp-bead" aria-hidden="true" />}
      {children}
    </span>
  </span>
);

export default ChassisLamp;
