import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { StorageLocationWithItems } from '../types/app.types';

interface StorageStore {
  locations: StorageLocationWithItems[];
  isLoading: boolean;
  fetchLocations: (userId: string) => Promise<void>;
  addLocation: (userId: string, name: string) => Promise<void>;
  updateLocation: (id: string, name: string) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  reorderLocations: (locations: StorageLocationWithItems[]) => Promise<void>;
  moveLocation: (id: string, direction: 'up' | 'down') => Promise<void>;
  addItem: (userId: string, locationId: string, name: string, meta?: { brand?: string | null; quantity?: string | null; image_url?: string | null }) => Promise<void>;
  updateItem: (id: string, name: string) => Promise<void>;
  unlinkItem: (id: string) => Promise<void>;
  moveItem: (locationId: string, itemId: string, direction: 'up' | 'down') => void;
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
      set({ locations: data as unknown as StorageLocationWithItems[] });
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

  moveLocation: async (id, direction) => {
    const { locations } = get();
    const idx = locations.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= locations.length) return;
    const next = [...locations];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    await get().reorderLocations(next);
  },

  addItem: async (userId, locationId, name, meta) => {
    // Reuse an existing unplaced item with the same name so store aisle links are preserved
    const { data: existing } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', name)
      .is('home_location_id', null)
      .limit(1)
      .maybeSingle();

    let item: any;
    if (existing) {
      const updateData: any = { home_location_id: locationId };
      if (meta?.brand) updateData.brand = meta.brand;
      if (meta?.quantity) updateData.quantity = meta.quantity;
      if (meta?.image_url) updateData.image_url = meta.image_url;
      const { data: updated } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
      item = updated;
    } else {
      const { data: created } = await supabase
        .from('items')
        .insert({ user_id: userId, name, home_location_id: locationId, tags: [], brand: meta?.brand ?? null, quantity: meta?.quantity ?? null, image_url: meta?.image_url ?? null })
        .select()
        .single();
      item = created;
    }

    if (item) {
      set((state) => ({
        locations: state.locations.map((l) =>
          l.id === locationId ? { ...l, items: [...l.items, item] } : l
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

  // Removes item from its home storage location without deleting from global items
  unlinkItem: async (id) => {
    const { error } = await supabase
      .from('items')
      .update({ home_location_id: null, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        locations: state.locations.map((l) => ({
          ...l,
          items: l.items.filter((item) => item.id !== id),
        })),
      }));
    }
  },

  moveItem: (locationId, itemId, direction) => {
    const { locations } = get();
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) return;
    const idx = loc.items.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= loc.items.length) return;
    const newItems = [...loc.items];
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
    set((state) => ({
      locations: state.locations.map((l) =>
        l.id === locationId ? { ...l, items: newItems } : l
      ),
    }));
  },
}));
