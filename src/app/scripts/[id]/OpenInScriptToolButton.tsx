'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Loader2 } from 'lucide-react'

const SCRIPT_TOOL_URL = 'https://script.bloodontheclocktower.com'

async function encodeScriptForUrl(json: unknown): Promise<string> {
  const jsonString = JSON.stringify(json)
  const encoded = new TextEncoder().encode(jsonString)
  const stream = new Blob([encoded]).stream().pipeThrough(new CompressionStream('gzip'))
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer())

  let binary = ''
  for (const byte of compressed) binary += String.fromCharCode(byte)
  return encodeURIComponent(btoa(binary))
}

export function OpenInScriptToolButton({ rawJson }: { rawJson: unknown }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const encoded = await encodeScriptForUrl(rawJson)
      window.open(`${SCRIPT_TOOL_URL}/?script=${encoded}`, '_blank', 'noopener')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
      Open in Script Tool
    </Button>
  )
}
