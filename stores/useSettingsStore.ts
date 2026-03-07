import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'super-shopper:theme';

interface SettingsStore {
  isDarkMode: boolean;
  loadTheme: () => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  isDarkMode: false,

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'dark') set({ isDarkMode: true });
    } catch {}
  },

  toggleTheme: async () => {
    const next = !get().isDarkMode;
    set({ isDarkMode: next });
    try {
      await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch {}
  },
}));
