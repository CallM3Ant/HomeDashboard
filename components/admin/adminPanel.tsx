'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Category, Question } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminPanelProps {
  username: string;
}

interface MigrationStatus {
  migrated: boolean;
  sql: string;
  message: string;
}

interface QuestionFormData {
  text: string;
  type: 'single' | 'multiple';
  correct: string[];
  incorrect: string[];
}

// ─── Tiny helper components ───────────────────────────────────────────────────

function Spinner() {
  return <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-xs px-2 py-1 rounded bg-violet-700/40 hover:bg-violet-600/50 text-violet-300 transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy SQL'}
    </button>
  );
}

// ─── Question Form (shared by Add + Edit) ─────────────────────────────────────

function QuestionForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: QuestionFormData;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [text, setText] = useState(initial?.text ?? '');
  const [type, setType] = useState<'single' | 'multiple'>(initial?.type ?? 'single');
  const [correct, setCorrect] = useState<string[]>(initial?.correct ?? ['']);
  const [incorrect, setIncorrect] = useState<string[]>(initial?.incorrect ?? ['', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError('');
    const c = correct.map(s => s.trim()).filter(Boolean);
    const w = incorrect.map(s => s.trim()).filter(Boolean);
    if (!text.trim()) return setError('Question text is required');
    if (c.length === 0) return setError('At least one correct answer is required');
    if (type === 'single' && c.length > 1) return setError('Single choice needs exactly one correct answer');
    setLoading(true);
    try { await onSubmit({ text: text.trim(), type, correct: c, incorrect: w }); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Question *</label>
        <textarea
          value={text} onChange={e => setText(e.target.value)} rows={3}
          className="w-full bg-[#0d0f1e] border border-violet-900/30 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-violet-500 resize-none"
          placeholder="Enter question text…"
        />
      </div>

      <div className="flex gap-2">
        {(['single', 'multiple'] as const).map(t => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
              type === t ? 'bg-violet-600/30 border-violet-500 text-violet-300' : 'border-violet-900/20 text-slate-500 hover:border-violet-700/40'
            }`}>{t === 'single' ? '🔘 Single' : '☑️ Multiple'}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-semibold text-emerald-400/80 uppercase tracking-widest mb-1.5">
          Correct Answer{type === 'multiple' ? 's' : ''} *
        </label>
        {correct.map((v, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <input value={v} onChange={e => { const n=[...correct]; n[i]=e.target.value; setCorrect(n); }}
              className="flex-1 bg-[#0d0f1e] border border-emerald-900/30 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              placeholder={`Correct ${i+1}`} />
            {type === 'multiple' && correct.length > 1 && (
              <button onClick={() => setCorrect(correct.filter((_,j)=>j!==i))} className="text-red-400 px-2 hover:text-red-300">✕</button>
            )}
          </div>
        ))}
        {type === 'multiple' && (
          <button onClick={() => setCorrect([...correct,''])} className="text-xs text-emerald-400 hover:text-emerald-300 mt-0.5">+ Add correct</button>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-red-400/80 uppercase tracking-widest mb-1.5">Wrong Answers</label>
        {incorrect.map((v, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <input value={v} onChange={e => { const n=[...incorrect]; n[i]=e.target.value; setIncorrect(n); }}
              className="flex-1 bg-[#0d0f1e] border border-red-900/30 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-red-700/50"
              placeholder={`Wrong ${i+1}`} />
            <button onClick={() => setIncorrect(incorrect.filter((_,j)=>j!==i))} className="text-red-400 px-2 hover:text-red-300">✕</button>
          </div>
        ))}
        <button onClick={() => setIncorrect([...incorrect,''])} className="text-xs text-red-400 hover:text-red-300 mt-0.5">+ Add wrong</button>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-violet-900/30 text-slate-400 hover:text-slate-200 text-sm transition-colors">Cancel</button>
        <button onClick={handle} disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
          {loading && <Spinner />}{submitLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ isOpen, onClose, title, children, size = 'md' }: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm'|'md'|'lg'|'xl';
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { document.addEventListener('keydown', h); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`relative w-full ${widths[size]} bg-gradient-to-br from-[#1a1f3a] to-[#131929] border border-violet-900/30 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700" />
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-lg font-bold text-slate-100">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-violet-900/20 transition-colors">✕</button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Question Row ──────────────────────────────────────────────────────────────

function QuestionRow({ q, onEdit, onDelete }: {
  q: Question; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="group flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
      <span className="mt-0.5 text-[10px] font-mono text-slate-600 border border-slate-700/40 rounded px-1.5 py-0.5 shrink-0">
        {q.type === 'single' ? 'S' : 'M'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 leading-snug">{q.text}</p>
        <p className="text-xs text-emerald-500/70 mt-0.5 truncate">✓ {q.correct.join(' · ')}</p>
        {q.incorrect.length > 0 && (
          <p className="text-xs text-slate-600 truncate">✗ {q.incorrect.join(' · ')}</p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onEdit}
          className="px-2 py-1 text-xs rounded-lg bg-violet-700/30 hover:bg-violet-600/40 text-violet-300 transition-colors">Edit</button>
        <button onClick={onDelete}
          className="px-2 py-1 text-xs rounded-lg bg-red-900/30 hover:bg-red-800/40 text-red-400 transition-colors">Del</button>
      </div>
    </div>
  );
}

// ─── Category Tree Node ────────────────────────────────────────────────────────

function CategoryNode({
  cat, depth, expandedCats, toggleCat, catQuestions, onAddQuestion,
  onEditQuestion, onDeleteQuestion, onAddSubcategory, onRenameCategory, onDeleteCategory,
}: {
  cat: Category; depth: number;
  expandedCats: Set<string>;
  toggleCat: (id: string) => void;
  catQuestions: Record<string, Question[]>;
  onAddQuestion: (catId: string, catName: string) => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string, catId: string) => void;
  onAddSubcategory: (parentId: string, parentName: string) => void;
  onRenameCategory: (cat: Category) => void;
  onDeleteCategory: (cat: Category) => void;
}) {
  const isOpen = expandedCats.has(cat.id);
  const qs = catQuestions[cat.id];
  const indent = depth * 16;
  const subs = cat.subcategories ?? [];

  return (
    <div>
      {/* Category header */}
      <div
        className="group flex items-center gap-2 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors select-none"
        style={{ paddingLeft: `${indent + 12}px`, paddingRight: '12px' }}
        onClick={() => toggleCat(cat.id)}
      >
        {/* Chevron */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
          className={`text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}>
          <path d="M4 2l4 4-4 4V2z"/>
        </svg>

        {/* Icon */}
        <span className="text-sm shrink-0">{subs.length > 0 ? '📂' : '📋'}</span>

        {/* Name */}
        <span className="flex-1 text-sm font-semibold text-slate-200 truncate">{cat.name}</span>

        {/* Count badges */}
        <span className="text-[10px] text-slate-600 font-mono shrink-0">
          {cat.totalQuestions ?? 0}q
        </span>

        {/* Actions - show on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={e => e.stopPropagation()}>
          <button onClick={() => onAddQuestion(cat.id, cat.name)}
            title="Add question"
            className="w-6 h-6 flex items-center justify-center rounded text-emerald-400 hover:bg-emerald-900/30 text-xs transition-colors">+Q</button>
          <button onClick={() => onAddSubcategory(cat.id, cat.name)}
            title="Add subcategory"
            className="w-6 h-6 flex items-center justify-center rounded text-violet-400 hover:bg-violet-900/30 text-xs transition-colors">+C</button>
          <button onClick={() => onRenameCategory(cat)}
            title="Rename"
            className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-700/40 text-xs transition-colors">✏️</button>
          <button onClick={() => onDeleteCategory(cat)}
            title="Delete"
            className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-900/30 text-xs transition-colors">🗑</button>
        </div>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div>
          {/* Subcategories */}
          {subs.map(sub => (
            <CategoryNode key={sub.id} cat={sub} depth={depth+1}
              expandedCats={expandedCats} toggleCat={toggleCat} catQuestions={catQuestions}
              onAddQuestion={onAddQuestion} onEditQuestion={onEditQuestion}
              onDeleteQuestion={onDeleteQuestion} onAddSubcategory={onAddSubcategory}
              onRenameCategory={onRenameCategory} onDeleteCategory={onDeleteCategory}
            />
          ))}

          {/* Direct questions */}
          {qs === undefined ? (
            <div className="flex items-center gap-2 py-2" style={{ paddingLeft: `${indent + 36}px` }}>
              <Spinner /><span className="text-xs text-slate-600">Loading questions…</span>
            </div>
          ) : qs.length > 0 ? (
            <div className="mt-1 mb-1" style={{ paddingLeft: `${indent + 8}px` }}>
              {qs.map(q => (
                <QuestionRow key={q.id} q={q}
                  onEdit={() => onEditQuestion(q)}
                  onDelete={() => onDeleteQuestion(q.id, cat.id)}
                />
              ))}
            </div>
          ) : subs.length === 0 ? (
            <p className="text-xs text-slate-600 py-2" style={{ paddingLeft: `${indent + 36}px` }}>
              No questions yet
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Bulk Import Modal ─────────────────────────────────────────────────────────

function BulkImportModal({ isOpen, onClose, onImport }: {
  isOpen: boolean; onClose: () => void; onImport: (tree: unknown, mode: 'merge'|'replace') => Promise<void>;
}) {
  const [json, setJson] = useState('');
  const [mode, setMode] = useState<'merge'|'replace'>('merge');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const EXAMPLE = `{
  "AP World History": {
    "Unit 1": [
      {
        "q": "When did the Silk Road begin?",
        "a": "2nd century BCE",
        "wrong": ["1st century CE", "5th century BCE", "3rd century CE"]
      }
    ],
    "Unit 2": [
      {
        "q": "Which of the following were Mongol innovations?",
        "a": ["Pony express", "Religious tolerance"],
        "wrong": ["Gunpowder", "Paper"],
        "type": "multiple"
      }
    ]
  }
}`;

  const handle = async () => {
    setError('');
    let parsed: unknown;
    try { parsed = JSON.parse(json); }
    catch { return setError('Invalid JSON — check your syntax'); }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return setError('Expected a JSON object at the root level');
    }
    setLoading(true);
    try { await onImport(parsed, mode); onClose(); setJson(''); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Import failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📥 Bulk Import" size="xl">
      <div className="flex flex-col gap-4">
        <div className="bg-violet-900/10 border border-violet-800/30 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
          <p className="font-semibold text-violet-300 mb-2">Format</p>
          <p>Paste a JSON object where keys are category names. Values are either sub-objects (subcategories) or arrays of question objects.</p>
          <p className="mt-1.5">Each question: <code className="text-violet-300">{"{ q, a, wrong?, type? }"}</code> — <code>a</code> can be a string or array for multiple-choice.</p>
          <p className="mt-1.5">Use <code className="text-violet-300">_questions</code> as a key to add direct questions to a category that also has subcategories.</p>
        </div>

        <div className="flex gap-3">
          {(['merge','replace'] as const).map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={mode===m} onChange={() => setMode(m)} className="accent-violet-500" />
              <span className="text-sm text-slate-300 capitalize">{m}</span>
              <span className="text-xs text-slate-600">
                {m === 'merge' ? '(skip existing questions)' : '(update existing questions)'}
              </span>
            </label>
          ))}
        </div>

        <div className="relative">
          <textarea
            value={json} onChange={e => setJson(e.target.value)} rows={14}
            placeholder={EXAMPLE}
            className="w-full bg-[#0a0c18] border border-violet-900/30 rounded-xl px-4 py-3 text-slate-200 text-xs font-mono focus:outline-none focus:border-violet-500 resize-none"
          />
          {!json && (
            <button onClick={() => setJson(EXAMPLE)}
              className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded bg-violet-800/40 hover:bg-violet-700/50 text-violet-300 transition-colors">
              Load Example
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-violet-900/30 text-slate-400 hover:text-slate-200 text-sm transition-colors">Cancel</button>
          <button onClick={handle} disabled={loading || !json.trim()}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {loading && <Spinner />} Import
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Migration Notice ──────────────────────────────────────────────────────────

function MigrationNotice({ status, onDismiss }: { status: MigrationStatus; onDismiss: () => void }) {
  if (status.migrated) return null;
  return (
    <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-bold text-amber-300 mb-0.5">⚠️ Database Migration Required</p>
          <p className="text-sm text-slate-400">{status.message}</p>
        </div>
        <button onClick={onDismiss} className="text-slate-600 hover:text-slate-400 shrink-0">✕</button>
      </div>
      <div className="relative bg-[#0a0c18] rounded-xl p-4 font-mono text-xs text-amber-200/80 border border-amber-900/30">
        <pre className="whitespace-pre-wrap">{status.sql}</pre>
        <div className="absolute top-3 right-3">
          <CopyButton text={status.sql} />
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2.5">
        Copy the SQL above → open your <span className="text-violet-400">Supabase Dashboard</span> → SQL Editor → New Query → paste and run.
      </p>
    </div>
  );
}

// ─── Main AdminPanel ───────────────────────────────────────────────────────────

export default function AdminPanel({ username }: AdminPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [catQuestions, setCatQuestions] = useState<Record<string, Question[]>>({});

  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrationDismissed, setMigrationDismissed] = useState(false);

  // Modal state
  const [addQModal, setAddQModal] = useState<{ catId: string; catName: string } | null>(null);
  const [editQModal, setEditQModal] = useState<Question | null>(null);
  const [addCatModal, setAddCatModal] = useState<{ parentId: string | null; parentName: string } | null>(null);
  const [renameCatModal, setRenameCatModal] = useState<Category | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportData, setExportData] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [renameCatName, setRenameCatName] = useState('');
  const [catFormLoading, setCatFormLoading] = useState(false);
  const [catFormError, setCatFormError] = useState('');

  // Load categories
  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const { data } = await res.json();
      setCategories(data);
    }
    setLoading(false);
  }, []);

  // Load questions for a category (lazy)
  const loadQuestionsForCat = useCallback(async (catId: string) => {
    if (catQuestions[catId] !== undefined) return;
    const res = await fetch(`/api/questions?categoryId=${catId}&includeSubcategories=false`);
    if (res.ok) {
      const { data } = await res.json();
      setCatQuestions(prev => ({ ...prev, [catId]: data || [] }));
    }
  }, [catQuestions]);

  const toggleCat = useCallback(async (catId: string) => {
    const willOpen = !expandedCats.has(catId);
    if (willOpen) await loadQuestionsForCat(catId);
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  }, [expandedCats, loadQuestionsForCat]);

  // Check migration status
  useEffect(() => {
    loadCategories();
    fetch('/api/admin/migrate')
      .then(r => r.json())
      .then(d => setMigrationStatus(d))
      .catch(() => {});
  }, [loadCategories]);

  // Invalidate cached questions for a category
  const invalidateQuestions = useCallback((catId: string) => {
    setCatQuestions(prev => {
      const next = { ...prev };
      delete next[catId];
      return next;
    });
    if (expandedCats.has(catId)) loadQuestionsForCat(catId);
  }, [expandedCats, loadQuestionsForCat]);

  // ── Question CRUD ──────────────────────────────────────────────────────────

  const handleAddQuestion = async (data: QuestionFormData) => {
    if (!addQModal) return;
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: addQModal.catId, ...data, difficulty: 1, tags: [] }),
    });
    if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
    showToast('Question added!');
    setAddQModal(null);
    invalidateQuestions(addQModal.catId);
    loadCategories();
  };

  const handleEditQuestion = async (data: QuestionFormData) => {
    if (!editQModal) return;
    const res = await fetch(`/api/questions/${editQModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
    showToast('Question updated');
    const catId = editQModal.category_id;
    setEditQModal(null);
    invalidateQuestions(catId);
  };

  const handleDeleteQuestion = async (id: string, catId: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Question deleted');
      invalidateQuestions(catId);
      loadCategories();
    } else showToast('Failed to delete', 'error');
  };

  // ── Category CRUD ──────────────────────────────────────────────────────────

  const handleAddCategory = async () => {
    setCatFormError('');
    if (!newCatName.trim()) return setCatFormError('Name is required');
    setCatFormLoading(true);
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCatName.trim(), parent_id: addCatModal?.parentId ?? null }),
    });
    setCatFormLoading(false);
    if (res.ok) {
      showToast('Category created!');
      setAddCatModal(null);
      setNewCatName('');
      loadCategories();
    } else {
      const j = await res.json();
      setCatFormError(j.error ?? 'Failed');
    }
  };

  const handleRenameCategory = async () => {
    setCatFormError('');
    if (!renameCatName.trim()) return setCatFormError('Name is required');
    if (!renameCatModal) return;
    setCatFormLoading(true);
    const res = await fetch(`/api/categories/${renameCatModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameCatName.trim() }),
    });
    setCatFormLoading(false);
    if (res.ok) {
      showToast('Category renamed');
      setRenameCatModal(null);
      loadCategories();
    } else {
      const j = await res.json();
      setCatFormError(j.error ?? 'Failed');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}" and ALL its subcategories and questions? This cannot be undone.`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Category deleted'); loadCategories(); }
    else showToast('Failed to delete', 'error');
  };

  // ── Bulk Import ────────────────────────────────────────────────────────────

  const handleBulkImport = async (tree: unknown, mode: 'merge'|'replace') => {
    const res = await fetch('/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tree, mode }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error);
    showToast(`Done! +${j.data.questionsCreated} new, ${j.data.questionsSkipped} skipped, ${j.data.questionsUpdated} updated`);
    // Invalidate all question caches and reload
    setCatQuestions({});
    loadCategories();
  };

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExportLoading(true);
    const res = await fetch('/api/admin/export');
    const j = await res.json();
    setExportLoading(false);
    if (res.ok) {
      setExportData(JSON.stringify(j.data, null, 2));
      setExportOpen(true);
    } else showToast('Export failed', 'error');
  };

  const downloadExport = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studycards-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Expand/Collapse All ────────────────────────────────────────────────────

  function collectAllIds(cats: Category[]): string[] {
    return cats.flatMap(c => [c.id, ...collectAllIds(c.subcategories ?? [])]);
  }

  const expandAll = async () => {
    const ids = collectAllIds(categories);
    await Promise.all(ids.map(id => loadQuestionsForCat(id)));
    setExpandedCats(new Set(ids));
  };

  const collapseAll = () => setExpandedCats(new Set());

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative z-10 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[100] px-5 py-3.5 rounded-xl border shadow-2xl text-sm font-semibold flex items-center gap-2.5 animate-slideInRight ${
          toast.type === 'error'
            ? 'bg-red-900/90 border-red-500/40 text-red-200'
            : 'bg-emerald-900/90 border-emerald-500/40 text-emerald-200'
        }`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl px-8 py-6 mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700 rounded-t-2xl" />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-xl shadow-lg shadow-violet-900/50">
                🛠
              </div>
              <div>
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">Admin Panel</h1>
                <p className="text-slate-500 text-sm">Logged in as <span className="text-violet-400 font-semibold">{username}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a href="/study"
                className="px-3 py-2 rounded-xl border border-violet-900/30 text-slate-400 hover:text-slate-200 text-sm transition-colors">
                ← Study Page
              </a>
              <button onClick={() => { setAddCatModal({ parentId: null, parentName: 'Root' }); setNewCatName(''); setCatFormError(''); }}
                className="px-3 py-2 rounded-xl bg-[#1e2749] border border-violet-900/30 text-slate-300 hover:border-violet-500/40 text-sm transition-colors">
                + Category
              </button>
              <button onClick={() => setBulkImportOpen(true)}
                className="px-3 py-2 rounded-xl bg-[#1e2749] border border-violet-900/30 text-slate-300 hover:border-violet-500/40 text-sm transition-colors">
                📥 Bulk Import
              </button>
              <button onClick={handleExport} disabled={exportLoading}
                className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2 transition-colors">
                {exportLoading ? <Spinner /> : '📤'} Export
              </button>
            </div>
          </div>
        </div>

        {/* Migration notice */}
        {migrationStatus && !migrationDismissed && (
          <MigrationNotice status={migrationStatus} onDismiss={() => setMigrationDismissed(true)} />
        )}

        {/* Category Tree */}
        <div className="bg-gradient-to-br from-[#1e2749] to-[#16213e] border border-violet-900/20 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-violet-700 opacity-60" />

          {/* Tree header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-violet-900/20">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              🗂 Categories &amp; Questions
              <span className="text-xs font-normal text-slate-600">
                ({collectAllIds(categories).length} categories)
              </span>
            </h2>
            <div className="flex gap-2">
              <button onClick={expandAll} className="text-xs px-2.5 py-1 rounded-lg border border-violet-900/30 text-slate-500 hover:text-slate-300 transition-colors">Expand All</button>
              <button onClick={collapseAll} className="text-xs px-2.5 py-1 rounded-lg border border-violet-900/30 text-slate-500 hover:text-slate-300 transition-colors">Collapse All</button>
            </div>
          </div>

          {/* Tree body */}
          <div className="p-3 min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
                <Spinner /> Loading…
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <p className="text-4xl mb-3">📂</p>
                <p className="font-semibold mb-4">No categories yet</p>
                <button onClick={() => { setAddCatModal({ parentId: null, parentName: 'Root' }); setNewCatName(''); setCatFormError(''); }}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
                  + Create First Category
                </button>
              </div>
            ) : (
              categories.map(cat => (
                <CategoryNode key={cat.id} cat={cat} depth={0}
                  expandedCats={expandedCats} toggleCat={toggleCat} catQuestions={catQuestions}
                  onAddQuestion={(catId, catName) => setAddQModal({ catId, catName })}
                  onEditQuestion={q => setEditQModal(q)}
                  onDeleteQuestion={handleDeleteQuestion}
                  onAddSubcategory={(parentId, parentName) => {
                    setAddCatModal({ parentId, parentName });
                    setNewCatName(''); setCatFormError('');
                  }}
                  onRenameCategory={cat => { setRenameCatModal(cat); setRenameCatName(cat.name); setCatFormError(''); }}
                  onDeleteCategory={handleDeleteCategory}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Add Question */}
      <Modal isOpen={!!addQModal} onClose={() => setAddQModal(null)}
        title={`Add Question to "${addQModal?.catName}"`} size="lg">
        {addQModal && (
          <QuestionForm
            onSubmit={handleAddQuestion}
            onCancel={() => setAddQModal(null)}
            submitLabel="Add Question"
          />
        )}
      </Modal>

      {/* Edit Question */}
      <Modal isOpen={!!editQModal} onClose={() => setEditQModal(null)} title="Edit Question" size="lg">
        {editQModal && (
          <QuestionForm
            initial={{ text: editQModal.text, type: editQModal.type, correct: editQModal.correct, incorrect: editQModal.incorrect }}
            onSubmit={handleEditQuestion}
            onCancel={() => setEditQModal(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Add Category */}
      <Modal isOpen={!!addCatModal} onClose={() => setAddCatModal(null)} title="Add Category" size="sm">
        <div className="flex flex-col gap-4">
          {addCatModal?.parentId && (
            <p className="text-xs text-slate-500">
              Will be created inside: <span className="text-violet-400 font-semibold">{addCatModal.parentName}</span>
            </p>
          )}
          <input
            value={newCatName} onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); }}
            autoFocus placeholder="Category name…"
            className="bg-[#0d0f1e] border border-violet-900/30 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-violet-500"
          />
          {catFormError && <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-2.5">{catFormError}</p>}
          <div className="flex gap-2">
            <button onClick={() => setAddCatModal(null)} className="flex-1 py-2.5 rounded-xl border border-violet-900/30 text-slate-400 text-sm hover:text-slate-200 transition-colors">Cancel</button>
            <button onClick={handleAddCategory} disabled={catFormLoading}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              {catFormLoading && <Spinner />}Create
            </button>
          </div>
        </div>
      </Modal>

      {/* Rename Category */}
      <Modal isOpen={!!renameCatModal} onClose={() => setRenameCatModal(null)}
        title={`Rename "${renameCatModal?.name}"`} size="sm">
        <div className="flex flex-col gap-4">
          <input
            value={renameCatName} onChange={e => setRenameCatName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRenameCategory(); }}
            autoFocus
            className="bg-[#0d0f1e] border border-violet-900/30 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-violet-500"
          />
          {catFormError && <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl px-4 py-2.5">{catFormError}</p>}
          <div className="flex gap-2">
            <button onClick={() => setRenameCatModal(null)} className="flex-1 py-2.5 rounded-xl border border-violet-900/30 text-slate-400 text-sm hover:text-slate-200 transition-colors">Cancel</button>
            <button onClick={handleRenameCategory} disabled={catFormLoading}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
              {catFormLoading && <Spinner />}Rename
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Import */}
      <BulkImportModal isOpen={bulkImportOpen} onClose={() => setBulkImportOpen(false)} onImport={handleBulkImport} />

      {/* Export */}
      <Modal isOpen={exportOpen} onClose={() => setExportOpen(false)} title="📤 Export Data" size="xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Your entire question bank as JSON. Use this as a backup or to import on another instance.</p>
            <button onClick={downloadExport}
              className="shrink-0 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
              ⬇ Download
            </button>
          </div>
          <div className="relative">
            <textarea readOnly value={exportData} rows={20}
              className="w-full bg-[#0a0c18] border border-violet-900/30 rounded-xl px-4 py-3 text-slate-300 text-xs font-mono focus:outline-none resize-none"
            />
            <div className="absolute top-3 right-3">
              <CopyButton text={exportData} />
            </div>
          </div>
          <button onClick={() => setExportOpen(false)}
            className="py-2.5 rounded-xl border border-violet-900/30 text-slate-400 text-sm hover:text-slate-200 transition-colors">
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}