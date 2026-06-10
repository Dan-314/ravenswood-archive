'use client'

import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { ScriptCommentWithProfile } from '@/lib/supabase/types'
import { CommentForm } from './CommentForm'
import type { CurrentUser } from './CommentsSection'
import { absoluteTime, timeAgo } from './time'

interface Props {
  comment: ScriptCommentWithProfile
  replies?: ScriptCommentWithProfile[]
  scriptId: string
  scriptOwnerId: string | null
  currentUser: CurrentUser | null
  onPosted: (comment: ScriptCommentWithProfile) => void
  onUpdated: (comment: ScriptCommentWithProfile) => void
  onDeleted: (id: string) => void
  onProfileCreated: (displayName: string) => void
}

export function CommentItem({
  comment,
  replies,
  scriptId,
  scriptOwnerId,
  currentUser,
  onPosted,
  onUpdated,
  onDeleted,
  onProfileCreated,
}: Props) {
  const supabase = React.useMemo(() => createClient(), [])
  const [editing, setEditing] = React.useState(false)
  const [editText, setEditText] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [replying, setReplying] = React.useState(false)
  const [showReplies, setShowReplies] = React.useState(false)

  const isTopLevel = comment.parent_id === null
  const isOwn = currentUser?.id === comment.user_id
  const canDelete = isOwn || currentUser?.isAdmin
  const isScriptOwner = scriptOwnerId !== null && comment.user_id === scriptOwnerId
  const isEdited = new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() > 1000

  async function handleSaveEdit() {
    const trimmed = editText.trim()
    if (!trimmed || saving) return
    setSaving(true)
    const { data, error } = await supabase
      .from('script_comments')
      .update({ content: trimmed })
      .eq('id', comment.id)
      .select('*, profiles(display_name)')
      .single()
    setSaving(false)
    if (!error && data) {
      onUpdated(data as ScriptCommentWithProfile)
      setEditing(false)
    }
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    const { error } = await supabase.from('script_comments').delete().eq('id', comment.id)
    if (!error) {
      onDeleted(comment.id)
    } else {
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">{comment.profiles?.display_name ?? 'Unknown'}</span>
        {isScriptOwner && <Badge variant="secondary">Owner</Badge>}
        <span className="text-xs text-muted-foreground" title={absoluteTime(comment.created_at)}>
          {timeAgo(comment.created_at)}
        </span>
        {isEdited && <span className="text-xs text-muted-foreground">(edited)</span>}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={5000} autoFocus rows={2} />
          <div className="flex items-center gap-2 self-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={saving || !editText.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
      )}

      {!editing && (
        <div className="flex items-center gap-1 -ml-2">
          {isTopLevel && currentUser && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setReplying((r) => !r)}
            >
              Reply
            </Button>
          )}
          {isOwn && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => {
                setEditText(comment.content)
                setEditing(true)
              }}
            >
              Edit
            </Button>
          )}
          {canDelete &&
            (confirmingDelete ? (
              <span className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Delete{isTopLevel && replies?.length ? ' thread' : ''}?</span>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Yes'}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setConfirmingDelete(false)}>
                  No
                </Button>
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </Button>
            ))}
        </div>
      )}

      {replying && (
        <div className="ml-4">
          <CommentForm
            scriptId={scriptId}
            parentId={comment.id}
            currentUser={currentUser}
            onPosted={(reply) => {
              onPosted(reply)
              setShowReplies(true)
            }}
            onProfileCreated={onProfileCreated}
            onCancel={() => setReplying(false)}
            autoFocus
            placeholder="Add a reply…"
          />
        </div>
      )}

      {replies && replies.length > 0 && (
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs self-start gap-1 text-primary"
            onClick={() => setShowReplies((s) => !s)}
          >
            {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </Button>
          {showReplies && (
            <div className="ml-4 border-l pl-3 flex flex-col gap-3">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  scriptId={scriptId}
                  scriptOwnerId={scriptOwnerId}
                  currentUser={currentUser}
                  onPosted={onPosted}
                  onUpdated={onUpdated}
                  onDeleted={onDeleted}
                  onProfileCreated={onProfileCreated}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
