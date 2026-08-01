import React, { useMemo, useState } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import EntryTile from './EntryTile';
import { WineEntry, isFlavorEntry } from '@/shared/types';
import { CONTAINER_BORDER, CONTAINER_BORDER_CLASS, CONTAINER_SHADOW_CLASS } from '../src/services/iconRendering';
import { createEntryVisualResolver, resolveEntryIconVisual } from '../src/services/entryIconVisuals';
import {
  FLAVOR_LIMIT,
  GrapeScanCriteria,
  bodyClassesInData,
  countriesInData,
  criteriaAreEmpty,
  emptyCriteria,
  flavorClasses,
  flavorsAreFull,
  flavorsInClass,
  grapesMatching,
  toggleFlavor,
} from '../src/services/grapeScan';

interface ScannerScreenProps {
  allEntries: WineEntry[];
  onOpen: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
}

type Step = 'color' | 'body' | 'country' | 'flavors' | 'reveal';

const STEP_ORDER: Step[] = ['color', 'body', 'country', 'flavors', 'reveal'];

/**
 * The scanner: four questions about the glass in front of you, then a
 * deduction. Ported from `vinodex-ios/Sources/VinodexUI/ScannerScreen.swift`.
 *
 * The whole flow lives in one component with a `step` cursor rather than as
 * routes, matching the iOS choice and for the same reason: the steps share one
 * accumulating answer, and routing them would make the chassis Back button
 * unwind the questionnaire one answer at a time. Here Back leaves the scanner
 * and the in-screen arrow steps between questions.
 *
 * One deviation from iOS: that version reaches the country question through the
 * 3D globe (continent marker → country list). This uses a flat country list.
 * Wiring `RetroGlobeScreen` into the middle of a questionnaire is a much larger
 * change than the question warrants, and the list answers it directly.
 */
