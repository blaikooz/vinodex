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
import { dailySession, recordDaily, isTodayDone, currentStreak, dailyMarks, dailyResultString } from '../src/services/dailyChallenge';
import { dayIndex } from '../src/services/dailyPick';
import { query as ssQuery, setQuery as ssSetQuery } from '../src/services/screenState';
import { playCorrect, playWrong } from '../src/services/sound';
import { answerHaptic } from '../src/services/haptics';

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

/** The result string and its one button (v10#3). Module-level, so it is not recreated per render. */
const ResultBlock: React.FC<{ text: string; copied: boolean; onShare: (text: string) => Promise<void> }> = ({ text, copied, onShare }) => (
  <div className="w-full max-w-[16rem] flex flex-col gap-2" data-daily-result>
    <pre className="whitespace-pre-wrap rounded-card border border-[var(--surface-line)] bg-[var(--surface-raised)] px-3 py-2 text-left font-mono text-caption normal-case leading-relaxed text-[var(--lcd-text)]">{text}</pre>
    <button
      type="button"
      onClick={() => { void onShare(text); }}
      className="dex-pressable w-full min-h-11 rounded-control bg-[var(--lcd-accent)] px-5 py-3 text-label tracking-widest text-[var(--lcd-on-accent)] shadow-elev-2"
    >
      {copied ? 'COPIED' : 'SHARE RESULT'}
    </button>
  </div>
);

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
      const right = id === question.answerID;
      if (right) playCorrect();
      else playWrong();
      answerHaptic(right);
      setSession(chooseAnswer(session, id, question));
    }
  };

  const next = () => {
    if (!session) return;
    const adv = advance(session);
    if (isComplete(adv)) recordDaily(isPassed(adv), dayIndex(), adv.marks);
    setSession(adv);
  };

  // The result string (v10#3): the date, the score, a tile per question --
  // right or wrong, never which answer -- and where to sit the same paper.
  // Copied or shared as text; no image card, by the 2026-08-30 ruling.
  const [copied, setCopied] = useState(false);
  const resultText = (marks: readonly boolean[] | null, passMark: number) =>
    marks && marks.length > 0 ? dailyResultString(dayIndex(), marks, passMark) : null;
  const shareResult = async (text: string) => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    try {
      if (typeof nav.share === 'function') {
        await nav.share({ text });
        return;
      }
    } catch {
      /* a cancelled sheet is the common path; fall through to the clipboard */
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  // ---- Results ----
  if (session && isComplete(session)) {
    const passed = isPassed(session);
    return (
      <DeviceLayout title="DAILY CHALLENGE" showBack onBack={onBack} onHome={onHome} centerHeaderText>
        <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ backgroundColor: 'var(--lcd-page)' }}>
          {passed ? <BadgeCheck size={72} className="text-[var(--livery-green)]" /> : <BadgeX size={72} className="text-[var(--livery-red)]" />}
          <div className="text-display text-[var(--lcd-text)]">{session.correct}/{session.length}</div>
          <div className={`text-title tracking-widest ${passed ? 'text-[var(--livery-green)]' : 'text-[var(--livery-red)]'}`}>{passed ? 'PASS' : 'FAIL'}</div>
          <div className="text-caption text-[var(--lcd-subtext)] max-w-[16rem] normal-case leading-relaxed">
            {currentStreak() > 0
              ? `Streak: ${currentStreak()} day${currentStreak() === 1 ? '' : 's'}.`
              : 'Streak reset — tomorrow is a fresh paper.'}
          </div>
          {resultText(session.marks, session.passMark) && <ResultBlock text={resultText(session.marks, session.passMark)!} copied={copied} onShare={shareResult} />}
          <div className="flex flex-col gap-3 mt-2 w-full max-w-[16rem]">
            <button
              onClick={onBack}
              className="dex-pressable w-full rounded-control bg-[var(--surface-raised)] border border-[var(--surface-line-strong)] px-5 py-3 text-label tracking-widest text-[var(--lcd-text)]"
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
              <span className="text-micro tracking-widest text-[var(--lcd-accent)]">
                DAILY · {kindTopic(question.kind)}
              </span>
              <span className="text-micro tracking-widest text-[var(--lcd-subtext)]">{Math.min(session.index + 1, session.length)}/{session.length}</span>
            </div>
            <p className="text-body text-[var(--lcd-text)] normal-case leading-snug">{question.prompt}</p>
            <div className="flex flex-col gap-2">
              {question.optionIDs.map(id => {
                const correct = id === question.answerID;
                const chosen = session.chosenID === id;
                let cls = 'bg-[var(--surface-raised)] border-[var(--surface-line-strong)] text-[var(--lcd-text)]';
                if (answered) {
                  if (correct) cls = 'bg-[color-mix(in_srgb,var(--livery-green)_16%,transparent)] border-[var(--livery-green)] text-[var(--lcd-text)]';
                  else if (chosen) cls = 'bg-[color-mix(in_srgb,var(--livery-red)_16%,transparent)] border-[var(--livery-red)] text-[var(--lcd-text)]';
                  else cls = 'bg-[var(--surface-raised)] border-[var(--surface-line)] text-[var(--lcd-disabled-text)]';
                }
                return (
                  <button
                    key={id}
                    disabled={answered}
                    onClick={() => choose(id)}
                    className={`dex-pressable flex items-center gap-2 rounded-card border-2 px-4 py-3 text-left ${cls}`}
                  >
                    <span className="flex-1 text-label">{entryName(id).toUpperCase()}</span>
                    {answered && correct && <CheckCircle2 size={18} className="text-[var(--livery-green)]" />}
                    {answered && chosen && !correct && <XCircle size={18} className="text-[var(--livery-red)]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reveal overlay */}
          {answered && answer && (
            <div className="absolute inset-0 z-40 flex items-end justify-center p-4">
              <div className="absolute inset-0 bg-black/70" />
              <div className={`relative w-full max-w-sm rounded-card border-2 bg-[var(--surface-raised)] shadow-elev-3 p-4 flex flex-col gap-3 mb-2 ${session.chosenID === question.answerID ? 'border-[var(--livery-green)]' : 'border-[var(--livery-amber)]'}`}>
                <div className={`text-label tracking-widest text-center ${session.chosenID === question.answerID ? 'text-[var(--livery-green)]' : 'text-[var(--livery-amber)]'}`}>
                  {session.chosenID === question.answerID ? 'CORRECT' : 'NOT QUITE'}
                </div>
                <p className="text-caption text-[var(--lcd-text)] normal-case leading-relaxed line-clamp-4">{answer.description}</p>
                <EntryTile entry={answer} onPress={() => onOpen(answer)} index={0} />
                <button onClick={() => onOpen(answer)} className="dex-pressable w-full flex items-center justify-center gap-1 rounded-control bg-[var(--lcd-accent)] px-3 py-2.5 text-label tracking-widest text-[var(--lcd-on-accent)] shadow-elev-1">
                  <BookOpen size={13} /> LEARN MORE
                </button>
                <button onClick={next} className="dex-pressable w-full rounded-control bg-[var(--surface-high)] border border-[var(--surface-line-strong)] px-3 py-2.5 text-label tracking-widest text-[var(--lcd-text)]">
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
        <Flame size={64} className={streak > 0 ? 'text-[var(--livery-amber)]' : 'text-[var(--lcd-disabled-text)]'} />
        <div className="text-title text-[var(--lcd-text)]">PAPER COMPLETE</div>
        <div className="text-caption text-[var(--lcd-subtext)] max-w-[16rem] normal-case leading-relaxed">
          {streak > 0 ? `Streak: ${streak} day${streak === 1 ? '' : 's'}. Come back tomorrow.` : "Today's paper is done. A new one arrives tomorrow."}
        </div>
        {resultText(dailyMarks(), dailySession().passMark) && <ResultBlock text={resultText(dailyMarks(), dailySession().passMark)!} copied={copied} onShare={shareResult} />}
        <button onClick={onBack} className="dex-pressable rounded-control bg-[var(--lcd-accent)] px-6 py-3 text-label tracking-widest text-[var(--lcd-on-accent)] shadow-elev-1">EXIT</button>
      </div>
    </DeviceLayout>
  );
};

export default TastingQuizScreen;
