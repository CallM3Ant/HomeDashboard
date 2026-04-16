"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudy } from "@/hooks/useStudy";
import { useQuiz } from "@/hooks/useQuiz";
import { useSettings } from "@/hooks/useSettings";
import { useToastContext } from "@/components/ui/Toast";

import { Header } from "@/components/study/Header";
import { Breadcrumb } from "@/components/study/Breadcrumb";
import { CategoryGrid } from "@/components/study/CategoryGrid";
import { QuestionList } from "@/components/study/QuestionList";
import { StatsPanel } from "@/components/study/StatsPanel";
import { HierarchyPanel } from "@/components/study/HierarchyPanel";
import { AddQuestionModal } from "@/components/study/AddQuestionModal";
import { EditQuestionModal } from "@/components/study/Editquestionmodal";
import { SettingsModal } from "@/components/study/SettingsModal";
import { QuizModal } from "@/components/study/QuizModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

import { Category, Question } from "@/types";

export default function StudyPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToastContext();
  const { settings, updateSettings } = useSettings(authLoading ? undefined : user?.id ?? null);

  const {
    categories,
    currentCategory,
    currentSubcategories,
    questions,
    stats,
    breadcrumb,
    loadingCats,
    loadingQuestions,
    search,
    setSearch,
    navigateTo,
    goHome,
    addQuestion,
    deleteQuestion,
    addCategory,
    recordAnswer,
    loadCategories,
    loadStats,
  } = useStudy();

  const {
    session,
    isOpen: quizOpen,
    currentQuestion,
    isFinished,
    progress,
    startQuiz,
    submitAnswer,
    nextQuestion,
    closeQuiz,
  } = useQuiz();

  // ─── Modal state ──────────────────────────────────────────────────────────
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  // Rename category state
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState("");

  // ─── Navigation ──────────────────────────────────────────────────────────
  const handleNavigate = useCallback(
    (category: Category) => {
      navigateTo(category, [...breadcrumb, category]);
    },
    [navigateTo, breadcrumb]
  );

  // ─── Quiz helpers ─────────────────────────────────────────────────────────
  const startQuizForCategory = useCallback(
    async (categoryId: string, mode: "all" | "review" | "smart", includeSubs: boolean) => {
      try {
        const res = await fetch(
          `/api/questions?categoryId=${categoryId}&includeSubcategories=${includeSubs}`
        );
        if (!res.ok) throw new Error("Failed to load questions");
        const { data } = await res.json();
        const result = startQuiz(data ?? [], mode, settings.shuffleAnswers);
        if (result?.error) addToast(result.error, "warning");
      } catch {
        addToast("Failed to load questions", "error");
      }
    },
    [startQuiz, addToast, settings.shuffleAnswers]
  );

  const handleMasteryQuiz = useCallback(
    (categoryId: string) =>
      startQuizForCategory(categoryId, "all", settings.includeSubcategoriesInMastery),
    [startQuizForCategory, settings.includeSubcategoriesInMastery]
  );
  const handleLocalQuiz = useCallback(
    (categoryId: string) => startQuizForCategory(categoryId, "all", false),
    [startQuizForCategory]
  );
  const handleReviewQuiz = useCallback(
    (categoryId: string) => startQuizForCategory(categoryId, "review", true),
    [startQuizForCategory]
  );

  const handleCurrentMasteryQuiz = useCallback(() => {
    if (!currentCategory) return;
    handleMasteryQuiz(currentCategory.id);
  }, [currentCategory, handleMasteryQuiz]);

  const handleCurrentLocalQuiz = useCallback(() => {
    const localQuestions = questions.filter((q) => q.category_id === currentCategory?.id);
    if (localQuestions.length === 0) {
      addToast("No questions directly in this category", "warning");
      return;
    }
    const result = startQuiz(localQuestions, "all", settings.shuffleAnswers);
    if (result?.error) addToast(result.error, "warning");
  }, [questions, currentCategory, startQuiz, addToast, settings.shuffleAnswers]);

  const handleCurrentReview = useCallback(() => {
    const pool = questions.filter((q) => q.stats?.in_review_pool);
    if (pool.length === 0) {
      addToast("Your review pool is empty — great work!", "info");
      return;
    }
    const result = startQuiz(pool, "all", settings.shuffleAnswers);
    if (result?.error) addToast(result.error, "warning");
  }, [questions, startQuiz, addToast, settings.shuffleAnswers]);

  const handleSingleQuiz = useCallback(
    (questionId: string) => {
      const q = questions.find((x) => x.id === questionId);
      if (!q) return;
      const result = startQuiz([q], "all", settings.shuffleAnswers);
      if (result?.error) addToast(result.error, "warning");
    },
    [questions, startQuiz, addToast, settings.shuffleAnswers]
  );

  // ─── Delete question ──────────────────────────────────────────────────────
  const handleDeleteQuestion = useCallback(
    async (id: string) => {
      if (!confirm("Delete this question? This cannot be undone.")) return;
      const { ok, error } = await deleteQuestion(id);
      if (ok) addToast("Question deleted", "success");
      else addToast(error ?? "Failed to delete", "error");
    },
    [deleteQuestion, addToast]
  );

  // ─── Edit question ────────────────────────────────────────────────────────
  const handleEditQuestion = useCallback(
    async (
      id: string,
      data: { text: string; type: "single" | "multiple"; correct: string[]; incorrect: string[] }
    ) => {
      try {
        const res = await fetch(`/api/questions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          addToast("Question updated", "success");
          await loadCategories();
          return { ok: true };
        }
        const json = await res.json();
        return { ok: false, error: json.error };
      } catch {
        return { ok: false, error: "Network error" };
      }
    },
    [loadCategories, addToast]
  );

  // ─── Add question ─────────────────────────────────────────────────────────
  const handleAddQuestion = useCallback(
    async (data: {
      category_id: string;
      text: string;
      type: "single" | "multiple";
      correct: string[];
      incorrect: string[];
    }) => {
      const result = await addQuestion({
        ...data,
        difficulty: 1,
        tags: [],
      });
      if (result.ok) addToast("Question added!", "success");
      return result;
    },
    [addQuestion, addToast]
  );

  // ─── Add category ─────────────────────────────────────────────────────────
  const handleAddCategory = useCallback(async () => {
    setCatError("");
    if (!newCategoryName.trim()) {
      setCatError("Name is required");
      return;
    }
    setCatLoading(true);
    const { ok, error } = await addCategory(
      newCategoryName.trim(),
      currentCategory?.id ?? null
    );
    setCatLoading(false);
    if (ok) {
      addToast("Category created!", "success");
      setNewCategoryName("");
      setCatError("");
      setAddCategoryOpen(false);
    } else {
      setCatError(error ?? "Failed to create category");
    }
  }, [newCategoryName, addCategory, currentCategory, addToast]);

  // ─── Rename category ──────────────────────────────────────────────────────
  const openRename = useCallback((categoryId: string, currentName: string) => {
    setRenameTarget({ id: categoryId, name: currentName });
    setRenameName(currentName);
    setRenameError("");
    setRenameOpen(true);
  }, []);

  const handleRenameCategory = useCallback(async () => {
    if (!renameTarget) return;
    setRenameError("");
    if (!renameName.trim()) {
      setRenameError("Name is required");
      return;
    }
    setRenameLoading(true);
    try {
      const res = await fetch(`/api/categories/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      });
      setRenameLoading(false);
      if (res.ok) {
        addToast("Category renamed", "success");
        setRenameOpen(false);
        await loadCategories();
      } else {
        const json = await res.json();
        setRenameError(json.error ?? "Failed to rename");
      }
    } catch {
      setRenameLoading(false);
      setRenameError("Network error");
    }
  }, [renameTarget, renameName, loadCategories, addToast]);

  // ─── Delete category ──────────────────────────────────────────────────────
  const handleDeleteCategory = useCallback(
    async (categoryId: string, name: string) => {
      if (
        !confirm(
          `Delete "${name}" and ALL its subcategories and questions? This cannot be undone.`
        )
      )
        return;
      try {
        const res = await fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
        if (res.ok) {
          addToast("Category deleted", "success");
          if (currentCategory?.id === categoryId) goHome();
          await loadCategories();
        } else {
          const json = await res.json();
          addToast(json.error ?? "Failed to delete", "error");
        }
      } catch {
        addToast("Failed to delete category", "error");
      }
    },
    [currentCategory, goHome, loadCategories, addToast]
  );

  // ─── Move category ────────────────────────────────────────────────────────
  const handleMoveCategory = useCallback(
    async (categoryId: string, newParentId: string | null) => {
      try {
        const res = await fetch(`/api/categories/${categoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parent_id: newParentId }),
        });
        if (res.ok) {
          addToast("Category moved", "success");
          await loadCategories();
        } else {
          const json = await res.json();
          addToast(json.error ?? "Failed to move category", "error");
        }
      } catch {
        addToast("Failed to move category", "error");
      }
    },
    [loadCategories, addToast]
  );

  // ─── Loading state ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Header user={user} onSettings={() => setSettingsOpen(true)} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8">
        {/* ── Left: main content ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Search + actions bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  currentCategory ? "Search questions…" : "Search categories…"
                }
                className="w-full bg-[#1e2749]/80 border border-violet-900/20 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
            {isLoggedIn && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAddCategoryOpen(true)}
              >
                + Category
              </Button>
            )}
          </div>

          {/* Breadcrumb */}
          <Breadcrumb
            breadcrumb={breadcrumb}
            onNavigate={(cat, crumb) => {
              if (!cat) goHome();
              else navigateTo(cat, crumb);
            }}
          />

          {/* Category grid */}
          {currentSubcategories.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-200 mb-4">
                {currentCategory
                  ? `${currentCategory.name} — Subcategories`
                  : "All Categories"}
              </h2>
              <CategoryGrid
                categories={currentSubcategories}
                onNavigate={handleNavigate}
                onMasteryQuiz={handleMasteryQuiz}
                onReview={handleReviewQuiz}
                onLocalQuiz={handleLocalQuiz}
                onAddCategory={() => setAddCategoryOpen(true)}
                onRenameCategory={openRename}
                onDeleteCategory={handleDeleteCategory}
                isLoggedIn={isLoggedIn}
                loading={loadingCats}
              />
            </section>
          )}

          {/* Question list */}
          {currentCategory && (
            <div className="bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700 opacity-60" />
              <QuestionList
                questions={questions}
                allQuestionsInCategory={questions}
                currentCategoryId={currentCategory.id}
                onDelete={handleDeleteQuestion}
                onEdit={(q) => setEditQuestion(q)}
                onSingleQuiz={handleSingleQuiz}
                onAddQuestion={() => setAddQuestionOpen(true)}
                onMasteryQuiz={handleCurrentMasteryQuiz}
                onLocalQuiz={handleCurrentLocalQuiz}
                onReview={handleCurrentReview}
                isLoggedIn={isLoggedIn}
                loading={loadingQuestions}
                categoryName={currentCategory.name}
              />
            </div>
          )}

          {/* Empty state */}
          {!currentCategory && currentSubcategories.length === 0 && !loadingCats && (
            <div className="text-center py-20 text-slate-500">
              <p className="text-5xl mb-4">📚</p>
              <p className="text-xl font-bold mb-2 text-slate-300">No content yet</p>
              <p className="text-sm mb-6">
                {isLoggedIn
                  ? "Click + Category to create your first category."
                  : "Sign in to start creating categories and questions."}
              </p>
              {isLoggedIn && (
                <Button variant="primary" onClick={() => setAddCategoryOpen(true)}>
                  + Create Category
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ── Right: sidebar ─────────────────────────────────────────────── */}
        <aside className="flex flex-col gap-6">
          <StatsPanel stats={stats} isLoggedIn={isLoggedIn} />

          {/* Category Hierarchy */}
          <div className="bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700 opacity-40" />
            <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
              🗂️ Hierarchy
              {isLoggedIn && (
                <span className="text-[10px] text-slate-600 font-normal">
                  drag to reorder
                </span>
              )}
            </h2>
            <HierarchyPanel
              categories={categories}
              currentCategoryId={currentCategory?.id ?? null}
              onNavigate={(cat) => navigateTo(cat, [cat])}
              onGoHome={goHome}
              onMoveCategory={isLoggedIn ? handleMoveCategory : undefined}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </aside>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      <AddQuestionModal
        isOpen={addQuestionOpen}
        onClose={() => setAddQuestionOpen(false)}
        onSubmit={handleAddQuestion}
        categories={categories}
        defaultCategoryId={currentCategory?.id}
      />

      <EditQuestionModal
        isOpen={!!editQuestion}
        question={editQuestion}
        onClose={() => setEditQuestion(null)}
        onSave={handleEditQuestion}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={updateSettings}
        isLoggedIn={isLoggedIn}
      />

      {/* Add Category modal */}
      <Modal
        isOpen={addCategoryOpen}
        onClose={() => {
          setAddCategoryOpen(false);
          setNewCategoryName("");
          setCatError("");
        }}
        title="Add Category"
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Category Name
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
              }}
              placeholder="e.g. Organic Chemistry"
              autoFocus
              className="bg-[#0f0f23] border border-violet-900/30 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
            {currentCategory && (
              <p className="text-xs text-slate-600">
                Will be created inside:{" "}
                <strong className="text-slate-500">{currentCategory.name}</strong>
              </p>
            )}
          </div>
          {catError && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3">
              {catError}
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setAddCategoryOpen(false);
                setNewCategoryName("");
                setCatError("");
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" loading={catLoading} onClick={handleAddCategory}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename Category modal */}
      <Modal
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        title={`Rename "${renameTarget?.name}"`}
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              New Name
            </label>
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameCategory();
              }}
              autoFocus
              className="bg-[#0f0f23] border border-violet-900/30 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
          {renameError && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-3">
              {renameError}
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={renameLoading}
              onClick={handleRenameCategory}
            >
              Rename
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quiz */}
      <QuizModal
        isOpen={quizOpen}
        session={session}
        currentQuestion={currentQuestion}
        isFinished={isFinished}
        progress={progress}
        onClose={closeQuiz}
        onSubmitAnswer={submitAnswer}
        onNext={nextQuestion}
        onRecordAnswer={recordAnswer}
      />
    </div>
  );
}