const ScannerScreen: React.FC<ScannerScreenProps> = ({ allEntries, onOpen, onBack, onHome }) => {
  const [step, setStep] = useState<Step>('color');
  const [criteria, setCriteria] = useState<GrapeScanCriteria>(emptyCriteria);
  const [openFlavorClass, setOpenFlavorClass] = useState<string | null>(null);
  // Session-local flavour filter. A half-typed query is scaffolding, not an
  // answer, so it lives outside `criteria`.
  const [flavorQuery, setFlavorQuery] = useState('');

  const bodies = useMemo(() => bodyClassesInData(allEntries), [allEntries]);
  const countries = useMemo(() => countriesInData(allEntries), [allEntries]);
  const classes = useMemo(() => flavorClasses(allEntries), [allEntries]);
  const allFlavors = useMemo(() => allEntries.filter(isFlavorEntry), [allEntries]);
  const resolver = useMemo(() => createEntryVisualResolver({ entries: allEntries }), [allEntries]);
  const openFlavors = useMemo(
    () => (openFlavorClass ? flavorsInClass(allEntries, openFlavorClass) : []),
    [allEntries, openFlavorClass],
  );
  const matches = useMemo(
    () => (step === 'reveal' ? grapesMatching(allEntries, criteria) : []),
    [allEntries, criteria, step],
  );

  const questionNumber = STEP_ORDER.indexOf(step) + 1;

  const goBackAStep = () => {
    if (openFlavorClass) {
      setOpenFlavorClass(null);
      return;
    }
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) setStep(STEP_ORDER[i - 1]!);
  };

  const advance = () => {
    const i = STEP_ORDER.indexOf(step);
    if (i < STEP_ORDER.length - 1) setStep(STEP_ORDER[i + 1]!);
  };

  const restart = () => {
    setCriteria(emptyCriteria());
    setOpenFlavorClass(null);
    setFlavorQuery('');
    setStep('color');
  };

  // Every step is skippable — "I don't know" is a first-class answer, and the
  // reveal works from none, some or all of the criteria.
  const skipButton = (
    <button
      onClick={advance}
      className="font-retro text-[0.6rem] tracking-widest text-stone-400 border-2 border-stone-700 rounded-full px-5 py-3 hover:bg-stone-800 transition-colors"
    >
      NOT SURE
    </button>
  );

  const chip = (label: string, selected: boolean, onClick: () => void, disabled = false) => (
    <button
      key={label}
      onClick={onClick}
      disabled={disabled}
      className={`font-retro text-[0.6rem] sm:text-xs tracking-widest rounded-lg px-4 py-4 border-2 transition-all ${
        selected
          ? 'bg-green-600 border-green-400 text-white'
          : disabled
            ? 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'
            : 'bg-stone-900 border-stone-600 text-green-300 hover:border-green-500 hover:bg-stone-800 active:translate-y-0.5'
      }`}
    >
      {label}
    </button>
  );

  const prompt = (text: string, subtitle?: string) => (
    <div className="flex flex-col items-center gap-2">
      <p className="font-retro text-[0.65rem] sm:text-sm tracking-widest text-green-400 text-center leading-relaxed">
        {text}
      </p>
      {subtitle && (
        <p className="font-mono text-xs text-stone-400 text-center normal-case leading-relaxed max-w-xs">
          {subtitle}
        </p>
      )}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'color':
        return (
          <>
            {prompt('WHAT COLOR?', 'Start with the easy one.')}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {chip('RED', criteria.color === 'red', () => {
                setCriteria({ ...criteria, color: 'red' });
                advance();
              })}
              {chip('WHITE', criteria.color === 'white', () => {
                setCriteria({ ...criteria, color: 'white' });
                advance();
              })}
            </div>
            {skipButton}
          </>
        );

      case 'body':
        return (
          <>
            {prompt('HOW IS THE BODY?', 'How much of it is there, from a wisp to a mouthful.')}
            {/* Stacked, not side by side, so the run reads as the light→full
                scale it is — a wisp at the top, a mouthful at the bottom. */}
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {bodies.map(b =>
                chip(b.toUpperCase(), criteria.body === b, () => {
                  setCriteria({ ...criteria, body: b });
                  advance();
                }),
              )}
            </div>
            {skipButton}
          </>
        );

      case 'country':
        return (
          <>
            {prompt('WHERE IS IT FROM?')}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {countries.map(c =>
                chip(c.toUpperCase(), criteria.country === c, () => {
                  setCriteria({ ...criteria, country: c });
                  advance();
                }),
              )}
            </div>
            {skipButton}
          </>
        );

      case 'flavors': {
        const q = flavorQuery.trim().toLowerCase();
        const searching = !openFlavorClass && q.length > 0;
        const searchMatches = searching
          ? allFlavors.filter(f => f.name.toLowerCase().includes(q))
          : [];

        const flavorToggleChip = (f: WineEntry) => {
          const selected = criteria.flavorIds.includes(f.id);
          return chip(
            f.name.toUpperCase(),
            selected,
            () => setCriteria(toggleFlavor(criteria, f.id)),
            !selected && flavorsAreFull(criteria),
          );
        };

        return (
          <>
            {prompt(
              openFlavorClass
                ? `${openFlavorClass.toUpperCase()} — PICK UP TO ${FLAVOR_LIMIT}`
                : 'AROMAS AND FLAVORS?',
              openFlavorClass
                ? undefined
                : `Search, or pick a family to browse. Up to ${FLAVOR_LIMIT} go in the basket — fewer is fine, none is fine.`,
            )}

            {/* Flavours are ANDed, so the basket is capped at three — a fourth
                specific note reliably matches nothing. */}
            <p className="font-mono text-xs text-green-300 tracking-widest">
              BASKET {criteria.flavorIds.length}/{FLAVOR_LIMIT}
            </p>

            {/* Name a flavour directly rather than walking the taxonomy. */}
            {!openFlavorClass && (
              <div
                className="flex flex-row items-center h-11 border-2 border-stone-600 px-3 rounded-full w-full max-w-sm"
                style={{ backgroundColor: 'var(--lcd-well)' }}
              >
                <Search size={18} className="text-green-500 shrink-0" />
                <input
                  type="text"
                  value={flavorQuery}
                  onChange={e => setFlavorQuery(e.target.value)}
                  placeholder="SEARCH FLAVORS…"
                  className="w-full ml-2 bg-transparent outline-none font-mono uppercase text-green-500 placeholder-green-900 placeholder:font-bold"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 w-full max-w-sm max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {openFlavorClass
                ? openFlavors.map(flavorToggleChip)
                : searching
                  ? searchMatches.map(flavorToggleChip)
                  : classes.map(c => chip(c.toUpperCase(), false, () => setOpenFlavorClass(c)))}
            </div>

            {searching && searchMatches.length === 0 && (
              <p className="font-mono text-xs text-stone-400">NO FLAVOR MATCHES THAT.</p>
            )}

            <div className="flex gap-3">
              {openFlavorClass && (
                <button
                  onClick={() => setOpenFlavorClass(null)}
                  className="font-retro text-[0.6rem] tracking-widest text-green-300 border-2 border-green-800 rounded-full px-5 py-3 hover:bg-stone-800"
                >
                  CLASSES
                </button>
              )}
              <button
                onClick={advance}
                className="font-retro text-[0.6rem] tracking-widest text-black bg-green-500 border-b-[5px] border-green-800 rounded-full px-6 py-3 active:translate-y-1 active:border-b-0 hover:bg-green-400"
              >
                SCAN
              </button>
            </div>
          </>
        );
      }

      case 'reveal': {
        // Lead with a single BEST MATCH hero, then the remainder under
        // "ALSO FITS (n MORE)", mirroring iOS rather than a flat tile list.
        const best = matches[0];
        const others = matches.slice(1, 7);
        const heroVisual = best ? resolveEntryIconVisual(best, { size: 96, resolver }) : null;

        return (
          <div className="w-full flex flex-col gap-3">
            {criteriaAreEmpty(criteria) ? (
              // A reveal from a blank slate is just a shuffled list; say so
              // rather than presenting all 80 grapes as a deduction.
              <p className="font-retro text-[0.65rem] tracking-widest text-yellow-400 text-center leading-relaxed">
                NO CRITERIA
                <br />
                EVERY GRAPE MATCHES.
              </p>
            ) : (
              <p className="font-retro text-[0.65rem] tracking-widest text-green-400 text-center">
                {matches.length} {matches.length === 1 ? 'MATCH' : 'MATCHES'}
              </p>
            )}

            {matches.length === 0 || !best ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-yellow-700/60 bg-yellow-400/10 py-8 px-4">
                <p className="font-retro text-sm tracking-widest text-yellow-400 text-center">
                  GRAPE NOT FOUND
                </p>
                <p className="font-mono text-sm text-stone-200 text-center normal-case leading-relaxed max-w-xs">
                  You&apos;re drinking rare grapes! Nothing in the database fits all of that —
                  loosen a criterion and scan again, or accept the compliment.
                </p>
              </div>
            ) : (
              <>
                {/* BEST MATCH hero */}
                <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-green-700/50 bg-green-500/[0.07] py-5 px-4">
                  <p className="font-retro text-[0.6rem] sm:text-xs tracking-widest text-yellow-400">
                    {matches.length === 1 ? "IT'S PROBABLY" : 'BEST MATCH'}
                  </p>
                  <div
                    className={`flex items-center justify-center w-28 h-28 rounded-2xl bg-stone-900 ${CONTAINER_BORDER} ${CONTAINER_BORDER_CLASS} ${CONTAINER_SHADOW_CLASS}`}
                  >
                    {heroVisual?.iconNode}
                  </div>
                  <p
                    className="font-retro text-base sm:text-lg text-stone-100 text-center break-words px-2"
                    style={{ textShadow: '3px 3px 0 rgba(34,197,94,0.55)' }}
                  >
                    {best.name.toUpperCase()}
                  </p>
                  <button
                    onClick={() => onOpen(best)}
                    className="font-retro text-[0.6rem] tracking-widest text-black bg-green-500 border-b-[5px] border-green-800 rounded-full px-8 py-3 active:translate-y-1 active:border-b-0 hover:bg-green-400 transition-all"
                  >
                    OPEN ENTRY
                  </button>
                </div>

                {others.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="font-retro text-[0.6rem] tracking-widest text-green-400">
                      ALSO FITS ({matches.length - 1} MORE)
                    </p>
                    {others.map((entry, index) => (
                      <EntryTile key={entry.id} entry={entry} onPress={onOpen} index={index} />
                    ))}
                  </div>
                )}
              </>
            )}

            <button
              onClick={restart}
              className="self-center font-retro text-[0.6rem] tracking-widest text-green-300 border-2 border-green-800 rounded-full px-6 py-3 hover:bg-stone-800 mt-2"
            >
              SCAN AGAIN
            </button>
          </div>
        );
      }
    }
  };

  return (
    <DeviceLayout title="SCANNER" subtitle="" showBack={true} onBack={onBack} onHome={onHome} centerHeaderText={true}>
      <div className="flex flex-col h-full min-h-0 bg-stone-950">

        <div className="shrink-0 flex items-center gap-3 px-3 py-2 bg-stone-900 border-b border-stone-700">
          {step !== 'color' && (
            <button onClick={goBackAStep} aria-label="Previous question" className="text-green-400 p-1">
              <ChevronLeft size={22} />
            </button>
          )}
          <span className="font-retro text-[0.6rem] tracking-widest text-green-500">
            {step === 'reveal' ? 'RESULT' : `STEP ${questionNumber} OF ${STEP_ORDER.length}`}
          </span>

          {/* RESET clears every answer back to question one — shown only once
              there is something to clear, matching iOS. */}
          {!criteriaAreEmpty(criteria) && (
            <button
              onClick={restart}
              className="ml-auto font-retro text-[0.6rem] tracking-widest text-green-500 hover:text-green-300 px-2 py-1 transition-colors"
            >
              RESET
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 flex flex-col items-center justify-center gap-4">
          {renderStep()}
        </div>

      </div>
    </DeviceLayout>
  );
};

export default ScannerScreen;
