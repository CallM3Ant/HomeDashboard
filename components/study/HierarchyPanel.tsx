'use client';
import { useState, useCallback } from 'react';
import { Category } from '@/types';

interface HierarchyPanelProps {
  categories: Category[];
  currentCategoryId?: string | null;
  onNavigate: (category: Category) => void;
  onGoHome: () => void;
  onMoveCategory?: (categoryId: string, newParentId: string | null) => void;
  isLoggedIn: boolean;
}

interface HierarchyNodeProps {
  category: Category;
  depth: number;
  currentCategoryId?: string | null;
  onNavigate: (category: Category) => void;
  isLoggedIn: boolean;
  dragState: { draggingId: string | null; overId: string | null };
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragLeave: () => void;
  onDrop: (targetId: string) => void;
  onDragEnd: () => void;
}

function HierarchyNode({
  category, depth, currentCategoryId, onNavigate, isLoggedIn,
  dragState, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
}: HierarchyNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (category.subcategories?.length ?? 0) > 0;
  const isCurrent = category.id === currentCategoryId;
  const isDragging = dragState.draggingId === category.id;
  const isOver = dragState.overId === category.id && dragState.draggingId !== category.id;

  return (
    <div>
      <div
        draggable={isLoggedIn}
        onDragStart={(e) => { e.stopPropagation(); onDragStart(category.id); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(category.id); }}
        onDragLeave={(e) => { e.stopPropagation(); onDragLeave(); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(category.id); }}
        onDragEnd={onDragEnd}
        onClick={() => onNavigate(category)}
        className={cn(
          'flex items-center gap-1.5 py-1.5 px-2 rounded-[var(--r-sm)] cursor-pointer text-xs transition-all select-none',
          isCurrent
            ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold border border-[var(--accent-border)]'
            : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
          isDragging && 'opacity-40',
          isOver && 'bg-[var(--accent-soft)] border border-dashed border-[var(--accent-border)]',
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-[var(--text-3)] transition-transform duration-150"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <path d="M2 1l4 3-4 3V1z"/>
            </svg>
          </button>
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}

        <span className="shrink-0 text-[10px] opacity-50">{hasChildren ? '▸' : '·'}</span>
        <span className="truncate flex-1">{category.name}</span>

        {(category.totalQuestions ?? 0) > 0 && (
          <span className="text-[10px] tabular shrink-0" style={{ color: 'var(--text-3)' }}>
            {category.totalQuestions}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {category.subcategories!.map((child) => (
            <HierarchyNode
              key={child.id}
              category={child}
              depth={depth + 1}
              currentCategoryId={currentCategoryId}
              onNavigate={onNavigate}
              isLoggedIn={isLoggedIn}
              dragState={dragState}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function HierarchyPanel({
  categories, currentCategoryId, onNavigate, onGoHome, onMoveCategory, isLoggedIn,
}: HierarchyPanelProps) {
  const [dragState, setDragState] = useState<{ draggingId: string | null; overId: string | null }>({
    draggingId: null, overId: null,
  });

  const handleDragStart = useCallback((id: string) => {
    setDragState({ draggingId: id, overId: null });
  }, []);

  const handleDragOver = useCallback((id: string) => {
    setDragState((prev) => ({ ...prev, overId: id }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({ ...prev, overId: null }));
  }, []);

  const handleDrop = useCallback((targetId: string) => {
    const { draggingId } = dragState;
    if (!draggingId || draggingId === targetId) {
      setDragState({ draggingId: null, overId: null });
      return;
    }
    onMoveCategory?.(draggingId, targetId);
    setDragState({ draggingId: null, overId: null });
  }, [dragState, onMoveCategory]);

  const handleDragEnd = useCallback(() => {
    setDragState({ draggingId: null, overId: null });
  }, []);

  return (
    <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto pr-0.5">
      {/* Home */}
      <div
        onClick={onGoHome}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-[var(--r-sm)] cursor-pointer text-xs transition-colors select-none',
          !currentCategoryId
            ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold border border-[var(--accent-border)]'
            : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
        )}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        Home
      </div>

      {categories.length === 0 && (
        <p className="text-[11px] text-[var(--text-3)] text-center py-4">No categories yet</p>
      )}

      {categories.map((cat) => (
        <HierarchyNode
          key={cat.id}
          category={cat}
          depth={0}
          currentCategoryId={currentCategoryId}
          onNavigate={onNavigate}
          isLoggedIn={isLoggedIn}
          dragState={dragState}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}

      {isLoggedIn && dragState.draggingId && (
        <div
          onDragOver={(e) => { e.preventDefault(); handleDragOver('__root__'); }}
          onDrop={(e) => {
            e.preventDefault();
            onMoveCategory?.(dragState.draggingId!, null);
            handleDragEnd();
          }}
          className="mt-1 border border-dashed border-[var(--border-2)] rounded-[var(--r-sm)] p-2 text-center text-[10px] text-[var(--text-3)]"
        >
          Drop to move to root
        </div>
      )}
    </div>
  );
}