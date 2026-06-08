'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { parseScriptJson } from '@/lib/search'
import { patchMeta, formatDbError } from '@/lib/scriptMeta'
import { ScriptFormFields } from '@/components/ScriptFormFields'
import { ScriptImageManager } from '@/components/ScriptImageManager'
import { revalidatePages } from '@/app/actions/revalidate'
import type { Script, Json } from '@/lib/supabase/types'

interface EditFormProps {
  script: Script
}

export function EditForm({ script }: EditFormProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  const [name, setName] = React.useState(script.name)
  const [author, setAuthor] = React.useState(script.author ?? '')
  const [description, setDescription] = React.useState(script.description ?? '')
  const currentVersionLabel = script.version_label === '0' ? '1.0.0' : script.version_label
  const [versionLabel, setVersionLabel] = React.useState(currentVersionLabel)
  const [scriptType, setScriptType] = React.useState<'full' | 'teensy'>(script.script_type)
  const [hasHomebrew, setHasHomebrew] = React.useState(script.has_homebrew ?? false)
  const [jsonText, setJsonText] = React.useState(JSON.stringify(script.raw_json, null, 2))
  const [parseError, setParseError] = React.useState('')
  const [parsed, setParsed] = React.useState<ReturnType<typeof parseScriptJson> | null>(() => {
    try { return parseScriptJson(script.raw_json as unknown[]) } catch { return null }
  })
  const [noBump, setNoBump] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')

  function applyJsonText(val: string) {
    setJsonText(val)
    setParseError('')
    setParsed(null)
    if (!val.trim()) return
    try {
      const json = JSON.parse(val)
      const result = parseScriptJson(json)
      setParsed(result)
      setHasHomebrew(result.hasHomebrew)
    } catch {
      setParseError('Invalid JSON')
    }
  }

  function handleJsonChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    applyJsonText(e.target.value)
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

    const rawJson = JSON.parse(jsonText) as unknown[]
    patchMeta(rawJson, name, author)

    const versionPayload = {
      name,
      author: author || null,
      description: description.trim() || null,
      version_label: versionLabel.trim() || currentVersionLabel,
      script_type: scriptType,
      has_carousel: parsed.hasCarousel,
      has_homebrew: hasHomebrew,
      character_ids: parsed.characterIds,
      raw_json: rawJson as Json[],
    }

    if (noBump) {
      const { data: latestVersion, error: latestQueryError } = await supabase
        .from('script_versions')
        .select('id')
        .eq('script_id', script.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (latestQueryError) {
        setError(formatDbError(latestQueryError))
        setSaving(false)
        return
      }

      const { error: updateVersionError } = await supabase
        .from('script_versions')
        .update(versionPayload)
        .eq('id', latestVersion.id)

      if (updateVersionError) {
        setError(formatDbError(updateVersionError))
        setSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from('scripts')
        .update({ ...versionPayload })
        .eq('id', script.id)

      if (updateError) {
        setError(formatDbError(updateError))
        setSaving(false)
        return
      }

      await revalidatePages([`/scripts/${script.id}`, '/'])
      router.push(`/scripts/${script.id}`)
      return
    }

    const { data: versionData, error: versionQueryError } = await supabase
      .from('script_versions')
      .select('version_number')
      .eq('script_id', script.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionQueryError && versionQueryError.code !== 'PGRST116') {
      setError(formatDbError(versionQueryError))
      setSaving(false)
      return
    }

    const nextVersion = (versionData?.version_number ?? 0) + 1
    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertError } = await supabase
      .from('script_versions')
      .insert({ script_id: script.id, version_number: nextVersion, edited_by: user?.id ?? null, ...versionPayload })

    if (insertError) {
      setError(formatDbError(insertError))
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('scripts')
      .update({ ...versionPayload })
      .eq('id', script.id)

    if (updateError) {
      setError(formatDbError(updateError))
      setSaving(false)
      return
    }

    await revalidatePages([`/scripts/${script.id}`, '/'])
    router.push(`/scripts/${script.id}`)
  }

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Edit script</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
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

        <ScriptFormFields
          name={name}
          onNameChange={setName}
          author={author}
          onAuthorChange={setAuthor}
          description={description}
          onDescriptionChange={setDescription}
          scriptType={scriptType}
          onScriptTypeChange={setScriptType}
          hasHomebrew={hasHomebrew}
          onHomebrewChange={setHasHomebrew}
          showMetaNotice={!!parsed && parsed.author === null}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="version">Version</Label>
            <div className="flex gap-2">
              <Input
                id="version"
                value={versionLabel}
                onChange={(e) => {
                  setVersionLabel(e.target.value)
                  if (e.target.value !== currentVersionLabel) setNoBump(false)
                }}
                className="flex-1"
              />
              {(() => {
                const parts = currentVersionLabel.split('.').map(Number)
                if (parts.length !== 3 || parts.some(isNaN)) return null
                const [major, minor, patch] = parts
                const bumps = [
                  { label: `${major + 1}.0.0`, desc: 'Major' },
                  { label: `${major}.${minor + 1}.0`, desc: 'Minor' },
                  { label: `${major}.${minor}.${patch + 1}`, desc: 'Patch' },
                ]
                return (
                  <>
                    {bumps.map((b) => (
                      <Button
                        key={b.desc}
                        type="button"
                        variant={!noBump && versionLabel === b.label ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => { setNoBump(false); setVersionLabel(b.label) }}
                        className="text-xs"
                      >
                        {b.desc}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant={noBump ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setNoBump(true); setVersionLabel(currentVersionLabel) }}
                      className="text-xs"
                    >
                      No bump
                    </Button>
                  </>
                )
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Major</strong>: redesign &middot; <strong>Minor</strong>: character changes &middot; <strong>Patch</strong>: description/metadata fixes
            </p>
          </div>
        </ScriptFormFields>

        <ScriptImageManager jsonText={jsonText} onJsonChange={applyJsonText} />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving || !!parseError}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
