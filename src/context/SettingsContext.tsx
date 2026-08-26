import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { systemSettingsRepository } from '../services/db/SystemSettingsRepository';
import { useAuth } from './AuthContext';
import { userRepository } from '../services/db/UserRepository';

interface SettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;

  // User specific settings
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateUserPreference: (key: string, value: any) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('omorfihub_theme') as any) || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('omorfihub_theme', theme);
  }, [theme]);

  const setTheme = (t: 'light' | 'dark' | 'system') => {
    setThemeState(t);
  };

  const updateUserPreference = async (key: string, value: any) => {
    const userId = user?.uid || user?.id;
    if (!userId) return;
    try {
      const currentPrefs = user?.preferences || {};
      await userRepository.update(userId, {
        preferences: {
          ...currentPrefs,
          [key]: value
        }
      });
    } catch (error) {
      console.error('Failed to update user preference:', error);
      throw error;
    }
  };

  const defaultSettings: SystemSettings = {
    platformName: 'OmorfiHub',
    tagline: 'Seamless Logistics for Everyone',
    supportEmail: 'support@omorfihub.com',
    supportPhone: '+234 123 456 7890',
    successAnimationStyle: 'confetti',
    branding: {
      logoUrl: '/assets/brand/omorfi-logo.png',
      logoDarkUrl: '/assets/brand/omorfi-logo.png',
      logoLightUrl: '/assets/brand/omorfi-logo.png',
      defaultTheme: 'light'
    },
    countryConfig: {
      defaultCountry: 'Nigeria',
      defaultCurrency: 'Naira',
      defaultCurrencySymbol: '₦'
    },
    featureFlags: {
      notifications: true,
      enableSafePay: true
    }
  } as any;

  useEffect(() => {
    let resolved = false;

    // Safety timeout: if Firestore takes more than 1.5 seconds, immediately populate safe defaults and set loading to false
    const fallbackTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setSettings((prev) => prev || defaultSettings);
        setLoading(false);
      }
    }, 1500);

    // Subscribe to live updates
    const unsubscribe = systemSettingsRepository.subscribeToSettings(
      (data) => {
        resolved = true;
        clearTimeout(fallbackTimer);
        setSettings(data || defaultSettings);
        setLoading(false);
      },
      (error) => {
        resolved = true;
        clearTimeout(fallbackTimer);
        console.error('Failed to load system settings, using defaults:', error);
        setSettings((prev) => prev || defaultSettings);
        setLoading(false);
      }
    );

    return () => {
      resolved = true;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const refreshSettings = async () => {
    setLoading(true);
    try {
      const data = await systemSettingsRepository.getGlobalSettings();
      setSettings(data || defaultSettings);
    } catch (err) {
      console.error('Failed to refresh global settings:', err);
      setSettings((prev) => prev || defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      refreshSettings,
      theme,
      setTheme,
      updateUserPreference
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
