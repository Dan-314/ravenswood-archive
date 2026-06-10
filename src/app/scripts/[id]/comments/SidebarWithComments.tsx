'use client'

import * as React from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { CommentsSection } from './CommentsSection'

interface Props {
  scriptId: string
  scriptOwnerId: string | null
  /** The regular sidebar content, replaced by the comment thread when open */
  children: React.ReactNode
}

export function SidebarWithComments({ scriptId, scriptOwnerId, children }: Props) {
  const supabase = React.useMemo(() => createClient(), [])
  const [open, setOpen] = React.useState(false)
  const [count, setCount] = React.useState<number | null>(null)
  const [latest, setLatest] = React.useState<{ name: string; content: string } | null>(null)

  React.useEffect(() => {
    if (open) return
    let cancelled = false
    async function load() {
      // Count includes replies (matches the panel heading); preview is the
      // latest top-level comment so it reads as a self-contained thought.
      const [{ count }, { data }] = await Promise.all([
        supabase
          .from('script_comments')
          .select('id', { count: 'exact', head: true })
          .eq('script_id', scriptId),
        supabase
          .from('script_comments')
          .select('content, profiles(display_name)')
          .eq('script_id', scriptId)
          .is('parent_id', null)
          .order('created_at', { ascending: false })
          .limit(1),
      ])
      if (cancelled) return
      const row = data?.[0] as { content: string; profiles: { display_name: string } | null } | undefined
      React.startTransition(() => {
        setCount(count ?? 0)
        setLatest(row ? { name: row.profiles?.display_name ?? 'Unknown', content: row.content } : null)
      })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [supabase, scriptId, open])

  if (open) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="self-start gap-1.5 -ml-2" onClick={() => setOpen(false)}>
          <ArrowLeft className="h-4 w-4" />
          Back to script
        </Button>
        <CommentsSection scriptId={scriptId} scriptOwnerId={scriptOwnerId} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {children}
      {/* Full-bleed band: -mx-4 cancels the sidebar's p-4 so the borders run
          edge to edge, while px-4 keeps the text aligned with the column */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group -mx-4 flex flex-col gap-1.5 border-y px-4 py-3 text-left transition-colors hover:bg-accent/50"
      >
        <span className="flex w-full items-center justify-between">
          <span className="font-semibold text-sm">Comments{count !== null ? ` (${count})` : ''}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </span>
        {latest ? (
          <span className="block w-full truncate text-xs text-muted-foreground">
            <span className="font-medium">{latest.name}</span> {latest.content}
          </span>
        ) : (
          count === 0 && (
            <span className="block text-xs text-muted-foreground">Be the first to comment</span>
          )
        )}
      </button>
    </div>
  )
}
