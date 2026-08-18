import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, BadgeCheck, BadgeX, Flame, BookOpen } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import EntryTile from './EntryTile';
import { WineEntry } from '@/shared/types';
import {
  QuizSession,
  quizQuestion,
  chooseAnswer,
  advance,
  isComplete,
  isPassed,
  isAnswered,
  kindTopic,
  parseSession,
} from '../src/services/quiz';
import { dailySession, recordDaily, isTodayDone, currentStreak } from '../src/services/dailyChallenge';
import { query as ssQuery, setQuery as ssSetQuery } from '../src/services/screenState';
import { playCorrect } from '../src/services/sound';

interface TastingQuizScreenProps {
  allEntries: WineEntry[];
  onOpen: (entry: WineEntry) => void;
  onBack: () => void;
  onHome: () => void;
}

/**
 * The DAILY CHALLENGE — one generated paper a day that keeps the streak.
 *
 * This screen used to carry the practice WINE EXAM as a second mode; iOS split
 * the two in 0.7.5 (D) — the exam runs on the authored 420-question bank
 * (`WineExamScreen` here, v6#8), while the daily keeps the *generated* quiz
 * because a daily must never contradict an entry, and a generated question
 * can't. The practice arm here was stripped when `/quiz` repointed, so the
 * quiz engine is genuinely daily-challenge-only, as on iOS
 * (`WineExamScreen.swift:18`).
 */
const KEY = 'dailyChallenge';

