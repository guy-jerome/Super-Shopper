import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { StorageLocationWithItems } from '../types/app.types';

interface StorageStore {
  locations: StorageLocationWithItems[];
  isLoading: boolean;
  fetchLocations: (userId: string) => Promise<void>;
  addLocation: (userId: string, name: string, parentId?: string) => Promise<StorageLocationWithItems | null>;
  updateLocation: (id: string, name: string) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  reorderLocations: (locations: StorageLocationWithItems[]) => Promise<void>;
  moveLocation: (id: string, direction: 'up' | 'down') => Promise<void>;
  moveSubsection: (parentId: string, id: string, direction: 'up' | 'down') => Promise<void>;
  addItem: (userId: string, locationId: string, name: string, meta?: { brand?: string | null; quantity?: string | null; image_url?: string | null }) => Promise<void>;
  updateItem: (id: string, name: string) => Promise<void>;
  unlinkItem: (id: string) => Promise<void>;
  moveItem: (locationId: string, itemId: string, direction: 'up' | 'down') => Promise<void>;
  transferItem: (itemId: string, fromLocationId: string, toLocationId: string, atEnd: boolean) => Promise<void>;
}

function sortItems(items: any[]) {
  return [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

function buildTree(flat: any[]): StorageLocationWithItems[] {
  const parents = flat.filter((l) => !l.parent_id);
  return parents.map((p) => ({
    ...p,
    items: sortItems(p.items ?? []),
    subsections: flat
      .filter((c) => c.parent_id === p.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((c) => ({
        ...c,
        items: sortItems(c.items ?? []),
        subsections: [],
      })),
  }));
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
      set({ locations: buildTree(data) });
    }
    set({ isLoading: false });
  },

  addLocation: async (userId, name, parentId) => {
    const { locations } = get();
    const orderIndex = parentId
      ? (locations.find((l) => l.id === parentId)?.subsections.length ?? 0)
      : locations.length;

    const { data, error } = await supabase
      .from('storage_locations')
      .insert({ user_id: userId, name, order_index: orderIndex, parent_id: parentId ?? null })
      .select()
      .single();

    if (error || !data) return null;

    const newLoc: StorageLocationWithItems = { ...data, items: [], subsections: [] };

    if (parentId) {
      set((state) => ({
        locations: state.locations.map((l) =>
          l.id === parentId
            ? { ...l, subsections: [...l.subsections, newLoc] }
            : l
        ),
      }));
    } else {
      set((state) => ({ locations: [...state.locations, newLoc] }));
    }
    return newLoc;
  },

  updateLocation: async (id, name) => {
    const { error } = await supabase
      .from('storage_locations')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        locations: state.locations.map((l) => {
          if (l.id === id) return { ...l, name };
          return {
            ...l,
            subsections: l.subsections.map((s) => (s.id === id ? { ...s, name } : s)),
          };
        }),
      }));
    }
  },

  deleteLocation: async (id) => {
    const { error } = await supabase.from('storage_locations').delete().eq('id', id);
    if (!error) {
      set((state) => ({
        locations: state.locations
          .filter((l) => l.id !== id)
          .map((l) => ({
            ...l,
            subsections: l.subsections.filter((s) => s.id !== id),
          })),
      }));
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

  moveSubsection: async (parentId, id, direction) => {
    const { locations } = get();
    const parent = locations.find((l) => l.id === parentId);
    if (!parent) return;
    const idx = parent.subsections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= parent.subsections.length) return;
    const next = [...parent.subsections];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    set((state) => ({
      locations: state.locations.map((l) =>
        l.id === parentId ? { ...l, subsections: next } : l
      ),
    }));
    await Promise.all(
      next.map((s, i) =>
        supabase.from('storage_locations').update({ order_index: i }).eq('id', s.id)
      )
    );
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
      // Count items in the target location (could be a subsection)
      const { locations } = get();
      let nextIndex = 0;
      for (const loc of locations) {
        if (loc.id === locationId) { nextIndex = loc.items.length; break; }
        for (const sub of loc.subsections) {
          if (sub.id === locationId) { nextIndex = sub.items.length; break; }
        }
      }
      const { data: created } = await supabase
        .from('items')
        .insert({ user_id: userId, name, home_location_id: locationId, order_index: nextIndex, tags: [], brand: meta?.brand ?? null, quantity: meta?.quantity ?? null, image_url: meta?.image_url ?? null })
        .select()
        .single();
      item = created;
    }

    if (item) {
      set((state) => ({
        locations: state.locations.map((l) => {
          if (l.id === locationId) return { ...l, items: [...l.items, item] };
          return {
            ...l,
            subsections: l.subsections.map((s) =>
              s.id === locationId ? { ...s, items: [...s.items, item] } : s
            ),
          };
        }),
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
          subsections: l.subsections.map((s) => ({
            ...s,
            items: s.items.map((item) => (item.id === id ? { ...item, name } : item)),
          })),
        })),
      }));
    }
  },

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
          subsections: l.subsections.map((s) => ({
            ...s,
            items: s.items.filter((item) => item.id !== id),
          })),
        })),
      }));
    }
  },

  moveItem: async (locationId, itemId, direction) => {
    const { locations } = get();

    // Find the location (top-level or subsection)
    let items: any[] | null = null;
    for (const loc of locations) {
      if (loc.id === locationId) { items = loc.items; break; }
      for (const sub of loc.subsections) {
        if (sub.id === locationId) { items = sub.items; break; }
      }
      if (items) break;
    }
    if (!items) return;

    const idx = items.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= items.length) return;
    const newItems = [...items];
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];

    set((state) => ({
      locations: state.locations.map((l) => {
        if (l.id === locationId) return { ...l, items: newItems };
        return {
          ...l,
          subsections: l.subsections.map((s) =>
            s.id === locationId ? { ...s, items: newItems } : s
          ),
        };
      }),
    }));

    await Promise.all([
      supabase.from('items').update({ order_index: idx }).eq('id', newItems[idx].id),
      supabase.from('items').update({ order_index: newIdx }).eq('id', newItems[newIdx].id),
    ]);
  },

  transferItem: async (itemId, fromLocationId, toLocationId, atEnd) => {
    const { locations } = get();

    // Find item in fromLocation (top-level or subsection)
    const findInLoc = (locs: StorageLocationWithItems[], locId: string) => {
      for (const l of locs) {
        if (l.id === locId) return l.items;
        for (const s of l.subsections) {
          if (s.id === locId) return s.items;
        }
      }
      return null;
    };

    const fromItems = findInLoc(locations, fromLocationId);
    const toItems = findInLoc(locations, toLocationId);
    if (!fromItems || !toItems) return;

    const item = fromItems.find((i) => i.id === itemId);
    if (!item) return;

    const newFromItems = fromItems.filter((i) => i.id !== itemId);
    const newToItems = atEnd ? [...toItems, item] : [item, ...toItems];

    const patchLoc = (locs: StorageLocationWithItems[], locId: string, newItems: any[]): StorageLocationWithItems[] =>
      locs.map((l) => {
        if (l.id === locId) return { ...l, items: newItems };
        return { ...l, subsections: l.subsections.map((s) => s.id === locId ? { ...s, items: newItems } : s) };
      });

    set((state) => ({
      locations: patchLoc(patchLoc(state.locations, fromLocationId, newFromItems), toLocationId, newToItems),
    }));

    // Persist: update home_location_id and order_index
    const newOrderIdx = atEnd ? newToItems.length - 1 : 0;
    await supabase.from('items').update({ home_location_id: toLocationId, order_index: newOrderIdx }).eq('id', itemId);
    await Promise.all(newFromItems.map((i, idx) => supabase.from('items').update({ order_index: idx }).eq('id', i.id)));
    await Promise.all(newToItems.map((i, idx) => supabase.from('items').update({ order_index: idx }).eq('id', i.id)));
  },
}));
