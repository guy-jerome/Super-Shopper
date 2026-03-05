import type { Database } from './database.types';

export type StorageLocation = Database['public']['Tables']['storage_locations']['Row'];
export type StoreProfile = Database['public']['Tables']['store_profiles']['Row'];
export type Aisle = Database['public']['Tables']['aisles']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type ItemStoreLocation = Database['public']['Tables']['item_store_locations']['Row'];
export type ShoppingListItem = Database['public']['Tables']['shopping_list']['Row'];
export type ShoppingNote = Database['public']['Tables']['shopping_notes']['Row'];
export type SharedList = Database['public']['Tables']['shared_lists']['Row'];

export type StorageLocationWithItems = StorageLocation & {
  items: Item[];
};

export type AisleWithItems = Aisle & {
  item_store_locations: (ItemStoreLocation & { item: Item })[];
};

export type StoreWithAisles = StoreProfile & {
  aisles: AisleWithItems[];
};

export type ShopMode = 'edit' | 'shop';

export type SyncStatus = 'online' | 'offline' | 'syncing';
