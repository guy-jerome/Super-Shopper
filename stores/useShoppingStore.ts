import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { ShoppingListItem, StoreProfile, ShopMode } from '../types/app.types';

interface ShoppingStore {
  shoppingList: ShoppingListItem[];
  notes: string;
  currentStore: StoreProfile | null;
  mode: ShopMode;
  isLoading: boolean;
  setMode: (mode: ShopMode) => void;
  setCurrentStore: (store: StoreProfile | null) => void;
  fetchShoppingList: (userId: string, date: string) => Promise<void>;
  addToList: (userId: string, itemId: string, quantity: number) => Promise<void>;
  removeFromList: (id: string) => Promise<void>;
  toggleChecked: (id: string, checked: boolean) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  updateNotes: (userId: string, date: string, notes: string) => Promise<void>;
  clearCheckedItems: () => Promise<void>;
}

export const useShoppingStore = create<ShoppingStore>((set, get) => ({
  shoppingList: [],
  notes: '',
  currentStore: null,
  mode: 'shop',
  isLoading: false,

  setMode: (mode) => set({ mode }),
  setCurrentStore: (store) => set({ currentStore: store }),

  fetchShoppingList: async (userId, date) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', userId)
      .eq('shopping_date', date);

    if (!error && data) {
      set({ shoppingList: data });
    }
    set({ isLoading: false });
  },

  addToList: async (userId, itemId, quantity) => {
    const date = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('shopping_list')
      .insert({ user_id: userId, item_id: itemId, quantity, shopping_date: date })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ shoppingList: [...state.shoppingList, data] }));
    }
  },

  removeFromList: async (id) => {
    const { error } = await supabase.from('shopping_list').delete().eq('id', id);
    if (!error) {
      set((state) => ({ shoppingList: state.shoppingList.filter((i) => i.id !== id) }));
    }
  },

  toggleChecked: async (id, checked) => {
    const { error } = await supabase
      .from('shopping_list')
      .update({ checked, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        shoppingList: state.shoppingList.map((i) => (i.id === id ? { ...i, checked } : i)),
      }));
    }
  },

  updateQuantity: async (id, quantity) => {
    const { error } = await supabase
      .from('shopping_list')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        shoppingList: state.shoppingList.map((i) => (i.id === id ? { ...i, quantity } : i)),
      }));
    }
  },

  updateNotes: async (userId, date, notes) => {
    await supabase.from('shopping_notes').upsert({ user_id: userId, shopping_date: date, content: notes });
    set({ notes });
  },

  clearCheckedItems: async () => {
    const { shoppingList } = get();
    const checkedIds = shoppingList.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;

    await supabase.from('shopping_list').delete().in('id', checkedIds);
    set((state) => ({ shoppingList: state.shoppingList.filter((i) => !i.checked) }));
  },
}));
