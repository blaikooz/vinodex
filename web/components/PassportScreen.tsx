import React, { useEffect, useMemo } from 'react';
import { Grid3x3, Wine, Flag, Map as MapIcon, ChevronRight, ShieldCheck } from 'lucide-react';
import { BADGE_TINT } from './badgeVisuals';
import StampArt from './StampArt';
import { tierProgress } from '../src/services/passportTier';
import { seedIfNeeded } from '../src/services/passportProgress';
import DeviceLayout from './DeviceLayout';
import { WineEntry } from '@/shared/types';
import { shelfIds } from '../src/services/bookmarks';
import { useBookmarks } from '../src/services/useBookmarks';
import { bestStreak } from '../src/services/dailyChallenge';
import { highestUnlocked } from '../src/services/quiz';
import { computePassport } from '../src/services/passport';
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

// Rarity tints ride the livery table (stage 4) — same hue per tier, plus the
// authored light-mode half. UNCOMMON's blue approximates to sky, the same
// call the TOOLS shelf records for out-of-vocabulary hues.
const RARITY_TINT: Record<string, string> = {
  COMMON: 'var(--livery-green)',
  UNCOMMON: 'var(--livery-sky)',
  RARE: 'var(--livery-violet)',
  NOBLE: 'var(--livery-amber)',
  GODFORSAKEN: 'var(--livery-amber-deep)',
};
const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'NOBLE', 'GODFORSAKEN'];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-5">
    <h2 className="font-sans text-label uppercase tracking-widest text-[var(--lcd-accent)] border-b pb-1 mb-3" style={{ borderColor: 'color-mix(in srgb, var(--lcd-accent) 45%, transparent)' }}>{title}</h2>
    {children}
  </div>
);

const StatTile: React.FC<{ icon: React.ReactNode; value: string; label: string; tint: string }> = ({ icon, value, label, tint }) => (
  <div className="rounded-card bg-[var(--surface-raised)] border-2 p-3 flex items-center gap-2.5 shadow-elev-1" style={{ borderColor: `color-mix(in srgb, ${tint} 35%, transparent)` }}>
    <span className="shrink-0" style={{ color: tint }}>{icon}</span>
    <div className="flex flex-col items-start min-w-0">
      <span className="font-sans text-heading font-bold text-[var(--lcd-text)] truncate">{value}</span>
      <span className="font-sans text-caption text-[var(--lcd-subtext)] normal-case truncate">{label}</span>
    </div>
  </div>
);

