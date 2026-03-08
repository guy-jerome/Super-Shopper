import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'super-shopper:theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsStore {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  loadTheme: () => Promise<void>;
  setThemeMode: (mode: ThemeMode, systemIsDark?: boolean) => Promise<void>;
  // kept for backwards compat with existing toggle in settings
  toggleTheme: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  themeMode: 'system',
  isDarkMode: false,

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        set({ themeMode: saved as ThemeMode });
      }
    } catch {}
  },

  setThemeMode: async (mode, systemIsDark = false) => {
    const isDark = mode === 'dark' || (mode === 'system' && systemIsDark);
    set({ themeMode: mode, isDarkMode: isDark });
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch {}
  },

  toggleTheme: async () => {
    const { themeMode } = get();
    const next: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    set({ themeMode: next, isDarkMode: next === 'dark' });
    try {
      await AsyncStorage.setItem(THEME_KEY, next);
    } catch {}
  },
}));
