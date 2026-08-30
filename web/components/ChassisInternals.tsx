import React, { useEffect, useRef, useState } from 'react';

/**
 * The mock circuit board that shows through a translucent chassis — a port of
 * iOS `InternalsView.swift` (v0.9.2), same palette and the same unit-fraction
 * layout so both platforms' clear shells reveal the same board.
 *
 * Drawn once as static SVG. Positions are fractions of the face; part sizes
 * scale with `u = width / 390` exactly as the Canvas version does, so the
 * viewBox is 390 wide and as tall as the mounted face's aspect ratio makes it.
 * Decorative and inert: `aria-hidden`, no pointer events.
 */

const Board = {
  ground: '#14161A',
  substrate: '#166534',
  copper: '#B45309',
  via: '#FBBF24',
  steel: '#9CA3AF',
  steelShade: '#6B7280',
  steelEdge: '#4B5563',
  steelWeld: '#D1D5DB',
  crystalCan: '#C0C5CC',
  package: '#0A0A0A',
  packageDimple: '#3F3F46',
  resistorBody: '#C8A165',
  resistorStripes: ['#7C2D12', '#0A0A0A', '#B45309'],
  coilWinding: '#7C3F0A',
  ribbon: '#475569',
  ribbonConductor: '#CBD5E1',
  connector: '#E7E5E4',
  canBody: '#27272A',
  canTop: '#D4D4D8',
  speakerRings: ['#3F3F46', '#71717A', '#27272A'],
} as const;

// Dex stone ramp, for the screw heads (DeviceBackPlate.screw uses the same).
const STONE = { s200: '#E7E5E4', s400: '#A8A29E', s600: '#57534E', s700: '#44403C', s800: '#292524' } as const;

type Pt = [number, number];

/** Copper traces, each ending in a via dot — coordinates as fractions. */
export const INTERNALS_TRACES: Pt[][] = [
  [[0.10, 0.09], [0.30, 0.09], [0.30, 0.14]],
  [[0.10, 0.12], [0.24, 0.12], [0.24, 0.20]],
  [[0.86, 0.08], [0.66, 0.08], [0.66, 0.13]],
  [[0.90, 0.12], [0.76, 0.12], [0.76, 0.22]],
  [[0.12, 0.30], [0.12, 0.40], [0.30, 0.40]],
  [[0.88, 0.30], [0.88, 0.38], [0.72, 0.38]],
  [[0.40, 0.42], [0.60, 0.42]],
  [[0.18, 0.07], [0.18, 0.10], [0.14, 0.10]],
  [[0.50, 0.07], [0.50, 0.12]],
  [[0.60, 0.30], [0.60, 0.35], [0.52, 0.35]],
  [[0.10, 0.58], [0.26, 0.58], [0.26, 0.64]],
  [[0.90, 0.58], [0.74, 0.58], [0.74, 0.66]],
  [[0.10, 0.90], [0.10, 0.80], [0.22, 0.80]],
  [[0.90, 0.92], [0.90, 0.82], [0.78, 0.82]],
  [[0.34, 0.92], [0.34, 0.86], [0.50, 0.86]],
  [[0.66, 0.92], [0.66, 0.88], [0.56, 0.88]],
  [[0.42, 0.60], [0.58, 0.60]],
  [[0.14, 0.70], [0.14, 0.75], [0.20, 0.75]],
  [[0.86, 0.74], [0.86, 0.78], [0.80, 0.78]],
];

const W = 390;
/** Fallback aspect before the first measurement — the phone chassis. */
const DEFAULT_H = 844;

interface ChassisInternalsProps {
  /** Corner screws at the back plate's inset. The back plate draws its own, so it turns these off. */
  screws?: boolean;
  className?: string;
}

