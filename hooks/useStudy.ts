"use client";
import { useState, useCallback, useEffect } from "react";
import { Category, Question, GlobalStats } from "@/types";

type CategoryStatsMap = Record<string, {
  total: number; attempted: number; mastered: number;
  masteryPercent: number; accuracy: number;
}>;

function applyStatsToTree(cats: Category[], statsMap: CategoryStatsMap): Category[] {
  return cats.map(cat => {
    const annotated: Category = {
      ...cat,
      subcategories: cat.subcategories ? applyStatsToTree(cat.subcategories, statsMap) : [],
    };

    // Compute rolled-up stats (self + all subcategory descendants)
    const allIds = collectAllIds(annotated);
    let total = 0, attempted = 0, mastered = 0, totalCorrect = 0, totalAttempts = 0;
    for (const id of allIds) {
      const s = statsMap[id];
      if (s) {
        total += s.total;
        attempted += s.attempted;
        mastered += s.mastered;
        // Approximate total correct from accuracy and attempts
        totalCorrect += Math.round((s.accuracy / 100) * s.attempted);
        totalAttempts += s.attempted;
      }
    }

    if (attempted > 0 || total > 0) {
      const catTotal = cat.totalQuestions ?? total;
      annotated.stats = {
        accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
        attempted,
        mastered,
        masteryPercent: catTotal > 0 ? Math.round((mastered / catTotal) * 100) : 0,
        dueForReview: 0,
      };
    }

    return annotated;
  });
}

function collectAllIds(cat: Category): string[] {
  const ids = [cat.id];
  for (const sub of cat.subcategories ?? []) {
    ids.push(...collectAllIds(sub));
  }
  return ids;
}

export function useStudy() {
  const [categoriesRaw, setCategoriesRaw] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStatsMap>({});
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [search, setSearch] = useState("");

  // Merge categories with stats
  const categories = categoryStats && Object.keys(categoryStats).length > 0
    ? applyStatsToTree(categoriesRaw, categoryStats)
    : categoriesRaw;

  const loadCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const { data } = await res.json();
        setCategoriesRaw(data);
      }
    } finally {
      setLoadingCats(false);
    }
  }, []);

  const loadCategoryStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats/categories");
      if (res.ok) {
        const { data } = await res.json();
        setCategoryStats(data || {});
      }
    } catch {
      // Guest or network error — no stats
    }
  }, []);

  const loadQuestions = useCallback(async (categoryId: string, includeSubs = true) => {
    setLoadingQuestions(true);
    try {
      const res = await fetch(
        `/api/questions?categoryId=${categoryId}&includeSubcategories=${includeSubs}`
      );
      if (res.ok) {
        const { data } = await res.json();
        setQuestions(data);
      }
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const { data } = await res.json();
        setStats(data);
      }
    } catch {
      // Guest - no stats
    }
  }, []);

  const navigateTo = useCallback(
    (category: Category | null, crumb: Category[]) => {
      setCurrentCategory(category);
      setBreadcrumb(crumb);
      setSearch("");
      if (category) {
        loadQuestions(category.id, true);
      } else {
        setQuestions([]);
      }
    },
    [loadQuestions]
  );

  const goHome = useCallback(() => {
    setCurrentCategory(null);
    setBreadcrumb([]);
    setQuestions([]);
    setSearch("");
  }, []);

  const addQuestion = useCallback(
    async (data: {
      category_id: string; text: string; type: "single" | "multiple";
      correct: string[]; incorrect: string[]; difficulty: number; tags: string[];
    }): Promise<{ ok: boolean; error?: string }> => {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        if (currentCategory) await loadQuestions(currentCategory.id, true);
        await Promise.all([loadCategories(), loadCategoryStats()]);
        return { ok: true };
      }
      return { ok: false, error: json.error };
    },
    [currentCategory, loadQuestions, loadCategories, loadCategoryStats]
  );

  const deleteQuestion = useCallback(
    async (questionId: string): Promise<{ ok: boolean; error?: string }> => {
      const res = await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        await Promise.all([loadCategories(), loadCategoryStats()]);
        return { ok: true };
      }
      const json = await res.json();
      return { ok: false, error: json.error };
    },
    [loadCategories, loadCategoryStats]
  );

  const addCategory = useCallback(
    async (name: string, parentId: string | null): Promise<{ ok: boolean; error?: string }> => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id: parentId }),
      });
      const json = await res.json();
      if (res.ok) {
        await loadCategories();
        return { ok: true };
      }
      return { ok: false, error: json.error };
    },
    [loadCategories]
  );

  const recordAnswer = useCallback(
    async (questionId: string, correct: boolean) => {
      try {
        await fetch(`/api/stats/${questionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correct }),
        });
        await Promise.all([loadStats(), loadCategoryStats()]);
      } catch {
        // Guest or network error
      }
    },
    [loadStats, loadCategoryStats]
  );

  const filteredQuestions = search
    ? questions.filter(
        (q) =>
          q.text.toLowerCase().includes(search.toLowerCase()) ||
          q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : questions;

  const currentSubcategories = currentCategory
    ? findSubcategories(categories, currentCategory.id)
    : categories;

  useEffect(() => {
    loadCategories();
    loadStats();
    loadCategoryStats();
  }, [loadCategories, loadStats, loadCategoryStats]);

  return {
    categories,
    currentCategory,
    currentSubcategories,
    questions: filteredQuestions,
    allQuestions: questions,
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
    loadStats,
    loadCategories,
    loadCategoryStats,
    loadQuestions,
  };
}

function findSubcategories(tree: Category[], parentId: string): Category[] {
  for (const cat of tree) {
    if (cat.id === parentId) return cat.subcategories ?? [];
    if (cat.subcategories?.length) {
      const found = findSubcategories(cat.subcategories, parentId);
      if (found.length > 0) return found;
    }
  }
  return [];
}