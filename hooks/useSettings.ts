'use client';
import { useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  shuffleAnswers: boolean;
  includeSubcategoriesInMastery: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  shuffleAnswers: true,
  includeSubcategoriesInMastery: true,
};

export function useSettings(userId: number | null | undefined) {
  const storageKey = userId != null ? `study_settings_user_${userId}` : null;

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (userId === undefined) return; // Still loading auth
    const key = userId != null ? `study_settings_user_${userId}` : 'study_settings_guest';
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
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
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [userId]);

  return { settings, updateSettings, loaded };
}