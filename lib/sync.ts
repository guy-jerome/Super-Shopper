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
  retry_count: number;
  /** The `updated_at` value of the row at queue time. Used for optimistic locking on UPDATE. */
  expected_updated_at?: string;
}

export async function queueChange(change: Omit<PendingChange, 'id' | 'synced' | 'retry_count'>): Promise<void> {
  const pending = (await localStore.get<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES)) ?? [];
  pending.push({ ...change, id: crypto.randomUUID(), synced: false, retry_count: 0 });
  await localStore.set(STORAGE_KEYS.PENDING_CHANGES, pending);
}

const MAX_RETRIES = 3;

export async function processPendingChanges(): Promise<{ failed: number }> {
  const pending = (await localStore.get<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES)) ?? [];
  const unsynced = pending.filter((c) => !c.synced && (c.retry_count ?? 0) < MAX_RETRIES);

  for (const change of unsynced) {
    try {
      if (change.operation === 'DELETE') {
        await supabase.from(change.table_name as never).delete().eq('id', change.record_id);
      } else if (change.operation === 'INSERT') {
        await supabase.from(change.table_name as never).insert(change.data as never);
      } else if (change.operation === 'UPDATE') {
        if (change.expected_updated_at) {
          // Optimistic locking: only apply if server row hasn't changed since we queued this
          const { data: rows } = await supabase
            .from(change.table_name as never)
            .update(change.data as never)
            .eq('id', change.record_id)
            .eq('updated_at', change.expected_updated_at)
            .select('id');
          // 0 rows = concurrent edit detected — discard our stale change (server version wins)
          if (!rows || (rows as { id: string }[]).length === 0) {
            change.synced = true;
          }
        } else {
          await supabase
            .from(change.table_name as never)
            .update(change.data as never)
            .eq('id', change.record_id);
        }
      } else if (change.operation === 'UPSERT') {
        await supabase
          .from(change.table_name as never)
          .upsert(change.data as never);
      }
      change.synced = true;
    } catch {
      change.retry_count = (change.retry_count ?? 0) + 1;
    }
  }

  const remaining = pending.filter((c) => !c.synced);
  await localStore.set(STORAGE_KEYS.PENDING_CHANGES, remaining);
  const failed = remaining.filter((c) => (c.retry_count ?? 0) >= MAX_RETRIES).length;
  return { failed };
}
