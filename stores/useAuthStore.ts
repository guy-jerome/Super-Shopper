import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isRecovery: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    emailRedirectTo?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  resetPasswordForEmail: (email: string, redirectTo: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isRecovery: false,

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({ user: data.session?.user ?? null, isLoading: false });

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        set({ user: session?.user ?? null, isRecovery: true });
      } else {
        set({ user: session?.user ?? null });
      }
    });
  },

  resetPasswordForEmail: async (email, redirectTo) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },

  signUp: async (email, password, emailRedirectTo) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    set({ isRecovery: false });
  },

  deleteAccount: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Delete user data from all tables (RLS ensures only own rows are deleted)
    await Promise.all([
      supabase.from("shopping_list").delete().eq("user_id", user.id),
      supabase.from("shopping_notes").delete().eq("user_id", user.id),
      supabase.from("storage_locations").delete().eq("user_id", user.id),
      supabase.from("store_profiles").delete().eq("user_id", user.id),
      supabase.from("items").delete().eq("user_id", user.id),
    ]);

    // Sign out (auth.admin.deleteUser requires service key; just sign out instead)
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
