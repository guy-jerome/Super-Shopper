import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processPendingChanges } from '../lib/sync';
import { useAuthStore } from '../stores/useAuthStore';
import { useShoppingStore } from '../stores/useShoppingStore';
import type { SyncStatus } from '../types/app.types';

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>('online');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        setStatus('syncing');
        await processPendingChanges();
        // Re-fetch to reconcile local state with server after queued changes applied
        const user = useAuthStore.getState().user;
        if (user) {
          const today = new Date().toISOString().split('T')[0];
          await useShoppingStore.getState().fetchShoppingList(user.id, today);
        }
        setStatus('online');
      } else {
        setStatus('offline');
      }
    });

    return unsubscribe;
  }, []);

  return { status, isOnline: status !== 'offline' };
}
