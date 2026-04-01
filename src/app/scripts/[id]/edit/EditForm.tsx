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
import type { Script } from '@/lib/supabase/types'

interface EditFormProps {
  script: Script
}

export function EditForm({ script }: EditFormProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  const [name, setName] = React.useState(script.name)
  const [author, setAuthor] = React.useState(script.author ?? '')
  const [description, setDescription] = React.useState(script.description ?? '')
  const [scriptType, setScriptType] = React.useState<'full' | 'teensy'>(script.script_type)
  const [jsonText, setJsonText] = React.useState(JSON.stringify(script.raw_json, null, 2))
  const [parseError, setParseError] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  function handleJsonChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setJsonText(val)
    setParseError('')
    if (!val.trim()) return
    try {
      JSON.parse(val)
    } catch {
      setParseError('Invalid JSON')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    let parsed
    try {
      const json = JSON.parse(jsonText)
      parsed = parseScriptJson(json)
    } catch {
      setParseError('Invalid JSON')
      setSaving(false)
      return
    }

    const rawJson = JSON.parse(jsonText)
    const versionPayload = {
      name,
      author: author || null,
      script_type: scriptType,
      has_carousel: parsed.hasCarousel,
      character_ids: parsed.characterIds,
      raw_json: rawJson,
    }

    // Get current max version number
    const { data: versionData, error: versionQueryError } = await supabase
      .from('script_versions')
      .select('version_number')
      .eq('script_id', script.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionQueryError && versionQueryError.code !== 'PGRST116') {
      setError(versionQueryError.message)
      setSaving(false)
      return
    }

    const nextVersion = (versionData?.version_number ?? 0) + 1
    const { data: { user } } = await supabase.auth.getUser()

    // Insert new version
    const { error: insertError } = await supabase
      .from('script_versions')
      .insert({ script_id: script.id, version_number: nextVersion, edited_by: user?.id ?? null, ...versionPayload })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    // Update scripts table to keep it as current
    const { error: updateError } = await supabase
      .from('scripts')
      .update({ ...versionPayload, description: description.trim() || null })
      .eq('id', script.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push(`/scripts/${script.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Edit script</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Script name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="author">Author</Label>
          <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the themes or mechanics of your script (optional)"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Script type</Label>
          <Select value={scriptType} onValueChange={(v) => setScriptType(v as 'full' | 'teensy')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="teensy">Teensy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="json">Script JSON</Label>
          <Textarea
            id="json"
            rows={10}
            value={jsonText}
            onChange={handleJsonChange}
            className="font-mono text-xs"
            required
          />
          {parseError && <p className="text-sm text-destructive">{parseError}</p>}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving || !!parseError}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
