import React from 'react';

/**
 * The two drawn skin marks, ported from iOS `SkinEmblem.swift` (0.6.7 K1 /
 * 0.7.0 B2, web v0.6.47). Drawn rather than borrowed: the sigil replaced a
 * registered mark that was not ours to ship, and the pumpkin replaces a
 * symbol that is nobody's because no icon set at our floor has one. Both are
 * laid out on a unit square and scaled, so one drawing serves a 17px picker
 * tile as well as anything larger.
 *
 * The props match the lucide call shape (`size`, `strokeWidth`, `style`,
 * `className`) so `SKIN_EMBLEM` can hold either kind of component.
 */
export interface SkinMarkProps {
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * The Vinodex sigil -- a wine glass abstracted to three strokes: a downward
 * triangle for the bowl, a stem dropped from its apex, a foot across the
 * bottom. The bowl's rim is open on purpose: the stroke's own two endpoints
 * are what stop it reading as a plain triangle badge.
 */
export const SkinSigil: React.FC<SkinMarkProps> = ({ size = 17, style, className, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 1 1"
    fill="none"
    stroke="currentColor"
    strokeWidth={0.11}
    strokeLinejoin="round"
    strokeLinecap="round"
    style={style}
    className={className}
    aria-hidden={rest['aria-hidden']}
    focusable="false"
  >
    <path d="M 0.10 0.16 L 0.90 0.16 L 0.50 0.62 Z M 0.50 0.62 L 0.50 0.86 M 0.26 0.88 L 0.74 0.88" />
  </svg>
);

/**
 * A jack-o'-lantern, HALLOWINE's badge. One closed silhouette with the stem
 * built into the outline, then the face as separate subpaths under an
 * even-odd fill -- the eyes, nose and grin are holes, not darker shapes.
 * Slightly wider than tall: the one proportion that stops a pumpkin reading
 * as an apple.
 */
export const SkinPumpkin: React.FC<SkinMarkProps> = ({ size = 17, style, className, ...rest }) => (
  <svg
    width={size * 1.08}
    height={size}
    viewBox="0 0 1 1"
    preserveAspectRatio="none"
    fill="currentColor"
    fillRule="evenodd"
    style={style}
    className={className}
    aria-hidden={rest['aria-hidden']}
    focusable="false"
  >
    <path
      fillRule="evenodd"
      d="M 0.44 0.10 L 0.56 0.04 L 0.58 0.26 C 0.86 0.24 0.99 0.38 0.99 0.60 C 0.99 0.86 0.78 0.99 0.50 0.99 C 0.22 0.99 0.01 0.86 0.01 0.60 C 0.01 0.38 0.14 0.24 0.42 0.26 Z M 0.22 0.46 L 0.40 0.46 L 0.31 0.62 Z M 0.60 0.46 L 0.78 0.46 L 0.69 0.62 Z M 0.44 0.58 L 0.56 0.58 L 0.50 0.68 Z M 0.22 0.74 L 0.34 0.74 L 0.40 0.80 L 0.46 0.74 L 0.54 0.74 L 0.60 0.80 L 0.66 0.74 L 0.78 0.74 C 0.74 0.88 0.64 0.90 0.50 0.90 C 0.36 0.90 0.26 0.88 0.22 0.74 Z"
    />
  </svg>
);
