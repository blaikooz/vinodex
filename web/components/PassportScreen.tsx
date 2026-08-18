import React, { useMemo } from 'react';
import { Grid3x3, Wine, Flag, Map as MapIcon, Droplet, Package, Crown, Flame, GraduationCap, Lock, ChevronRight } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import { WineEntry } from '@/shared/types';
import { shelfIds } from '../src/services/bookmarks';
import { useBookmarks } from '../src/services/useBookmarks';
import { bestStreak } from '../src/services/dailyChallenge';
import { highestUnlocked } from '../src/services/quiz';
import { computePassport, BadgeId } from '../src/services/passport';
import {
  RECOMMENDATION_STRIP,
  allRecommendations,
  buildProfile,
  buildTriedIndex,
} from '../src/services/recommendations';
import EntryTile from './EntryTile';

interface PassportScreenProps {
  allEntries: WineEntry[];
  onSelect: (entry: WineEntry) => void;
  onShowAllRecommendations: () => void;
  onBack: () => void;
  onHome: () => void;
}

const BADGE_ICON: Record<BadgeId, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
  firstSip: Droplet,
  tenBottles: Package,
  allNoble: Crown,
  regionComplete: MapIcon,
  streakWeek: Flame,
  sommelier: GraduationCap,
};
const BADGE_TINT: Record<BadgeId, string> = {
  firstSip: '#ef4444',
  tenBottles: '#3b82f6',
  allNoble: '#eab308',
  regionComplete: '#22c55e',
  streakWeek: '#f97316',
  sommelier: '#a855f7',
};
const RARITY_TINT: Record<string, string> = {
  COMMON: '#22c55e',
  UNCOMMON: '#3b82f6',
  RARE: '#a855f7',
  NOBLE: '#eab308',
  GODFORSAKEN: '#ca8a04',
};
const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'NOBLE', 'GODFORSAKEN'];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-5">
    <div className="font-retro text-[0.6rem] tracking-widest text-green-400 border-b border-green-800 pb-1 mb-3">{title}</div>
    {children}
  </div>
);

const StatTile: React.FC<{ icon: React.ReactNode; value: string; label: string; tint: string }> = ({ icon, value, label, tint }) => (
  <div className="rounded-xl bg-stone-900/70 border-2 p-3 flex items-center gap-2.5" style={{ borderColor: `${tint}55` }}>
    <span className="shrink-0" style={{ color: tint }}>{icon}</span>
    <div className="flex flex-col items-start min-w-0">
      <span className="font-retro text-lg text-stone-100 truncate">{value}</span>
      <span className="font-mono text-[0.62rem] text-stone-400 normal-case truncate">{label}</span>
    </div>
  </div>
);

const ProgressRow: React.FC<{ label: string; done: number; total: number; fill: string }> = ({ label, done, total, fill }) => {
  const pct = total > 0 ? Math.max(done > 0 ? 8 : 0, Math.round((done / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="font-mono text-xs text-stone-300 normal-case w-24 shrink-0 truncate">{label}</span>
      <span className="flex-1 h-3 rounded-full bg-black/50 overflow-hidden">
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: fill }} />
      </span>
      <span className="font-mono text-xs text-stone-400 w-12 text-right shrink-0">{done}/{total}</span>
    </div>
  );
};

const PassportScreen: React.FC<PassportScreenProps> = ({ allEntries, onSelect, onShowAllRecommendations, onBack, onHome }) => {
  const revision = useBookmarks();
  const passport = useMemo(
    () => computePassport(shelfIds('tried'), allEntries, bestStreak(), highestUnlocked()),
    [allEntries, revision],
  );
  // YOU MIGHT LIKE (iOS 0.8.91, B3): the head of the full ranking, capped at
  // the strip length; SHOW ALL opens the same list uncapped. Empty when the
  // profile is thin — the strip withholds itself rather than guessing from
  // two tastings.
  const recommended = useMemo(() => {
    const index = buildTriedIndex(allEntries);
    return allRecommendations(buildProfile(index), index);
  }, [allEntries, revision]);

  return (
    <DeviceLayout title="PASSPORT" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4" style={{ backgroundColor: 'var(--lcd-page)' }}>

        <Section title="TASTINGS">
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={<Grid3x3 size={22} />} value={`${passport.triedGrapes}/${passport.totalGrapes}`} label="GRAPES" tint="#a855f7" />
            <StatTile icon={<Wine size={22} />} value={`${passport.triedStyles}/${passport.totalStyles}`} label="STYLES" tint="#f97316" />
            <StatTile icon={<Flag size={22} />} value={`${passport.countries}`} label="COUNTRIES" tint="#eab308" />
            <StatTile icon={<MapIcon size={22} />} value={`${passport.continents.length}/6`} label="CONTINENTS" tint="#3b82f6" />
          </div>
        </Section>

        <Section title="BY COLOUR">
          <ProgressRow label="RED" done={passport.byColor.red} total={passport.colorTotals.red} fill="#ef4444" />
          <ProgressRow label="WHITE" done={passport.byColor.white} total={passport.colorTotals.white} fill="#d6d3d1" />
        </Section>

        <Section title="BY RARITY">
          {RARITIES.map(r => (
            <ProgressRow key={r} label={r} done={passport.byRarity[r] ?? 0} total={passport.rarityTotals[r] ?? 0} fill={RARITY_TINT[r] ?? '#888'} />
          ))}
        </Section>

        {recommended.length > 0 && (
          <Section title="YOU MIGHT LIKE">
            <div className="flex flex-col gap-2">
              {recommended.slice(0, RECOMMENDATION_STRIP).map((entry, i) => (
                <EntryTile key={entry.id} entry={entry} onPress={() => onSelect(entry)} index={i} />
              ))}
              {recommended.length > RECOMMENDATION_STRIP && (
                <button
                  onClick={onShowAllRecommendations}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-900/70 border-2 border-green-800 px-4 py-2.5 font-retro text-[0.55rem] tracking-widest text-green-400 transition-colors hover:border-green-500"
                >
                  SHOW ALL ({recommended.length}) <ChevronRight size={13} />
                </button>
              )}
            </div>
          </Section>
        )}

        <Section title="STAMPS">
          <div className="grid grid-cols-2 gap-3">
            {passport.badges.map(b => {
              const Icon = BADGE_ICON[b.id];
              const tint = BADGE_TINT[b.id];
              return (
                <div
                  key={b.id}
                  className="rounded-xl bg-stone-900/60 p-3 flex flex-col items-center text-center gap-1"
                  style={{ border: `${b.earned ? 2 : 1}px solid ${b.earned ? `${tint}88` : '#44403c'}`, opacity: b.earned ? 1 : 0.7 }}
                >
                  {b.earned ? <Icon size={26} color={tint} /> : <Lock size={26} className="text-stone-600" />}
                  <span className="font-retro text-[0.55rem] tracking-widest mt-1" style={{ color: b.earned ? '#e7e5e4' : '#78716c' }}>{b.title}</span>
                  <span className="font-mono text-[0.62rem] text-stone-500 leading-tight normal-case">{b.blurb}</span>
                </div>
              );
            })}
          </div>
        </Section>

      </div>
    </DeviceLayout>
  );
};

export default PassportScreen;
