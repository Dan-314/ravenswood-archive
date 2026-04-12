'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { trackDownload } from '@/lib/track-download'

interface Props {
  scriptId: string
  blob: string
  downloadName: string
}

export function DownloadJsonButton({ scriptId, blob, downloadName }: Props) {
  return (
    <a href={blob} download={downloadName} onClick={() => trackDownload(scriptId)}>
      <Button variant="outline" size="sm" className="gap-1.5">
        <Download className="h-4 w-4" />
        Download JSON
      </Button>
    </a>
  )
}
