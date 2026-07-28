import React, { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import {
  BiodynamicElement,
  MoonReading,
  getHourlyReadings,
  getMoonReading,
} from '../src/services/moonService';

interface MoonDialScreenProps {
  onBack: () => void;
  onHome: () => void;
}

type DialMode = 'DAY' | 'WEEK';

// Element → retro LCD palette
const ELEMENT_FILL: Record<BiodynamicElement, string> = {
  fruit: '#ef4444',   // red — wine day
  flower: '#f59e0b',  // amber
  leaf: '#22c55e',    // green
  root: '#a16207',    // copper/brown
};
const NODE_FILL = '#475569'; // slate — suppressed
const ELEMENT_LABEL: Record<BiodynamicElement, string> = {
  fruit: 'FRUIT', flower: 'FLOWER', leaf: 'LEAF', root: 'ROOT',
};
const ELEMENT_BOTANICAL: Record<BiodynamicElement, string> = {
  fruit: 'game-icons:grapes',
  flower: 'game-icons:lily-flower',
  leaf: 'game-icons:linden-leaf',
  root: 'game-icons:plant-roots',
};

// SVG geometry — viewBox 360 with comfortable padding so labels never clip
const VB = 360;
const C = VB / 2;
const R_OUTER = 142;
const R_INNER = 108;
const R_LABEL = 162;
const POINTER_R = R_INNER - 4;

const DAY_LABELS = ['MIDNIGHT', '3AM', '6AM', '9AM', 'NOON', '3PM', '6PM', '9PM'];
const WEEK_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface Segment {
  startDeg: number;
  endDeg: number;
  fill: string;
  suppressed: boolean;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(rOuter: number, rInner: number, startDeg: number, endDeg: number) {
  const p1 = polar(C, C, rOuter, startDeg);
  const p2 = polar(C, C, rOuter, endDeg);
  const p3 = polar(C, C, rInner, endDeg);
  const p4 = polar(C, C, rInner, startDeg);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

// Group consecutive equal readings into variable-length wedges. The "value"
// is the (element, suppressed) pair so node-suppressed runs split out.
function groupSegments(
  readings: MoonReading[],
  startDeg: number,
  totalDeg: number,
): Segment[] {
  const out: Segment[] = [];
  const slice = totalDeg / readings.length;
  let i = 0;
  while (i < readings.length) {
    const current = readings[i]!;
    let j = i + 1;
    while (
      j < readings.length &&
      readings[j]!.element === current.element &&
      readings[j]!.nodeSuppressed === current.nodeSuppressed
    ) j++;
    out.push({
      startDeg: startDeg + i * slice,
      endDeg: startDeg + j * slice,
      fill: current.nodeSuppressed ? NODE_FILL : ELEMENT_FILL[current.element],
      suppressed: current.nodeSuppressed,
    });
    i = j;
  }
  return out;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Returns the Monday on or before `d`, at midnight.
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const dow = x.getDay(); // 0=Sun..6=Sat
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + offset);
  return x;
}

function fmtMonth(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'long' }).toUpperCase();
}
function fmtWeekday(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
}
function fmtTime(d: Date) {
  return d
    .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    .toUpperCase();
}

