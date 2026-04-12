'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function DeleteButton({ scriptId }: { scriptId: string }) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [confirming, setConfirming] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('scripts').delete().eq('id', scriptId)
    if (!error) {
      router.push('/')
      router.refresh()
    } else {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">Are you sure?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  )
}
