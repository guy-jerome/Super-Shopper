import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { StoreProfile, StoreWithAisles } from '../types/app.types';
import { useShoppingStore } from './useShoppingStore';

interface StoreStore {
  stores: StoreProfile[];
  activeStore: StoreWithAisles | null;
  isLoading: boolean;
  fetchStores: (userId: string) => Promise<void>;
  fetchStoreWithAisles: (storeId: string) => Promise<void>;
  addStore: (userId: string, name: string) => Promise<void>;
  updateStore: (id: string, name: string) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  addAisle: (storeId: string, name: string, sectionTag?: string) => Promise<void>;
  updateAisle: (aisleId: string, name: string, side?: string | null) => Promise<void>;
  deleteAisle: (aisleId: string) => Promise<void>;
  moveAisle: (aisleId: string, direction: 'up' | 'down') => Promise<void>;
  addItemToAisle: (userId: string, aisleId: string, itemName: string, positionTag?: string, meta?: { brand?: string | null; quantity?: string | null; image_url?: string | null }) => Promise<void>;
  removeItemFromAisle: (itemStoreLocationId: string) => Promise<void>;
  updateItemInAisle: (locId: string, positionTag: string | null) => Promise<void>;
  moveItemInAisle: (aisleId: string, itemLocId: string, direction: 'up' | 'down') => void;
  transferItemAcrossAisles: (itemLocId: string, fromAisleId: string, toAisleId: string, atEnd: boolean) => void;
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
      // Sort aisles by order_index, items by position_index
      const store = data as any;
      store.aisles = (store.aisles ?? [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((a: any) => ({
          ...a,
          item_store_locations: (a.item_store_locations ?? [])
            .sort((x: any, y: any) => x.position_index - y.position_index),
        }));
      set({ activeStore: store as StoreWithAisles });
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
        activeStore: state.activeStore?.id === id
          ? { ...state.activeStore, name }
          : state.activeStore,
      }));
    }
  },

  deleteStore: async (id) => {
    const { error } = await supabase.from('store_profiles').delete().eq('id', id);
    if (!error) {
      set((state) => ({ stores: state.stores.filter((s) => s.id !== id) }));
    }
  },

  addAisle: async (storeId, name, sectionTag) => {
    const { activeStore } = get();
    const orderIndex = activeStore ? activeStore.aisles.length : 0;
    const { data, error } = await supabase
      .from('aisles')
      .insert({ store_id: storeId, name, side: sectionTag ?? null, order_index: orderIndex })
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

  updateAisle: async (aisleId, name, side) => {
    const patch: any = { name, updated_at: new Date().toISOString() };
    if (side !== undefined) patch.side = side ?? null;
    const { error } = await supabase
      .from('aisles')
      .update(patch)
      .eq('id', aisleId);

    if (!error) {
      set((state) => {
        if (!state.activeStore) return state;
        return {
          activeStore: {
            ...state.activeStore,
            aisles: state.activeStore.aisles.map((a) =>
              a.id === aisleId ? { ...a, name, ...(side !== undefined && { side: side ?? null }) } : a
            ),
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

  moveAisle: async (aisleId, direction) => {
    const { activeStore } = get();
    if (!activeStore) return;
    const idx = activeStore.aisles.findIndex((a) => a.id === aisleId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= activeStore.aisles.length) return;
    const next = [...activeStore.aisles];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    set((state) => ({
      activeStore: state.activeStore ? { ...state.activeStore, aisles: next } : null,
    }));
    await Promise.all(
      next.map((a, i) => supabase.from('aisles').update({ order_index: i }).eq('id', a.id))
    );
  },

  addItemToAisle: async (userId, aisleId, itemName, positionTag, meta) => {
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
        .insert({ user_id: userId, name: itemName, tags: [], brand: meta?.brand ?? null, quantity: meta?.quantity ?? null, image_url: meta?.image_url ?? null })
        .select()
        .single();
      if (error || !newItem) return;
      itemId = newItem.id;
    }

    const { activeStore } = get();
    const aisle = activeStore?.aisles.find((a) => a.id === aisleId);
    const positionIndex = aisle ? aisle.item_store_locations.length : 0;

    const { data: loc, error: locError } = await supabase
      .from('item_store_locations')
      .insert({ item_id: itemId, aisle_id: aisleId, position_index: positionIndex, position_tag: positionTag ?? null })
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

  updateItemInAisle: async (locId, positionTag) => {
    const { error } = await supabase
      .from('item_store_locations')
      .update({ position_tag: positionTag })
      .eq('id', locId);

    if (!error) {
      set((state) => {
        if (!state.activeStore) return state;
        return {
          activeStore: {
            ...state.activeStore,
            aisles: state.activeStore.aisles.map((a) => ({
              ...a,
              item_store_locations: a.item_store_locations.map((l) =>
                l.id === locId ? { ...l, position_tag: positionTag } : l
              ),
            })),
          },
        };
      });
    }
  },

  moveItemInAisle: (aisleId, itemLocId, direction) => {
    const { activeStore } = get();
    if (!activeStore) return;
    const aisle = activeStore.aisles.find((a) => a.id === aisleId);
    if (!aisle) return;
    const idx = aisle.item_store_locations.findIndex((l) => l.id === itemLocId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= aisle.item_store_locations.length) return;
    const newLocs = [...aisle.item_store_locations];
    [newLocs[idx], newLocs[newIdx]] = [newLocs[newIdx], newLocs[idx]];
    set((state) => {
      if (!state.activeStore) return state;
      return {
        activeStore: {
          ...state.activeStore,
          aisles: state.activeStore.aisles.map((a) =>
            a.id === aisleId ? { ...a, item_store_locations: newLocs } : a
          ),
        },
      };
    });
    // Update shopping store immediately so shop tab re-sorts without a refetch
    useShoppingStore.getState().updateAisleItemOrder(
      aisleId,
      newLocs.map((l, i) => ({ itemId: (l as any).item_id, position_index: i }))
    );
    // Persist position_index
    Promise.all(
      newLocs.map((l, i) =>
        supabase.from('item_store_locations').update({ position_index: i }).eq('id', l.id)
      )
    );
  },

  transferItemAcrossAisles: (itemLocId, fromAisleId, toAisleId, atEnd) => {
    const { activeStore } = get();
    if (!activeStore) return;
    const fromAisle = activeStore.aisles.find((a) => a.id === fromAisleId);
    const toAisle = activeStore.aisles.find((a) => a.id === toAisleId);
    if (!fromAisle || !toAisle) return;
    const item = fromAisle.item_store_locations.find((l) => l.id === itemLocId);
    if (!item) return;

    const newFromLocs = fromAisle.item_store_locations.filter((l) => l.id !== itemLocId);
    const newToLocs = atEnd
      ? [...toAisle.item_store_locations, item]
      : [item, ...toAisle.item_store_locations];

    set((state) => {
      if (!state.activeStore) return state;
      return {
        activeStore: {
          ...state.activeStore,
          aisles: state.activeStore.aisles.map((a) => {
            if (a.id === fromAisleId) return { ...a, item_store_locations: newFromLocs };
            if (a.id === toAisleId) return { ...a, item_store_locations: newToLocs };
            return a;
          }),
        },
      };
    });

    // Update shopping store order for both aisles
    useShoppingStore.getState().updateAisleItemOrder(
      fromAisleId,
      newFromLocs.map((l, i) => ({ itemId: (l as any).item_id, position_index: i }))
    );
    useShoppingStore.getState().updateAisleItemOrder(
      toAisleId,
      newToLocs.map((l, i) => ({ itemId: (l as any).item_id, position_index: i }))
    );

    // Persist: move item to new aisle, update position indices for both aisles
    supabase.from('item_store_locations').update({ aisle_id: toAisleId, position_index: atEnd ? newToLocs.length - 1 : 0 }).eq('id', itemLocId);
    Promise.all([
      ...newFromLocs.map((l, i) => supabase.from('item_store_locations').update({ position_index: i }).eq('id', l.id)),
      ...newToLocs.map((l, i) => supabase.from('item_store_locations').update({ position_index: i }).eq('id', l.id)),
    ]);
  },
}));
