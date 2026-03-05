import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'shopping_list' | 'storage_locations' | 'items' | 'store_profiles' | 'aisles';

export function useRealtimeSubscription(
  table: TableName,
  userId: string,
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`${table}_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, userId, onChange]);
}
