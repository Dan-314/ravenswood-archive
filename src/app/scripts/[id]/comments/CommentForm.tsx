'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { ScriptCommentWithProfile } from '@/lib/supabase/types'
import type { CurrentUser } from './CommentsSection'

interface Props {
  scriptId: string
  parentId?: string | null
  currentUser: CurrentUser | null
  onPosted: (comment: ScriptCommentWithProfile) => void
  onProfileCreated: (displayName: string) => void
  onCancel?: () => void
  autoFocus?: boolean
  placeholder?: string
}

export function CommentForm({
  scriptId,
  parentId = null,
  currentUser,
  onPosted,
  onProfileCreated,
  onCancel,
  autoFocus,
  placeholder = 'Add a comment…',
}: Props) {
  const supabase = React.useMemo(() => createClient(), [])
  const [content, setContent] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (!currentUser) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="underline hover:text-foreground transition-colors">
          Log in
        </Link>{' '}
        to join the discussion.
      </p>
    )
  }

  const needsName = currentUser.displayName === null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || !currentUser) return
    const trimmedContent = content.trim()
    if (!trimmedContent) return

    setSubmitting(true)
    setError(null)

    if (needsName) {
      const trimmedName = displayName.trim()
      if (trimmedName.length < 1 || trimmedName.length > 50) {
        setError('Display name must be between 1 and 50 characters.')
        setSubmitting(false)
        return
      }
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ user_id: currentUser.id, display_name: trimmedName })
      if (profileError) {
        setError(
          profileError.code === '23505'
            ? 'That display name is already taken. Please choose another.'
            : 'Could not save display name. Please try again.'
        )
        setSubmitting(false)
        return
      }
      onProfileCreated(trimmedName)
    }

    const { data, error: insertError } = await supabase
      .from('script_comments')
      .insert({
        script_id: scriptId,
        user_id: currentUser.id,
        parent_id: parentId,
        content: trimmedContent,
      })
      .select('*, profiles(display_name)')
      .single()

    if (insertError || !data) {
      setError('Could not post comment. Please try again.')
      setSubmitting(false)
      return
    }

    setContent('')
    setSubmitting(false)
    onPosted(data as ScriptCommentWithProfile)
    onCancel?.()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {needsName && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`display-name-${parentId ?? 'top'}`} className="text-sm text-muted-foreground">
            Choose a public display name to comment
          </label>
          <Input
            id={`display-name-${parentId ?? 'top'}`}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            maxLength={50}
            className="max-w-xs"
          />
        </div>
      )}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        maxLength={5000}
        autoFocus={autoFocus}
        rows={parentId ? 2 : 3}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-2 self-end">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
          {submitting ? 'Posting…' : parentId ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  )
}