const TastingQuizScreen: React.FC<TastingQuizScreenProps> = ({ allEntries, onOpen, onBack, onHome }) => {
  const byId = useMemo(() => new Map(allEntries.map(e => [e.id, e])), [allEntries]);
  const entryName = (id: string) => byId.get(id)?.name ?? id;

  // Validated, not cast (W15) - see `quiz.parseSession`.
  const [session, setSessionState] = useState<QuizSession | null>(() => parseSession(ssQuery(KEY)));

  const setSession = (s: QuizSession | null) => {
    setSessionState(s);
    ssSetQuery(KEY, s ? JSON.stringify(s) : '');
  };

  // Auto-start today's paper unless it's already done.
  useEffect(() => {
    if (!session && !isTodayDone()) setSession(dailySession());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = session && !isComplete(session) ? quizQuestion(allEntries, session.index, session.seed, session.tier) : null;

  const choose = (id: string) => {
    if (session && question && !isAnswered(session)) {
      if (id === question.answerID) playCorrect();
      setSession(chooseAnswer(session, id, question));
    }
  };

  const next = () => {
    if (!session) return;
    const adv = advance(session);
    if (isComplete(adv)) recordDaily(isPassed(adv));
    setSession(adv);
  };

  // ---- Results ----
  if (session && isComplete(session)) {
    const passed = isPassed(session);
    return (
      <DeviceLayout title="DAILY CHALLENGE" showBack onBack={onBack} onHome={onHome} centerHeaderText>
        <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: 'var(--lcd-page)' }}>
          {passed ? <BadgeCheck size={72} className="text-green-400" /> : <BadgeX size={72} className="text-red-400" />}
          <div className="font-retro text-3xl text-stone-100">{session.correct}/{session.length}</div>
          <div className={`font-retro text-lg tracking-widest ${passed ? 'text-green-400' : 'text-red-400'}`}>{passed ? 'PASS' : 'FAIL'}</div>
          <div className="font-mono text-xs text-stone-400 max-w-[16rem] normal-case">
            {currentStreak() > 0
              ? `Streak: ${currentStreak()} day${currentStreak() === 1 ? '' : 's'}.`
              : 'Streak reset — tomorrow is a fresh paper.'}
          </div>
          <div className="flex flex-col gap-3 mt-2 w-full max-w-[16rem]">
            <button
              onClick={onBack}
              className="w-full rounded-xl bg-stone-800 border-b-4 border-stone-950 active:translate-y-0.5 px-5 py-3 font-retro text-[0.6rem] tracking-widest text-stone-300"
            >
              EXIT
            </button>
          </div>
        </div>
      </DeviceLayout>
    );
  }

  // ---- Active question ----
  if (session && question) {
    const answered = isAnswered(session);
    const answer = byId.get(question.answerID);
    return (
      <DeviceLayout title="DAILY CHALLENGE" showBack onBack={onBack} onHome={onHome} centerHeaderText>
        <div className="relative h-full">
          <div className="h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4" style={{ backgroundColor: 'var(--lcd-page)' }}>
            <div className="flex items-center justify-between">
              <span className="font-retro text-[0.55rem] tracking-widest text-green-400">
                DAILY · {kindTopic(question.kind)}
              </span>
              <span className="font-retro text-[0.55rem] tracking-widest text-stone-400">{Math.min(session.index + 1, session.length)}/{session.length}</span>
            </div>
            <p className="font-retro text-base text-stone-100 normal-case leading-snug">{question.prompt}</p>
            <div className="flex flex-col gap-2">
              {question.optionIDs.map(id => {
                const correct = id === question.answerID;
                const chosen = session.chosenID === id;
                let cls = 'bg-stone-900/70 border-stone-700 text-stone-200';
                if (answered) {
                  if (correct) cls = 'bg-green-700/80 border-green-400 text-white';
                  else if (chosen) cls = 'bg-red-800/80 border-red-500 text-white';
                  else cls = 'bg-stone-900/40 border-stone-800 text-stone-500';
                }
                return (
                  <button
                    key={id}
                    disabled={answered}
                    onClick={() => choose(id)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left transition-colors ${cls}`}
                  >
                    <span className="flex-1 font-retro text-[0.65rem] tracking-widest">{entryName(id).toUpperCase()}</span>
                    {answered && correct && <CheckCircle2 size={18} className="text-white" />}
                    {answered && chosen && !correct && <XCircle size={18} className="text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reveal overlay */}
          {answered && answer && (
            <div className="absolute inset-0 z-40 flex items-end justify-center p-4">
              <div className="absolute inset-0 bg-black/70" />
              <div className={`relative w-full max-w-sm rounded-2xl border-2 bg-stone-900 p-4 flex flex-col gap-3 mb-2 ${session.chosenID === question.answerID ? 'border-green-700' : 'border-yellow-600'}`}>
                <div className={`font-retro text-sm tracking-widest text-center ${session.chosenID === question.answerID ? 'text-green-400' : 'text-yellow-400'}`}>
                  {session.chosenID === question.answerID ? 'CORRECT' : 'NOT QUITE'}
                </div>
                <p className="font-mono text-xs text-stone-300 normal-case leading-snug line-clamp-4">{answer.description}</p>
                <EntryTile entry={answer} onPress={() => onOpen(answer)} index={0} />
                <button onClick={() => onOpen(answer)} className="w-full flex items-center justify-center gap-1 rounded-xl bg-green-600 border-b-4 border-green-800 active:translate-y-0.5 px-3 py-2.5 font-retro text-[0.55rem] tracking-widest text-white">
                  <BookOpen size={13} /> LEARN MORE
                </button>
                <button onClick={next} className="w-full rounded-xl bg-yellow-400 border-b-4 border-yellow-600 active:translate-y-0.5 px-3 py-2.5 font-retro text-[0.55rem] tracking-widest text-amber-900">
                  {session.index === session.length - 1 ? 'SEE RESULTS' : 'NEXT QUESTION'}
                </button>
              </div>
            </div>
          )}
        </div>
      </DeviceLayout>
    );
  }

  // ---- Daily done card ----
  const streak = currentStreak();
  return (
    <DeviceLayout title="DAILY CHALLENGE" showBack onBack={onBack} onHome={onHome} centerHeaderText>
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: 'var(--lcd-page)' }}>
        <Flame size={64} className={streak > 0 ? 'text-yellow-400' : 'text-stone-600'} />
        <div className="font-retro text-lg text-stone-100">PAPER COMPLETE</div>
        <div className="font-mono text-xs text-stone-400 max-w-[16rem] normal-case">
          {streak > 0 ? `Streak: ${streak} day${streak === 1 ? '' : 's'}. Come back tomorrow.` : "Today's paper is done. A new one arrives tomorrow."}
        </div>
        <button onClick={onBack} className="rounded-xl bg-green-600 border-b-4 border-green-800 active:translate-y-0.5 px-6 py-3 font-retro text-[0.6rem] tracking-widest text-white">EXIT</button>
      </div>
    </DeviceLayout>
  );
};

export default TastingQuizScreen;
