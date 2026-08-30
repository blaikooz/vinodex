import React from 'react';
import { Hand } from 'lucide-react';
import pkg from '../../package.json';
import { APP_VERSION_DISPLAY } from '../src/services/appVersion';
import { getAllEntries } from '../src/services/wineData';
import { shelfIds } from '../src/services/bookmarks';
import { bestStreak } from '../src/services/dailyChallenge';
import { highestUnlocked } from '../src/services/quiz';
import { computePassport, type BadgeId } from '../src/services/passport';
import { stampFor } from '../src/services/stampCatalog';
import { skinStickerStem } from '../src/services/skinSticker';
import { useTheme } from '../src/services/useTheme';
import { CHASSIS_SKINS, type ChassisSkin } from '../src/services/theme';
import ChassisInternals from './ChassisInternals';
import ArtImage from './ArtImage';

interface DeviceBackPanelProps {
  onReturn: () => void;
}

// Fixed slot per badge, so an earned stamp keeps its home between flips —
// mirrors DeviceBackPlate.swift's stampSlots.
const STAMP_SLOT: Record<BadgeId, { pos: React.CSSProperties; rot: number; ink: string }> = {
  firstSip: { pos: { top: '17%', left: '7%' }, rot: -12, ink: '#A63838' },
  tenBottles: { pos: { top: '21%', right: '7%' }, rot: 8, ink: '#33518F' },
  allNoble: { pos: { bottom: '25%', right: '9%' }, rot: -7, ink: '#6E4F8F' },
  regionComplete: { pos: { bottom: '29%', left: '7%' }, rot: 10, ink: '#2F6E4F' },
  streakWeek: { pos: { bottom: '13%', right: '13%' }, rot: -15, ink: '#8F5A33' },
  sommelier: { pos: { top: '45%', left: '10%' }, rot: 5, ink: '#2F6E6E' },
  // The two completions sit low on the plate, as on iOS -- in the runs the
  // six above and the factory leavings left free.
  allGrapes: { pos: { top: '57%', right: '6%' }, rot: -9, ink: '#8F3366' },
  allStyles: { pos: { bottom: '18%', left: '34%' }, rot: 11, ink: '#3F6E33' },
};

const PassportStamp: React.FC<{ title: string; ink: string; rot: number; pos: React.CSSProperties }> = ({ title, ink, rot, pos }) => (
  <div
    className="absolute pointer-events-none select-none"
    style={{ ...pos, transform: `rotate(${rot}deg)`, opacity: 0.82 }}
    aria-hidden="true"
  >
    <div
      className="px-2 py-1 rounded-md flex flex-col items-center"
      style={{ border: `2px double ${ink}`, color: ink, WebkitMaskImage: 'linear-gradient(120deg, #000 55%, rgba(0,0,0,0.5))' }}
    >
      <div className="font-retro text-[0.32rem] tracking-widest">· VINODEX PASSPORT ·</div>
      <div className="w-full h-px my-0.5" style={{ backgroundColor: ink }} />
      <div className="font-retro text-[0.5rem] tracking-widest">{title}</div>
      <div className="font-retro text-[0.32rem] tracking-widest mt-0.5">★ ADMITTED ★</div>
    </div>
  </div>
);

const APP_NAME = (pkg.name || 'vinodex').toUpperCase();
const CREATOR = 'HORIZON/GODOT';
const COPYRIGHT_YEAR = new Date().getFullYear();
const SERIAL = `SN: VDX-${COPYRIGHT_YEAR}-001`;

const engravedTextShadow =
  '0 1px 0 rgba(255,255,255,0.55), 0 -1px 0 rgba(0,0,0,0.45), inset 0 0 2px rgba(0,0,0,0.4)';

/**
 * This shell's plate material -- iOS `ChassisSkin.backPlate` (0.7.0 F1).
 *
 * CLASSIC is the exception in both directions: written out in literals,
 * because those literals are the plate as it shipped, and deriving the
 * reference would move the baseline. Every other shell derives: the gradient
 * runs panel-body-body-panel on the same 135deg diagonal the steel sheet
 * does, the edge and the engraving ink are the skin's own panelEdge, the
 * screws turn in the shell's three colours, and the finish follows the
 * *front's* -- OAKED is walnut on both faces, WINE XMAS stays wrapped,
 * STAINLESS keeps its brush -- because a walnut device is walnut front and
 * back or it is two devices. No front treatment means plain moulding, which
 * is what plastic looks like from behind.
 */
interface PlateStyle {
  background: string;
  brushed: boolean;
  patternUrl?: string;
  edge: string;
  ink: string;
  inkDeep: string;
  washFrom: string;
  washTo: string;
  rule: string;
  screw: [string, string, string];
  screwRim: string;
}

