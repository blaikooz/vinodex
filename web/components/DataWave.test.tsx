import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import DataWave, { dataWaveValue } from './DataWave';

/**
 * The growth curve's maths, and that the component settles on the total.
 *
 * `dataWaveValue` is exported for this: the curve, the counter and the legend
 * all read from it, so if the easing is wrong the whole panel is wrong in a way
 * that looks plausible. The Swift original has no test — `VinodexUI` has no test
 * target — so these are written against what its comments promise.
 */
const MILESTONES = [0, 25, 186, 357];

describe('dataWaveValue', () => {
  it('starts at the first milestone and ends at the last', () => {
    expect(dataWaveValue(0, MILESTONES)).toBe(0);
    expect(dataWaveValue(1, MILESTONES)).toBe(357);
  });

  it('passes exactly through every milestone', () => {
    MILESTONES.forEach((value, index) => {
      const f = index / (MILESTONES.length - 1);
      expect(dataWaveValue(f, MILESTONES)).toBeCloseTo(value, 6);
    });
  });

  it('never goes backwards across the sweep', () => {
    let previous = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const v = dataWaveValue(i / 200, MILESTONES);
      expect(v).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = v;
    }
  });

  it('stays within the milestone range', () => {
    for (let i = 0; i <= 200; i++) {
      const v = dataWaveValue(i / 200, MILESTONES);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(357);
    }
  });

  /**
   * Smoothstep, not linear: the curve should arc into each milestone rather
   * than turn a hard corner at it. Halfway between two stops the eased value
   * equals the linear midpoint, but the approach into it is flatter — so just
   * past a milestone the eased value trails the linear one.
   */
  it('eases between stops rather than interpolating linearly', () => {
    const mid = dataWaveValue(1 / 6, [0, 100, 200, 300]); // a sixth = halfway into leg 1
    expect(mid).toBeCloseTo(50, 6);

    const quarterIn = dataWaveValue(1 / 12, [0, 100, 200, 300]);
    expect(quarterIn).toBeLessThan(25);
  });

  it('clamps outside 0..1', () => {
    expect(dataWaveValue(-1, MILESTONES)).toBe(0);
    expect(dataWaveValue(2, MILESTONES)).toBe(357);
  });

  describe('degenerate inputs', () => {
    it('returns zero for an empty track', () => {
      expect(dataWaveValue(0.5, [])).toBe(0);
    });

    it('returns the only value for a single-point track', () => {
      expect(dataWaveValue(0.5, [42])).toBe(42);
    });

    it('handles a flat track', () => {
      expect(dataWaveValue(0.5, [10, 10, 10])).toBe(10);
    });
  });
});

describe('<DataWave />', () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * jsdom reports no `prefers-reduced-motion` match by default, but it also
   * never fires `requestAnimationFrame` callbacks on a schedule the test can
   * wait on — so what is pinned here is the structure and the legend, which do
   * not depend on the sweep having advanced.
   */
  it('labels itself and lists every milestone', () => {
    render(<DataWave milestones={MILESTONES} />);

    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('357');
    for (const value of MILESTONES) {
      expect(screen.getAllByText(String(value)).length).toBeGreaterThan(0);
    }
  });

  it('survives a single-milestone track without throwing', () => {
    expect(() => render(<DataWave milestones={[7]} />)).not.toThrow();
  });

  it('survives an all-zero track without throwing', () => {
    // peak === 0 is the guard the Swift Canvas has; without it the curve
    // divides by zero and every point becomes NaN.
    expect(() => render(<DataWave milestones={[0, 0]} />)).not.toThrow();
  });
});
