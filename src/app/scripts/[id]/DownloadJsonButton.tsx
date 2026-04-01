'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface Props {
  scriptId: string
  blob: string
  downloadName: string
}

export function DownloadJsonButton({ scriptId, blob, downloadName }: Props) {
  function track() {
    fetch('/api/track-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId }),
    }).catch(() => {})
  }
  return (
    <a href={blob} download={downloadName} onClick={track}>
      <Button variant="outline" size="sm" className="gap-1.5">
        <Download className="h-4 w-4" />
        Download JSON
      </Button>
    </a>
  )
}
