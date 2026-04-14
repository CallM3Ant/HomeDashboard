'use client';
import { useState, useCallback } from 'react';
import { Question, QuizMode, QuizQuestion, QuizSession } from '@/types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getQuestionsForMode(questions: Question[], mode: QuizMode): Question[] {
  const now = new Date();
  switch (mode) {
    case 'smart':
      // Questions due for review (next_review <= now) or never attempted
      return questions.filter((q) => {
        if (!q.stats) return true; // never attempted
        return new Date(q.stats.next_review) <= now;
      });
    case 'review':
      // Only questions in the review pool
      return questions.filter((q) => q.stats?.in_review_pool);
    case 'all':
    default:
      return [...questions];
  }
}

function buildQuizQuestion(q: Question, shuffleAnswers: boolean): QuizQuestion {
  const all = [...q.correct, ...(q.incorrect ?? [])];
  return {
    ...q,
    allAnswers: shuffleAnswers ? shuffle(all) : all,
  };
}

export function useQuiz() {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const startQuiz = useCallback(
    (questions: Question[], mode: QuizMode, shuffleAnswers = true) => {
      const pool = getQuestionsForMode(questions, mode);
      if (pool.length === 0) return { error: getEmptyMessage(mode) };

      const shuffledPool = shuffle(pool);
      const quizQuestions: QuizQuestion[] = shuffledPool.map((q) =>
        buildQuizQuestion(q, shuffleAnswers)
      );

      setSession({
        questions: quizQuestions,
        currentIndex: 0,
        score: 0,
        answers: {},
      });
      setIsOpen(true);
      return { error: null };
    },
    []
  );

  const submitAnswer = useCallback(
    (selected: string[]): { correct: boolean; correctAnswers: string[] } => {
      if (!session) return { correct: false, correctAnswers: [] };
      const question = session.questions[session.currentIndex];
      const correctAnswers = question.correct;

      const isCorrect = evaluateAnswer(question, selected);

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          score: isCorrect ? prev.score + 1 : prev.score,
          answers: {
            ...prev.answers,
            [question.id]: { selected, correct: isCorrect },
          },
        };
      });

      return { correct: isCorrect, correctAnswers };
    },
    [session]
  );

  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, currentIndex: prev.currentIndex + 1 };
    });
  }, []);

  const closeQuiz = useCallback(() => {
    setIsOpen(false);
    setSession(null);
  }, []);

  const currentQuestion = session?.questions[session.currentIndex] ?? null;
  const isFinished = session ? session.currentIndex >= session.questions.length : false;
  const progress = session
    ? Math.round((session.currentIndex / session.questions.length) * 100)
    : 0;

  return {
    session,
    isOpen,
    currentQuestion,
    isFinished,
    progress,
    startQuiz,
    submitAnswer,
    nextQuestion,
    closeQuiz,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function evaluateAnswer(question: Question, selected: string[]): boolean {
  if (question.type === 'single') {
    return selected.length === 1 && question.correct.includes(selected[0]);
  }
  // multiple: must match all correct answers exactly
  const sortedSelected = [...selected].sort();
  const sortedCorrect = [...question.correct].sort();
  return (
    sortedSelected.length === sortedCorrect.length &&
    sortedSelected.every((v, i) => v === sortedCorrect[i])
  );
}

function getEmptyMessage(mode: QuizMode): string {
  switch (mode) {
    case 'smart': return 'No questions due for review right now. Check back later!';
    case 'review': return 'Your review pool is empty. Great work!';
    default: return 'No questions available in this category.';
  }
}