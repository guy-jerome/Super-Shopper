import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import type { Item } from '../types/app.types';

const SORT_KEY = 'super-shopper:item-sort';

export type ItemSortOrder = 'name' | 'recent' | 'tags';
export type FilterMode = 'all' | 'no-home' | 'no-store';

export type ItemWithLocations = Item & {
  hasHomeLocation: boolean;
  hasStoreLocation: boolean;
};

type ItemMeta = { brand?: string | null; quantity?: string | null; image_url?: string | null };

interface ItemStore {
  items: ItemWithLocations[];
  isLoading: boolean;
  sortOrder: ItemSortOrder;
  setSortOrder: (order: ItemSortOrder) => void;
  loadSortOrder: () => Promise<void>;
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  fetchItems: (userId: string) => Promise<void>;
  addItem: (userId: string, name: string, tags?: string[], meta?: ItemMeta) => Promise<ItemWithLocations | null>;
  updateItemTags: (id: string, tags: string[]) => Promise<void>;
  updateItemName: (id: string, name: string) => Promise<void>;
  updateItemDetails: (id: string, details: ItemMeta) => Promise<void>;
  uploadItemImage: (itemId: string, userId: string, uri: string) => Promise<boolean>;
  deleteItem: (id: string) => Promise<void>;
}

function sortItems(items: ItemWithLocations[], order: ItemSortOrder): ItemWithLocations[] {
  return [...items].sort((a, b) => {
    if (order === 'name') return a.name.localeCompare(b.name);
    if (order === 'recent') return b.updated_at.localeCompare(a.updated_at);
    if (order === 'tags') {
      const ta = a.tags.join(',');
      const tb = b.tags.join(',');
      return ta.localeCompare(tb) || a.name.localeCompare(b.name);
    }
    return 0;
  });
}

export const useItemStore = create<ItemStore>((set, get) => ({
  items: [],
  isLoading: false,
  sortOrder: 'name',
  filterMode: 'all',

  setFilterMode: (mode) => set({ filterMode: mode }),

  setSortOrder: (order) => {
    set((state) => ({ sortOrder: order, items: sortItems(state.items, order) }));
    AsyncStorage.setItem(SORT_KEY, order).catch(() => {});
  },

  loadSortOrder: async () => {
    try {
      const saved = await AsyncStorage.getItem(SORT_KEY);
      if (saved === 'name' || saved === 'recent' || saved === 'tags') {
        set({ sortOrder: saved });
      }
    } catch {}
  },

  fetchItems: async (userId) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('items')
      .select('*, item_store_locations(id)')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (!error && data) {
      const { sortOrder } = get();
      const mapped: ItemWithLocations[] = (data as any[]).map((row) => ({
        ...row,
        tags: row.tags ?? [],
        hasHomeLocation: row.home_location_id !== null,
        hasStoreLocation: (row.item_store_locations?.length ?? 0) > 0,
      }));
      set({ items: sortItems(mapped, sortOrder) });
    }
    set({ isLoading: false });
  },

  addItem: async (userId, name, tags = [], meta) => {
    const { data, error } = await supabase
      .from('items')
      .insert({ user_id: userId, name, tags, brand: meta?.brand ?? null, quantity: meta?.quantity ?? null, image_url: meta?.image_url ?? null })
      .select('*, item_store_locations(id)')
      .single();

    if (error || !data) return null;
    const { sortOrder } = get();
    const newItem: ItemWithLocations = {
      ...(data as any),
      tags: (data as any).tags ?? [],
      hasHomeLocation: (data as any).home_location_id !== null,
      hasStoreLocation: false,
    };
    set((state) => ({ items: sortItems([...state.items, newItem], sortOrder) }));
    return newItem;
  },

  updateItemTags: async (id, tags) => {
    const { error } = await supabase
      .from('items')
      .update({ tags, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      const { sortOrder } = get();
      set((state) => ({
        items: sortItems(
          state.items.map((i) => (i.id === id ? { ...i, tags } : i)),
          sortOrder
        ),
      }));
    }
  },

  updateItemName: async (id, name) => {
    const { error } = await supabase
      .from('items')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      const { sortOrder } = get();
      set((state) => ({
        items: sortItems(
          state.items.map((i) => (i.id === id ? { ...i, name } : i)),
          sortOrder
        ),
      }));
    }
  },

  updateItemDetails: async (id, details) => {
    const clean: any = { updated_at: new Date().toISOString() };
    if ('brand' in details) clean.brand = details.brand ?? null;
    if ('quantity' in details) clean.quantity = details.quantity ?? null;
    if ('image_url' in details) clean.image_url = details.image_url ?? null;
    const { error } = await supabase.from('items').update(clean).eq('id', id);
    if (!error) {
      const { sortOrder } = get();
      set((state) => ({
        items: sortItems(
          state.items.map((i) => (i.id === id ? { ...i, ...clean } : i)),
          sortOrder,
        ),
      }));
    }
  },

  uploadItemImage: async (itemId, userId, uri) => {
    try {
      let blob: Blob;

      if (uri.startsWith('data:')) {
        // Web image picker returns data: URIs
        const match = uri.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        const mimeType = match?.[1] ?? 'image/jpeg';
        const base64 = uri.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        blob = new Blob([bytes], { type: mimeType });
      } else {
        const response = await fetch(uri);
        blob = await response.blob();
      }

      const mimeType = blob.type || 'image/jpeg';
      const ext = (mimeType.split('/')[1] ?? 'jpeg').replace('jpeg', 'jpg').split('+')[0];
      const path = `${userId}/${itemId}.${ext}`;
      const { error } = await supabase.storage
        .from('item-images')
        .upload(path, blob, { upsert: true, contentType: mimeType });
      if (error) return false;
      const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path);
      await get().updateItemDetails(itemId, { image_url: publicUrl });
      return true;
    } catch {
      return false;
    }
  },

  deleteItem: async (id) => {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (!error) {
      set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    }
  },
}));
