import React, { useEffect, useRef, useState } from 'react';

/**
 * The growth curve on the DATA panel, ported from `DataWave` in
 * `vinodex-ios/Sources/VinodexUI/SettingsPanel.swift`.
 *
 * A sweep rather than a static chart: the counter and the curve are rendered
 * from the same value, so the number climbing to the total *is* the line being
 * drawn. The Swift version drives this from a `TimelineView` clock; the web
 * equivalent is `requestAnimationFrame`, and it stops itself once the sweep is
 * done rather than repainting the panel forever.
 *
 * The milestone track is eased between stops with a smoothstep rather than
 * interpolated linearly, so the curve arcs into each milestone instead of
 * turning a hard corner at it — the difference between a wave and a zigzag.
 */

/** The value along the milestone track at `f` in 0...1. */
export function dataWaveValue(f: number, points: number[]): number {
  const first = points[0];
  if (first === undefined) return 0;
  if (points.length < 2) return first;

  const clamped = Math.min(Math.max(f, 0), 1);
  const scaled = clamped * (points.length - 1);
  const index = Math.min(Math.floor(scaled), points.length - 2);
  const local = scaled - index;
  const eased = local * local * (3 - 2 * local);

  const a = points[index]!;
  const b = points[index + 1]!;
  return a + (b - a) * eased;
}

const DURATION_MS = 2600;
const STEPS = 140;

const VB_H = 96;
const TOP = 8;
const BASELINE = VB_H - 8;
const USABLE = BASELINE - TOP;

interface DataWaveProps {
  milestones: number[];
}

const DataWave: React.FC<DataWaveProps> = ({ milestones }) => {
  const [p, setP] = useState(0);
  const frame = useRef<number | null>(null);

  /*
    The viewBox is measured rather than fixed, so one unit is one pixel and the
    head dot stays a circle. With a fixed viewBox the sweep would need
    `preserveAspectRatio="none"` to fill the panel, and that stretches the x
    axis — which is harmless for the curve but turns the dot into an ellipse at
    every width except one.
  */
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [vbW, setVbW] = useState(300);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => setVbW(Math.max(host.clientWidth, 1));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // Decorative motion, so anyone who has asked for less of it gets the
    // settled frame immediately rather than a 2.6s sweep.
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setP(1);
      return;
    }

    const started = performance.now();
    const tick = (now: number) => {
      const linear = Math.min(Math.max((now - started) / DURATION_MS, 0), 1);
      // Eased so the sweep settles into the total instead of running at full
      // speed and stopping dead on the last frame.
      setP(linear * linear * (3 - 2 * linear));
      if (linear < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [milestones]);

  const peak = Math.max(...milestones, 0);
  const current = Math.round(dataWaveValue(p, milestones));

  // Never exactly zero: a zero-width sweep produces a degenerate path that
  // renders as a stray dot at the origin.
  const visible = Math.min(Math.max(p, 0.0001), 1);

  const pointAt = (f: number): [number, number] => {
    if (peak <= 0) return [f * vbW, BASELINE];
    const v = dataWaveValue(f, milestones) / peak;
    // The ripple scales with the value so the flat empty start does not wobble
    // below its own axis.
    const ripple = Math.sin(f * 13 + p * 5) * 0.03 * v;
    const height = Math.min(Math.max(v + ripple, 0), 1);
    return [f * vbW, BASELINE - height * USABLE];
  };

  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= STEPS; i++) {
    pts.push(pointAt((i / STEPS) * visible));
  }

  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `M0,${BASELINE} ${pts
    .map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')} L${(visible * vbW).toFixed(2)},${BASELINE} Z`;

  const [headX, headY] = pointAt(visible);

  return (
    <div ref={hostRef} className="flex flex-col gap-2 w-full">
      <span className="font-retro text-xl" style={{ color: 'var(--lcd-accent)' }}>
        {current}
      </span>

      <svg
        viewBox={`0 0 ${vbW} ${VB_H}`}
        width={vbW}
        height={VB_H}
        className="w-full"
        style={{ height: '6rem' }}
        role="img"
        aria-label={`Growth curve: ${milestones.join(' to ')} entries`}
      >
        <defs>
          <linearGradient id="dataWaveFill" x1="0" y1={TOP} x2="0" y2={BASELINE} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--lcd-accent)" stopOpacity="0.42" />
            <stop offset="100%" stopColor="var(--lcd-accent)" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Axis first, so the fill sits over it rather than cutting it. */}
        <line
          x1="0"
          y1={BASELINE}
          x2={vbW}
          y2={BASELINE}
          stroke="var(--lcd-accent)"
          strokeOpacity="0.3"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path d={area} fill="url(#dataWaveFill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--lcd-accent)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        {/* The head of the sweep. Round because the viewBox is measured in
            pixels — see the note on `vbW`. */}
        <circle cx={headX} cy={headY} r="4" fill="var(--lcd-accent)" />
      </svg>

      {/*
        Milestone values under the curve, pinned to the ends so the first and
        last sit over the points they label rather than floating inward.
      */}
      <div className="flex w-full">
        {milestones.map((value, index) => (
          <span
            key={index}
            className="flex-1 font-mono text-xs"
            style={{
              color: 'var(--lcd-subtext)',
              textAlign: index === 0 ? 'left' : index === milestones.length - 1 ? 'right' : 'center',
            }}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DataWave;
