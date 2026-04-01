'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DownloadCount({ scriptId, initialCount }: { scriptId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`downloads-${scriptId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scripts',
          filter: `id=eq.${scriptId}`,
        },
        (payload) => {
          const n = (payload.new as { download_count: number }).download_count
          if (typeof n === 'number') setCount(n)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [scriptId])

  if (count <= 0) return null
  return (
    <p className="text-xs text-muted-foreground">
      {count.toLocaleString()} {count === 1 ? 'download' : 'downloads'}
    </p>
  )
}
