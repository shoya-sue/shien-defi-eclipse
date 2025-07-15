import { useState, useEffect } from 'react';
import type { UserSettings } from '../types';

const defaultSettings: UserSettings = {
  theme: 'system',
  currency: 'USD',
  language: 'ja',
  slippageTolerance: 0.5,
  priceAlerts: true,
  realtimeUpdates: true,
  refreshInterval: 5000,
  notifications: {
    priceChanges: true,
    transactions: true,
    farming: true,
    pools: true,
  },
  privacy: {
    trackingEnabled: true,
    analyticsEnabled: true,
    shareData: false,
  },
  advanced: {
    showAdvancedStats: false,
    debugMode: false,
    gasOptimization: true,
  },
};

const SETTINGS_KEY = 'eclipse-defi-settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = (newSettings: UserSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Apply theme changes immediately
      if (newSettings.theme !== settings.theme) {
        applyTheme(newSettings.theme);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const applyTheme = (theme: UserSettings['theme']) => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(SETTINGS_KEY);
    applyTheme(defaultSettings.theme);
  };

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const updateNestedSetting = <K extends keyof UserSettings>(
    parentKey: K,
    childKey: keyof UserSettings[K],
    value: UserSettings[K][keyof UserSettings[K]]
  ) => {
    const parentValue = settings[parentKey] as Record<string, unknown>;
    const newSettings = {
      ...settings,
      [parentKey]: {
        ...parentValue,
        [childKey]: value,
      },
    };
    saveSettings(newSettings);
  };

  // Apply theme on initial load
  useEffect(() => {
    if (!isLoading) {
      applyTheme(settings.theme);
    }
  }, [settings.theme, isLoading]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  return {
    settings,
    isLoading,
    saveSettings,
    resetSettings,
    updateSetting,
    updateNestedSetting,
  };
};