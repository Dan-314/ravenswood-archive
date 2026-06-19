'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'
import { revalidatePages } from '@/app/actions/revalidate'
import { parseScriptJson } from '@/lib/search'
import { patchMeta, formatDbError } from '@/lib/scriptMeta'
import { ScriptFormFields } from '@/components/ScriptFormFields'
import { ScriptImageManager } from '@/components/ScriptImageManager'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function SubmitForm() {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  const [jsonText, setJsonText] = React.useState('')
  const [manualName, setManualName] = React.useState('')
  const [manualAuthor, setManualAuthor] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [versionLabel, setVersionLabel] = React.useState('1.0.0')
  const [scriptType, setScriptType] = React.useState<'full' | 'teensy'>('full')
  const [typeTouched, setTypeTouched] = React.useState(false)
  const [status, setStatus] = React.useState<Status>('idle')
  const [errorMsg, setErrorMsg] = React.useState('')
  const [hasHomebrew, setHasHomebrew] = React.useState(false)
  const [uploadAnother, setUploadAnother] = React.useState(false)
  const [newScriptId, setNewScriptId] = React.useState<string | null>(null)
  const [parsed, setParsed] = React.useState<ReturnType<typeof parseScriptJson> | null>(null)
  const [parseError, setParseError] = React.useState('')

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

      if (!typeTouched) setScriptType(result.characterIds.length < 13 ? 'teensy' : 'full')
      if (!manualName) setManualName(result.name)
      if (!manualAuthor && result.author) setManualAuthor(result.author)
    } catch {
      setParseError('Invalid JSON - please paste a valid BotC script.')
    }
  }

  function handleJsonChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    applyJsonText(e.target.value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!parsed) return

    setStatus('loading')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('You must be signed in to submit a script.')
      setStatus('error')
      return
    }
    const finalType = scriptType
    const finalName = (manualName || parsed.name).trim()
    const finalAuthor = manualAuthor.trim()

    const { data: existing } = await supabase
      .from('scripts')
      .select('id')
      .eq('name', finalName)
      .eq('author', finalAuthor)
      .limit(1)
      .maybeSingle()

    if (existing) {
      setErrorMsg('A script with this name and author already exists.')
      setStatus('error')
      return
    }

    const scriptJson = JSON.parse(jsonText) as unknown[]
    patchMeta(scriptJson, finalName, finalAuthor)

    const { data, error } = await supabase.from('scripts').insert({
      name: finalName,
      author: finalAuthor,
      description: description.trim() || null,
      version_label: versionLabel.trim() || '1.0.0',
      script_type: finalType,
      has_carousel: parsed.hasCarousel,
      has_homebrew: hasHomebrew,
      character_ids: parsed.characterIds,
      raw_json: scriptJson as Json[],
      submitted_by: user.id,
      status: 'approved',
    }).select('id').single()

    if (error) {
      setErrorMsg(formatDbError(error))
      setStatus('error')
    } else if (uploadAnother) {
      await revalidatePages(['/', '/sitemap.xml'])
      resetForm()
      setNewScriptId(data.id)
      setStatus('success')
    } else {
      await revalidatePages(['/', '/sitemap.xml'])
      router.replace(`/scripts/${data.id}?uploaded=1`)
    }
  }

  function resetForm() {
    setJsonText('')
    setManualName('')
    setManualAuthor('')
    setDescription('')
    setVersionLabel('1.0.0')
    setScriptType('full')
    setTypeTouched(false)
    setHasHomebrew(false)
    setStatus('idle')
    setErrorMsg('')
    setNewScriptId(null)
    setParsed(null)
    setParseError('')
  }

  return (
    <div className="max-w-lg flex flex-col gap-6">
      {status === 'success' && newScriptId && (
        <div className="rounded-md border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm flex items-center justify-between gap-3">
          <span>Script uploaded!</span>
          <a href={`/scripts/${newScriptId}`} className="underline font-medium hover:text-foreground">
            View script
          </a>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Upload a script</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste your BotC script JSON below.
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Uploaded scripts are added to a{' '}
          <a
            href="https://github.com/Dan-314/ravenswood-archive-stacks"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            public archive
          </a>
          .
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
              {parsed.hasHomebrew ? ', has homebrew' : ''}
            </p>
          )}
        </div>

        <ScriptFormFields
          name={manualName}
          onNameChange={setManualName}
          author={manualAuthor}
          onAuthorChange={setManualAuthor}
          description={description}
          onDescriptionChange={setDescription}
          scriptType={scriptType}
          onScriptTypeChange={(v) => { setScriptType(v); setTypeTouched(true) }}
          hasHomebrew={hasHomebrew}
          onHomebrewChange={setHasHomebrew}
          showMetaNotice={!!parsed && parsed.author === null}
          namePlaceholder="Auto-detected from JSON"
          authorPlaceholder="Auto-detected from JSON"
          afterScriptType={
            parsed && !typeTouched && scriptType === 'teensy' ? (
              <p className="rounded-md border border-amber-600/40 bg-amber-600/10 px-3 py-2 text-sm">
                Set to <strong>Teensy</strong> because this script has {parsed.characterIds.length} characters. Please double-check this is correct before submitting.
              </p>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="1.0.0"
            />
            <p className="text-xs text-muted-foreground">
              <strong>Major</strong>.Minor.Patch - Major: redesign, Minor: character changes, Patch: description/metadata fixes
            </p>
          </div>
        </ScriptFormFields>

        {parsed && <ScriptImageManager jsonText={jsonText} onJsonChange={applyJsonText} />}

        {status === 'error' && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!parsed || status === 'loading'}>
            {status === 'loading' ? 'Uploading…' : 'Upload'}
          </Button>
          <div className="flex items-center gap-2">
            <Checkbox
              id="uploadAnother"
              checked={uploadAnother}
              onCheckedChange={(checked) => setUploadAnother(checked === true)}
            />
            <Label htmlFor="uploadAnother" className="cursor-pointer">Upload another</Label>
          </div>
        </div>
      </form>
    </div>
  )
}
