'use client'

import { Download } from 'lucide-react'
import { useRealtimeCount } from '@/lib/hooks/use-realtime-count'

export function DownloadCount({ scriptId, initialCount }: { scriptId: string; initialCount: number }) {
  const count = useRealtimeCount(scriptId, 'download_count', initialCount)

  if (count <= 0) return null
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      <Download className="h-3 w-3" />
      {count.toLocaleString()} {count === 1 ? 'download' : 'downloads'}
    </p>
  )
}
