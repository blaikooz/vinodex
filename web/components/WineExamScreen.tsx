import React, { useMemo, useState } from 'react';
import { BadgeCheck, BadgeX, CheckCircle2, XCircle, Lock, ChevronRight } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import {
  EXAM_CATEGORY_LABELS,
  ExamQuestion,
} from '@/shared/data/exam';
import {
  ExamAnswer,
  ExamPrompt,
  ExamRun,
  advanceRun,
  assemble,
  correctPairing,
  correctSequence,
  draft,
  ladderExamTier,
  isCorrectSlot,
  matchingLeft,
  matchingRight,
  newRun,
  parseRun,
  presentedOptions,
  retryRun,
  runCorrect,
  runIsComplete,
  runPassed,
  submit,
  EXAM_LENGTH,
  EXAM_PASS_MARK,
} from '../src/services/examPaper';
import { record, stats, weakest } from '../src/services/examProgress';
import { QuizTier, QUIZ_TIERS, isTierUnlocked, tierRank } from '../src/services/quiz';
import { dayIndex, revealCursor } from '../src/services/dailyPick';
import { query as ssQuery, setQuery as ssSetQuery } from '../src/services/screenState';
import { playCorrect } from '../src/services/sound';
import { artSprite } from '../src/services/artSprites';
import { classArtNode } from '../src/services/classArt';
import iconManifest from '../src/data/iconManifest.json';

interface WineExamScreenProps {
  onBack: () => void;
  onHome: () => void;
}

const TIER_BLURB: Record<QuizTier, string> = {
  NOVICE: 'The grapes everyone has heard of.',
  ENTHUSIAST: 'The full cellar.',
  SOMMELIER: 'The back corner of the cellar.',
};

const KEY = 'wineExam';
const FLAVOR_ART = (iconManifest as { flavorArt?: Record<string, string> }).flavorArt ?? {};
const COUNTRY_SHAPES = (iconManifest as { countryShapeIcons?: Record<string, string> }).countryShapeIcons ?? {};

/** The picture a question is asked about — indirect keys, never file paths. */
const questionImage = (q: ExamQuestion): React.ReactNode => {
  if (q.format === 'aromaIdentification') {
    return (
      <div className="flex items-center justify-center gap-3 py-2" aria-label="Aroma glyphs">
        {q.noteKeys.map(key => (
          <span key={key}>{artSprite('flavor', FLAVOR_ART[key] ?? key, 48)}</span>
        ))}
      </div>
    );
  }
  if (q.format === 'imageIdentification') {
    if (q.image.kind === 'countryOutline') {
      const id = COUNTRY_SHAPES[q.image.key];
      return id ? <div className="flex justify-center py-2">{classArtNode(id, 96)}</div> : null;
    }
    // entryIcon: the entry's own manifest glyph, rendered like the class art.
    const id = (iconManifest as { byEntry?: Record<string, string> }).byEntry?.[q.image.key];
    return id ? <div className="flex justify-center py-2">{classArtNode(id, 96)}</div> : null;
  }
  return null;
};

/**
 * The Wine Exam, ported from
 * `vinodex-ios/Sources/VinodexUI/WineExamScreen.swift` (v6#8): seeded papers
 * assembled from the shared 420-question bank (`shared/data/exam.ts`) by
 * `examPaper.ts`, in place of the generated tasting quiz this screen's title
 * used to overpromise. The daily challenge keeps the generated quiz — see
 * `TastingQuizScreen`.
 *
 * The run survives a trip Back via the screen-state store, storing the seed
 * rather than the questions: `assemble` is pure, so the seed re-derives the
 * paper exactly.
 */
