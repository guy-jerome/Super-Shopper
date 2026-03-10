import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEASON_KEY = 'super-shopper:season';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface SettingsStore {
  season: Season;
  loadSeason: () => Promise<void>;
  setSeason: (s: Season) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  season: 'autumn',

  loadSeason: async () => {
    try {
      const saved = await AsyncStorage.getItem(SEASON_KEY);
      if (saved === 'spring' || saved === 'summer' || saved === 'autumn' || saved === 'winter') {
        set({ season: saved });
      }
    } catch {}
  },

  setSeason: async (season) => {
    set({ season });
    try {
      await AsyncStorage.setItem(SEASON_KEY, season);
    } catch {}
  },
}));
