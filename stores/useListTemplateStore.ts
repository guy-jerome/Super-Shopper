import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface ListTemplate {
  id: string;
  name: string;
  items: Array<{ item_id: string; item_name: string; quantity: number }>;
  createdAt: string;
}

interface ListTemplateStore {
  templates: ListTemplate[];
  loadTemplates: () => Promise<void>;
  saveTemplate: (name: string, items: Array<{ item_id: string; item_name: string; quantity: number }>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

const STORAGE_KEY = 'super-shopper:list-templates';

export const useListTemplateStore = create<ListTemplateStore>((set, get) => ({
  templates: [],

  loadTemplates: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) set({ templates: JSON.parse(raw) });
  },

  saveTemplate: async (name, items) => {
    const template: ListTemplate = {
      id: Date.now().toString(),
      name,
      items,
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
