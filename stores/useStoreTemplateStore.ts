import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface StoreTemplate {
  id: string;
  name: string;
  aisles: Array<{ name: string; side?: string | null }>;
  createdAt: string;
}

interface StoreTemplateStore {
  templates: StoreTemplate[];
  loadTemplates: () => Promise<void>;
  saveTemplate: (name: string, aisles: Array<{ name: string; side?: string | null }>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

const STORAGE_KEY = 'super-shopper:store-templates';

export const useStoreTemplateStore = create<StoreTemplateStore>((set, get) => ({
  templates: [],

  loadTemplates: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) set({ templates: JSON.parse(raw) });
  },

  saveTemplate: async (name, aisles) => {
    const template: StoreTemplate = {
      id: Date.now().toString(),
      name,
      aisles,
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().templates, template];
    set({ templates: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  deleteTemplate: async (id) => {
    const updated = get().templates.filter(t => t.id !== id);
    set({ templates: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
}));
