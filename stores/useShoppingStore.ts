import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { ShoppingListItem, StoreProfile, ShopMode } from '../types/app.types';

const CURRENT_STORE_KEY = 'super-shopper:currentStore';

async function loadCurrentStore(): Promise<StoreProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(CURRENT_STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveCurrentStore(store: StoreProfile | null): Promise<void> {
  try {
    if (store) {
      await AsyncStorage.setItem(CURRENT_STORE_KEY, JSON.stringify(store));
    } else {
      await AsyncStorage.removeItem(CURRENT_STORE_KEY);
    }
  } catch {
    // ignore
  }
}

export type StoreLocation = {
  aisle_id: string;
  aisles: { id: string; name: string; order_index: number; store_id: string };
};

export type ShoppingListItemWithName = ShoppingListItem & {
  item_name: string;
  store_locations: StoreLocation[];
};

interface ShoppingStore {
  shoppingList: ShoppingListItemWithName[];
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
  markAllChecked: (ids: string[], checked: boolean) => Promise<void>;
}

export const useShoppingStore = create<ShoppingStore>()((set, get) => ({
  shoppingList: [],
  notes: '',
  currentStore: null,
  mode: 'shop',
  isLoading: false,

  setMode: (mode) => set({ mode }),

  setCurrentStore: (store) => {
    set({ currentStore: store });
    saveCurrentStore(store);
  },

  fetchShoppingList: async (userId, date) => {
    set({ isLoading: true });
    const [listResult, notesResult] = await Promise.all([
      supabase
        .from('shopping_list')
        .select('*, items(name, item_store_locations(aisle_id, aisles(id, name, order_index, store_id)))')
        .eq('user_id', userId)
        .eq('shopping_date', date),
      supabase
        .from('shopping_notes')
        .select('content')
        .eq('user_id', userId)
        .eq('shopping_date', date)
        .maybeSingle(),
    ]);

    if (!listResult.error && listResult.data) {
      const withNames = (listResult.data as any[]).map((row) => ({
        ...row,
        item_name: row.items?.name ?? '',
        store_locations: row.items?.item_store_locations ?? [],
      })) as ShoppingListItemWithName[];
      set({ shoppingList: withNames });
    }
    if (!notesResult.error) {
      set({ notes: notesResult.data?.content ?? '' });
    }
    set({ isLoading: false });
  },

  addToList: async (userId, itemId, quantity) => {
    const date = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('shopping_list')
      .insert({ user_id: userId, item_id: itemId, quantity, shopping_date: date })
      .select('*, items(name, item_store_locations(aisle_id, aisles(id, name, order_index, store_id)))')
      .single();

    if (!error && data) {
      const withName: ShoppingListItemWithName = {
        ...(data as any),
        item_name: (data as any).items?.name ?? '',
        store_locations: (data as any).items?.item_store_locations ?? [],
      };
      set((state) => ({ shoppingList: [...state.shoppingList, withName] }));
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
    await supabase.from('shopping_notes').upsert(
      { user_id: userId, shopping_date: date, content: notes },
      { onConflict: 'user_id,shopping_date' }
    );
    set({ notes });
  },

  markAllChecked: async (ids, checked) => {
    if (ids.length === 0) return;
    await supabase
      .from('shopping_list')
      .update({ checked, updated_at: new Date().toISOString() })
      .in('id', ids);
    set((state) => ({
      shoppingList: state.shoppingList.map((i) => ids.includes(i.id) ? { ...i, checked } : i),
    }));
  },

  clearCheckedItems: async () => {
    const { shoppingList } = get();
    const checkedIds = shoppingList.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;

    await supabase.from('shopping_list').delete().in('id', checkedIds);
    set((state) => ({ shoppingList: state.shoppingList.filter((i) => !i.checked) }));
  },
}));

// Hydrate currentStore from AsyncStorage on startup
loadCurrentStore().then((store) => {
  if (store) {
    useShoppingStore.setState({ currentStore: store });
  }
});