const ChassisInternals: React.FC<ChassisInternalsProps> = ({ screws = true, className = '' }) => {
  const host = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(DEFAULT_H);

  useEffect(() => {
    const el = host.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(entries => {
      const box = entries[0]?.contentRect;
      if (box && box.width > 1 && box.height > 1) setH(Math.round((box.height / box.width) * W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const w = W;
  const u = 1; // w / 390
  const rect = (x: number, y: number, rw: number, rh: number) => ({ x: x * w, y: y * h, width: rw * w, height: rh * h });
  const shield = rect(0.36, 0.56, 0.28, 0.10);
  const ribbon = rect(0.28, 0.455, 0.44, 0.065);
  const crystal = rect(0.70, 0.18, 0.09, 0.025);
  const coil = { cx: 0.72 * w, cy: 0.33 * h, r: 9 * u };
  const cell = { cx: 0.28 * w, cy: 0.88 * h, r: 16 * u };
  const speaker = { cx: 0.52 * w, cy: 0.955 * h };
  const inset = 38 + 13;

  const chip = (x: number, y: number, cw: number, ch: number, key: string) => {
    const body = rect(x, y, cw, ch);
    const pins: React.ReactNode[] = [];
    const pinW = 2 * u;
    const pinH = 4 * u;
    for (let i = 0; i < 5; i++) {
      const px = body.x + (body.width * (i + 0.5)) / 5 - pinW / 2;
      pins.push(<rect key={`t${i}`} x={px} y={body.y - pinH} width={pinW} height={pinH} fill={Board.steel} />);
      pins.push(<rect key={`b${i}`} x={px} y={body.y + body.height} width={pinW} height={pinH} fill={Board.steel} />);
    }
    return (
      <g key={key}>
        {pins}
        <rect x={body.x} y={body.y} width={body.width} height={body.height} rx={2 * u} fill={Board.package} />
        <circle cx={body.x + 4 * u + 2.5 * u} cy={body.y + 4 * u + 2.5 * u} r={2.5 * u} fill={Board.packageDimple} />
      </g>
    );
  };

  const resistor = (x: number, y: number, key: string) => {
    const bx = x * w;
    const by = y * h;
    return (
      <g key={key}>
        <rect x={bx} y={by} width={16 * u} height={6 * u} rx={3 * u} fill={Board.resistorBody} />
        {Board.resistorStripes.map((stripe, i) => (
          <rect key={stripe} x={bx + (3 + i * 4) * u} y={by} width={1.6 * u} height={6 * u} fill={stripe} />
        ))}
      </g>
    );
  };

  const capacitor = (x: number, y: number, key: string) => (
    <g key={key}>
      <circle cx={x * w} cy={y * h} r={7 * u} fill={Board.canBody} />
      <circle cx={x * w} cy={y * h} r={7 * u * 0.55} fill={Board.canTop} />
    </g>
  );

  const screw = (cx: number, cy: number, key: string) => {
    const arm = 9 * 0.707;
    return (
      <g key={key}>
        <circle cx={cx} cy={cy} r={13} fill="url(#internals-screw)" stroke={STONE.s700} strokeWidth={1} />
        <line x1={cx - arm} y1={cy - arm} x2={cx + arm} y2={cy + arm} stroke={STONE.s800} strokeOpacity={0.7} strokeWidth={3} />
      </g>
    );
  };

  return (
    <div ref={host} className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true" data-chassis-internals>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        focusable="false"
      >
        <defs>
          <linearGradient id="internals-shield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={Board.steel} />
            <stop offset="1" stopColor={Board.steelShade} />
          </linearGradient>
          <linearGradient id="internals-screw" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={STONE.s200} />
            <stop offset="0.5" stopColor={STONE.s400} />
            <stop offset="1" stopColor={STONE.s600} />
          </linearGradient>
        </defs>

        {/* Ground, then the two boards */}
        <rect x={0} y={0} width={w} height={h} fill={Board.ground} />
        <rect {...rect(0.06, 0.05, 0.88, 0.39)} rx={8 * u} fill={Board.substrate} data-board />
        <rect {...rect(0.06, 0.53, 0.88, 0.42)} rx={8 * u} fill={Board.substrate} data-board />

        {/* Copper traces with via dots at both ends */}
        {INTERNALS_TRACES.map((pts, i) => {
          const d = pts.map(([x, y], j) => `${j === 0 ? 'M' : 'L'}${x * w} ${y * h}`).join(' ');
          const [sx, sy] = pts[0] ?? [0, 0];
          const [ex, ey] = pts[pts.length - 1] ?? [0, 0];
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={Board.copper} strokeWidth={1.5 * u} data-trace />
              <circle cx={sx * w} cy={sy * h} r={2.2 * u} fill={Board.via} />
              <circle cx={ex * w} cy={ey * h} r={2.2 * u} fill={Board.via} />
            </g>
          );
        })}

        {/* EMI shield can with spot-weld dimples */}
        <rect {...shield} rx={3 * u} fill="url(#internals-shield)" stroke={Board.steelEdge} strokeWidth={1.5 * u} />
        {Array.from({ length: 6 }, (_, i) => (
          <circle key={i} cx={shield.x + (shield.width * (i + 0.5)) / 6} cy={shield.y + 3 * u + 1.6 * u} r={1.6 * u} fill={Board.steelWeld} />
        ))}

        {/* ICs */}
        {chip(0.34, 0.16, 0.32, 0.10, 'soc')}
        {chip(0.14, 0.22, 0.16, 0.06, 'ic2')}
        {chip(0.62, 0.68, 0.22, 0.08, 'ic3')}
        {chip(0.18, 0.68, 0.18, 0.07, 'ic4')}

        {/* Crystal oscillator */}
        <rect {...crystal} rx={crystal.height / 2} fill={Board.crystalCan} stroke={Board.steelShade} strokeWidth={1 * u} />

        {/* Resistors */}
        {resistor(0.55, 0.28, 'r1')}
        {resistor(0.60, 0.31, 'r2')}
        {resistor(0.24, 0.60, 'r3')}
        {resistor(0.52, 0.78, 'r4')}

        {/* Inductor coil */}
        <circle cx={coil.cx} cy={coil.cy} r={coil.r} fill="none" stroke={Board.copper} strokeWidth={3.5 * u} />
        {Array.from({ length: 4 }, (_, i) => {
          const a = (i * Math.PI) / 4 + Math.PI / 8;
          return (
            <line
              key={i}
              x1={coil.cx + Math.cos(a) * coil.r * 0.55}
              y1={coil.cy + Math.sin(a) * coil.r * 0.55}
              x2={coil.cx + Math.cos(a) * coil.r * 1.45}
              y2={coil.cy + Math.sin(a) * coil.r * 1.45}
              stroke={Board.coilWinding}
              strokeWidth={1.2 * u}
            />
          );
        })}

        {/* Ribbon cable across the board seam, with its connector blocks */}
        <rect {...ribbon} rx={3 * u} fill={Board.ribbon} />
        {Array.from({ length: 7 }, (_, i) => {
          const ry = ribbon.y + (ribbon.height * (i + 1)) / 8;
          return <line key={i} x1={ribbon.x + 3 * u} y1={ry} x2={ribbon.x + ribbon.width - 3 * u} y2={ry} stroke={Board.ribbonConductor} strokeOpacity={0.7} strokeWidth={1 * u} />;
        })}
        {[ribbon.x - 6 * u, ribbon.x + ribbon.width].map(cx => (
          <rect key={cx} x={cx} y={ribbon.y - 2 * u} width={6 * u} height={ribbon.height + 4 * u} rx={1.5 * u} fill={Board.connector} />
        ))}

        {/* Electrolytic capacitors */}
        {capacitor(0.20, 0.34, 'c1')}
        {capacitor(0.27, 0.34, 'c2')}
        {capacitor(0.80, 0.28, 'c3')}
        {capacitor(0.44, 0.72, 'c4')}
        {capacitor(0.51, 0.72, 'c5')}
        {capacitor(0.83, 0.88, 'c6')}

        {/* Coin cell with its stamped + */}
        <circle cx={cell.cx} cy={cell.cy} r={cell.r} fill={Board.canTop} stroke={Board.steel} strokeWidth={2 * u} />
        <path d={`M${cell.cx - 5 * u} ${cell.cy} L${cell.cx + 5 * u} ${cell.cy} M${cell.cx} ${cell.cy - 5 * u} L${cell.cx} ${cell.cy + 5 * u}`} stroke={Board.steel} strokeWidth={1.6 * u} fill="none" />

        {/* Speaker magnet, bottom centre where the grille is */}
        {([13, 9, 4.5] as const).map((r, i) => (
          <circle key={r} cx={speaker.cx} cy={speaker.cy} r={r * u} fill={Board.speakerRings[i]} />
        ))}

        {/* Corner screws — the same screws the back plate shows */}
        {screws && screw(inset, inset, 's1')}
        {screws && screw(w - inset, inset, 's2')}
        {screws && screw(inset, h - inset, 's3')}
        {screws && screw(w - inset, h - inset, 's4')}
      </svg>
    </div>
  );
};

export default ChassisInternals;
