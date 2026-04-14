'use client';
import { useState } from 'react';
import { QuizSession, QuizQuestion } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/utils';

interface QuizModalProps {
  isOpen: boolean;
  session: QuizSession | null;
  currentQuestion: QuizQuestion | null;
  isFinished: boolean;
  progress: number;
  onClose: () => void;
  onSubmitAnswer: (selected: string[]) => { correct: boolean; correctAnswers: string[] };
  onNext: () => void;
  onRecordAnswer: (questionId: string, correct: boolean) => void;
}

type Phase = 'answering' | 'feedback';

export function QuizModal({
  isOpen, session, currentQuestion, isFinished, progress,
  onClose, onSubmitAnswer, onNext, onRecordAnswer,
}: QuizModalProps) {
  const [selected, setSelected]     = useState<string[]>([]);
  const [phase, setPhase]           = useState<Phase>('answering');
  const [lastResult, setLastResult] = useState<{ correct: boolean; correctAnswers: string[] } | null>(null);

  const toggleAnswer = (answer: string) => {
    if (phase === 'feedback') return;
    if (currentQuestion?.type === 'single') {
      setSelected([answer]);
    } else {
      setSelected((prev) =>
        prev.includes(answer) ? prev.filter((a) => a !== answer) : [...prev, answer]
      );
    }
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    const result = onSubmitAnswer(selected);
    setLastResult(result);
    setPhase('feedback');
    if (currentQuestion) {
      onRecordAnswer(currentQuestion.id, result.correct);
    }
  };

  const handleNext = () => {
    setSelected([]);
    setPhase('answering');
    setLastResult(null);
    onNext();
  };

  const handleClose = () => {
    setSelected([]);
    setPhase('answering');
    setLastResult(null);
    onClose();
  };

  // ── Finished screen ──────────────────────────────────────────────────────
  if (isFinished && session) {
    const pct = Math.round((session.score / session.questions.length) * 100);
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '📚';
    const color = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'red';

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Quiz Complete!" size="sm">
        <div className="text-center py-4 flex flex-col items-center gap-6">
          <div className="text-7xl">{emoji}</div>
          <div>
            <div className="text-6xl font-black bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent mb-1">
              {session.score}/{session.questions.length}
            </div>
            <ProgressBar value={pct} color={color} className="mt-3 mb-2" />
            <p className="text-2xl font-bold text-slate-200">{pct}% Accuracy</p>
          </div>
          <Button variant="primary" size="lg" onClick={handleClose} className="w-full">
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  if (!currentQuestion || !session) return null;

  // ── Question screen ──────────────────────────────────────────────────────
  const { currentIndex, questions } = session;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      {/* Progress */}
      <div className="flex justify-between text-sm text-slate-400 mb-3">
        <span>Question {currentIndex + 1} / {questions.length}</span>
        <span>Score: {session.score}/{currentIndex}</span>
      </div>
      <ProgressBar value={progress} className="mb-6" />

      {/* Question */}
      <p className="text-xl font-bold text-slate-100 mb-6 leading-snug">{currentQuestion.text}</p>

      {/* Answer options */}
      <div className="flex flex-col gap-3 mb-8">
        {currentQuestion.allAnswers.map((answer) => {
          const isSelected  = selected.includes(answer);
          const isCorrect   = lastResult?.correctAnswers.includes(answer);
          const isWrong     = phase === 'feedback' && isSelected && !isCorrect;

          return (
            <button
              key={answer}
              onClick={() => toggleAnswer(answer)}
              className={cn(
                'w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all duration-200',
                phase === 'answering' && !isSelected &&
                  'border-violet-900/20 text-slate-300 hover:border-violet-500/40 hover:bg-violet-900/10',
                phase === 'answering' && isSelected &&
                  'border-violet-500 bg-violet-900/30 text-violet-200',
                phase === 'feedback' && isCorrect &&
                  'border-emerald-500 bg-emerald-900/30 text-emerald-200 cursor-default',
                phase === 'feedback' && isWrong &&
                  'border-red-500 bg-red-900/30 text-red-300 cursor-default',
                phase === 'feedback' && !isCorrect && !isWrong &&
                  'border-slate-700/30 text-slate-500 cursor-default',
              )}
            >
              <span className="flex items-center gap-3">
                <span className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold',
                  phase === 'answering' && isSelected ? 'border-violet-400 bg-violet-400 text-white' : 'border-slate-600',
                  phase === 'feedback' && isCorrect ? 'border-emerald-400 bg-emerald-400 text-white' : '',
                  phase === 'feedback' && isWrong   ? 'border-red-400 bg-red-400 text-white' : '',
                )}>
                  {phase === 'feedback' && isCorrect ? '✓' : phase === 'feedback' && isWrong ? '✗' : ''}
                </span>
                {answer}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback message */}
      {phase === 'feedback' && lastResult && (
        <div className={cn(
          'mb-5 px-5 py-3.5 rounded-xl border text-sm font-semibold',
          lastResult.correct
            ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-300'
            : 'bg-red-900/30 border-red-500/40 text-red-300'
        )}>
          {lastResult.correct ? '✓ Correct! Great job.' : '✗ Incorrect. Review the highlighted answers.'}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {phase === 'answering' ? (
          <>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={selected.length === 0}
              className="flex-1"
            >
              Submit Answer
            </Button>
            <Button variant="secondary" onClick={handleClose}>Quit</Button>
          </>
        ) : (
          <>
            <Button variant="primary" onClick={handleNext} className="flex-1">
              {currentIndex + 1 < questions.length ? 'Next Question →' : 'See Results'}
            </Button>
            <Button variant="secondary" onClick={handleClose}>Quit</Button>
          </>
        )}
      </div>
    </Modal>
  );
}