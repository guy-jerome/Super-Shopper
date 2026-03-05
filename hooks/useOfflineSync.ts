import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processPendingChanges } from '../lib/sync';
import type { SyncStatus } from '../types/app.types';

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>('online');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        setStatus('syncing');
        await processPendingChanges();
        setStatus('online');
      } else {
        setStatus('offline');
      }
    });

    return unsubscribe;
  }, []);

  return { status, isOnline: status !== 'offline' };
}
