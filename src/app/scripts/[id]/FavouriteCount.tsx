'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function FavouriteCount({ scriptId, initialCount }: { scriptId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`favourites-${scriptId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scripts',
          filter: `id=eq.${scriptId}`,
        },
        (payload) => {
          const n = (payload.new as { favourite_count: number }).favourite_count
          if (typeof n === 'number') setCount(n)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [scriptId])

  if (count <= 0) return null
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      <Heart className="h-3 w-3" />
      {count.toLocaleString()} {count === 1 ? 'favourite' : 'favourites'}
    </p>
  )
}
