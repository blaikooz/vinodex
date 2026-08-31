import { beforeEach, describe, expect, it } from 'vitest';
import { EXPERIMENTS, experimentCopy, resetExperiments, variantFor, variantTag } from './experiment';

/** Per-pageload draws from a closed table; nothing stored (v0.6.51). */
beforeEach(resetExperiments);

describe('experiments', () => {
  it('draws once per pageload and stays stable', () => {
    const first = variantFor('landing-nudge');
    for (let i = 0; i < 20; i++) expect(variantFor('landing-nudge')).toBe(first);
    expect(Object.keys(EXPERIMENTS['landing-nudge'].variants)).toContain(first);
  });

  it('reaches every variant across pageloads', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200 && seen.size < 2; i++) {
      resetExperiments();
      seen.add(variantFor('landing-nudge'));
    }
    expect(seen.size).toBe(2);
  });

  it('authors copy and a closed-vocabulary tag from the same draw', () => {
    const v = variantFor('landing-nudge');
    expect(experimentCopy('landing-nudge')).toBe(EXPERIMENTS['landing-nudge'].variants[v as 'a' | 'b']);
    expect(variantTag('landing-nudge')).toBe(`landing-nudge:${v}`);
  });

  it('stores nothing on the device', () => {
    variantFor('landing-nudge');
    expect(window.localStorage.length).toBe(0);
  });
});
