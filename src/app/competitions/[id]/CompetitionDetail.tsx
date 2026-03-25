'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { parseScriptJson } from '@/lib/search'
import { BracketView } from '@/components/BracketView'
import type { Competition, CompetitionEntry, Script, CompetitionStatus } from '@/lib/supabase/types'

const STATUS_VARIANT: Record<CompetitionStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  open: 'default',
  closed: 'secondary',
  brackets: 'secondary',
  complete: 'outline',
  cancelled: 'destructive',
}

const STATUS_LABEL: Record<CompetitionStatus, string> = {
  open: 'Open for submissions',
  closed: 'Submissions closed',
  brackets: 'Brackets in progress',
  complete: 'Complete',
  cancelled: 'Cancelled',
}

interface Props {
  competition: Competition
  entries: (CompetitionEntry & { script: Script })[]
  userScripts: Script[]
  userId: string | null
  isCreator: boolean
  isOpen: boolean
  matchups: unknown[]
  voteCounts: Record<string, Record<string, number>>
  userVotes: Record<string, string>
}

export function CompetitionDetail({ competition, entries, userScripts, userId, isCreator, isOpen, matchups, voteCounts, userVotes }: Props) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [confirmCancel, setConfirmCancel] = React.useState(false)

  const enteredScriptIds = new Set(entries.map((e) => e.script_id))
  const availableScripts = userScripts.filter((s) => !enteredScriptIds.has(s.id))
  const deadlinePassed = new Date(competition.submission_deadline) <= new Date()

  async function handleStatusChange(newStatus: CompetitionStatus) {
    setActionLoading(true)
    setError('')
    const { error: updateError } = await supabase
      .from('competitions')
      .update({ status: newStatus })
      .eq('id', competition.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      router.refresh()
    }
    setActionLoading(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{competition.name}</h1>
          <Badge variant={STATUS_VARIANT[competition.status]}>
            {STATUS_LABEL[competition.status]}
          </Badge>
        </div>
        {competition.description && (
          <p className="text-muted-foreground">{competition.description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Deadline: {new Date(competition.submission_deadline).toLocaleString()}
          {deadlinePassed && competition.status === 'open' && (
            <span className="text-destructive ml-2">(passed)</span>
          )}
        </p>
      </div>

      {/* Creator controls */}
      {isCreator && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Competition management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Link href={`/competitions/${competition.id}/manage`}>
                <Button variant="outline" size="sm">Manage</Button>
              </Link>
              {competition.status === 'open' && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('closed')}
                >
                  Close submissions
                </Button>
              )}
              {(competition.status === 'open' || competition.status === 'closed') && !confirmCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancel competition
                </Button>
              )}
              {confirmCancel && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-destructive">This cannot be undone. Are you sure?</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleStatusChange('cancelled')}
                  >
                    Yes, cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmCancel(false)}
                  >
                    No, go back
                  </Button>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Submit entry */}
      {isOpen && userId && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            Submit a script
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit a script to this competition</DialogTitle>
            </DialogHeader>
            <SubmitEntryForm
              competitionId={competition.id}
              userId={userId}
              availableScripts={availableScripts}
              onDone={() => { setDialogOpen(false); router.refresh() }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Bracket (only shown publicly after creator publishes) */}
      {(matchups as { id: string }[]).length > 0 && competition.bracket_published && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Bracket</h2>
          <BracketView
            matchups={matchups as Parameters<typeof BracketView>[0]['matchups']}
            voteCounts={voteCounts}
            userVotes={userVotes}
            userId={userId}
          />
        </div>
      )}

      {/* Entries */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Entries ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No scripts submitted yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-left">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Author</th>
                <th className="pb-2 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/scripts/${entry.script_id}`)}
                >
                  <td className="py-3 pr-4 font-medium">{entry.script.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{entry.script.author ?? '—'}</td>
                  <td className="py-3">
                    <Badge variant={entry.script.script_type === 'teensy' ? 'secondary' : 'outline'} className="text-xs">
                      {entry.script.script_type === 'teensy' ? 'Teensy' : 'Full'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// --- Submit Entry sub-form ---

function SubmitEntryForm({
  competitionId,
  userId,
  availableScripts,
  onDone,
}: {
  competitionId: string
  userId: string
  availableScripts: Script[]
  onDone: () => void
}) {
  const supabase = React.useMemo(() => createClient(), [])
  const [mode, setMode] = React.useState<'existing' | 'new'>(availableScripts.length > 0 ? 'existing' : 'new')
  const [selectedScriptId, setSelectedScriptId] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  // New script fields
  const [jsonText, setJsonText] = React.useState('')
  const [scriptName, setScriptName] = React.useState('')
  const [scriptAuthor, setScriptAuthor] = React.useState('')
  const [scriptType, setScriptType] = React.useState<'full' | 'teensy'>('full')
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
      if (!scriptName) setScriptName(result.name)
      if (!scriptAuthor && result.author) setScriptAuthor(result.author)
    } catch {
      setParseError('Invalid JSON — please paste a valid BotC script.')
    }
  }

  async function handleSubmitExisting(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedScriptId) return
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase
      .from('competition_entries')
      .insert({
        competition_id: competitionId,
        script_id: selectedScriptId,
        submitted_by: userId,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      onDone()
    }
  }

  async function handleSubmitNew(e: React.FormEvent) {
    e.preventDefault()
    if (!parsed) return
    setLoading(true)
    setError('')

    // Create the script first
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .insert({
        name: scriptName || parsed.name,
        author: scriptAuthor || parsed.author || null,
        script_type: scriptType,
        has_carousel: parsed.hasCarousel,
        character_ids: parsed.characterIds,
        raw_json: JSON.parse(jsonText),
        submitted_by: userId,
        status: 'approved',
      })
      .select('id')
      .single()

    if (scriptError) {
      setError(scriptError.message)
      setLoading(false)
      return
    }

    // Then add the entry
    const { error: entryError } = await supabase
      .from('competition_entries')
      .insert({
        competition_id: competitionId,
        script_id: script.id,
        submitted_by: userId,
      })

    if (entryError) {
      setError(entryError.message)
      setLoading(false)
    } else {
      onDone()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {availableScripts.length > 0 && (
        <div className="flex gap-1">
          <Button
            variant={mode === 'existing' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('existing')}
          >
            Existing script
          </Button>
          <Button
            variant={mode === 'new' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('new')}
          >
            New script
          </Button>
        </div>
      )}

      {mode === 'existing' ? (
        <form onSubmit={handleSubmitExisting} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Select a script</Label>
            <Select value={selectedScriptId} onValueChange={(v) => setSelectedScriptId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a script..." />
              </SelectTrigger>
              <SelectContent>
                {availableScripts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={!selectedScriptId || loading}>
            {loading ? 'Submitting...' : 'Submit entry'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmitNew} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="entry-json">Script JSON</Label>
            <Textarea
              id="entry-json"
              placeholder='[{"id": "_meta", "name": "My Script", ...}, ...]'
              rows={6}
              value={jsonText}
              onChange={handleJsonChange}
              className="font-mono text-xs"
              required
            />
            {parseError && <p className="text-sm text-destructive">{parseError}</p>}
            {parsed && (
              <p className="text-sm text-muted-foreground">
                Detected: {parsed.characterIds.length} characters, type: {parsed.scriptType}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="entry-name">Script name</Label>
            <Input
              id="entry-name"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              placeholder="Auto-detected from JSON"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="entry-author">Author</Label>
            <Input
              id="entry-author"
              value={scriptAuthor}
              onChange={(e) => setScriptAuthor(e.target.value)}
              placeholder="Auto-detected from JSON"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Script type</Label>
            <Select value={scriptType} onValueChange={(v) => { if (v) setScriptType(v as 'full' | 'teensy') }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="teensy">Teensy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={!parsed || loading}>
            {loading ? 'Submitting...' : 'Submit new script'}
          </Button>
        </form>
      )}
    </div>
  )
}
