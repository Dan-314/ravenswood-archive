'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { History, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Version {
  id: string
  version_number: number
  version_label: string
  name: string
  created_at: string
}

interface VersionManagerProps {
  scriptId: string
  versions: Version[]
}

export function VersionManager({ scriptId, versions }: VersionManagerProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [open, setOpen] = React.useState(false)
  const [labels, setLabels] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  // Reset labels when dialog opens
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      const initial: Record<string, string> = {}
      for (const v of versions) {
        initial[v.id] = v.version_label === '0' ? '' : v.version_label
      }
      setLabels(initial)
      setError('')
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    // Find which versions changed
    const changed = versions.filter(v => labels[v.id] !== (v.version_label === '0' ? '' : v.version_label))
    if (changed.length === 0) {
      setOpen(false)
      setSaving(false)
      return
    }

    for (const v of changed) {
      const { error: updateError } = await supabase
        .from('script_versions')
        .update({ version_label: labels[v.id].trim() || '0' })
        .eq('id', v.id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    }

    // If the latest version (first in array, sorted desc) was changed, update scripts too
    const latest = versions[0]
    if (changed.some(v => v.id === latest.id)) {
      const { error: scriptError } = await supabase
        .from('scripts')
        .update({ version_label: labels[latest.id].trim() || '0' })
        .eq('id', scriptId)

      if (scriptError) {
        setError(scriptError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDeleteVersion(versionId: string) {
    setDeleteLoading(true)
    setError('')

    const version = versions.find(v => v.id === versionId)
    if (!version) return

    const isLatest = version.version_number === versions[0].version_number

    const { error: deleteError } = await supabase
      .from('script_versions')
      .delete()
      .eq('id', versionId)

    if (deleteError) {
      setError(deleteError.message)
      setDeleteLoading(false)
      setConfirmingDelete(null)
      return
    }

    // If deleted latest, sync scripts table with new latest version
    if (isLatest && versions.length > 1) {
      const newLatest = versions[1]
      const { data: fullVersion, error: fetchError } = await supabase
        .from('script_versions')
        .select('name, author, description, version_label, script_type, has_carousel, has_homebrew, character_ids, raw_json')
        .eq('id', newLatest.id)
        .single()

      if (fetchError) {
        setError(`Version deleted but failed to sync script: ${fetchError.message}`)
        setDeleteLoading(false)
        setConfirmingDelete(null)
        return
      }

      const { error: scriptError } = await supabase
        .from('scripts')
        .update({
          name: fullVersion.name,
          author: fullVersion.author,
          description: fullVersion.description,
          version_label: fullVersion.version_label,
          script_type: fullVersion.script_type,
          has_carousel: fullVersion.has_carousel,
          has_homebrew: fullVersion.has_homebrew,
          character_ids: fullVersion.character_ids,
          raw_json: fullVersion.raw_json,
        })
        .eq('id', scriptId)

      if (scriptError) {
        setError(`Version deleted but failed to sync script: ${scriptError.message}`)
        setDeleteLoading(false)
        setConfirmingDelete(null)
        return
      }
    }

    setDeleteLoading(false)
    setConfirmingDelete(null)
    setOpen(false)
    router.refresh()
  }

  const hasChanges = versions.some(v => labels[v.id] !== (v.version_label === '0' ? '' : v.version_label))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5" />
        }
      >
        <History className="h-4 w-4" />
        Manage versions
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage version labels</DialogTitle>
          <DialogDescription>
            Edit the version labels for each revision. Use semantic versioning: Major.Minor.Patch.
            <br /><strong>Major</strong>: redesign<br /><strong>Minor</strong>: character changes<br /><strong>Patch</strong>: description/metadata fixes
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center gap-3">
              <Input
                value={labels[v.id] ?? v.version_label}
                onChange={(e) => setLabels(prev => ({ ...prev, [v.id]: e.target.value }))}
                className="w-24 text-sm font-mono"
              />
              <span className="text-xs text-muted-foreground flex-1 truncate">
                {new Date(v.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
              {v.version_number === versions[0].version_number && (
                <span className="text-xs text-muted-foreground">current</span>
              )}
              {versions.length > 1 && (
                confirmingDelete === v.id ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => handleDeleteVersion(v.id)}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Deleting…' : 'Confirm'}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setConfirmingDelete(null)}
                      disabled={deleteLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmingDelete(v.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
