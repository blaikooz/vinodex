import { afterEach, describe, expect, it } from 'vitest';
import {
  DEMO_STOPS,
  demoCycleSeconds,
  demoStopAt,
  isDemoActive,
  startDemo,
  stopDemo,
} from './demoMode';

/** Ported from the tour-shape cases of the iOS DemoMode coverage. */
describe('demo mode', () => {
  afterEach(() => stopDemo());

  it('the four screens the spec names lead, in its order', () => {
    expect(DEMO_STOPS.slice(0, 4).map(s => s.path)).toEqual([
      '/scanner',
      '/retro-globe',
      '/list/GRAPES',
      '/passport',
    ]);
  });

  it('the globe dwells longest — it is the one stop that animates on its own', () => {
    const globe = DEMO_STOPS.find(s => s.path === '/retro-globe')!;
    for (const stop of DEMO_STOPS) expect(stop.dwell).toBeLessThanOrEqual(globe.dwell);
  });

  it('the cycle is the sum of the dwells', () => {
    expect(demoCycleSeconds()).toBeCloseTo(DEMO_STOPS.reduce((s, x) => s + x.dwell, 0));
  });

  it('the counter wraps and floors at zero', () => {
    expect(demoStopAt(0)).toBe(DEMO_STOPS[0]);
    expect(demoStopAt(DEMO_STOPS.length)).toBe(DEMO_STOPS[0]);
    expect(demoStopAt(DEMO_STOPS.length + 2)).toBe(DEMO_STOPS[2]);
    expect(demoStopAt(-5)).toBe(DEMO_STOPS[0]);
  });

  it('every stop dwells long enough to be seen and no stop repeats a path', () => {
    const paths = DEMO_STOPS.map(s => s.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const stop of DEMO_STOPS) expect(stop.dwell).toBeGreaterThanOrEqual(3);
  });

  it('the switch flips and notifies', () => {
    expect(isDemoActive()).toBe(false);
    startDemo();
    expect(isDemoActive()).toBe(true);
    stopDemo();
    expect(isDemoActive()).toBe(false);
  });
});
