'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, Question } from '@/types';

interface AdminPanelProps { username: string; }

interface MigrationStatus { migrated: boolean; sql: string; message: string; }

interface QuestionFormData {
  text: string; type: 'single' | 'multiple'; correct: string[]; incorrect: string[];
}

function Spinner() {
  return <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-xs px-2 py-1 rounded-[var(--r-sm)] transition-colors"
      style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
    >
      {copied ? '✓ Copied' : 'Copy SQL'}
    </button>
  );
}

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border-2)',
  borderRadius: 'var(--r-sm)',
  color: 'var(--text)',
  fontSize: '13px',
  padding: '8px 12px',
  outline: 'none',
};

function QuestionForm({ initial, onSubmit, onCancel, submitLabel }: {
  initial?: QuestionFormData; onSubmit: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void; submitLabel: string;
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
        <label className="label block mb-1.5">Question *</label>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          style={{ ...inputBase, resize: 'none', borderColor: 'var(--border-2)' }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-2)')}
          placeholder="Enter question text…"
        />
      </div>

      <div className="flex gap-2">
        {(['single', 'multiple'] as const).map(t => (
          <button key={t} type="button" onClick={() => setType(t)}
            className="flex-1 py-2 rounded-[var(--r-sm)] text-xs font-semibold transition-all"
            style={{
              background: type === t ? 'var(--accent-soft)' : 'var(--surface-2)',
              border: `1px solid ${type === t ? 'var(--accent-border)' : 'var(--border)'}`,
              color: type === t ? 'var(--accent)' : 'var(--text-2)',
            }}>
            {t === 'single' ? '🔘 Single' : '☑️ Multiple'}
          </button>
        ))}
      </div>

      <div>
        <label className="label block mb-1.5" style={{ color: 'var(--green)' }}>
          Correct Answer{type === 'multiple' ? 's' : ''} *
        </label>
        {correct.map((v, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <input value={v} onChange={e => { const n=[...correct]; n[i]=e.target.value; setCorrect(n); }}
              style={{ ...inputBase, borderColor: 'var(--green-border)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--green)')}
              onBlur={e => (e.target.style.borderColor = 'var(--green-border)')}
              placeholder={`Correct ${i+1}`} />
            {type === 'multiple' && correct.length > 1 && (
              <button onClick={() => setCorrect(correct.filter((_,j)=>j!==i))}
                className="px-2 text-sm" style={{ color: 'var(--red)' }}>✕</button>
            )}
          </div>
        ))}
        {type === 'multiple' && (
          <button onClick={() => setCorrect([...correct,''])}
            className="text-xs mt-0.5" style={{ color: 'var(--green)' }}>+ Add correct</button>
        )}
      </div>

      <div>
        <label className="label block mb-1.5" style={{ color: 'var(--red)' }}>Wrong Answers</label>
        {incorrect.map((v, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <input value={v} onChange={e => { const n=[...incorrect]; n[i]=e.target.value; setIncorrect(n); }}
              style={{ ...inputBase, borderColor: 'var(--red-border)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--red)')}
              onBlur={e => (e.target.style.borderColor = 'var(--red-border)')}
              placeholder={`Wrong ${i+1}`} />
            <button onClick={() => setIncorrect(incorrect.filter((_,j)=>j!==i))}
              className="px-2 text-sm" style={{ color: 'var(--red)' }}>✕</button>
          </div>
        ))}
        <button onClick={() => setIncorrect([...incorrect,''])}
          className="text-xs mt-0.5" style={{ color: 'var(--red)' }}>+ Add wrong</button>
      </div>

      {error && (
        <p className="text-xs px-3 py-2.5 rounded-[var(--r-sm)]"
          style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)' }}>
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-[var(--r-sm)] text-sm transition-colors"
          style={{ border: '1px solid var(--border-2)', color: 'var(--text-2)', background: 'transparent' }}>
          Cancel
        </button>
        <button onClick={handle} disabled={loading}
          className="flex-1 py-2.5 rounded-[var(--r-sm)] text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          style={{ background: 'var(--accent)', color: 'white' }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--accent)')}>
          {loading && <Spinner />}{submitLabel}
        </button>
      </div>
    </div>
  );
}

function AdminModal({ isOpen, onClose, title, children, size = 'md' }: {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`relative w-full ${widths[size]} rounded-[var(--r-xl)] overflow-hidden max-h-[90vh] flex flex-col animate-slideUp`}
        style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'var(--accent-border)' }} />
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <h2 className="text-base font-bold text-[var(--text)]">{title}</h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--r-sm)] text-lg leading-none transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}>
            ×
          </button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function QuestionRow({ q, onEdit, onDelete }: { q: Question; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="group flex items-start gap-3 px-3 py-2.5 rounded-[var(--r-sm)] transition-colors"
      onMouseOver={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
      <span className="mt-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
        style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
        {q.type === 'single' ? 'S' : 'M'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text)] leading-snug">{q.text}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--green)' }}>✓ {q.correct.join(' · ')}</p>
        {q.incorrect.length > 0 && (
          <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>✗ {q.incorrect.join(' · ')}</p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onEdit}
          className="px-2 py-1 text-xs rounded-[var(--r-sm)] transition-colors"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
          Edit
        </button>
        <button onClick={onDelete}
          className="px-2 py-1 text-xs rounded-[var(--r-sm)] transition-colors"
          style={{ background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid var(--red-border)' }}>
          Del
        </button>
      </div>
    </div>
  );
}

function CategoryNode({
  cat, depth, expandedCats, toggleCat, catQuestions, onAddQuestion,
  onEditQuestion, onDeleteQuestion, onAddSubcategory, onRenameCategory, onDeleteCategory,
}: {
  cat: Category; depth: number; expandedCats: Set<string>; toggleCat: (id: string) => void;
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
      <div
        className="group flex items-center gap-2 py-2 rounded-[var(--r-sm)] cursor-pointer select-none transition-colors"
        style={{ paddingLeft: `${indent + 10}px`, paddingRight: '10px' }}
        onMouseOver={e => (e.currentTarget.style.background = 'var(--surface-2)')}
        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
        onClick={() => toggleCat(cat.id)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
          className="shrink-0 transition-transform duration-150"
          style={{ color: 'var(--text-3)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <path d="M4 2l4 4-4 4V2z"/>
        </svg>
        <span className="text-sm shrink-0">{subs.length > 0 ? '📂' : '📋'}</span>
        <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{cat.name}</span>
        <span className="text-[10px] tabular shrink-0" style={{ color: 'var(--text-3)' }}>
          {cat.totalQuestions ?? 0}q
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={e => e.stopPropagation()}>
          {[
            { label: '+Q', title: 'Add question', onClick: () => onAddQuestion(cat.id, cat.name), color: 'var(--green)' },
            { label: '+C', title: 'Add subcategory', onClick: () => onAddSubcategory(cat.id, cat.name), color: 'var(--accent)' },
            { label: '✏', title: 'Rename', onClick: () => onRenameCategory(cat), color: 'var(--text-2)' },
            { label: '🗑', title: 'Delete', onClick: () => onDeleteCategory(cat), color: 'var(--red)' },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} title={btn.title}
              className="w-6 h-6 flex items-center justify-center rounded text-xs transition-colors"
              style={{ color: btn.color }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {isOpen && (
        <div>
          {subs.map(sub => (
            <CategoryNode key={sub.id} cat={sub} depth={depth+1}
              expandedCats={expandedCats} toggleCat={toggleCat} catQuestions={catQuestions}
              onAddQuestion={onAddQuestion} onEditQuestion={onEditQuestion}
              onDeleteQuestion={onDeleteQuestion} onAddSubcategory={onAddSubcategory}
              onRenameCategory={onRenameCategory} onDeleteCategory={onDeleteCategory}
            />
          ))}
          {qs === undefined ? (
            <div className="flex items-center gap-2 py-2 text-xs" style={{ paddingLeft: `${indent + 36}px`, color: 'var(--text-3)' }}>
              <Spinner /> Loading…
            </div>
          ) : qs.length > 0 ? (
            <div style={{ paddingLeft: `${indent + 6}px` }}>
              {qs.map(q => (
                <QuestionRow key={q.id} q={q}
                  onEdit={() => onEditQuestion(q)}
                  onDelete={() => onDeleteQuestion(q.id, cat.id)}
                />
              ))}
            </div>
          ) : subs.length === 0 ? (
            <p className="text-xs py-2" style={{ paddingLeft: `${indent + 36}px`, color: 'var(--text-3)' }}>
              No questions yet
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function BulkImportModal({ isOpen, onClose, onImport }: {
  isOpen: boolean; onClose: () => void;
  onImport: (tree: unknown, mode: 'merge'|'replace') => Promise<void>;
}) {
  const [json, setJson] = useState('');
  const [mode, setMode] = useState<'merge'|'replace'>('merge');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const EXAMPLE = `{\n  "AP World History": {\n    "Unit 1": [\n      {\n        "q": "When did the Silk Road begin?",\n        "a": "2nd century BCE",\n        "wrong": ["1st century CE", "5th century BCE"]\n      }\n    ]\n  }\n}`;

  const handle = async () => {
    setError('');
    let parsed: unknown;
    try { parsed = JSON.parse(json); } catch { return setError('Invalid JSON — check your syntax'); }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      return setError('Expected a JSON object at the root level');
    setLoading(true);
    try { await onImport(parsed, mode); onClose(); setJson(''); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Import failed'); }
    finally { setLoading(false); }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Bulk Import" size="xl">
      <div className="flex flex-col gap-4">
        <div className="rounded-[var(--r)] p-4 text-xs leading-relaxed"
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--text-2)' }}>
          <p className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>Format</p>
          <p>JSON object where keys are category names. Values are sub-objects (subcategories) or arrays of question objects.</p>
          <p className="mt-1.5">Each question: <code style={{ color: 'var(--accent)' }}>{"{ q, a, wrong?, type? }"}</code> — <code>a</code> can be a string or array for multiple-choice.</p>
        </div>

        <div className="flex gap-4">
          {(['merge','replace'] as const).map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={mode===m} onChange={() => setMode(m)}
                style={{ accentColor: 'var(--accent)' }} />
              <span className="text-sm" style={{ color: 'var(--text)' }}>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                {m === 'merge' ? '(skip existing)' : '(update existing)'}
              </span>
            </label>
          ))}
        </div>

        <div className="relative">
          <textarea value={json} onChange={e => setJson(e.target.value)} rows={14}
            placeholder={EXAMPLE}
            style={{ ...inputBase, resize: 'none', fontFamily: 'monospace', fontSize: '12px' }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-2)')}
          />
          {!json && (
            <button onClick={() => setJson(EXAMPLE)}
              className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-[var(--r-sm)] transition-colors"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
              Load Example
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs px-3 py-2.5 rounded-[var(--r-sm)]"
            style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)' }}>
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-[var(--r-sm)] text-sm transition-colors"
            style={{ border: '1px solid var(--border-2)', color: 'var(--text-2)', background: 'transparent' }}>
            Cancel
          </button>
          <button onClick={handle} disabled={loading || !json.trim()}
            className="flex-1 py-2.5 rounded-[var(--r-sm)] text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            style={{ background: 'var(--accent)', color: 'white' }}>
            {loading && <Spinner />} Import
          </button>
        </div>
      </div>
    </AdminModal>
  );
}

function MigrationNotice({ status, onDismiss }: { status: MigrationStatus; onDismiss: () => void }) {
  if (status.migrated) return null;
  return (
    <div className="rounded-[var(--r-lg)] p-5 mb-6"
      style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber-border)' }}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-bold mb-0.5" style={{ color: 'var(--amber)' }}>⚠ Database Migration Required</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{status.message}</p>
        </div>
        <button onClick={onDismiss} style={{ color: 'var(--text-3)' }}>✕</button>
      </div>
      <div className="relative rounded-[var(--r)] p-4 font-mono text-xs"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--amber)' }}>
        <pre className="whitespace-pre-wrap">{status.sql}</pre>
        <div className="absolute top-3 right-3"><CopyButton text={status.sql} /></div>
      </div>
      <p className="text-xs mt-2.5" style={{ color: 'var(--text-3)' }}>
        Copy the SQL above → open your{' '}
        <span style={{ color: 'var(--accent)' }}>Supabase Dashboard</span>
        {' '}→ SQL Editor → New Query → paste and run.
      </p>
    </div>
  );
}

export default function AdminPanel({ username }: AdminPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [catQuestions, setCatQuestions] = useState<Record<string, Question[]>>({});
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrationDismissed, setMigrationDismissed] = useState(false);

  const [addQModal, setAddQModal] = useState<{ catId: string; catName: string } | null>(null);
  const [editQModal, setEditQModal] = useState<Question | null>(null);
  const [addCatModal, setAddCatModal] = useState<{ parentId: string | null; parentName: string } | null>(null);
  const [renameCatModal, setRenameCatModal] = useState<Category | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportData, setExportData] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const [newCatName, setNewCatName] = useState('');
  const [renameCatName, setRenameCatName] = useState('');
  const [catFormLoading, setCatFormLoading] = useState(false);
  const [catFormError, setCatFormError] = useState('');

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/categories');
    if (res.ok) { const { data } = await res.json(); setCategories(data); }
    setLoading(false);
  }, []);

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

  useEffect(() => {
    loadCategories();
    fetch('/api/admin/migrate').then(r => r.json()).then(d => setMigrationStatus(d)).catch(() => {});
  }, [loadCategories]);

  const invalidateQuestions = useCallback((catId: string) => {
    setCatQuestions(prev => { const next = { ...prev }; delete next[catId]; return next; });
    if (expandedCats.has(catId)) loadQuestionsForCat(catId);
  }, [expandedCats, loadQuestionsForCat]);

  const handleAddQuestion = async (data: QuestionFormData) => {
    if (!addQModal) return;
    const res = await fetch('/api/questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: addQModal.catId, ...data, difficulty: 1, tags: [] }),
    });
    if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
    showToast('Question added!'); setAddQModal(null);
    invalidateQuestions(addQModal.catId); loadCategories();
  };

  const handleEditQuestion = async (data: QuestionFormData) => {
    if (!editQModal) return;
    const res = await fetch(`/api/questions/${editQModal.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
    showToast('Question updated'); const catId = editQModal.category_id;
    setEditQModal(null); invalidateQuestions(catId);
  };

  const handleDeleteQuestion = async (id: string, catId: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Question deleted'); invalidateQuestions(catId); loadCategories(); }
    else showToast('Failed to delete', 'error');
  };

  const handleAddCategory = async () => {
    setCatFormError('');
    if (!newCatName.trim()) return setCatFormError('Name is required');
    setCatFormLoading(true);
    const res = await fetch('/api/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCatName.trim(), parent_id: addCatModal?.parentId ?? null }),
    });
    setCatFormLoading(false);
    if (res.ok) { showToast('Category created!'); setAddCatModal(null); setNewCatName(''); loadCategories(); }
    else { const j = await res.json(); setCatFormError(j.error ?? 'Failed'); }
  };

  const handleRenameCategory = async () => {
    setCatFormError('');
    if (!renameCatName.trim()) return setCatFormError('Name is required');
    if (!renameCatModal) return;
    setCatFormLoading(true);
    const res = await fetch(`/api/categories/${renameCatModal.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameCatName.trim() }),
    });
    setCatFormLoading(false);
    if (res.ok) { showToast('Category renamed'); setRenameCatModal(null); loadCategories(); }
    else { const j = await res.json(); setCatFormError(j.error ?? 'Failed'); }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}" and ALL its subcategories and questions? This cannot be undone.`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Category deleted'); loadCategories(); }
    else showToast('Failed to delete', 'error');
  };

  const handleBulkImport = async (tree: unknown, mode: 'merge'|'replace') => {
    const res = await fetch('/api/admin/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tree, mode }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error);
    showToast(`Done! +${j.data.questionsCreated} new, ${j.data.questionsSkipped} skipped, ${j.data.questionsUpdated} updated`);
    setCatQuestions({}); loadCategories();
  };

  const handleExport = async () => {
    setExportLoading(true);
    const res = await fetch('/api/admin/export');
    const j = await res.json();
    setExportLoading(false);
    if (res.ok) { setExportData(JSON.stringify(j.data, null, 2)); setExportOpen(true); }
    else showToast('Export failed', 'error');
  };

  const downloadExport = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `studycards-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  function collectAllIds(cats: Category[]): string[] {
    return cats.flatMap(c => [c.id, ...collectAllIds(c.subcategories ?? [])]);
  }

  const expandAll = async () => {
    const ids = collectAllIds(categories);
    await Promise.all(ids.map(id => loadQuestionsForCat(id)));
    setExpandedCats(new Set(ids));
  };

  const collapseAll = () => setExpandedCats(new Set());

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[100] px-5 py-3.5 rounded-[var(--r-lg)] text-sm font-semibold flex items-center gap-2.5 animate-slideInRight`}
          style={{
            background: toast.type === 'error' ? 'var(--red-soft)' : 'var(--green-soft)',
            border: `1px solid ${toast.type === 'error' ? 'var(--red-border)' : 'var(--green-border)'}`,
            color: toast.type === 'error' ? 'var(--red)' : 'var(--green)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[var(--r-lg)] flex items-center justify-center text-xl"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
                🛠
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Admin Panel</h1>
                <p className="text-sm text-[var(--text-3)] mt-0.5">
                  Logged in as <span className="font-semibold" style={{ color: 'var(--accent)' }}>{username}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a href="/study"
                className="px-3 py-2 rounded-[var(--r-sm)] text-sm transition-colors"
                style={{ border: '1px solid var(--border-2)', color: 'var(--text-2)' }}
                onMouseOver={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--text-2)'; }}>
                ← Study Page
              </a>
              <button onClick={() => { setAddCatModal({ parentId: null, parentName: 'Root' }); setNewCatName(''); setCatFormError(''); }}
                className="px-3 py-2 rounded-[var(--r-sm)] text-sm transition-colors"
                style={{ border: '1px solid var(--border-2)', color: 'var(--text-2)', background: 'var(--surface-2)' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}>
                + Category
              </button>
              <button onClick={() => setBulkImportOpen(true)}
                className="px-3 py-2 rounded-[var(--r-sm)] text-sm transition-colors"
                style={{ border: '1px solid var(--border-2)', color: 'var(--text-2)', background: 'var(--surface-2)' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}>
                📥 Bulk Import
              </button>
              <button onClick={handleExport} disabled={exportLoading}
                className="px-3 py-2 rounded-[var(--r-sm)] text-sm font-semibold disabled:opacity-60 flex items-center gap-2 transition-colors"
                style={{ background: 'var(--accent)', color: 'white' }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseOut={e => (e.currentTarget.style.background = 'var(--accent)')}>
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
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              Categories &amp; Questions
              <span className="text-xs font-normal" style={{ color: 'var(--text-3)' }}>
                ({collectAllIds(categories).length})
              </span>
            </h2>
            <div className="flex gap-2">
              {[{ label: 'Expand all', fn: expandAll }, { label: 'Collapse all', fn: collapseAll }].map(btn => (
                <button key={btn.label} onClick={btn.fn}
                  className="text-xs px-2.5 py-1 rounded-[var(--r-sm)] transition-colors"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'var(--text-3)' }}>
                <Spinner /> Loading…
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>
                <p className="text-4xl mb-3">📂</p>
                <p className="font-semibold mb-4 text-[var(--text-2)]">No categories yet</p>
                <button onClick={() => { setAddCatModal({ parentId: null, parentName: 'Root' }); setNewCatName(''); setCatFormError(''); }}
                  className="px-4 py-2 rounded-[var(--r-sm)] text-sm font-semibold transition-colors"
                  style={{ background: 'var(--accent)', color: 'white' }}>
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
                  onAddSubcategory={(parentId, parentName) => { setAddCatModal({ parentId, parentName }); setNewCatName(''); setCatFormError(''); }}
                  onRenameCategory={cat => { setRenameCatModal(cat); setRenameCatName(cat.name); setCatFormError(''); }}
                  onDeleteCategory={handleDeleteCategory}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Question */}
      <AdminModal isOpen={!!addQModal} onClose={() => setAddQModal(null)}
        title={`Add Question to "${addQModal?.catName}"`} size="lg">
        {addQModal && <QuestionForm onSubmit={handleAddQuestion} onCancel={() => setAddQModal(null)} submitLabel="Add Question" />}
      </AdminModal>

      {/* Edit Question */}
      <AdminModal isOpen={!!editQModal} onClose={() => setEditQModal(null)} title="Edit Question" size="lg">
        {editQModal && (
          <QuestionForm
            initial={{ text: editQModal.text, type: editQModal.type, correct: editQModal.correct, incorrect: editQModal.incorrect }}
            onSubmit={handleEditQuestion} onCancel={() => setEditQModal(null)} submitLabel="Save Changes"
          />
        )}
      </AdminModal>

      {/* Add Category */}
      <AdminModal isOpen={!!addCatModal} onClose={() => setAddCatModal(null)} title="Add Category" size="sm">
        <div className="flex flex-col gap-4">
          {addCatModal?.parentId && (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Inside: <span className="font-semibold" style={{ color: 'var(--accent)' }}>{addCatModal.parentName}</span>
            </p>
          )}
          <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); }}
            autoFocus placeholder="Category name…" style={inputBase}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-2)')} />
          {catFormError && (
            <p className="text-xs px-3 py-2" style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 'var(--r-sm)' }}>
              {catFormError}
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={() => setAddCatModal(null)}
              className="flex-1 py-2.5 rounded-[var(--r-sm)] text-sm transition-colors"
              style={{ border: '1px solid var(--border-2)', color: 'var(--text-2)', background: 'transparent' }}>
              Cancel
            </button>
            <button onClick={handleAddCategory} disabled={catFormLoading}
              className="flex-1 py-2.5 rounded-[var(--r-sm)] text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)', color: 'white' }}>
              {catFormLoading && <Spinner />}Create
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Rename Category */}
      <AdminModal isOpen={!!renameCatModal} onClose={() => setRenameCatModal(null)}
        title={`Rename "${renameCatModal?.name}"`} size="sm">
        <div className="flex flex-col gap-4">
          <input value={renameCatName} onChange={e => setRenameCatName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRenameCategory(); }}
            autoFocus style={inputBase}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-2)')} />
          {catFormError && (
            <p className="text-xs px-3 py-2" style={{ background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)', borderRadius: 'var(--r-sm)' }}>
              {catFormError}
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={() => setRenameCatModal(null)}
              className="flex-1 py-2.5 rounded-[var(--r-sm)] text-sm transition-colors"
              style={{ border: '1px solid var(--border-2)', color: 'var(--text-2)', background: 'transparent' }}>
              Cancel
            </button>
            <button onClick={handleRenameCategory} disabled={catFormLoading}
              className="flex-1 py-2.5 rounded-[var(--r-sm)] text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)', color: 'white' }}>
              {catFormLoading && <Spinner />}Rename
            </button>
          </div>
        </div>
      </AdminModal>

      <BulkImportModal isOpen={bulkImportOpen} onClose={() => setBulkImportOpen(false)} onImport={handleBulkImport} />

      {/* Export */}
      <AdminModal isOpen={exportOpen} onClose={() => setExportOpen(false)} title="Export Data" size="xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Your entire question bank as JSON.</p>
            <button onClick={downloadExport}
              className="shrink-0 px-4 py-2 rounded-[var(--r-sm)] text-sm font-semibold transition-colors"
              style={{ background: 'var(--accent)', color: 'white' }}>
              ⬇ Download
            </button>
          </div>
          <div className="relative">
            <textarea readOnly value={exportData} rows={20}
              style={{ ...inputBase, resize: 'none', fontFamily: 'monospace', fontSize: '11px' }} />
            <div className="absolute top-3 right-3"><CopyButton text={exportData} /></div>
          </div>
          <button onClick={() => setExportOpen(false)}
            className="py-2.5 rounded-[var(--r-sm)] text-sm transition-colors"
            style={{ border: '1px solid var(--border-2)', color: 'var(--text-2)', background: 'transparent' }}>
            Close
          </button>
        </div>
      </AdminModal>
    </div>
  );
}