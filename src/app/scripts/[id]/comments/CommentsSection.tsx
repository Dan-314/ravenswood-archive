'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { ScriptCommentWithProfile } from '@/lib/supabase/types'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'

export interface CurrentUser {
  id: string
  isAdmin: boolean
  displayName: string | null
}

interface Props {
  scriptId: string
  scriptOwnerId: string | null
}

/** Comments are fetched in pages so one heavily-commented script can't make
 * visitors download the whole thread at once. Ascending created_at order
 * guarantees a reply's parent is always in an earlier page. */
const PAGE_SIZE = 100

export function CommentsSection({ scriptId, scriptOwnerId }: Props) {
  const supabase = React.useMemo(() => createClient(), [])
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [comments, setComments] = React.useState<ScriptCommentWithProfile[]>([])
  // Comments in the database but not fetched yet (drives the load-more button)
  const [remaining, setRemaining] = React.useState(0)
  const fetchedRef = React.useRef(0)
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const [{ data: { user } }, { data: commentData, count }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('script_comments')
          .select('*, profiles(display_name)', { count: 'exact' })
          .eq('script_id', scriptId)
          .order('created_at', { ascending: true })
          .range(0, PAGE_SIZE - 1),
      ])

      let loadedUser: CurrentUser | null = null
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .maybeSingle()
        loadedUser = {
          id: user.id,
          isAdmin: user.app_metadata?.role === 'admin',
          displayName: profile?.display_name ?? null,
        }
      }

      if (cancelled) return
      const rows = (commentData ?? []) as ScriptCommentWithProfile[]
      fetchedRef.current = rows.length
      setComments(rows)
      setRemaining(Math.max(0, (count ?? rows.length) - rows.length))
      setCurrentUser(loadedUser)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [supabase, scriptId])

  async function handleLoadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    const from = fetchedRef.current
    const { data, count } = await supabase
      .from('script_comments')
      .select('*, profiles(display_name)', { count: 'exact' })
      .eq('script_id', scriptId)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (data) {
      fetchedRef.current = from + data.length
      // Dedupe against locally-posted comments, then restore creation order
      setComments((prev) => {
        const seen = new Set(prev.map((c) => c.id))
        const merged = [...prev, ...(data as ScriptCommentWithProfile[]).filter((c) => !seen.has(c.id))]
        merged.sort((a, b) => a.created_at.localeCompare(b.created_at))
        return merged
      })
      setRemaining(Math.max(0, (count ?? fetchedRef.current) - fetchedRef.current))
    }
    setLoadingMore(false)
  }

  const handlePosted = React.useCallback((comment: ScriptCommentWithProfile) => {
    setComments((prev) => [...prev, comment])
  }, [])

  const handleUpdated = React.useCallback((comment: ScriptCommentWithProfile) => {
    setComments((prev) => prev.map((c) => (c.id === comment.id ? comment : c)))
  }, [])

  const handleDeleted = React.useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id))
  }, [])

  const handleProfileCreated = React.useCallback((displayName: string) => {
    setCurrentUser((prev) => (prev ? { ...prev, displayName } : prev))
  }, [])

  const topLevel = comments.filter((c) => c.parent_id === null)
  const repliesByParent = new Map<string, ScriptCommentWithProfile[]>()
  for (const comment of comments) {
    if (comment.parent_id === null) continue
    const list = repliesByParent.get(comment.parent_id) ?? []
    list.push(comment)
    repliesByParent.set(comment.parent_id, list)
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">
        Comments{!loading && ` (${comments.length + remaining})`}
      </h2>

      {!loading && (
        <CommentForm
          scriptId={scriptId}
          currentUser={currentUser}
          onPosted={handlePosted}
          onProfileCreated={handleProfileCreated}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="flex flex-col gap-5 pt-2">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesByParent.get(comment.id)}
              scriptId={scriptId}
              scriptOwnerId={scriptOwnerId}
              currentUser={currentUser}
              onPosted={handlePosted}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onProfileCreated={handleProfileCreated}
            />
          ))}
          {remaining > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start gap-1.5 text-muted-foreground"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Load {Math.min(remaining, PAGE_SIZE)} more {remaining === 1 ? 'comment' : 'comments'}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
