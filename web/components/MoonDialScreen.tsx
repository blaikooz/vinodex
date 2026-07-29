import React, { useMemo } from 'react';
import { Apple, BadgeCheck, Flower2, Hand, Leaf, Mountain } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import {
  MoonDay,
  MOON_DAYS,
  isGoodForDrinking,
  moonDay,
  moonElement,
  moonQuote,
  moonSummary,
  moonVerdict,
  zodiacName,
} from '../src/services/moonService';

interface MoonDialScreenProps {
  onBack: () => void;
  onHome: () => void;
  /** Injectable so the screen can be tested on a fixed day. */
  now?: Date;
}

/**
 * The moon dial: today's date, what kind of day it is, whether that is a good
 * day to drink, and a line about it.
 *
 * Ported from `vinodex-ios/Sources/VinodexUI/MoonDialScreen.swift`, replacing
 * the draggable version that used to live here. The Swift file explains why,
 * and it is about this file specifically:
 *
 * > Deliberately a readout with no interaction. The web reference
 * > (`MoonDialScreen.tsx`) drove a draggable dial through the lunar month,
 * > which is a lot of machinery in front of a single fact — the only thing
 * > anyone wants from it is whether tonight is a good night.
 *
 * So the dial is now an illustration of the answer rather than a control: a
 * ring, four ticks with today's lit, and the day's glyph in the middle. The
 * hourly sampling, the week/day toggle and the sidereal node window are all
 * gone with it — see `moonService`.
 */

/** iOS picks an SF Symbol per day type; these are the lucide equivalents. */
const DAY_GLYPH: Record<MoonDay, React.ComponentType<{ size?: number; className?: string }>> = {
  FRUIT: Apple,
  FLOWER: Flower2,
  LEAF: Leaf,
  ROOT: Mountain,
};

const MoonDialScreen: React.FC<MoonDialScreenProps> = ({ onBack, onHome, now }) => {
  // Captured once so the screen cannot change under the reader if it is left
  // open across midnight — and so every value below agrees with every other.
  const today = useMemo(() => now ?? new Date(), [now]);

  const day = moonDay(today);
  const good = isGoodForDrinking(day);
  const Glyph = DAY_GLYPH[day];

  /**
   * Green when the calendar says yes, amber when it says no. The tint carries
   * the verdict everywhere on the screen, so the answer is legible before any
   * of the words are read.
   */
  const tint = good ? 'text-green-400' : 'text-amber-400';
  const tintBorder = good ? 'border-green-400' : 'border-amber-400';
  const tintBg = good ? 'bg-green-400' : 'bg-amber-400';

  const dateLine = today
    .toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase();

  const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-baseline gap-2.5">
      <span className="font-retro text-[0.55rem] tracking-widest text-green-500">{label}</span>
      <span className="flex-1 min-w-0" />
      <span className="font-retro text-[0.7rem] tracking-widest text-green-300 truncate">{value}</span>
    </div>
  );

  return (
    <DeviceLayout
      title="MOON DIAL"
      subtitle="BIODYNAMIC SCAN"
      onBack={onBack}
      onHome={onHome}
      showBack
      centerHeaderText
    >
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-stone-950 p-4">
        <div className="flex flex-col items-center gap-4">

          <span className="font-retro text-[0.55rem] tracking-widest text-green-500 text-center leading-relaxed">
            {dateLine}
          </span>

          {/* The illustration: the day's glyph in a ring tinted by the verdict. */}
          <div className="relative w-[150px] h-[150px] shrink-0">
            <div className={`absolute inset-0 rounded-full border-[3px] ${tintBorder} opacity-35`} />

            {/*
              Four ticks, one per day type, with today's lit. Enough to say
              "this is a cycle and you are here" without being a control.
            */}
            {MOON_DAYS.map((mark, index) => {
              const isToday = mark === day;
              const size = isToday ? 12 : 7;
              return (
                <span
                  key={mark}
                  aria-hidden="true"
                  className={`absolute left-1/2 top-1/2 rounded-full ${
                    isToday ? tintBg : 'bg-green-700 opacity-40'
                  }`}
                  style={{
                    width: size,
                    height: size,
                    transform: `translate(-50%, -50%) rotate(${(index / MOON_DAYS.length) * 360}deg) translateY(-75px)`,
                  }}
                />
              );
            })}

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              <Glyph size={40} className={tint} />
              <span className="font-retro text-base tracking-[0.2em] text-green-300">{day}</span>
            </div>
          </div>

          {/* The three-line readout. */}
          <div
            className="w-full rounded-lg border border-green-800 bg-stone-900 px-3 py-3 flex flex-col gap-2"
          >
            <Row label="DAY TYPE" value={`${day} DAY`} />
            <Row label="ELEMENT" value={moonElement(day)} />
            <Row label="MOON IN" value={zodiacName(today)} />
          </div>

          {/*
            The headline. Big, tinted, and unambiguous — it is the one thing the
            screen exists to say.
          */}
          <div
            className={`w-full rounded-lg border-2 ${tintBorder} px-3.5 py-3.5 flex flex-col items-center gap-2.5`}
            style={{ backgroundColor: good ? 'rgba(74,222,128,0.10)' : 'rgba(251,191,36,0.10)' }}
          >
            {good ? <BadgeCheck size={28} className={tint} /> : <Hand size={28} className={tint} />}
            <span className={`font-retro text-[0.8rem] tracking-widest ${tint} text-center leading-relaxed`}>
              {moonVerdict(day)}
            </span>
            <p className="font-mono text-[0.7rem] sm:text-xs text-green-500 leading-relaxed normal-case text-center">
              {moonSummary(day)}
            </p>
          </div>

          {/* The line of the day, against a rule in the verdict's colour. */}
          <div className="w-full flex items-stretch gap-3 rounded-r bg-green-500/[0.06] py-2.5">
            <span className={`w-1 shrink-0 rounded-sm ${tintBg}`} aria-hidden="true" />
            <p className="font-mono text-[0.7rem] sm:text-xs text-green-300 leading-relaxed normal-case pr-3">
              {moonQuote(today)}
            </p>
          </div>

        </div>
      </div>
    </DeviceLayout>
  );
};

export default MoonDialScreen;
