'use client';
import { useState, useCallback, useRef } from 'react';
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
  onMoveCategory?: (categoryId: string, newParentId: string | null) => void;
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

  const indent = depth * 12;

  return (
    <div>
      <div
        draggable={isLoggedIn}
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart(category.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDragOver(category.id);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          onDragLeave();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDrop(category.id);
        }}
        onDragEnd={onDragEnd}
        onClick={() => onNavigate(category)}
        className={`
          flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-150 select-none
          ${isCurrent
            ? 'bg-violet-600/30 text-violet-300 font-semibold'
            : 'text-slate-400 hover:bg-violet-900/20 hover:text-slate-200'
          }
          ${isDragging ? 'opacity-40' : ''}
          ${isOver ? 'bg-violet-900/40 border border-dashed border-violet-500/50 text-violet-300' : ''}
        `}
        style={{ paddingLeft: `${indent + 12}px` }}
      >
        {/* Toggle expand */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-300 flex-shrink-0 transition-transform duration-150"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <path d="M2 1l4 3-4 3V1z"/>
            </svg>
          </button>
        ) : (
          <span className="w-4 h-4 flex-shrink-0" />
        )}

        <span className="text-xs opacity-50 flex-shrink-0">
          {hasChildren ? '📂' : '📋'}
        </span>

        <span className="truncate flex-1 text-xs leading-tight">
          {category.name}
        </span>

        {(category.totalQuestions ?? 0) > 0 && (
          <span className="text-[10px] text-slate-600 flex-shrink-0">
            {category.totalQuestions}
          </span>
        )}
      </div>

      {/* Children */}
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

export function HierarchyPanel({
  categories, currentCategoryId, onNavigate, onGoHome, onMoveCategory, isLoggedIn
}: HierarchyPanelProps) {
  const [dragState, setDragState] = useState<{ draggingId: string | null; overId: string | null }>({
    draggingId: null,
    overId: null,
  });

  const handleDragStart = useCallback((id: string) => {
    setDragState({ draggingId: id, overId: null });
  }, []);

  const handleDragOver = useCallback((id: string) => {
    setDragState(prev => ({ ...prev, overId: id }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState(prev => ({ ...prev, overId: null }));
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
    <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1">
      {/* Home */}
      <div
        onClick={onGoHome}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-150
          ${!currentCategoryId
            ? 'bg-violet-600/30 text-violet-300 font-semibold'
            : 'text-slate-400 hover:bg-violet-900/20 hover:text-slate-200'
          }
        `}
      >
        <span className="text-xs">🏠</span>
        <span className="text-xs font-semibold">Home</span>
      </div>

      {categories.length === 0 && (
        <p className="text-xs text-slate-600 text-center py-4">No categories yet</p>
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
          onDrop={(e) => { e.preventDefault(); onMoveCategory?.(dragState.draggingId!, null); handleDragEnd(); }}
          className="mt-1 border-2 border-dashed border-slate-700/50 rounded-lg p-2 text-center text-[10px] text-slate-600"
        >
          Drop here to move to root
        </div>
      )}
    </div>
  );
}