const ProgressRow: React.FC<{ label: string; done: number; total: number; fill: string }> = ({ label, done, total, fill }) => {
  const pct = total > 0 ? Math.max(done > 0 ? 8 : 0, Math.round((done / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="font-sans text-caption text-[var(--lcd-text)] normal-case w-24 shrink-0 truncate">{label}</span>
      <span className="flex-1 h-3 rounded-full bg-[var(--lcd-well)] overflow-hidden">
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: fill }} />
      </span>
      <span className="font-sans text-caption text-[var(--lcd-subtext)] w-12 text-right shrink-0">{done}/{total}</span>
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

  // The rank ladder (v6#21): held rung + floor-based progress to the next.
  // Catalog-resolved (review M4), so the rank agrees with every other count
  // on this page when a data batch retires an entry.
  const tastings = passport.triedTotal;
  const rank = tierProgress(tastings);

  // Seed the announce ledgers here too — the passport is the iOS seeding
  // site; the entry page covers the update-then-tap-TRIED path.
  useEffect(() => {
    seedIfNeeded(() => passport.badges, () => tastings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DeviceLayout title="PASSPORT" subtitle="" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4" style={{ backgroundColor: 'var(--lcd-page)' }}>

        {/* RANK — thresholds from the ladder (APPRENTICE 5 / MASTER 25 /
            GRANDMASTER 100 / LEGENDARY 250 / WINE MONK 400), progress from
            the held rung's floor rather than zero. */}
        <Section title="RANK">
          <div className="rounded-card bg-[var(--surface-raised)] border-2 p-3.5 shadow-elev-1" style={{ borderColor: 'color-mix(in srgb, var(--livery-amber) 50%, transparent)' }}>
            <div className="flex items-center gap-3">
              <ShieldCheck size={30} className="text-[var(--livery-amber)]" />
              <div className="flex-1 min-w-0">
                <div className="font-sans text-heading font-bold tracking-wide text-[var(--lcd-text)]">
                  {rank.held ? rank.held.name : 'UNRANKED'}
                </div>
                <div className="font-sans text-caption text-[var(--lcd-subtext)] normal-case mt-0.5">
                  {rank.held ? rank.held.blurb : 'Mark five entries tried to take the first rung.'}
                </div>
              </div>
            </div>
            {rank.next && (
              <div className="mt-3">
                <div className="h-3 rounded-full bg-[var(--lcd-well)] overflow-hidden">
                  <span className="block h-full rounded-full bg-[var(--livery-amber)]" style={{ width: `${Math.max(rank.fraction > 0 ? 8 : 0, Math.round(rank.fraction * 100))}%` }} />
                </div>
                <div className="font-sans text-caption text-[var(--lcd-subtext)] normal-case mt-1 text-right">
                  {tastings}/{rank.next.threshold} toward {rank.next.name}
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="TASTINGS">
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={<Grid3x3 size={22} />} value={`${passport.triedGrapes}/${passport.totalGrapes}`} label="GRAPES" tint="var(--livery-violet)" />
            <StatTile icon={<Wine size={22} />} value={`${passport.triedStyles}/${passport.totalStyles}`} label="STYLES" tint="var(--livery-orange)" />
            <StatTile icon={<Flag size={22} />} value={`${passport.countries}`} label="COUNTRIES" tint="var(--livery-amber)" />
            <StatTile icon={<MapIcon size={22} />} value={`${passport.continents.length}/6`} label="CONTINENTS" tint="var(--livery-sky)" />
          </div>
        </Section>

        <Section title="BY COLOUR">
          <ProgressRow label="RED" done={passport.byColor.red} total={passport.colorTotals.red} fill="var(--livery-red)" />
          <ProgressRow label="WHITE" done={passport.byColor.white} total={passport.colorTotals.white} fill="var(--lcd-text)" />
        </Section>

        <Section title="BY RARITY">
          {RARITIES.map(r => (
            <ProgressRow key={r} label={r} done={passport.byRarity[r] ?? 0} total={passport.rarityTotals[r] ?? 0} fill={RARITY_TINT[r] ?? 'var(--lcd-subtext)'} />
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
                  className="dex-pressable w-full flex items-center justify-center gap-1.5 rounded-card bg-[var(--surface-raised)] border border-[var(--surface-line-strong)] px-4 py-2.5 font-sans text-caption font-semibold tracking-widest text-[var(--lcd-accent)] hover:border-[var(--lcd-accent)] shadow-elev-1"
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
              const tint = BADGE_TINT[b.id];
              return (
                <div
                  key={b.id}
                  className="rounded-card bg-[var(--surface-raised)] p-3 flex flex-col items-center text-center gap-1 shadow-elev-1"
                  style={{ border: b.earned ? `2px solid color-mix(in srgb, ${tint} 55%, transparent)` : '1px solid var(--surface-line)', opacity: b.earned ? 1 : 0.7 }}
                >
                  <StampArt id={b.id} size={40} earned={b.earned} />
                  <span className="font-sans text-caption font-semibold tracking-widest mt-1" style={{ color: b.earned ? 'var(--lcd-text)' : 'var(--lcd-disabled-text)' }}>{b.title}</span>
                  <span className="font-sans text-caption text-[var(--lcd-subtext)] leading-tight normal-case">{b.blurb}</span>
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
