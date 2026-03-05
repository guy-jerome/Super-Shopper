import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { StoreProfile, StoreWithAisles } from '../types/app.types';

interface StoreStore {
  stores: StoreProfile[];
  activeStore: StoreWithAisles | null;
  isLoading: boolean;
  fetchStores: (userId: string) => Promise<void>;
  fetchStoreWithAisles: (storeId: string) => Promise<void>;
  addStore: (userId: string, name: string) => Promise<void>;
  updateStore: (id: string, name: string) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
}

export const useStoreStore = create<StoreStore>((set, get) => ({
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
      set({ activeStore: data as StoreWithAisles });
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
}));
