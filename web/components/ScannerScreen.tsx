import React, { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import EntryTile from './EntryTile';
import { WineEntry } from '@/shared/types';
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

  const bodies = useMemo(() => bodyClassesInData(allEntries), [allEntries]);
  const countries = useMemo(() => countriesInData(allEntries), [allEntries]);
  const classes = useMemo(() => flavorClasses(allEntries), [allEntries]);
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
    setStep('color');
  };

  // Every step is skippable — "I don't know" is a first-class answer, and the
  // reveal works from none, some or all of the criteria.
  const skipButton = (
    <button
      onClick={advance}
      className="font-retro text-[0.6rem] tracking-widest text-stone-400 border-2 border-stone-700 rounded-full px-5 py-3 hover:bg-stone-800 transition-colors"
    >
      SKIP
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

  const prompt = (text: string) => (
    <p className="font-retro text-[0.65rem] sm:text-sm tracking-widest text-green-400 text-center leading-relaxed">
      {text}
    </p>
  );

  const renderStep = () => {
    switch (step) {
      case 'color':
        return (
          <>
            {prompt('WHAT COLOUR IS IT?')}
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
            {prompt('HOW DOES IT FEEL?')}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
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

      case 'flavors':
        return (
          <>
            {prompt(
              openFlavorClass
                ? `${openFlavorClass.toUpperCase()} — PICK UP TO ${FLAVOR_LIMIT}`
                : 'WHAT DO YOU TASTE?',
            )}

            {/* Flavours are ANDed, so the basket is capped at three — a fourth
                specific note reliably matches nothing. */}
            {criteria.flavorIds.length > 0 && (
              <p className="font-mono text-xs text-green-300 tracking-widest">
                {criteria.flavorIds.length} / {FLAVOR_LIMIT} SELECTED
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 w-full max-w-sm max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {openFlavorClass
                ? openFlavors.map(f => {
                    const selected = criteria.flavorIds.includes(f.id);
                    return chip(
                      f.name.toUpperCase(),
                      selected,
                      () => setCriteria(toggleFlavor(criteria, f.id)),
                      !selected && flavorsAreFull(criteria),
                    );
                  })
                : classes.map(c => chip(c.toUpperCase(), false, () => setOpenFlavorClass(c)))}
            </div>

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

      case 'reveal':
        return (
          <div className="w-full flex flex-col gap-3">
            {criteriaAreEmpty(criteria) ? (
              // A reveal from a blank slate is just a shuffled list; say so
              // rather than presenting all 80 grapes as a deduction.
              <p className="font-retro text-[0.65rem] tracking-widest text-yellow-400 text-center leading-relaxed">
                YOU TOLD ME NOTHING.
                <br />
                EVERY GRAPE MATCHES.
              </p>
            ) : (
              <p className="font-retro text-[0.65rem] tracking-widest text-green-400 text-center">
                {matches.length} {matches.length === 1 ? 'MATCH' : 'MATCHES'}
              </p>
            )}

            {matches.length === 0 ? (
              <p className="font-mono text-sm text-red-400 text-center py-8">
                NO GRAPE CARRIES ALL OF THAT.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {matches.slice(0, 20).map((entry, index) => (
                  <EntryTile key={entry.id} entry={entry} onPress={onOpen} index={index} />
                ))}
              </div>
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
            {questionNumber} / {STEP_ORDER.length}
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 flex flex-col items-center justify-center gap-4">
          {renderStep()}
        </div>

      </div>
    </DeviceLayout>
  );
};

export default ScannerScreen;