const plateStyleFor = (s: ChassisSkin): PlateStyle =>
  s.id === 'CLASSIC'
    ? {
        background: 'linear-gradient(135deg, #cdcfd2 0%, #9ea1a5 35%, #7e8186 60%, #b8babd 100%)',
        brushed: true,
        edge: '#44403c',
        ink: '#44403c',
        inkDeep: '#292524',
        washFrom: 'rgba(120, 113, 108, 0.4)',
        washTo: 'rgba(68, 64, 60, 0.4)',
        rule: 'rgba(41, 37, 36, 0.4)',
        screw: ['#e7e5e4', '#a8a29e', '#57534e'],
        screwRim: '#44403c',
      }
    : {
        background: `linear-gradient(135deg, ${s.panel} 0%, ${s.body} 35%, ${s.body} 60%, ${s.panel} 100%)`,
        brushed: false,
        patternUrl: s.bodyPattern ? `/chassis/${s.bodyPattern}.png` : undefined,
        edge: s.panelEdge,
        ink: s.panelEdge,
        inkDeep: s.panelEdge,
        washFrom: `color-mix(in srgb, ${s.panelEdge} 28%, transparent)`,
        washTo: `color-mix(in srgb, ${s.panelEdge} 45%, transparent)`,
        rule: `color-mix(in srgb, ${s.panelEdge} 40%, transparent)`,
        screw: [s.panel, s.body, s.panelEdge],
        screwRim: s.panelEdge,
      };

