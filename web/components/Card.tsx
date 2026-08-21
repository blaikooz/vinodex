import React from 'react';

/**
 * The surface primitive (v0.4.0, m3) — `Card`, `Tile`, and the livery type
 * they share.
 *
 * ## What this replaces
 *
 * Two hand-rolled tile treatments that had drifted apart, both of them the
 * same 2010s flat-material idea:
 *
 * - `WebsitePortal`'s `tileBase` — a full-chroma Tailwind fill
 *   (`bg-purple-500`), a 6px hard bottom border pretending to be an
 *   extrusion, `shadow-lg`, and a label in Press Start 2P small enough that
 *   WHO WE ARE and CONTACT US had to carry a literal `<br />`.
 * - `MainMenu`'s `DialTile` — four hexes spelled at the call site, an
 *   `inset 0 -5px 0` extrusion, and the same pixel-font label.
 *
 * Both filled the whole tile with the category colour, which is why neither
 * could carry legible text: white on the seven `DexTileLivery` faces measures
 * 1.92:1 to 3.96:1, and AA wants 4.5:1. **The colour becoming an accent
 * rather than the fill is what makes the label readable**, so the taste change
 * and the accessibility fix are the same change.
 *
 * ## The construction
 *
 * A card is: a surface tinted 14% toward its livery, one soft two-layer
 * shadow, one radius from the three-radius vocabulary, and the livery showing
 * up **once** — in the icon chip. Not a border AND a chip AND a wash; the
 * plan's word for this is restraint and it is the difference between this and
 * a crypto dashboard.
 *
 * Every colour comes from `.dex-tint`, which derives the four-step ramp from
 * one `--tint` against the *current screen mode's* own page, surface and text
 * (see index.css). That is why there is no light-mode branch in this file and
 * no `useTheme()` call: nine LCD modes, one rule, resolved by the engine.
 *
 * ## The idea is shared; this execution is the web's
 *
 * The liveries are `DexTileLivery` (DexTheme.swift:132) — same seven names,
 * same assignment of hue to category, retuned one chroma step. The *drawing*
 * is not iOS's painted-plastic tile, and as of v0.4.0 it does not have to be:
 * presentation split from the phone at this release (see index.css and
 * IOS-PARITY-v9.md). What the web gets in exchange is `:focus-visible`,
 * pointer-gated hover and a spring on the press — three things a SwiftUI tile
 * has no use for.
 */

/**
 * The seven liveries, spelled as a union so a typo is a compile error rather
 * than a tile that silently resolves `var(--livery-purple)` to nothing and
 * paints itself the bare surface colour.
 */
export type Livery = 'violet' | 'green' | 'amber' | 'red' | 'orange' | 'sky' | 'emerald';

/** Resting / raised / overlay, matching `--shadow-elev-{1,2,3}`. */
export type Elevation = 0 | 1 | 2 | 3;

const ELEVATION: Record<Elevation, string> = {
  0: '',
  1: 'shadow-elev-1',
  2: 'shadow-elev-2',
  3: 'shadow-elev-3',
};

/**
 * The custom properties a card hands its own subtree.
 *
 * `--tint` is the one authored value; `.dex-tint` derives surface, subtle,
 * border and ink from it. A card with no livery still gets the class, so a
 * neutral card's `--tint-*` fall back through their own `var()` defaults
 * rather than being a second code path.
 */
const tintStyle = (livery: Livery | undefined, extra?: React.CSSProperties): React.CSSProperties =>
  ({
    ...(livery ? { '--tint': `var(--livery-${livery})` } : null),
    ...extra,
  }) as React.CSSProperties;

