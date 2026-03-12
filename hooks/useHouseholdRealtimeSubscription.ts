import { useEffect } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useHouseholdRealtimeSubscription(
  householdId: string | null,
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
) {
  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`household_list_${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list',
          filter: `household_id=eq.${householdId}`,
        },
        onChange,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, onChange]);
}
