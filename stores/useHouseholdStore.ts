import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { setHouseholdId } from '../lib/householdContext';


export type Household = {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  joined_at: string;
  email: string;
};

interface HouseholdStore {
  household: Household | null;
  members: HouseholdMember[];
  isLoading: boolean;
  loadHousehold: () => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
  generateInviteCode: () => Promise<string>;
  joinHousehold: (code: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
}

export const useHouseholdStore = create<HouseholdStore>((set, get) => ({
  household: null,
  members: [],
  isLoading: false,

  loadHousehold: async () => {
    set({ isLoading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ isLoading: false }); return; }

    const { data: membership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      setHouseholdId(null);
      set({ household: null, members: [], isLoading: false });
      return;
    }

    const [householdResult, membersResult] = await Promise.all([
      supabase.from('households').select('*').eq('id', (membership as any).household_id).single(),
      supabase
        .from('household_members')
        .select('*, profiles(email)')
        .eq('household_id', (membership as any).household_id),
    ]);

    const household = householdResult.data as Household | null;
    setHouseholdId(household?.id ?? null);
    if (household) set({ household });

    if (membersResult.data) {
      set({
        members: membersResult.data.map((m: any) => ({
          id: m.id,
          household_id: m.household_id,
          user_id: m.user_id,
          joined_at: m.joined_at,
          email: m.profiles?.email ?? 'Unknown',
        })),
      });
    }

    set({ isLoading: false });
  },

  createHousehold: async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const { data: household, error: hErr } = await supabase
      .from('households')
      .insert({ name: name.trim() || 'Our Household', created_by: user.id })
      .select()
      .single();
    if (hErr || !household) throw new Error(hErr?.message ?? 'Failed to create household');

    const { error: mErr } = await supabase
      .from('household_members')
      .insert({ household_id: (household as any).id, user_id: user.id });
    if (mErr) throw new Error(mErr.message);

    await get().loadHousehold();
  },

  generateInviteCode: async () => {
    const { household } = get();
    if (!household) throw new Error('Not in a household');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('household_invites').insert({
      code,
      household_id: household.id,
      created_by: user.id,
      expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);
    return code;
  },

  joinHousehold: async (code: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');

    const { data: invite } = await supabase
      .from('household_invites')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!invite) throw new Error('Invalid or expired invite code');

    const { error: joinErr } = await supabase
      .from('household_members')
      .insert({ household_id: (invite as any).household_id, user_id: user.id });
    if (joinErr) {
      if (joinErr.code === '23505') throw new Error('You are already in this household');
      throw new Error(joinErr.message);
    }

    await supabase.from('household_invites').update({ used: true }).eq('id', (invite as any).id);
    await get().loadHousehold();
  },

  leaveHousehold: async () => {
    const { household } = get();
    const { data: { user } } = await supabase.auth.getUser();
    if (!household || !user) return;

    await supabase
      .from('household_members')
      .delete()
      .eq('household_id', household.id)
      .eq('user_id', user.id);

    setHouseholdId(null);
    set({ household: null, members: [] });
  },
}));