export interface CardProps {
  /** The category hue. Omit for a neutral card. */
  livery?: Livery;
  /** Resting depth. 1 is the default because most cards sit on the page. */
  elevation?: Elevation;
  /** Makes the card a `<button>`. A card with an action is a control. */
  onClick?: () => void;
  /** Required when `onClick` is set and the visible content is not a label. */
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * A surface: content on tinted or neutral ground, with a soft edge.
 *
 * Renders a `<div>` normally and a `<button>` when it is given an `onClick`,
 * rather than putting a click handler on a div. That is not a formality — a
 * div with `onClick` is unreachable by keyboard, invisible to a screen reader
 * and is exactly the shape `jsx-a11y` exists to refuse.
 */
export const Card: React.FC<CardProps> = ({
  livery,
  elevation = 1,
  onClick,
  ariaLabel,
  className = '',
  style,
  children,
}) => {
  const surface = livery ? 'bg-[var(--tint-surface)]' : 'bg-[var(--surface-raised)]';
  const shell =
    `dex-tint relative overflow-hidden rounded-card border border-[var(--surface-line)] ` +
    `${surface} ${ELEVATION[elevation]} ${className}`;

  if (!onClick) {
    return (
      <div className={shell} style={tintStyle(livery, style)}>
        {children}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      // `min-h-11` is 44px: WCAG 2.2's target size, and the floor the whole
      // app is held to. A card is free to be taller and may not be shorter.
      className={`dex-pressable min-h-11 text-left ${shell}`}
      style={tintStyle(livery, style)}
    >
      {children}
    </button>
  );
};

export interface TileProps {
  livery: Livery;
  /** The glyph. Sized by the caller; coloured by the chip. */
  icon: React.ReactNode;
  /** One line, in the sans. Never wrapped by a literal line break. */
  label: string;
  /** Optional second line, sentence case. */
  caption?: string;
  onClick: () => void;
  /** Walkthrough anchor: the spotlight cuts its hole from this tile's rect. */
  coachmark?: string;
  /**
   * Escape hatch for a tile that is not a rectangle — `MainMenu`'s dial cuts
   * a concave scoop out of each quadrant with a mask, and supplies its own
   * radius. Nothing else should need it.
   */
  className?: string;
  style?: React.CSSProperties;
  /**
   * The tile is clipped to a shape of its own — the dial's quadrants, which
   * cut a concave scoop out of their inner corner with a `mask-image`.
   *
   * It does two things because they have one cause. A clipped tile drops the
   * card's rectangle and hairline, which would fight the shape; and its focus
   * ring moves **inside**, because a mask clips to the border box and an outer
   * ring is painted outside it — so the keyboard ring on all four dial
   * quadrants would be masked away entirely, which is the kind of thing that
   * is invisible to every gate and to anyone using a mouse.
   */
  clipped?: boolean;
  elevation?: Elevation;
}

/**
 * A big square control: icon in a tinted well, one-line label under it.
 *
 * The label is `<span>` rather than a heading because a tile is a button, and
 * its text is the button's accessible name — which is also why `WHO WE<br/>
 * ARE` had to go beyond looking bad: it made the name "WHO WEARE" in some
 * name-computation paths and left the site suite asserting a string the DOM
 * only accidentally produced.
 *
 * `uppercase` on the label is deliberate and is not the pixel font coming back
 * in another form. A two-word navigation label in Inter 600 with a little
 * tracking reads as the product's voice; a *paragraph* in caps does not, which
 * is why `caption` is `normal-case`. The LCD wrapper uppercases its whole
 * subtree, so the caption has to say so explicitly.
 *
 * See `clipped` for why a masked tile needs its focus ring drawn inside.
 */
export const Tile: React.FC<TileProps> = ({
  livery,
  icon,
  label,
  caption,
  onClick,
  coachmark,
  className = '',
  style,
  clipped = false,
  elevation = 2,
}) => (
  <button
    type="button"
    onClick={onClick}
    data-coachmark={coachmark}
    className={
      `dex-tint dex-pressable group relative flex min-h-11 flex-col items-center justify-center ` +
      `gap-[var(--gap-stack)] overflow-hidden p-[var(--pad-card)] bg-[var(--tint-surface)] ` +
      `${clipped ? 'dex-focus-inset' : 'rounded-card border border-[var(--surface-line)]'} ` +
      `${ELEVATION[elevation]} ${className}`
    }
    style={tintStyle(livery, style)}
  >
    {/* The icon well. The one place the livery appears at strength, and the
        reason the glyph is `--tint-ink` (the hue blended 70% toward the mode's
        text colour) rather than the hue itself: undiluted, the pair measures
        2.20:1 on VINOFD and fails the 3:1 non-text floor. */}
    <span
      aria-hidden="true"
      className={
        'flex items-center justify-center rounded-control bg-[var(--tint-subtle)] ' +
        'text-[var(--tint-ink)] p-2.5 sm:p-3.5 transition-transform duration-200 group-hover:scale-105'
      }
    >
      {icon}
    </span>

    {/* One step up above the `sm` breakpoint. The chassis is a fixed box on a
        desktop window, so the tile gets physically bigger while a fixed 13px
        label does not -- and a label that is 6% of its tile's height reads as
        a caption for something else. */}
    <span className="font-sans text-label sm:text-heading uppercase tracking-wide text-[var(--lcd-text)]">
      {label}
    </span>

    {caption ? (
      <span className="font-sans text-caption normal-case text-[var(--lcd-subtext)]">
        {caption}
      </span>
    ) : null}
  </button>
);

export default Card;
