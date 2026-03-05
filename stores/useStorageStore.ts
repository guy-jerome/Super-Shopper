import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { StorageLocation, Item, StorageLocationWithItems } from '../types/app.types';

interface StorageStore {
  locations: StorageLocationWithItems[];
  isLoading: boolean;
  fetchLocations: (userId: string) => Promise<void>;
  addLocation: (userId: string, name: string) => Promise<void>;
  updateLocation: (id: string, name: string) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  reorderLocations: (locations: StorageLocationWithItems[]) => Promise<void>;
  addItem: (userId: string, locationId: string, name: string) => Promise<void>;
  updateItem: (id: string, name: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useStorageStore = create<StorageStore>((set, get) => ({
  locations: [],
  isLoading: false,

  fetchLocations: async (userId) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('storage_locations')
      .select('*, items(*)')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (!error && data) {
      set({ locations: data as StorageLocationWithItems[] });
    }
    set({ isLoading: false });
  },

  addLocation: async (userId, name) => {
    const { locations } = get();
    const { data, error } = await supabase
      .from('storage_locations')
      .insert({ user_id: userId, name, order_index: locations.length })
      .select()
      .single();

    if (!error && data) {
      set({ locations: [...locations, { ...data, items: [] }] });
    }
  },

  updateLocation: async (id, name) => {
    const { error } = await supabase
      .from('storage_locations')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        locations: state.locations.map((l) => (l.id === id ? { ...l, name } : l)),
      }));
    }
  },

  deleteLocation: async (id) => {
    const { error } = await supabase.from('storage_locations').delete().eq('id', id);
    if (!error) {
      set((state) => ({ locations: state.locations.filter((l) => l.id !== id) }));
    }
  },

  reorderLocations: async (locations) => {
    set({ locations });
    await Promise.all(
      locations.map((l, i) =>
        supabase.from('storage_locations').update({ order_index: i }).eq('id', l.id)
      )
    );
  },

  addItem: async (userId, locationId, name) => {
    const { data, error } = await supabase
      .from('items')
      .insert({ user_id: userId, name, home_location_id: locationId })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        locations: state.locations.map((l) =>
          l.id === locationId ? { ...l, items: [...l.items, data] } : l
        ),
      }));
    }
  },

  updateItem: async (id, name) => {
    const { error } = await supabase
      .from('items')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        locations: state.locations.map((l) => ({
          ...l,
          items: l.items.map((item) => (item.id === id ? { ...item, name } : item)),
        })),
      }));
    }
  },

  deleteItem: async (id) => {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (!error) {
      set((state) => ({
        locations: state.locations.map((l) => ({
          ...l,
          items: l.items.filter((item) => item.id !== id),
        })),
      }));
    }
  },
}));
