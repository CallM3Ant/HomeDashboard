'use client';
import { Category } from '@/types';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface CategoryCardProps {
  category: Category;
  onNavigate: (category: Category) => void;
  onMasteryQuiz: (categoryId: string) => void;
  onReview: (categoryId: string) => void;
  onLocalQuiz: (categoryId: string) => void;
  isLoggedIn: boolean;
}

export function CategoryCard({ category, onNavigate, onMasteryQuiz, onReview, onLocalQuiz, isLoggedIn }: CategoryCardProps) {
  const total = category.totalQuestions ?? 0;
  const stats = category.stats;
  const accuracy = stats?.accuracy ?? 0;
  const attempted = stats?.attempted ?? 0;
  const dueForReview = stats?.dueForReview ?? 0;
  const subCount = category.subcategories?.length ?? 0;

  const accuracyColor = accuracy >= 80 ? 'emerald' : accuracy >= 50 ? 'amber' : 'red';

  return (
    <div
      className="group relative bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-900/30 hover:border-violet-500/40 overflow-hidden"
      onClick={() => onNavigate(category)}
    >
      {/* Hover accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <h3 className="text-lg font-bold text-slate-100 leading-snug flex-1">{category.name}</h3>
        <span className="text-xl shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          {subCount > 0 ? '📂' : '📋'}
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-2 mb-5 text-sm text-slate-400">
        <div className="flex justify-between">
          <span>Questions</span>
          <span className="text-violet-400 font-semibold">{total}</span>
        </div>
        {subCount > 0 && (
          <div className="flex justify-between">
            <span>Subcategories</span>
            <span className="text-violet-400 font-semibold">{subCount}</span>
          </div>
        )}
        {isLoggedIn && attempted > 0 && (
          <>
            <div className="flex justify-between">
              <span>Attempted</span>
              <span className="text-slate-300 font-semibold">{attempted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Accuracy</span>
              <span className={`font-bold ${accuracy >= 80 ? 'text-emerald-400' : accuracy >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {accuracy}%
              </span>
            </div>
            <ProgressBar value={accuracy} color={accuracyColor} className="mt-1" />
          </>
        )}
        {isLoggedIn && dueForReview > 0 && (
          <div className="flex justify-between">
            <span>In review pool</span>
            <span className="text-amber-400 font-semibold">{dueForReview}</span>
          </div>
        )}
      </div>

      {/* Actions — stop propagation so clicking buttons doesn't also navigate */}
      {total > 0 && (
        <div
          className="flex gap-2 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="primary"
            size="sm"
            onClick={() => onMasteryQuiz(category.id)}
          >
            📚 Mastery
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onLocalQuiz(category.id)}
          >
            📝 Local
          </Button>
          {isLoggedIn && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReview(category.id)}
            >
              📌 Review
            </Button>
          )}
        </div>
      )}
    </div>
  );
}