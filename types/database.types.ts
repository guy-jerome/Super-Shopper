export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Views: { [_ in never]: { Row: Record<string, unknown>; Relationships: [] } };
    Functions: { [_ in never]: { Args: Record<string, unknown>; Returns: unknown } };
    Tables: {
      storage_locations: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['storage_locations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['storage_locations']['Insert']>;
        Relationships: [];
      };
      store_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['store_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['store_profiles']['Insert']>;
        Relationships: [];
      };
      aisles: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          side: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['aisles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['aisles']['Insert']>;
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          home_location_id: string | null;
          order_index: number;
          tags: string[];
          brand: string | null;
          quantity: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['items']['Row'], 'id' | 'created_at' | 'updated_at' | 'home_location_id' | 'order_index'> & { home_location_id?: string | null; order_index?: number };
        Update: Partial<Database['public']['Tables']['items']['Insert']>;
        Relationships: [];
      };
      item_store_locations: {
        Row: {
          id: string;
          item_id: string;
          aisle_id: string;
          position_index: number;
          position_tag: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['item_store_locations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['item_store_locations']['Insert']>;
        Relationships: [];
      };
      shopping_list: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          quantity: number;
          checked: boolean;
          shopping_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shopping_list']['Row'], 'id' | 'created_at' | 'updated_at' | 'checked'> & { checked?: boolean };
        Update: Partial<Database['public']['Tables']['shopping_list']['Insert']>;
        Relationships: [];
      };
      shopping_notes: {
        Row: {
          id: string;
          user_id: string;
          shopping_date: string;
          content: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shopping_notes']['Row'], 'id' | 'updated_at'> & { updated_at?: string };
        Update: Partial<Database['public']['Tables']['shopping_notes']['Insert']>;
        Relationships: [];
      };
      shared_lists: {
        Row: {
          id: string;
          owner_id: string;
          shared_with_id: string;
          permission_level: 'read' | 'write';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shared_lists']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['shared_lists']['Insert']>;
        Relationships: [];
      };
    };
  };
}
