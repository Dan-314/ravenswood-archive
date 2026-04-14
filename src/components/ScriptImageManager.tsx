'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface CharacterWithImage {
  index: number
  id: string
  name: string
  currentUrl: string
}

interface ScriptImageManagerProps {
  jsonText: string
  onJsonChange: (next: string) => void
}

function extractImageSlots(jsonText: string): CharacterWithImage[] {
  let parsed: unknown
  try { parsed = JSON.parse(jsonText) } catch { return [] }
  if (!Array.isArray(parsed)) return []

  const slots: CharacterWithImage[] = []
  parsed.forEach((el, index) => {
    if (typeof el !== 'object' || el === null) return
    const obj = el as Record<string, unknown>
    if (obj.id === '_meta') return
    const image = obj.image
    const url =
      typeof image === 'string' ? image :
      Array.isArray(image) && typeof image[0] === 'string' ? image[0] as string :
      null
    if (!url) return
    slots.push({
      index,
      id: typeof obj.id === 'string' ? obj.id : `#${index}`,
      name: typeof obj.name === 'string' ? obj.name : (typeof obj.id === 'string' ? obj.id : `#${index}`),
      currentUrl: url,
    })
  })
  return slots
}

function rewriteImageUrl(jsonText: string, index: number, newUrl: string): string {
  const parsed = JSON.parse(jsonText)
  if (!Array.isArray(parsed)) return jsonText
  const el = parsed[index]
  if (typeof el !== 'object' || el === null) return jsonText
  const obj = el as Record<string, unknown>
  if (Array.isArray(obj.image)) {
    obj.image = [newUrl, ...(obj.image as unknown[]).slice(1)]
  } else {
    obj.image = newUrl
  }
  return JSON.stringify(parsed, null, 2)
}

export function ScriptImageManager({ jsonText, onJsonChange }: ScriptImageManagerProps) {
  const slots = React.useMemo(() => extractImageSlots(jsonText), [jsonText])
  const [busyIndex, setBusyIndex] = React.useState<number | null>(null)
  const [errorByIndex, setErrorByIndex] = React.useState<Record<number, string>>({})

  if (slots.length === 0) return null

  async function handleFile(index: number, file: File) {
    setBusyIndex(index)
    setErrorByIndex((prev) => { const next = { ...prev }; delete next[index]; return next })
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/uploads/script-image', { method: 'POST', body: form })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorByIndex((prev) => ({ ...prev, [index]: body.error || 'Upload failed' }))
        return
      }
      onJsonChange(rewriteImageUrl(jsonText, index, body.url))
    } catch {
      setErrorByIndex((prev) => ({ ...prev, [index]: 'Upload failed' }))
    } finally {
      setBusyIndex(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label>Character images</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Replace externally-hosted images with uploads so they load reliably. Uploads are re-encoded to WebP and hosted on this site.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {slots.map((slot) => {
          const err = errorByIndex[slot.index]
          const busy = busyIndex === slot.index
          const inputId = `img-upload-${slot.index}`
          return (
            <li key={`${slot.index}-${slot.id}`} className="flex items-center gap-3 border rounded-md p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.currentUrl}
                alt=""
                className="w-12 h-12 object-contain bg-muted rounded"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{slot.name}</div>
                <div className="text-xs text-muted-foreground truncate">{slot.currentUrl}</div>
                {err && <div className="text-xs text-destructive mt-1">{err}</div>}
              </div>
              <input
                id={inputId}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleFile(slot.index, f)
                  e.target.value = ''
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => document.getElementById(inputId)?.click()}
              >
                {busy ? 'Uploading…' : 'Replace'}
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
