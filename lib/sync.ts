import { supabase } from './supabase';
import { localStore, STORAGE_KEYS } from './storage';

export interface PendingChange {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  data: Record<string, unknown> | null;
  timestamp: number;
  synced: boolean;
}

export async function queueChange(change: Omit<PendingChange, 'id' | 'synced'>): Promise<void> {
  const pending = (await localStore.get<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES)) ?? [];
  pending.push({ ...change, id: crypto.randomUUID(), synced: false });
  await localStore.set(STORAGE_KEYS.PENDING_CHANGES, pending);
}

export async function processPendingChanges(): Promise<void> {
  const pending = (await localStore.get<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES)) ?? [];
  const unsynced = pending.filter((c) => !c.synced);

  for (const change of unsynced) {
    try {
      if (change.operation === 'DELETE') {
        await supabase.from(change.table_name as never).delete().eq('id', change.record_id);
      } else if (change.operation === 'INSERT') {
        await supabase.from(change.table_name as never).insert(change.data as never);
      } else if (change.operation === 'UPDATE') {
        await supabase
          .from(change.table_name as never)
          .update(change.data as never)
          .eq('id', change.record_id);
      } else if (change.operation === 'UPSERT') {
        await supabase
          .from(change.table_name as never)
          .upsert(change.data as never);
      }
      change.synced = true;
    } catch {
      // Leave as unsynced to retry later
    }
  }

  await localStore.set(STORAGE_KEYS.PENDING_CHANGES, pending.filter((c) => !c.synced));
}
