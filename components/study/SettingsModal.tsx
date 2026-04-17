'use client';
import { AppSettings, ThemeName } from '@/hooks/useSettings';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  isLoggedIn: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group py-1">
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        <p className="text-xs text-[var(--text-3)] mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className="relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
        style={{ background: checked ? 'var(--accent)' : 'var(--surface-2)', border: `1px solid ${checked ? 'transparent' : 'var(--border-2)'}` }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
          style={{ left: checked ? 'calc(100% - 18px)' : '1px' }}
        />
      </button>
    </label>
  );
}

const THEMES: { id: ThemeName; label: string; dark: boolean; colors: [string, string, string] }[] = [
  { id: 'dark',     label: 'Dark',     dark: true,  colors: ['#0e0e12', '#18181f', '#6366f1'] },
  { id: 'midnight', label: 'Midnight', dark: true,  colors: ['#080c1a', '#111927', '#3b82f6'] },
  { id: 'light',    label: 'Light',    dark: false, colors: ['#f4f5f7', '#ffffff', '#6366f1'] },
  { id: 'warm',     label: 'Warm',     dark: false, colors: ['#faf7f2', '#ffffff', '#c2410c'] },
];

function ThemeSwatch({
  theme,
  selected,
  onSelect,
}: {
  theme: typeof THEMES[0];
  selected: boolean;
  onSelect: () => void;
}) {
  const [bg, surface, accent] = theme.colors;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col gap-1.5 items-center group"
      style={{ outline: 'none' }}
    >
      <div
        className="w-full aspect-video rounded-[var(--r)] overflow-hidden transition-all duration-150"
        style={{
          background: bg,
          border: selected ? `2px solid var(--accent)` : '1px solid var(--border-2)',
          boxShadow: selected ? `0 0 0 3px var(--accent-soft)` : 'none',
        }}
      >
        {/* Mini preview */}
        <div className="p-1.5 flex flex-col gap-1">
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded" style={{ background: accent }} />
            <div className="flex-1 h-1.5 rounded" style={{ background: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
          </div>
          <div className="w-full h-1.5 rounded" style={{ background: surface, border: `1px solid ${theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }} />
          <div className="w-3/4 h-1.5 rounded" style={{ background: surface, border: `1px solid ${theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }} />
          <div className="flex gap-1">
            <div className="h-1 flex-1 rounded" style={{ background: accent, opacity: 0.7 }} />
            <div className="h-1 flex-1 rounded" style={{ background: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="5" fill="var(--accent)" />
            <path d="M3 5l1.5 1.5L7 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <span className="text-xs font-medium" style={{ color: selected ? 'var(--accent)' : 'var(--text-3)' }}>
          {theme.label}
        </span>
        <span className="text-[10px] px-1 py-0.5 rounded" style={{
          background: theme.dark ? 'var(--surface-2)' : 'var(--surface-2)',
          color: 'var(--text-3)',
          border: '1px solid var(--border)',
        }}>
          {theme.dark ? 'dark' : 'light'}
        </span>
      </div>
    </button>
  );
}

export function SettingsModal({ isOpen, onClose, settings, onUpdate, isLoggedIn }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
      <div className="flex flex-col gap-6">
        {!isLoggedIn && (
          <p className="text-xs text-[var(--amber)] px-3 py-2.5 rounded-[var(--r-sm)]" style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber-border)' }}>
            Settings saved locally. Sign in to sync across devices.
          </p>
        )}

        {/* Theme */}
        <div className="flex flex-col gap-3">
          <p className="label">Theme</p>
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map(theme => (
              <ThemeSwatch
                key={theme.id}
                theme={theme}
                selected={settings.theme === theme.id}
                onSelect={() => onUpdate({ theme: theme.id })}
              />
            ))}
          </div>
        </div>

        {/* Quiz options */}
        <div className="flex flex-col gap-3">
          <p className="label">Quiz options</p>
          <div
            className="flex flex-col gap-3 p-4 rounded-[var(--r)]"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <Toggle
              checked={settings.shuffleAnswers}
              onChange={() => onUpdate({ shuffleAnswers: !settings.shuffleAnswers })}
              label="Shuffle answers"
              description="Randomize the order of answer choices each quiz"
            />
            <div className="h-px bg-[var(--border)]" />
            <Toggle
              checked={settings.includeSubcategoriesInMastery}
              onChange={() => onUpdate({ includeSubcategoriesInMastery: !settings.includeSubcategoriesInMastery })}
              label="Mastery includes subcategories"
              description="Pull questions from all nested subcategories"
            />
          </div>
        </div>

        {/* Display options */}
        <div className="flex flex-col gap-3">
          <p className="label">Display</p>
          <div
            className="flex flex-col gap-3 p-4 rounded-[var(--r)]"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <Toggle
              checked={settings.showHierarchy}
              onChange={() => onUpdate({ showHierarchy: !settings.showHierarchy })}
              label="Show category structure"
              description="Display the hierarchy panel in the sidebar"
            />
          </div>
        </div>

        <Button variant="primary" onClick={onClose} className="w-full">Done</Button>
      </div>
    </Modal>
  );
}