import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';
import { queueChange } from '../lib/sync';
import { localStore, STORAGE_KEYS } from '../lib/storage';
import { getHouseholdId } from '../lib/householdContext';
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

// Module-level network state — updated by listener so mutations are synchronous checks
let _online = true;
NetInfo.fetch().then((s) => { _online = s.isConnected !== false; });
NetInfo.addEventListener((s) => { _online = s.isConnected !== false; });

async function cacheList(list: ShoppingListItemWithName[], notes: string) {
  await localStore.set(STORAGE_KEYS.SHOPPING_LIST, { list, notes });
}

export type StoreLocation = {
  aisle_id: string;
  position_index: number;
  aisles: { id: string; name: string; order_index: number; store_id: string };
};

export type ShoppingListItemWithName = ShoppingListItem & {
  item_name: string;
  item_brand: string | null;
  item_quantity: string | null;
  store_locations: StoreLocation[];
  household_id: string | null;
  added_by: string | null;
};

interface ShoppingStore {
  shoppingList: ShoppingListItemWithName[];
  notes: string;
  currentStore: StoreProfile | null;
  mode: ShopMode;
  isLoading: boolean;
  history: Record<string, ShoppingListItemWithName[]>;
  setMode: (mode: ShopMode) => void;
  setCurrentStore: (store: StoreProfile | null) => void;
  fetchShoppingList: (userId: string, date: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
  addToList: (userId: string, itemId: string, quantity: number, optimisticName?: string) => Promise<void>;
  removeFromList: (id: string) => Promise<void>;
  toggleChecked: (id: string, checked: boolean) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  updateNotes: (userId: string, date: string, notes: string) => Promise<void>;
  clearCheckedItems: () => Promise<void>;
  markAllChecked: (ids: string[], checked: boolean) => Promise<void>;
  updateAisleItemOrder: (aisleId: string, positions: { itemId: string; position_index: number }[]) => void;
  applyRealtimeChange: (event: 'UPDATE' | 'DELETE', row?: any, id?: string) => void;
}

export const useShoppingStore = create<ShoppingStore>()((set, get) => ({
  shoppingList: [],
  notes: '',
  currentStore: null,
  mode: 'shop',
  isLoading: false,
  history: {},

  setMode: (mode) => set({ mode }),

  setCurrentStore: (store) => {
    set({ currentStore: store });
    saveCurrentStore(store);
  },

  fetchShoppingList: async (userId, date) => {
    set({ isLoading: true });

    // Show cached data instantly while fetching
    const cached = await localStore.get<{ list: ShoppingListItemWithName[]; notes: string }>(STORAGE_KEYS.SHOPPING_LIST);
    if (cached) {
      set({ shoppingList: cached.list, notes: cached.notes ?? '' });
    }

    if (!_online) {
      set({ isLoading: false });
      return;
    }

    const householdId = getHouseholdId();
    const listQuery = householdId
      ? supabase
          .from('shopping_list')
          .select('*, items(name, brand, quantity, item_store_locations(aisle_id, position_index, aisles(id, name, order_index, store_id)))')
          .eq('shopping_date', date)
          .or(`user_id.eq.${userId},household_id.eq.${householdId}`)
      : supabase
          .from('shopping_list')
          .select('*, items(name, brand, quantity, item_store_locations(aisle_id, position_index, aisles(id, name, order_index, store_id)))')
          .eq('user_id', userId)
          .eq('shopping_date', date);

    const [listResult, notesResult] = await Promise.all([
      listQuery,
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
        item_brand: row.items?.brand ?? null,
        item_quantity: row.items?.quantity ?? null,
        store_locations: row.items?.item_store_locations ?? [],
        household_id: (row as any).household_id ?? null,
        added_by: (row as any).added_by ?? null,
      })) as ShoppingListItemWithName[];
      set({ shoppingList: withNames });
      const notes = !notesResult.error ? (notesResult.data?.content ?? '') : get().notes;
      set({ notes });
      await cacheList(withNames, notes);
    } else if (!notesResult.error) {
      set({ notes: notesResult.data?.content ?? '' });
    }
    set({ isLoading: false });
  },

  fetchHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('shopping_list')
      .select(`*, items(name, brand, quantity)`)
      .eq('user_id', user.id)
      .gte('shopping_date', sevenDaysAgo)
      .lt('shopping_date', today)
      .order('shopping_date', { ascending: false });
    if (error || !data) return;
    const grouped: Record<string, ShoppingListItemWithName[]> = {};
    for (const row of data) {
      const date = row.shopping_date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push({
        ...row,
        item_name: (row.items as any)?.name ?? '',
        item_brand: (row.items as any)?.brand ?? null,
        item_quantity: (row.items as any)?.quantity ?? null,
        store_locations: [],
      });
    }
    set({ history: grouped });
  },