const MoonDialScreen: React.FC<MoonDialScreenProps> = ({ onBack, onHome }) => {
  const [mode, setMode] = useState<DialMode>('DAY');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const now = useMemo(() => new Date(), []);

  // Reading for the giant YES/NO is always "right now", regardless of which
  // day/week the user is browsing.
  const liveReading = useMemo(() => getMoonReading(now), [now]);
  const isLive = mode === 'DAY'
    ? startOfDay(anchor).getTime() === startOfDay(now).getTime()
    : startOfWeek(anchor).getTime() === startOfWeek(now).getTime();

  // Center text always reflects the *anchor* time so the user can preview
  // other days. The YES/NO follows the live reading only when isLive.
  const anchorReading = useMemo(() => getMoonReading(anchor), [anchor]);
  const verdictReading = isLive ? liveReading : anchorReading;
  const showYes = verdictReading.element === 'fruit' && !verdictReading.nodeSuppressed;

  const segments = useMemo<Segment[]>(() => {
    if (mode === 'DAY') {
      const readings = getHourlyReadings(startOfDay(anchor), 24);
      return groupSegments(readings, -90, 360); // start at top (midnight)
    }
    // WEEK: 7 daily readings; sample every 3 hours for finer transitions
    const start = startOfWeek(anchor);
    const readings = getHourlyReadings(start, 7 * 24).filter((_, i) => i % 3 === 0);
    return groupSegments(readings, -90 - (360 / 7) / 2, 360);
  }, [mode, anchor]);

  // Pointer angle
  const pointerAngle = useMemo(() => {
    if (mode === 'DAY') {
      const dayStart = startOfDay(anchor).getTime();
      const ref = isLive ? now : anchor;
      const hours = (ref.getTime() - dayStart) / 3_600_000;
      return -90 + (hours / 24) * 360;
    }
    const weekStart = startOfWeek(anchor).getTime();
    const ref = isLive ? now : anchor;
    const days = (ref.getTime() - weekStart) / 86_400_000;
    // Week starts at -90 - half-segment (so MON sits at top)
    return -90 - (360 / 7) / 2 + (days / 7) * 360;
  }, [mode, anchor, isLive, now]);

  const navigate = (dir: -1 | 1) => {
    setAnchor(prev => {
      const next = new Date(prev);
      if (mode === 'DAY') next.setDate(next.getDate() + dir);
      else next.setDate(next.getDate() + dir * 7);
      return next;
    });
  };

  // Header text per mode
  const headerEl = mode === 'DAY' ? (
    <div className="flex flex-col items-center leading-tight">
      <span className="font-retro text-green-300 text-[20px] tracking-widest">{fmtWeekday(anchor)}</span>
      <span className="font-retro text-green-200 text-[15px] tracking-widest mt-1">
        {anchor.getDate()} {fmtMonth(anchor)}
      </span>
    </div>
  ) : (
    <div className="flex items-center gap-4 leading-tight">
      <div className="flex flex-col items-center">
        <span className="font-retro text-green-200 text-[15px] tracking-widest">
          {startOfWeek(anchor).getDate()} {fmtMonth(startOfWeek(anchor))}
        </span>
        <span className="font-retro text-green-400 text-[12px] tracking-widest mt-1">MONDAY</span>
      </div>
      <span className="font-retro text-green-500 text-[15px]">—</span>
      <div className="flex flex-col items-center">
        <span className="font-retro text-green-200 text-[15px] tracking-widest">
          {(() => { const e = new Date(startOfWeek(anchor)); e.setDate(e.getDate() + 6); return `${e.getDate()} ${fmtMonth(e)}`; })()}
        </span>
        <span className="font-retro text-green-400 text-[12px] tracking-widest mt-1">SUNDAY</span>
      </div>
    </div>
  );

  const labels = mode === 'DAY' ? DAY_LABELS : WEEK_LABELS;
  const labelStartDeg = mode === 'DAY' ? -90 : -90;
  const labelStep = mode === 'DAY' ? 45 : 360 / 7;

  return (
    <DeviceLayout
      title="MOON DIAL"
      subtitle="BIODYNAMIC SCAN"
      onBack={onBack}
      onHome={onHome}
      showBack
      centerHeaderText
    >
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-between bg-dex-screen relative overflow-hidden px-3 py-3 gap-2">
        {/* Retro grid backdrop */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(50, 255, 50, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 255, 50, 0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Date nav */}
        <div className="z-10 w-full flex items-center justify-between px-1 shrink-0">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-green-600 bg-black/50 text-green-300 active:scale-95 hover:bg-black/70 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 flex justify-center">{headerEl}</div>
          <button
            type="button"
            aria-label="Next"
            onClick={() => navigate(1)}
            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-green-600 bg-black/50 text-green-300 active:scale-95 hover:bg-black/70 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Dial */}
        <div className="relative z-10 w-full flex-1 min-h-0 flex items-center justify-center">
         <div className="relative w-full max-w-[26rem] aspect-square mx-auto">
          <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-full drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            {/* Outer subtle glow */}
            <circle cx={C} cy={C} r={R_OUTER + 4} fill="none" stroke="rgba(34,197,94,0.25)" strokeWidth={1} />

            {/* Wedges */}
            {segments.map((s, i) => (
              <path
                key={i}
                d={arcPath(R_OUTER, R_INNER, s.startDeg, s.endDeg)}
                fill={s.fill}
                fillOpacity={s.suppressed ? 0.55 : 0.92}
                stroke="#0a0a0a"
                strokeWidth={1}
              />
            ))}

            {/* Suppressed-window cross-hatch (Iconify ⊘ glyph) */}
            {segments.filter(s => s.suppressed).map((s, i) => {
              const mid = (s.startDeg + s.endDeg) / 2;
              const { x, y } = polar(C, C, (R_OUTER + R_INNER) / 2, mid);
              return (
                <foreignObject key={`sup-${i}`} x={x - 8} y={y - 8} width={16} height={16} className="pointer-events-none">
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-white/80">⊘</div>
                </foreignObject>
              );
            })}

            {/* Spoke labels (curved baseline along R_LABEL via simple path text) */}
            {labels.map((label, i) => {
              const angle = labelStartDeg + i * labelStep;
              const { x, y } = polar(C, C, R_LABEL, angle);
              // Rotate text so it sits tangent-ish but stays readable upright when near top
              const rotate = angle + 90;
              const upright = rotate > 90 && rotate < 270 ? rotate + 180 : rotate;
              return (
                <text
                  key={label}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-retro"
                  fontSize={mode === 'DAY' ? 10 : 11}
                  fill="#bbf7d0"
                  letterSpacing={1}
                  transform={`rotate(${upright} ${x} ${y})`}
                >
                  {label}
                </text>
              );
            })}

            {/* Inner disk */}
            <circle cx={C} cy={C} r={R_INNER - 6} fill="#0a0a0a" stroke="#1f2937" strokeWidth={1.5} />

            {/* Pointer */}
            {(() => {
              const tip = polar(C, C, POINTER_R, pointerAngle);
              return (
                <g>
                  <circle cx={tip.x} cy={tip.y} r={7} fill="#fde047" stroke="#78350f" strokeWidth={2}
                          className="drop-shadow-[0_0_4px_rgba(253,224,71,0.9)]" />
                  <circle cx={tip.x} cy={tip.y} r={2.5} fill="#1c1917" />
                </g>
              );
            })()}

            {/* Centre stack */}
            <text x={C} y={C - 70} textAnchor="middle" className="font-retro" fontSize={11} fill="#86efac" letterSpacing={3}>
              DRINK?
            </text>
            <text x={C} y={C - 28} textAnchor="middle" className="font-retro" fontSize={40} fill={showYes ? '#ef4444' : '#94a3b8'} letterSpacing={2}>
              {showYes ? 'YES' : 'NO'}
            </text>

            {/* Element botanicals + wine glass */}
            <foreignObject x={C - 70} y={C - 14} width={48} height={48} className="pointer-events-none">
              <div className="w-full h-full flex items-center justify-center opacity-50">
                <Icon icon={ELEMENT_BOTANICAL[verdictReading.element]} width={42} height={42} color={ELEMENT_FILL[verdictReading.element]} />
              </div>
            </foreignObject>
            <foreignObject x={C - 26} y={C - 18} width={52} height={52} className="pointer-events-none">
              <div className="w-full h-full flex items-center justify-center">
                <Icon icon="game-icons:wine-glass" width={48} height={48} color={showYes ? '#fde047' : '#64748b'} />
              </div>
            </foreignObject>
            <foreignObject x={C + 22} y={C - 14} width={48} height={48} className="pointer-events-none">
              <div className="w-full h-full flex items-center justify-center opacity-50">
                <Icon icon={ELEMENT_BOTANICAL[verdictReading.element]} width={42} height={42} color={ELEMENT_FILL[verdictReading.element]} />
              </div>
            </foreignObject>

            {/* Element label (always shows underlying element) + optional NODE badge + time */}
            <text x={C} y={C + 50} textAnchor="middle" className="font-retro" fontSize={12}
                  fill={ELEMENT_FILL[verdictReading.element]} letterSpacing={3}>
              {ELEMENT_LABEL[verdictReading.element]}
              {verdictReading.nodeSuppressed ? (
                <tspan dx={6} fill="#94a3b8" fontSize={10}>⊘ NODE</tspan>
              ) : null}
            </text>
            <text x={C} y={C + 66} textAnchor="middle" className="font-retro" fontSize={10} fill="#bbf7d0" letterSpacing={2}>
              {fmtTime(isLive ? now : anchor)}
            </text>
          </svg>
         </div>
        </div>

        {/* DAY / WEEK toggle */}
        <div className="z-10 shrink-0 flex items-center gap-2 bg-black/70 border-2 border-green-600 rounded-lg p-1.5 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
          {(['DAY', 'WEEK'] as DialMode[]).map(m => {
            const active = m === mode;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-7 py-2 rounded-md font-retro text-[13px] tracking-widest transition-colors ${
                  active
                    ? 'bg-green-500 text-black shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]'
                    : 'text-green-300 hover:bg-green-900/40'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
    </DeviceLayout>
  );
};

export default MoonDialScreen;
