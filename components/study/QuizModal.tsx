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
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('answering');
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
    if (currentQuestion) onRecordAnswer(currentQuestion.id, result.correct);
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

  /* ── Finished screen ── */
  if (isFinished && session) {
    const pct = Math.round((session.score / session.questions.length) * 100);
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '📚';
    const color = pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red';
    const label = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';

    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="sm">
        <div className="text-center py-2 flex flex-col items-center gap-5">
          <div className="text-5xl">{emoji}</div>
          <div className="w-full">
            <p className="text-4xl font-black tabular" style={{ color: label }}>
              {session.score}/{session.questions.length}
            </p>
            <ProgressBar value={pct} color={color} className="mt-3 mb-2" />
            <p className="text-lg font-bold text-[var(--text)]">{pct}% correct</p>
          </div>
          <Button size="lg" className="w-full" onClick={handleClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  if (!currentQuestion || !session) return null;

  const { currentIndex, questions } = session;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      {/* Progress bar */}
      <div className="flex justify-between text-xs text-[var(--text-3)] mb-2">
        <span>{currentIndex + 1} / {questions.length}</span>
        <span className="tabular">{session.score} correct</span>
      </div>
      <ProgressBar value={progress} className="mb-5" />

      {/* Question */}
      <p className="text-base font-semibold text-[var(--text)] mb-5 leading-snug">
        {currentQuestion.text}
      </p>

      {/* Answer options */}
      <div className="flex flex-col gap-2 mb-5">
        {currentQuestion.allAnswers.map((answer) => {
          const isSelected  = selected.includes(answer);
          const isCorrect   = lastResult?.correctAnswers.includes(answer);
          const isWrong     = phase === 'feedback' && isSelected && !isCorrect;

          let borderColor = 'var(--border)';
          let bgColor = 'transparent';
          let textColor = 'var(--text)';

          if (phase === 'answering' && isSelected) {
            borderColor = 'var(--accent-border)';
            bgColor = 'var(--accent-soft)';
            textColor = 'var(--text)';
          } else if (phase === 'feedback' && isCorrect) {
            borderColor = 'var(--green-border)';
            bgColor = 'var(--green-soft)';
            textColor = 'var(--green)';
          } else if (phase === 'feedback' && isWrong) {
            borderColor = 'var(--red-border)';
            bgColor = 'var(--red-soft)';
            textColor = 'var(--red)';
          } else if (phase === 'feedback') {
            textColor = 'var(--text-3)';
          }

          return (
            <button
              key={answer}
              onClick={() => toggleAnswer(answer)}
              className="w-full text-left px-4 py-3 rounded-[var(--r)] text-sm transition-all duration-150"
              style={{
                border: `1px solid ${borderColor}`,
                background: bgColor,
                color: textColor,
                cursor: phase === 'feedback' ? 'default' : 'pointer',
              }}
            >
              <span className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-all"
                  style={{
                    borderColor: phase === 'answering' && isSelected ? 'var(--accent)' :
                                 phase === 'feedback' && isCorrect ? 'var(--green)' :
                                 phase === 'feedback' && isWrong ? 'var(--red)' : 'var(--border-2)',
                    background: phase === 'answering' && isSelected ? 'var(--accent)' :
                                phase === 'feedback' && isCorrect ? 'var(--green)' :
                                phase === 'feedback' && isWrong ? 'var(--red)' : 'transparent',
                    color: 'white',
                  }}
                >
                  {phase === 'feedback' && isCorrect ? '✓' : phase === 'feedback' && isWrong ? '✗' : ''}
                </span>
                {answer}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {phase === 'feedback' && lastResult && (
        <div
          className="mb-4 px-4 py-3 rounded-[var(--r)] text-sm font-medium"
          style={{
            background: lastResult.correct ? 'var(--green-soft)' : 'var(--red-soft)',
            border: `1px solid ${lastResult.correct ? 'var(--green-border)' : 'var(--red-border)'}`,
            color: lastResult.correct ? 'var(--green)' : 'var(--red)',
          }}
        >
          {lastResult.correct ? '✓ Correct!' : '✗ Incorrect — check the highlighted answers.'}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        {phase === 'answering' ? (
          <>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={selected.length === 0}
              className="flex-1"
            >
              Submit
            </Button>
            <Button variant="ghost" onClick={handleClose} size="md">
              Quit
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" onClick={handleNext} className="flex-1">
              {currentIndex + 1 < questions.length ? 'Next →' : 'See results'}
            </Button>
            <Button variant="ghost" onClick={handleClose} size="md">
              Quit
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}