  addToList: async (userId, itemId, quantity, optimisticName?) => {
    const date = new Date().toISOString().split('T')[0];
    const householdId = getHouseholdId();

    // Use a stable UUID so it can be referenced in queued changes if offline
    const offlineId = crypto.randomUUID();
    if (optimisticName) {
      const optimistic: ShoppingListItemWithName = {
        id: offlineId,
        user_id: userId,
        item_id: itemId,
        quantity,
        checked: false,
        shopping_date: date,
        item_name: optimisticName,
        item_brand: null,
        item_quantity: null,
        store_locations: [],
        household_id: householdId,
        added_by: householdId ? userId : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      set((state) => ({ shoppingList: [...state.shoppingList, optimistic] }));
    }

    if (!_online) {
      await queueChange({ table_name: 'shopping_list', record_id: offlineId, operation: 'INSERT', data: { id: offlineId, user_id: userId, item_id: itemId, quantity, shopping_date: date, checked: false, ...(householdId ? { household_id: householdId, added_by: userId } : {}) }, timestamp: Date.now() });
      await cacheList(get().shoppingList, get().notes);
      return;
    }

    const { data, error } = await supabase
      .from('shopping_list')
      .insert({ user_id: userId, item_id: itemId, quantity, shopping_date: date, ...(householdId ? { household_id: householdId, added_by: userId } : {}) })
      .select('*, items(name, brand, quantity, item_store_locations(aisle_id, position_index, aisles(id, name, order_index, store_id)))')
      .single();

    if (!error && data) {
      const withName: ShoppingListItemWithName = {
        ...(data as any),
        item_name: (data as any).items?.name ?? optimisticName ?? '',
        item_brand: (data as any).items?.brand ?? null,
        item_quantity: (data as any).items?.quantity ?? null,
        store_locations: (data as any).items?.item_store_locations ?? [],
        household_id: (data as any).household_id ?? null,
        added_by: (data as any).added_by ?? null,
      };
      // Replace optimistic entry (or append if no optimistic was added)
      set((state) => ({
        shoppingList: optimisticName
          ? state.shoppingList.map((i) => i.id === offlineId ? withName : i)
          : [...state.shoppingList, withName],
      }));
      await cacheList(get().shoppingList, get().notes);
    } else if (error && optimisticName) {
      // Revert optimistic entry on error
      set((state) => ({ shoppingList: state.shoppingList.filter((i) => i.id !== offlineId) }));
    }
  },

  removeFromList: async (id) => {
    // Optimistic: remove immediately for instant UI response
    set((state) => ({ shoppingList: state.shoppingList.filter((i) => i.id !== id) }));
    if (!_online) {
      await queueChange({ table_name: 'shopping_list', record_id: id, operation: 'DELETE', data: null, timestamp: Date.now() });
      await cacheList(get().shoppingList, get().notes);
      return;
    }
    await supabase.from('shopping_list').delete().eq('id', id);
    await cacheList(get().shoppingList, get().notes);
  },

  toggleChecked: async (id, checked) => {
    const before = get().shoppingList.find((i) => i.id === id);
    // Optimistic: update immediately for instant UI response
    set((state) => ({
      shoppingList: state.shoppingList.map((i) => (i.id === id ? { ...i, checked } : i)),
    }));
    if (!_online) {
      await queueChange({ table_name: 'shopping_list', record_id: id, operation: 'UPDATE', data: { checked, updated_at: new Date().toISOString() }, timestamp: Date.now(), expected_updated_at: before?.updated_at });
      await cacheList(get().shoppingList, get().notes);
      return;
    }
    const { error } = await supabase
      .from('shopping_list')
      .update({ checked, updated_at: new Date().toISOString() })
      .eq('id', id);
    // Revert on error
    if (error) {
      set((state) => ({
        shoppingList: state.shoppingList.map((i) => (i.id === id ? { ...i, checked: !checked } : i)),
      }));
    } else {
      await cacheList(get().shoppingList, get().notes);
    }
  },

  updateQuantity: async (id, quantity) => {
    const before = get().shoppingList.find((i) => i.id === id);
    // Optimistic: update immediately
    set((state) => ({
      shoppingList: state.shoppingList.map((i) => (i.id === id ? { ...i, quantity } : i)),
    }));
    if (!_online) {
      await queueChange({ table_name: 'shopping_list', record_id: id, operation: 'UPDATE', data: { quantity, updated_at: new Date().toISOString() }, timestamp: Date.now(), expected_updated_at: before?.updated_at });
      await cacheList(get().shoppingList, get().notes);
      return;
    }
    await supabase
      .from('shopping_list')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', id);
    await cacheList(get().shoppingList, get().notes);
  },

  updateNotes: async (userId, date, notes) => {
    set({ notes });
    if (!_online) {
      await queueChange({ table_name: 'shopping_notes', record_id: `${userId}_${date}`, operation: 'UPSERT', data: { user_id: userId, shopping_date: date, content: notes }, timestamp: Date.now() });
      await cacheList(get().shoppingList, notes);
      return;
    }
    await supabase.from('shopping_notes').upsert(
      { user_id: userId, shopping_date: date, content: notes },
      { onConflict: 'user_id,shopping_date' }
    );
    await cacheList(get().shoppingList, notes);
  },

  markAllChecked: async (ids, checked) => {
    if (ids.length === 0) return;
    // Optimistic: update immediately
    set((state) => ({
      shoppingList: state.shoppingList.map((i) => ids.includes(i.id) ? { ...i, checked } : i),
    }));
    if (!_online) {
      const ts = Date.now();
      const list = get().shoppingList;
      await Promise.all(ids.map((id) => {
        const before = list.find((i) => i.id === id);
        return queueChange({ table_name: 'shopping_list', record_id: id, operation: 'UPDATE', data: { checked, updated_at: new Date().toISOString() }, timestamp: ts, expected_updated_at: before?.updated_at });
      }));
      await cacheList(get().shoppingList, get().notes);
      return;
    }
    await supabase
      .from('shopping_list')
      .update({ checked, updated_at: new Date().toISOString() })
      .in('id', ids);
    await cacheList(get().shoppingList, get().notes);
  },

  clearCheckedItems: async () => {
    const { shoppingList } = get();
    const checkedIds = shoppingList.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;
    // Optimistic: clear immediately for instant UI response
    set((state) => ({ shoppingList: state.shoppingList.filter((i) => !i.checked) }));
    if (!_online) {
      const ts = Date.now();
      await Promise.all(checkedIds.map((id) => queueChange({ table_name: 'shopping_list', record_id: id, operation: 'DELETE', data: null, timestamp: ts })));
      await cacheList(get().shoppingList, get().notes);
      return;
    }
    await supabase.from('shopping_list').delete().in('id', checkedIds);
    await cacheList(get().shoppingList, get().notes);
  },

  updateAisleItemOrder: (aisleId, positions) => {
    const posMap = new Map(positions.map((p) => [p.itemId, p.position_index]));
    set((state) => ({
      shoppingList: state.shoppingList.map((item) => ({
        ...item,
        store_locations: item.store_locations.map((loc) =>
          loc.aisle_id === aisleId && posMap.has(item.item_id)
            ? { ...loc, position_index: posMap.get(item.item_id)! }
            : loc
        ),
      })),
    }));
  },

  applyRealtimeChange: (event, row?, id?) => {
    if (event === 'UPDATE' && row) {
      set((state) => ({
        shoppingList: state.shoppingList.map((i) =>
          i.id === row.id ? { ...i, checked: row.checked, quantity: row.quantity, updated_at: row.updated_at } : i
        ),
      }));
    } else if (event === 'DELETE' && id) {
      set((state) => ({ shoppingList: state.shoppingList.filter((i) => i.id !== id) }));
    }
  },
}));

// Hydrate currentStore from AsyncStorage on startup
loadCurrentStore().then((store) => {
  if (store) {
    useShoppingStore.setState({ currentStore: store });
  }
});
