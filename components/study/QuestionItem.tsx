'use client';
import { Question } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface QuestionItemProps {
  question: Question;
  onDelete: (id: string) => void;
  onQuiz: (id: string) => void;
  isLoggedIn: boolean;
}

export function QuestionItem({ question, onDelete, onQuiz, isLoggedIn }: QuestionItemProps) {
  const stats = question.stats;
  const accuracy = stats && stats.total_attempts > 0
    ? Math.round((stats.correct_count / stats.total_attempts) * 100)
    : null;

  const accuracyVariant = accuracy === null ? 'default' : accuracy >= 80 ? 'success' : accuracy >= 50 ? 'warning' : 'error';

  return (
    <div className="group relative bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-xl p-5 transition-all duration-200 hover:border-violet-500/30 hover:translate-x-1 overflow-hidden">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-xl" />

      <div className="flex items-start justify-between gap-4">
        {/* Question text + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-100 mb-2 leading-snug">{question.text}</p>

          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
            <span className="border border-slate-700/50 rounded-lg px-2 py-0.5 capitalize">
              {question.type === 'single' ? '🔘 Single' : '☑️ Multiple'}
            </span>
            <span className="border border-slate-700/50 rounded-lg px-2 py-0.5">
              {question.correct.length} correct answer{question.correct.length !== 1 ? 's' : ''}
            </span>
            {question.tags?.map((tag) => (
              <span key={tag} className="text-violet-500/70">#{tag}</span>
            ))}
          </div>

          {/* Spaced repetition badge */}
          {isLoggedIn && stats && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge variant={accuracyVariant}>
                {accuracy !== null ? `${accuracy}% accuracy` : 'Not attempted'}
              </Badge>
              <Badge variant="default">
                {stats.total_attempts} attempt{stats.total_attempts !== 1 ? 's' : ''}
              </Badge>
              {stats.in_review_pool && (
                <Badge variant="warning">📌 Review pool</Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="sm" onClick={() => onQuiz(question.id)}>
            Practice
          </Button>
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(question.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              🗑
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}