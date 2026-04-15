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
      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-[#1e2749]/60 rounded-xl animate-pulse border border-violet-900/10"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-slate-200">
          Questions {categoryName ? `in ${categoryName}` : ""}
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({questions.length})
          </span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          {questions.length > 0 && (
            <>
              <Button variant="primary" size="sm" onClick={onMasteryQuiz}>
                📚 Mastery Quiz
              </Button>
              <Button variant="secondary" size="sm" onClick={onLocalQuiz}>
                📝 Local Quiz
              </Button>
              {isLoggedIn && (
                <Button variant="secondary" size="sm" onClick={onReview}>
                  📌 Review
                </Button>
              )}
            </>
          )}
          {isLoggedIn && (
            <Button variant="secondary" size="sm" onClick={onAddQuestion}>
              + Add Question
            </Button>
          )}
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <p className="text-3xl mb-3">💬</p>
          <p className="font-semibold mb-1">No questions here yet</p>
          {isLoggedIn && (
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={onAddQuestion}
            >
              + Add First Question
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
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