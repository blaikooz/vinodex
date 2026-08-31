/**
 * First-party copy experiments (Phase 4, v0.6.51).
 *
 * **Per-pageload assignment, stored nowhere.** The privacy page promises "no
 * identifiers, nothing stored on your device" about the counting machinery,
 * and a persisted bucket is exactly the kind of thing that promise is about.
 * So a visit draws its variant at page load and forgets it on the way out.
 * For same-session copy tests -- does this wording earn more taps than that
 * one, between landing-view and substack-tap -- per-visit assignment is the
 * statistics anyway; only cross-session experiments would need more, and we
 * are not running any.
 *
 * **A closed table.** Variants are authored here, named here, and the ids
 * ride analytics as a closed-set `variant` prop -- the same rule `source`
 * follows: nothing user-authored, ever. An experiment ends by being deleted
 * from this table; the winning copy moves into the component.
 */

export interface Experiment {
  /** The analytics dimension. Short, kebab, stable for the run's lifetime. */
  id: string;
  /** Variant id -> the copy under test. 'a' is the shipped control. */
  variants: Record<string, string>;
}

/**
 * The live experiments. One for now: the landing's Substack nudge line
 * (v0.6.16's "quiet footnote to the pitch"). Control is the shipped wording;
 * B asks with the studio's voice instead of the product's.
 */
export const EXPERIMENTS = {
  'landing-nudge': {
    id: 'landing-nudge',
    variants: {
      a: 'GET iOS UPDATES',
      b: 'FOLLOW THE BUILD',
    },
  },
} as const satisfies Record<string, Experiment>;

export type ExperimentId = keyof typeof EXPERIMENTS;

/** `<experiment>:<variant>`, the closed vocabulary the beacon may carry. */
export type VariantTag = {
  [K in ExperimentId]: `${K}:${string & keyof (typeof EXPERIMENTS)[K]['variants']}`;
}[ExperimentId];

const drawn = new Map<ExperimentId, string>();

/**
 * This pageload's variant for an experiment -- drawn once, then stable for
 * the life of the page so the copy cannot flicker between renders.
 */
export function variantFor(id: ExperimentId): string {
  let v = drawn.get(id);
  if (!v) {
    const keys = Object.keys(EXPERIMENTS[id].variants);
    v = keys[Math.floor(Math.random() * keys.length)] ?? keys[0]!;
    drawn.set(id, v);
  }
  return v;
}

/** The copy the drawn variant authors. */
export const experimentCopy = (id: ExperimentId): string =>
  (EXPERIMENTS[id].variants as Record<string, string>)[variantFor(id)]!;

/** The tag the beacon carries for the drawn variant. */
export const variantTag = (id: ExperimentId): VariantTag =>
  `${id}:${variantFor(id)}` as VariantTag;

/** Test seam: forget this pageload's draws. */
export const resetExperiments = (): void => drawn.clear();
