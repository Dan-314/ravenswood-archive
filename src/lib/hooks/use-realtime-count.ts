'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribe to realtime updates for a numeric column on the scripts table.
 */
export function useRealtimeCount(
  scriptId: string,
  column: string,
  initialCount: number,
): number {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`${column}-${scriptId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scripts',
          filter: `id=eq.${scriptId}`,
        },
        (payload) => {
          const n = (payload.new as Record<string, unknown>)[column]
          if (typeof n === 'number') setCount(n)
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [scriptId, column])

  return count
}
