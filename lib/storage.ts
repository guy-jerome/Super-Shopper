import AsyncStorage from '@react-native-async-storage/async-storage';

export const localStore = {
  async get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};

export const STORAGE_KEYS = {
  SHOPPING_LIST: 'shopping_list',
  STORAGE_LOCATIONS: 'storage_locations',
  STORE_PROFILES: 'store_profiles',
  PENDING_CHANGES: 'pending_changes',
  CURRENT_USER: 'current_user',
} as const;