const Screw: React.FC<{ className?: string; colors?: [string, string, string]; rim?: string }> = ({
  className = '',
  colors = ['#e7e5e4', '#a8a29e', '#57534e'],
  rim = '#44403c',
}) => (
  <div
    className={`w-4 h-4 md:w-5 md:h-5 rounded-full border shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),inset_0_-1px_2px_rgba(0,0,0,0.5),0_1px_2px_rgba(0,0,0,0.4)] flex items-center justify-center ${className}`}
    style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`, borderColor: rim }}
    aria-hidden="true"
  >
    <div className="w-[70%] h-[1.5px] rounded-full rotate-45" style={{ backgroundColor: `color-mix(in srgb, ${rim} 70%, transparent)` }} />
  </div>
);

const DeviceBackPanel: React.FC<DeviceBackPanelProps> = ({ onReturn }) => {
  // Earned passport stamps ink themselves onto the underside — the device
  // "accumulates a travel record". Read once on flip.
  const earned = React.useMemo(() => {
    const p = computePassport(shelfIds('tried'), getAllEntries(), bestStreak(), highestUnlocked());
    return p.badges.filter(b => b.earned);
  }, []);
  // A clear shell has a clear back too: the board shows through instead of
  // brushed steel, under the same tinted moulding (v0.6.30, iOS
  // `DeviceBackPlate`). Stamps and screws still sit on the outside.
  const skin = CHASSIS_SKINS[useTheme().skin];
  const clear = !!skin.translucent;
  const plate = plateStyleFor(skin);
  return (
    <button
      type="button"
      onClick={onReturn}
      aria-label="Flip device back to front"
      className="w-full h-full md:rounded-[2.5rem] overflow-hidden relative border-[3px] ring-1 ring-white/10 shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.35),inset_10px_10px_30px_rgba(255,255,255,0.08)] cursor-pointer focus:outline-none active:brightness-95 transition"
      style={{
        background: clear ? '#14161A' : plate.background,
        borderColor: clear ? '#44403c' : plate.edge,
      }}
      data-back-clear={clear ? 'on' : undefined}
      data-plate-finish={clear ? 'internals' : plate.patternUrl ? 'pattern' : plate.brushed ? 'brushed' : 'moulded'}
    >
      {clear ? (
        <>
          <ChassisInternals screws={false} />
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ backgroundColor: skin.body }} />
        </>
      ) : (
        <>
          {plate.brushed && (
            /* Brushed metal texture: fine vertical striations */
            <div
              className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, rgba(0,0,0,0.18) 1px, rgba(0,0,0,0.18) 2px)',
              }}
            />
          )}
          {plate.patternUrl && (
            /* The front's own tile, on the back of the same device. */
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: `url(${plate.patternUrl})`, backgroundSize: '96px 96px', opacity: 0.9 }}
            />
          )}

          {/* Subtle radial highlight */}
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              background:
                'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 55%)',
            }}
          />
        </>
      )}

      {/* Passport stamps — one per earned badge, at its fixed slot. */}
      {earned.map(b => {
        const slot = STAMP_SLOT[b.id];
        return <PassportStamp key={b.id} title={stampFor(b.id).title} ink={slot.ink} rot={slot.rot} pos={slot.pos} />;
      })}

      {/* The shell's own aged sticker (iOS 0.6.4 F3, back on the web since
          v0.6.42): the die-cut picture of the fitted skin, stuck to the plate
          the way the real thing ships from the factory -- swapping shells
          swaps the sticker with it. The stem is the skin id's kebab form;
          ORANGE WINE and WINE XMAS have no drawn sticker on either platform
          and simply go without. Decorative: it says what it is by being the
          shell's picture. */}
      {skinStickerStem(skin.id) && (
        <ArtImage
          src={`/art/sticker/${skinStickerStem(skin.id)}.png`}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute pointer-events-none select-none"
          style={{ top: '73%', right: '28%', width: 96, height: 'auto', transform: 'rotate(-7deg)', imageRendering: 'pixelated', opacity: 0.95 }}
        />
      )}

      {/* Corner screws */}
      <Screw className="absolute top-3 left-3 md:top-4 md:left-4" colors={plate.screw} rim={plate.screwRim} />
      <Screw className="absolute top-3 right-3 md:top-4 md:right-4" colors={plate.screw} rim={plate.screwRim} />
      <Screw className="absolute bottom-3 left-3 md:bottom-4 md:left-4" colors={plate.screw} rim={plate.screwRim} />
      <Screw className="absolute bottom-3 right-3 md:bottom-4 md:right-4" colors={plate.screw} rim={plate.screwRim} />

      {/* Factory leavings (mirrors DeviceBackPlate.swift): a faded barcode
          sticker at bottom-left and a torn SALE price tag at top-right — a
          device that has been on a shelf, not in a renderer. Decorative. */}
      <div
        className="absolute bottom-24 left-8 pointer-events-none select-none"
        style={{ transform: 'rotate(-4deg)', opacity: 0.9 }}
        aria-hidden="true"
      >
        <div className="px-2 py-1.5 rounded-[3px] bg-[#E9E6DA] shadow-[0_1px_2px_rgba(0,0,0,0.25)] flex flex-col items-center gap-1">
          <div
            className="h-6 w-24"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0, rgba(0,0,0,0.55) 1px, transparent 1px, transparent 3px, rgba(0,0,0,0.55) 3px, rgba(0,0,0,0.55) 5px, transparent 5px, transparent 6px, rgba(0,0,0,0.55) 6px, rgba(0,0,0,0.55) 9px, transparent 9px, transparent 12px)',
            }}
          />
          <div className="font-mono text-[0.5rem] tracking-[0.2em] text-black/60">4 71332 90815</div>
        </div>
      </div>
      <div
        className="absolute top-20 right-8 pointer-events-none select-none"
        style={{ transform: 'rotate(8deg)', opacity: 0.9 }}
        aria-hidden="true"
      >
        <div
          className="pl-2.5 pr-6 py-1.5 bg-[#F5A8C4] shadow-[0_1px_2px_rgba(0,0,0,0.25)] flex flex-col items-start"
          style={{
            clipPath:
              'polygon(0 0, 92% 0, 84% 18%, 95% 32%, 78% 45%, 90% 60%, 74% 74%, 86% 88%, 70% 100%, 0 100%)',
          }}
        >
          <div className="font-retro text-[0.5rem] tracking-[0.2em]" style={{ color: '#8F2D56' }}>SALE</div>
          <div className="font-mono text-lg leading-none" style={{ color: '#6B1D40' }}>$4.99</div>
        </div>
      </div>

      {/* Engraved content */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-6 py-10 gap-8 font-mono select-none" style={{ color: plate.ink }}>
        {/* Nameplate — recessed */}
        <div
          className="px-8 py-5 rounded-md border border-stone-700/50 bg-gradient-to-b from-stone-500/40 to-stone-700/40 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.5)] flex flex-col items-center"
        >
          <div
            className="font-retro text-[2rem] md:text-[2.5rem] tracking-[0.25em] leading-none"
            style={{ color: plate.inkDeep, textShadow: engravedTextShadow }}
          >
            {APP_NAME}
          </div>
          <div
            className="mt-2 text-base md:text-lg tracking-[0.5em]"
            style={{ textShadow: engravedTextShadow }}
          >
            {APP_VERSION_DISPLAY}
          </div>
        </div>

        {/* Divider */}
        <div className="w-2/3 h-px shadow-[0_1px_0_rgba(255,255,255,0.4)]" style={{ backgroundImage: `linear-gradient(to right, transparent, ${plate.rule}, transparent)` }} />

        {/* Spec / serial / copyright block */}
        <div className="flex flex-col items-center gap-2.5 text-sm md:text-base tracking-[0.25em]">
          <div style={{ textShadow: engravedTextShadow }}>{SERIAL}</div>
          <div style={{ textShadow: engravedTextShadow }}>
            &copy; {COPYRIGHT_YEAR} {CREATOR}
          </div>
          <div style={{ textShadow: engravedTextShadow }}>ALL RIGHTS RESERVED</div>
        </div>

        {/* Return hint */}
        <div style={{ color: `color-mix(in srgb, ${plate.inkDeep} 80%, transparent)` }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm md:text-base tracking-[0.4em] animate-pulse">
          <Hand aria-hidden="true" size={18} strokeWidth={2} />
          <span style={{ textShadow: engravedTextShadow }}>TAP TO RETURN</span>
        </div>
      </div>
    </button>
  );
};

export default DeviceBackPanel;