const WineExamScreen: React.FC<WineExamScreenProps> = ({ onBack, onHome }) => {
  // Validated, not cast (W15) - see `parseRun`. sessionStorage is
  // user-writable and a half-written value survives a crash.
  const [run, setRunState] = useState<ExamRun | null>(() => parseRun(ssQuery(KEY)));
  const [lockedTier, setLockedTier] = useState<QuizTier | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<QuizTier | null>(null);
  const [recorded, setRecorded] = useState(false);
  // Multi-tap scaffolding for matching: the selected left slot awaiting a right.
  const [pendingLeft, setPendingLeft] = useState<number | null>(null);

  const setRun = (r: ExamRun | null) => {
    setRunState(r);
    ssSetQuery(KEY, r ? JSON.stringify(r) : '');
  };

  // `run` is deliberately not a dependency, and this is the one lint warning
  // in the repo without a written reason (L3).
  //
  // `assemble` is a pure function of exactly the three fields listed, and a
  // paper is expensive to build. `run` also carries `index`, `answer`,
  // `submitted` and `marks`, all of which change on **every keystroke of
  // every question** — so depending on the object would rebuild the whole
  // paper on each interaction, and rebuild it identically, since none of
  // those fields reaches `assemble`. Listing the three inputs is the honest
  // dependency set; the rule cannot see through the property reads.
  //
  // The seam that makes it safe: a paper is derived from `(tier, length,
  // seed)` and nothing else, which is the same property `examPaper.ts`'s
  // seeded-determinism tests pin. If `assemble` ever grew a fourth input,
  // those tests move first.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const paper = useMemo(() => (run ? assemble(run.tier, run.length, run.seed) : null), [run?.tier, run?.length, run?.seed]);
  const prompts: ExamPrompt[] = paper && paper.ok ? paper.prompts : [];
  const prompt = run && !runIsComplete(run) ? prompts[run.index] ?? null : null;

  const tierLabel = (t: QuizTier) => t;
  const runTierLabel = run ? tierLabel(ladderTier(run)) : '';

  function ladderTier(r: ExamRun): QuizTier {
    return (Object.entries(ladderExamTier).find(([, examTier]) => examTier === r.tier)?.[0] ?? 'NOVICE') as QuizTier;
  }

  const begin = (rung: QuizTier) => {
    if (!isTierUnlocked(rung)) {
      setLockedTier(rung);
      return;
    }
    setNewlyUnlocked(null);
    setRecorded(false);
    setPendingLeft(null);
    setRun(newRun(revealCursor() + dayIndex(), ladderExamTier[rung]));
  };

  const commit = (answer: ExamAnswer) => {
    if (!run || !prompt || run.submitted) return;
    const next = submit(draft(run, answer), prompt);
    if (next.marks[next.marks.length - 1]) playCorrect();
    setRun(next);
  };

  const submitDraft = () => {
    if (!run || !prompt || run.submitted || !run.answer) return;
    const next = submit(run, prompt);
    if (next.marks[next.marks.length - 1]) playCorrect();
    setRun(next);
  };

  const next = () => {
    if (!run) return;
    setPendingLeft(null);
    const adv = advanceRun(run);
    if (runIsComplete(adv) && !recorded) {
      // Exactly once per completion, from the handler that completes it.
      setNewlyUnlocked(record(adv));
      setRecorded(true);
    }
    setRun(adv);
  };

  // ---- Results ----
  if (run && runIsComplete(run) && paper?.ok) {
    const passed = runPassed(run);
    const s = stats();
    const weak = weakest(s);
    return (
      <DeviceLayout title="WINE EXAM" showBack onBack={onBack} onHome={onHome} centerHeaderText>
        <div className="h-full overflow-y-auto custom-scrollbar flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: 'var(--lcd-page)' }}>
          {passed ? <BadgeCheck size={72} className="text-green-400" /> : <BadgeX size={72} className="text-red-400" />}
          <div className="font-retro text-3xl text-stone-100">{runCorrect(run)}/{run.length}</div>
          <div className={`font-retro text-lg tracking-widest ${passed ? 'text-green-400' : 'text-red-400'}`}>{passed ? 'PASS' : 'FAIL'}</div>
          {newlyUnlocked && <div className="font-retro text-xs tracking-widest text-yellow-300">{newlyUnlocked} UNLOCKED</div>}
          <div className="font-mono text-xs text-stone-400 max-w-[16rem] normal-case">
            {passed ? 'Santé!' : `Not quite — ${run.passMark}/${run.length} passes. Swirl and retry.`}
            {weak && ` Weakest subject so far: ${EXAM_CATEGORY_LABELS[weak.category]}.`}
          </div>
          {s.passStreak > 1 && (
            <div className="font-mono text-[0.65rem] text-stone-500 normal-case">{s.passStreak} papers passed in a row.</div>
          )}
          <div className="flex flex-col gap-3 mt-2 w-full max-w-[16rem]">
            <button
              onClick={() => { setRecorded(false); setNewlyUnlocked(null); setRun(retryRun(run)); }}
              className="w-full rounded-xl bg-yellow-400 border-b-4 border-yellow-600 active:translate-y-0.5 px-5 py-3 font-retro text-[0.6rem] tracking-widest text-amber-900"
            >
              RETRY
            </button>
            <button
              onClick={() => { setRun(null); setNewlyUnlocked(null); setRecorded(false); }}
              className="w-full rounded-xl bg-stone-800 border-b-4 border-stone-950 active:translate-y-0.5 px-5 py-3 font-retro text-[0.6rem] tracking-widest text-stone-300"
            >
              BACK TO PAPERS
            </button>
          </div>
        </div>
      </DeviceLayout>
    );
  }

  // ---- Assembly failure (bank missing a tier, etc.) ----
  if (run && paper && !paper.ok) {
    return (
      <DeviceLayout title="WINE EXAM" showBack onBack={onBack} onHome={onHome} centerHeaderText>
        <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: 'var(--lcd-page)' }}>
          <p className="font-retro text-xs tracking-widest text-yellow-300">{paper.message}</p>
          <button onClick={() => setRun(null)} className="rounded-xl bg-stone-800 border-2 border-stone-600 px-6 py-2.5 font-retro text-[0.6rem] tracking-widest text-stone-300">BACK</button>
        </div>
      </DeviceLayout>
    );
  }

  // ---- Active question ----
  if (run && prompt) {
    const q = prompt.question;
    const answered = run.submitted;
    const options = presentedOptions(prompt);
    const answer = run.answer;

    const optionButton = (label: string, slot: number, picked: boolean, onPick: () => void) => {
      let cls = 'bg-stone-900/70 border-stone-700 text-stone-200';
      if (answered) {
        if (isCorrectSlot(prompt, slot)) cls = 'bg-green-700/80 border-green-400 text-white';
        else if (picked) cls = 'bg-red-800/80 border-red-500 text-white';
        else cls = 'bg-stone-900/40 border-stone-800 text-stone-500';
      } else if (picked) {
        cls = 'bg-stone-800 border-green-600 text-stone-100';
      }
      return (
        <button
          key={slot}
          disabled={answered}
          onClick={onPick}
          className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left transition-colors ${cls}`}
        >
          <span className="flex-1 font-retro text-[0.65rem] tracking-widest normal-case">{label}</span>
          {answered && isCorrectSlot(prompt, slot) && <CheckCircle2 size={18} className="text-white" />}
          {answered && picked && !isCorrectSlot(prompt, slot) && <XCircle size={18} className="text-white" />}
        </button>
      );
    };

    let body: React.ReactNode = null;
    let checkEnabled = false;
    let needsCheck = false;

    if (q.format === 'trueFalse') {
      // TRUE and FALSE are fixed poles, not options — never shuffled.
      const pick = answer?.kind === 'truth' ? answer.value : null;
      body = (
        <div className="flex gap-3">
          {[true, false].map(v => {
            let cls = 'bg-stone-900/70 border-stone-700 text-stone-200';
            if (answered) {
              if (q.answer === v) cls = 'bg-green-700/80 border-green-400 text-white';
              else if (pick === v) cls = 'bg-red-800/80 border-red-500 text-white';
              else cls = 'bg-stone-900/40 border-stone-800 text-stone-500';
            }
            return (
              <button
                key={String(v)}
                disabled={answered}
                onClick={() => commit({ kind: 'truth', value: v })}
                className={`flex-1 rounded-xl border-2 px-4 py-4 font-retro text-sm tracking-widest transition-colors ${cls}`}
              >
                {v ? 'TRUE' : 'FALSE'}
              </button>
            );
          })}
        </div>
      );
    } else if (q.format === 'multipleChoice' || q.format === 'aromaIdentification' || q.format === 'imageIdentification') {
      const picked = answer?.kind === 'choice' ? answer.slot : null;
      body = (
        <div className="flex flex-col gap-2">
          {options.map((label, slot) => optionButton(label, slot, picked === slot, () => commit({ kind: 'choice', slot })))}
        </div>
      );
    } else if (q.format === 'selectAll') {
      const slots = answer?.kind === 'selection' ? answer.slots : [];
      needsCheck = true;
      checkEnabled = slots.length > 0;
      body = (
        <div className="flex flex-col gap-2">
          {options.map((label, slot) =>
            optionButton(label, slot, slots.includes(slot), () => {
              // A second tap is a toggle, not a second vote.
              const nextSlots = slots.includes(slot) ? slots.filter(s => s !== slot) : [...slots, slot];
              setRun(draft(run, { kind: 'selection', slots: nextSlots }));
            }),
          )}
          <p className="font-mono text-[0.65rem] text-stone-500 normal-case">Select every answer that applies, then check.</p>
        </div>
      );
    } else if (q.format === 'matching') {
      const left = matchingLeft(prompt);
      const right = matchingRight(prompt);
      const map = answer?.kind === 'pairing' ? answer.map : {};
      const pairedRights = new Set(Object.values(map));
      needsCheck = true;
      checkEnabled = Object.keys(map).length === left.length;
      const want = correctPairing(prompt);
      body = (
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[0.65rem] text-stone-500 normal-case">Tap an item, then its match.</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              {left.map((label, i) => {
                const good = answered && want[i] === map[i];
                const bad = answered && map[i] !== undefined && want[i] !== map[i];
                return (
                  <button
                    key={i}
                    disabled={answered}
                    onClick={() => setPendingLeft(pendingLeft === i ? null : i)}
                    className={`rounded-lg border-2 px-2 py-2 text-left font-mono text-[0.65rem] normal-case transition-colors ${
                      good ? 'bg-green-700/80 border-green-400 text-white'
                        : bad ? 'bg-red-800/80 border-red-500 text-white'
                        : pendingLeft === i ? 'bg-stone-800 border-green-600 text-stone-100'
                        : map[i] !== undefined ? 'bg-stone-800/70 border-stone-600 text-stone-200'
                        : 'bg-stone-900/70 border-stone-700 text-stone-200'
                    }`}
                  >
                    {label}
                    {map[i] !== undefined && <span className="block text-[0.55rem] text-stone-400">→ {right[map[i]!]}</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              {right.map((label, slot) => (
                <button
                  key={slot}
                  disabled={answered || pendingLeft === null}
                  onClick={() => {
                    if (pendingLeft === null) return;
                    const nextMap: Record<number, number> = { ...map };
                    // Re-pairing a right steals it from its previous left.
                    for (const [l, r] of Object.entries(nextMap)) if (r === slot) delete nextMap[Number(l)];
                    nextMap[pendingLeft] = slot;
                    setPendingLeft(null);
                    setRun(draft(run, { kind: 'pairing', map: nextMap }));
                  }}
                  className={`rounded-lg border-2 px-2 py-2 text-left font-mono text-[0.65rem] normal-case transition-colors ${
                    pairedRights.has(slot) ? 'bg-stone-800/70 border-stone-600 text-stone-400' : 'bg-stone-900/70 border-stone-700 text-stone-200'
                  } ${pendingLeft !== null && !answered ? 'border-green-700' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {answered && (
            <div className="font-mono text-[0.65rem] text-stone-400 normal-case">
              {left.map((label, i) => (
                <div key={i}>{label} → {right[want[i]!]}</div>
              ))}
            </div>
          )}
        </div>
      );
    } else if (q.format === 'ordering') {
      const seq = answer?.kind === 'sequence' ? answer.slots : [];
      needsCheck = true;
      checkEnabled = seq.length === options.length;
      const want = correctSequence(prompt);
      body = (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[0.65rem] text-stone-500 normal-case">
            Tap in order: {q.axis.from} → {q.axis.to}. Tap again to remove.
          </p>
          {options.map((label, slot) => {
            const position = seq.indexOf(slot);
            const good = answered && want[position] === slot && position >= 0;
            const bad = answered && position >= 0 && want[position] !== slot;
            return (
              <button
                key={slot}
                disabled={answered}
                onClick={() => {
                  const nextSeq = position >= 0 ? seq.filter(s => s !== slot) : [...seq, slot];
                  setRun(draft(run, { kind: 'sequence', slots: nextSeq }));
                }}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                  good ? 'bg-green-700/80 border-green-400 text-white'
                    : bad ? 'bg-red-800/80 border-red-500 text-white'
                    : position >= 0 ? 'bg-stone-800 border-green-600 text-stone-100'
                    : 'bg-stone-900/70 border-stone-700 text-stone-200'
                }`}
              >
                <span className="w-6 font-retro text-[0.65rem] text-green-400">{position >= 0 ? position + 1 : ''}</span>
                <span className="flex-1 font-mono text-[0.7rem] normal-case">{label}</span>
              </button>
            );
          })}
          {answered && (
            <div className="font-mono text-[0.65rem] text-stone-400 normal-case">
              Correct order: {want.map(s => options[s]).join(' → ')}
            </div>
          )}
        </div>
      );
    }

    return (
      <DeviceLayout title="WINE EXAM" showBack onBack={onBack} onHome={onHome} centerHeaderText>
        <div className="relative h-full">
          <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }}>
            <div className="flex items-center justify-between">
              <span className="font-retro text-[0.55rem] tracking-widest text-green-400">
                {runTierLabel} · {EXAM_CATEGORY_LABELS[q.category]}
              </span>
              <span className="font-retro text-[0.55rem] tracking-widest text-stone-400">{Math.min(run.index + 1, run.length)}/{run.length}</span>
            </div>
            <p className="font-retro text-base text-stone-100 normal-case leading-snug">{q.prompt}</p>
            {questionImage(q)}
            {body}
            {needsCheck && !answered && (
              <button
                disabled={!checkEnabled}
                onClick={submitDraft}
                className={`w-full rounded-xl border-b-4 active:translate-y-0.5 px-4 py-3 font-retro text-[0.6rem] tracking-widest ${
                  checkEnabled ? 'bg-green-600 border-green-800 text-white' : 'bg-stone-800 border-stone-950 text-stone-500'
                }`}
              >
                CHECK ANSWER
              </button>
            )}
            {/* Reveal: verdict + the explanation every question carries (D7). */}
            {answered && (
              <div className={`rounded-2xl border-2 bg-stone-900 p-4 flex flex-col gap-3 ${run.marks[run.marks.length - 1] ? 'border-green-700' : 'border-yellow-600'}`}>
                <div className={`font-retro text-sm tracking-widest text-center ${run.marks[run.marks.length - 1] ? 'text-green-400' : 'text-yellow-400'}`}>
                  {run.marks[run.marks.length - 1] ? 'CORRECT' : 'NOT QUITE'}
                </div>
                <p className="font-mono text-xs text-stone-300 normal-case leading-snug">{q.explanation}</p>
                {q.source && <p className="font-mono text-[0.6rem] text-stone-500 normal-case">{q.source}</p>}
                <button onClick={next} className="w-full rounded-xl bg-yellow-400 border-b-4 border-yellow-600 active:translate-y-0.5 px-3 py-2.5 font-retro text-[0.55rem] tracking-widest text-amber-900">
                  {run.index === run.length - 1 ? 'SEE RESULTS' : 'NEXT QUESTION'}
                </button>
              </div>
            )}
          </div>
        </div>
      </DeviceLayout>
    );
  }

  // ---- Tier picker ----
  return (
    <DeviceLayout title="WINE EXAM" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--lcd-page)' }}>
        <div className="font-retro text-xs tracking-widest text-green-400 text-left pb-1 mb-1 border-b-2" style={{ borderColor: 'var(--lcd-accent)' }}>CHOOSE YOUR EXAM</div>
        {QUIZ_TIERS.map(tier => {
          const unlocked = isTierUnlocked(tier);
          return (
            <button
              key={tier}
              onClick={() => begin(tier)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                unlocked ? 'bg-stone-900/70 border-green-700 hover:border-green-400' : 'bg-stone-900/40 border-stone-800 opacity-60'
              }`}
            >
              <div className="flex-1 text-left">
                <div className="font-retro text-sm tracking-widest text-stone-100">{tier}</div>
                <div className="font-mono text-xs text-stone-500 mt-0.5 normal-case">{TIER_BLURB[tier]}</div>
              </div>
              {unlocked ? <ChevronRight size={20} className="text-green-400" /> : <Lock size={18} className="text-stone-600" />}
            </button>
          );
        })}
        {/* iOS `WineExamScreen`'s ledger line, numbers from the engine. */}
        <p className="font-mono text-xs text-stone-500 text-left mt-2 normal-case">
          {EXAM_LENGTH} questions across 16 subjects, {EXAM_PASS_MARK} to pass. Passing an exam unlocks the next one.
        </p>
      </div>

      {lockedTier && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center p-6">
          <div className="w-full max-w-xs bg-stone-900 border-2 border-yellow-700 rounded-lg p-5 flex flex-col gap-3 text-center">
            <p className="font-retro text-xs tracking-widest text-yellow-300">{lockedTier} IS LOCKED</p>
            <p className="font-mono text-sm text-stone-300 normal-case">
              Pass {QUIZ_TIERS[tierRank(lockedTier) - 1] ?? 'NOVICE'} — {EXAM_PASS_MARK} of {EXAM_LENGTH} — to unlock it.
            </p>
            <button onClick={() => setLockedTier(null)} className="rounded-xl bg-stone-800 border-2 border-stone-600 py-2.5 font-retro text-[0.6rem] tracking-widest text-stone-300">OK</button>
          </div>
        </div>
      )}
    </DeviceLayout>
  );
};

export default WineExamScreen;
