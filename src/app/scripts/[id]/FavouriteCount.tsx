'use client'

import { Heart } from 'lucide-react'
import { useRealtimeCount } from '@/lib/hooks/use-realtime-count'

export function FavouriteCount({ scriptId, initialCount }: { scriptId: string; initialCount: number }) {
  const count = useRealtimeCount(scriptId, 'favourite_count', initialCount)

  if (count <= 0) return null
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      <Heart className="h-3 w-3" />
      {count.toLocaleString()} {count === 1 ? 'favourite' : 'favourites'}
    </p>
  )
}
