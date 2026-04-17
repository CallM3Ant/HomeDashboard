'use client';
import { useState, useEffect, useCallback } from 'react';

export type ThemeName = 'dark' | 'midnight' | 'light' | 'warm';

export interface AppSettings {
  shuffleAnswers: boolean;
  includeSubcategoriesInMastery: boolean;
  showHierarchy: boolean;
  theme: ThemeName;
}

const DEFAULT_SETTINGS: AppSettings = {
  shuffleAnswers: true,
  includeSubcategoriesInMastery: true,
  showHierarchy: true,
  theme: 'dark',
};

const THEME_KEY = 'study_theme';

export function applyTheme(theme: ThemeName) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export function useSettings(userId: number | null | undefined) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (userId === undefined) return;
    const key = userId != null ? `study_settings_user_${userId}` : 'study_settings_guest';
    try {
      const stored = localStorage.getItem(key);
      const savedTheme = (localStorage.getItem(THEME_KEY) as ThemeName | null) ?? DEFAULT_SETTINGS.theme;
      const base = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
      const merged = { ...base, theme: savedTheme };
      setSettings(merged);
      applyTheme(merged.theme);
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
    setLoaded(true);
  }, [userId]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      const key = userId != null ? `study_settings_user_${userId}` : 'study_settings_guest';
      try {
        if (updates.theme) {
          localStorage.setItem(THEME_KEY, updates.theme);
          applyTheme(updates.theme);
        }
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [userId]);

  return { settings, updateSettings, loaded };
}