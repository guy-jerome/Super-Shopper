import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { StoreProfile, StoreWithAisles, Aisle } from '../types/app.types';

interface StoreStore {
  stores: StoreProfile[];
  activeStore: StoreWithAisles | null;
  isLoading: boolean;
  fetchStores: (userId: string) => Promise<void>;
  fetchStoreWithAisles: (storeId: string) => Promise<void>;
  addStore: (userId: string, name: string) => Promise<void>;
  updateStore: (id: string, name: string) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  addAisle: (storeId: string, name: string, side: Aisle['side']) => Promise<void>;
  deleteAisle: (aisleId: string) => Promise<void>;
  addItemToAisle: (userId: string, aisleId: string, itemName: string) => Promise<void>;
  removeItemFromAisle: (itemStoreLocationId: string) => Promise<void>;
}

export const useStoreStore = create<StoreStore>((set) => ({
  stores: [],
  activeStore: null,
  isLoading: false,

  fetchStores: async (userId) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('store_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      set({ stores: data });
    }
    set({ isLoading: false });
  },

  fetchStoreWithAisles: async (storeId) => {
    const { data, error } = await supabase
      .from('store_profiles')
      .select(`*, aisles(*, item_store_locations(*, items(*)))`)
      .eq('id', storeId)
      .single();

    if (!error && data) {
      set({ activeStore: data as unknown as StoreWithAisles });
    }
  },

  addStore: async (userId, name) => {
    const { data, error } = await supabase
      .from('store_profiles')
      .insert({ user_id: userId, name })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ stores: [...state.stores, data] }));
    }
  },

  updateStore: async (id, name) => {
    const { error } = await supabase
      .from('store_profiles')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        stores: state.stores.map((s) => (s.id === id ? { ...s, name } : s)),
      }));
    }
  },

  deleteStore: async (id) => {
    const { error } = await supabase.from('store_profiles').delete().eq('id', id);
    if (!error) {
      set((state) => ({ stores: state.stores.filter((s) => s.id !== id) }));
    }
  },

  addAisle: async (storeId, name, side) => {
    const { data, error } = await supabase
      .from('aisles')
      .insert({ store_id: storeId, name, side, order_index: 0 })
      .select()
      .single();

    if (!error && data) {
      set((state) => {
        if (!state.activeStore) return state;
        return {
          activeStore: {
            ...state.activeStore,
            aisles: [...state.activeStore.aisles, { ...data, item_store_locations: [] }],
          },
        };
      });
    }
  },

  deleteAisle: async (aisleId) => {
    const { error } = await supabase.from('aisles').delete().eq('id', aisleId);
    if (!error) {
      set((state) => {
        if (!state.activeStore) return state;
        return {
          activeStore: {
            ...state.activeStore,
            aisles: state.activeStore.aisles.filter((a) => a.id !== aisleId),
          },
        };
      });
    }
  },

  addItemToAisle: async (userId, aisleId, itemName) => {
    // Find or create item by name
    let itemId: string;
    const { data: existing } = await supabase
      .from('items')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', itemName)
      .limit(1)
      .maybeSingle();

    if (existing) {
      itemId = existing.id;
    } else {
      const { data: newItem, error } = await supabase
        .from('items')
        .insert({ user_id: userId, name: itemName })
        .select()
        .single();
      if (error || !newItem) return;
      itemId = newItem.id;
    }

    const { data: loc, error: locError } = await supabase
      .from('item_store_locations')
      .insert({ item_id: itemId, aisle_id: aisleId, position_index: 0 })
      .select('*, items(*)')
      .single();

    if (!locError && loc) {
      set((state) => {
        if (!state.activeStore) return state;
        return {
          activeStore: {
            ...state.activeStore,
            aisles: state.activeStore.aisles.map((a) =>
              a.id === aisleId
                ? { ...a, item_store_locations: [...a.item_store_locations, loc as any] }
                : a
            ),
          },
        };
      });
    }
  },

  removeItemFromAisle: async (itemStoreLocationId) => {
    const { error } = await supabase
      .from('item_store_locations')
      .delete()
      .eq('id', itemStoreLocationId);

    if (!error) {
      set((state) => {
        if (!state.activeStore) return state;
        return {
          activeStore: {
            ...state.activeStore,
            aisles: state.activeStore.aisles.map((a) => ({
              ...a,
              item_store_locations: a.item_store_locations.filter(
                (l) => l.id !== itemStoreLocationId
              ),
            })),
          },
        };
      });
    }
  },
}));
