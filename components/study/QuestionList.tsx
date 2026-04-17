"use client";
import { Question } from "@/types";
import { QuestionItem } from "./QuestionItem";
import { Button } from "@/components/ui/Button";

interface QuestionListProps {
  questions: Question[];
  allQuestionsInCategory: Question[];
  currentCategoryId?: string;
  onDelete: (id: string) => void;
  onEdit: (question: Question) => void;
  onSingleQuiz: (questionId: string) => void;
  onAddQuestion: () => void;
  onMasteryQuiz: () => void;
  onLocalQuiz: () => void;
  onReview: () => void;
  isLoggedIn: boolean;
  loading?: boolean;
  categoryName?: string;
}

export function QuestionList({
  questions,
  onDelete,
  onEdit,
  onSingleQuiz,
  onAddQuestion,
  onMasteryQuiz,
  onLocalQuiz,
  onReview,
  isLoggedIn,
  loading,
  categoryName,
}: QuestionListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-[var(--r)] animate-pulse"
            style={{ background: 'var(--surface-2)' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            {categoryName ? categoryName : 'Questions'}
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full tabular font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
          >
            {questions.length}
          </span>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {questions.length > 0 && (
            <>
              <Button variant="primary" size="sm" onClick={onMasteryQuiz}>Mastery</Button>
              <Button variant="secondary" size="sm" onClick={onLocalQuiz}>Local</Button>
              {isLoggedIn && (
                <Button variant="secondary" size="sm" onClick={onReview}>Review</Button>
              )}
            </>
          )}
          {isLoggedIn && (
            <Button variant="secondary" size="sm" onClick={onAddQuestion}>
              + Question
            </Button>
          )}
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-3)]">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm font-medium text-[var(--text-2)] mb-1">No questions here yet</p>
          {isLoggedIn && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={onAddQuestion}>
              + Add first question
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          {questions.map((q) => (
            <QuestionItem
              key={q.id}
              question={q}
              onDelete={onDelete}
              onQuiz={onSingleQuiz}
              onEdit={onEdit}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}