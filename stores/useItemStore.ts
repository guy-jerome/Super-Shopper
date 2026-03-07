import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Item } from '../types/app.types';

export type ItemSortOrder = 'name' | 'recent' | 'tags';

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
  fetchItems: (userId: string) => Promise<void>;
  addItem: (userId: string, name: string, tags?: string[], meta?: ItemMeta) => Promise<ItemWithLocations | null>;
  updateItemTags: (id: string, tags: string[]) => Promise<void>;
  updateItemName: (id: string, name: string) => Promise<void>;
  updateItemDetails: (id: string, details: ItemMeta) => Promise<void>;
  uploadItemImage: (itemId: string, userId: string, uri: string) => Promise<void>;
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

  setSortOrder: (order) => {
    set((state) => ({ sortOrder: order, items: sortItems(state.items, order) }));
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
      const ext = (uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg').replace('jpeg', 'jpg');
      const path = `${userId}/${itemId}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from('item-images')
        .upload(path, blob, { upsert: true, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
      if (error) return;
      const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path);
      await get().updateItemDetails(itemId, { image_url: publicUrl });
    } catch {}
  },

  deleteItem: async (id) => {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (!error) {
      set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    }
  },
}));
