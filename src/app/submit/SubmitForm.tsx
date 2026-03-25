'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { parseScriptJson } from '@/lib/search'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function SubmitForm() {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  const [jsonText, setJsonText] = React.useState('')
  const [manualName, setManualName] = React.useState('')
  const [manualAuthor, setManualAuthor] = React.useState('')
  const [scriptType, setScriptType] = React.useState<'full' | 'teensy'>('full')
  const [status, setStatus] = React.useState<Status>('idle')
  const [errorMsg, setErrorMsg] = React.useState('')
  const [parsed, setParsed] = React.useState<ReturnType<typeof parseScriptJson> | null>(null)
  const [parseError, setParseError] = React.useState('')

  function handleJsonChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setJsonText(val)
    setParseError('')
    setParsed(null)
    if (!val.trim()) return
    try {
      const json = JSON.parse(val)
      const result = parseScriptJson(json)
      setParsed(result)
      if (!manualName) setManualName(result.name)
      if (!manualAuthor && result.author) setManualAuthor(result.author)
    } catch {
      setParseError('Invalid JSON — please paste a valid BotC script.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!parsed) return

    setStatus('loading')

    const { data: { user } } = await supabase.auth.getUser()
    const finalType = scriptType

    const { error } = await supabase.from('scripts').insert({
      name: manualName || parsed.name,
      author: manualAuthor || parsed.author || null,
      script_type: finalType,
      has_carousel: parsed.hasCarousel,
      character_ids: parsed.characterIds,
      raw_json: JSON.parse(jsonText),
      submitted_by: user?.id ?? null,
      status: 'approved',
    })

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  function resetForm() {
    setJsonText('')
    setManualName('')
    setManualAuthor('')
    setScriptType('full')
    setStatus('idle')
    setErrorMsg('')
    setParsed(null)
    setParseError('')
  }

  if (status === 'success') {
    return (
      <div className="max-w-lg flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Script uploaded!</h1>
        <p className="text-muted-foreground">
          Your script has been uploaded for review. It will appear in search results once approved.
        </p>
        <div className="flex gap-2">
          <Button onClick={resetForm}>Upload another</Button>
          <Button onClick={() => router.push('/')} variant="outline">Back to search</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Upload a script</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste your BotC script JSON below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="json">Script JSON</Label>
          <Textarea
            id="json"
            placeholder='[{"id": "_meta", "name": "My Script", ...}, ...]'
            rows={10}
            value={jsonText}
            onChange={handleJsonChange}
            className="font-mono text-xs"
            required
          />
          {parseError && <p className="text-sm text-destructive">{parseError}</p>}
          {parsed && (
            <p className="text-sm text-muted-foreground">
              Detected: {parsed.characterIds.length} characters, type: {parsed.scriptType}
              {parsed.hasCarousel ? ', has carousel' : ''}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Script name</Label>
          <Input
            id="name"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Auto-detected from JSON"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={manualAuthor}
            onChange={(e) => setManualAuthor(e.target.value)}
            placeholder="Auto-detected from JSON"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Script type</Label>
          <Select value={scriptType} onValueChange={(v) => setScriptType(v as typeof scriptType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="teensy">Teensy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {status === 'error' && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        <Button type="submit" disabled={!parsed || status === 'loading'}>
          {status === 'loading' ? 'Uploading…' : 'Upload'}
        </Button>
      </form>
    </div>
  )
}
