'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  initialDisplayName: string | null
}

export function DisplayNameEditor({ userId, initialDisplayName }: Props) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState(initialDisplayName ?? '')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (saving) return
    if (trimmed.length < 1 || trimmed.length > 50) {
      setError('Display name must be between 1 and 50 characters.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, display_name: trimmed })
    setSaving(false)
    if (upsertError) {
      setError(
        upsertError.code === '23505'
          ? 'That display name is already taken. Please choose another.'
          : upsertError.code === 'P0001'
            ? upsertError.message // cooldown message from the trigger, includes the date
            : 'Could not save display name. Please try again.'
      )
      return
    }
    setEditing(false)
    router.refresh()
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {initialDisplayName ? (
          <span className="text-muted-foreground">
            Public display name: <span className="text-foreground font-medium">{initialDisplayName}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">No public display name set (needed to comment on scripts)</span>
        )}
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          {initialDisplayName ? 'Change' : 'Set name'}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name"
          maxLength={50}
          autoFocus
          className="max-w-xs h-8"
        />
        <Button type="submit" size="sm" disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setEditing(false); setError(null); setName(initialDisplayName ?? '') }}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
