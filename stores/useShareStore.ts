import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { SharedList } from '../types/app.types';
import type { ShoppingListItemWithName } from './useShoppingStore';

export type ShareWithEmail = SharedList & { email: string };

export type SharedUserList = {
  ownerId: string;
  ownerEmail: string;
  items: ShoppingListItemWithName[];
};

interface ShareStore {
  // People I've shared my list with
  myShares: ShareWithEmail[];
  // People who've shared their list with me + their items
  sharedWithMe: SharedUserList[];
  isLoading: boolean;

  loadShares: () => Promise<void>;
  shareWithEmail: (email: string) => Promise<void>;
  removeShare: (shareId: string) => Promise<void>;
  loadSharedItems: (date: string) => Promise<void>;
}

export const useShareStore = create<ShareStore>((set, get) => ({
  myShares: [],
  sharedWithMe: [],
  isLoading: false,

  loadShares: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load shares I created — join profiles to get the shared_with email
    const { data: mySharesData } = await supabase
      .from('shared_lists')
      .select('*, profiles!shared_lists_shared_with_id_fkey(email)')
      .eq('owner_id', user.id);

    const myShares: ShareWithEmail[] = (mySharesData ?? []).map((row: any) => ({
      id: row.id,
      owner_id: row.owner_id,
      shared_with_id: row.shared_with_id,
      permission_level: row.permission_level,
      created_at: row.created_at,
      email: row.profiles?.email ?? row.shared_with_id,
    }));

    set({ myShares });
  },

  shareWithEmail: async (email: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      throw new Error('Please enter a valid email address');
    }

    // Look up the target user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (profileError || !profile) throw new Error('No user found with that email');
    if (profile.id === user.id) throw new Error("You can't share with yourself");

    // Check if already shared
    const { data: existing } = await supabase
      .from('shared_lists')
      .select('id')
      .eq('owner_id', user.id)
      .eq('shared_with_id', profile.id)
      .maybeSingle();

    if (existing) throw new Error('Already shared with this user');

    const { error } = await supabase.from('shared_lists').insert({
      owner_id: user.id,
      shared_with_id: profile.id,
      permission_level: 'read',
    });
    if (error) throw error;

    await get().loadShares();
  },

  removeShare: async (shareId: string) => {
    const { error } = await supabase.from('shared_lists').delete().eq('id', shareId);
    if (error) throw error;
    set((s) => ({ myShares: s.myShares.filter((x) => x.id !== shareId) }));
  },

  loadSharedItems: async (date: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find all users who shared their list with me
    const { data: inboundShares } = await supabase
      .from('shared_lists')
      .select('owner_id, profiles!shared_lists_owner_id_fkey(email)')
      .eq('shared_with_id', user.id);

    if (!inboundShares || inboundShares.length === 0) {
      set({ sharedWithMe: [] });
      return;
    }

    const ownerIds = inboundShares.map((s: any) => s.owner_id);

    // Fetch their shopping lists for today
    const { data: listData } = await supabase
      .from('shopping_list')
      .select(`
        *,
        items!inner(name, brand, quantity, item_store_locations(aisle_id, position_index, aisles(id, name, order_index, store_id)))
      `)
      .in('user_id', ownerIds)
      .eq('shopping_date', date);

    const byOwner = new Map<string, ShoppingListItemWithName[]>();
    for (const row of (listData ?? []) as any[]) {
      const entry: ShoppingListItemWithName = {
        id: row.id,
        user_id: row.user_id,
        item_id: row.item_id,
        quantity: row.quantity,
        checked: row.checked,
        shopping_date: row.shopping_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
        item_name: row.items?.name ?? '',
        item_brand: row.items?.brand ?? null,
        item_quantity: row.items?.quantity ?? null,
        store_locations: (row.items?.item_store_locations ?? []).map((loc: any) => ({
          aisle_id: loc.aisle_id,
          position_index: loc.position_index,
          aisles: loc.aisles,
        })),
      };
      if (!byOwner.has(row.user_id)) byOwner.set(row.user_id, []);
      byOwner.get(row.user_id)!.push(entry);
    }

    const sharedWithMe: SharedUserList[] = inboundShares.map((s: any) => ({
      ownerId: s.owner_id,
      ownerEmail: s.profiles?.email ?? s.owner_id,
      items: byOwner.get(s.owner_id) ?? [],
    }));

    set({ sharedWithMe });
  },
}));
