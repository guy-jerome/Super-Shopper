import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'super-shopper:low-stock';

interface LowStockStore {
  lowStockIds: Set<string>;
  loadLowStock: () => Promise<void>;
  toggleLowStock: (itemId: string) => Promise<void>;
  isLowStock: (itemId: string) => boolean;
}

export const useLowStockStore = create<LowStockStore>((set, get) => ({
  lowStockIds: new Set(),

  loadLowStock: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr: string[] = JSON.parse(raw);
      set({ lowStockIds: new Set(arr) });
    }
  },

  toggleLowStock: async (itemId: string) => {
    const next = new Set(get().lowStockIds);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    set({ lowStockIds: next });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  },

  isLowStock: (itemId: string) => get().lowStockIds.has(itemId),
}));
