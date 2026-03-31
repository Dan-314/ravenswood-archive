'use client'

import * as React from 'react'
import Link from 'next/link'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import type { ClaimStatus } from '@/lib/supabase/types'

interface ClaimButtonProps {
  scriptId: string
  isLoggedIn: boolean
  displayName: string | null
  existingClaim: { status: ClaimStatus } | null
}

export function ClaimButton({ scriptId, isLoggedIn, displayName, existingClaim }: ClaimButtonProps) {
  const supabase = React.useMemo(() => createClient(), [])
  const [open, setOpen] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [claimStatus, setClaimStatus] = React.useState<ClaimStatus | null>(existingClaim?.status ?? null)
  const [confirmingRetract, setConfirmingRetract] = React.useState(false)

  async function handleSubmit() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const name = displayName ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Unknown'

    const { error } = await supabase.from('script_claims').insert({
      script_id: scriptId,
      claimant_id: user.id,
      claimant_display_name: name,
      message: message.trim() || null,
    })

    setLoading(false)
    if (!error) {
      setClaimStatus('pending')
      setSubmitted(true)
      setOpen(false)
    }
  }

  async function handleRetract() {
    setLoading(true)
    await supabase.from('script_claims').delete().eq('script_id', scriptId)
    setClaimStatus(null)
    setSubmitted(false)
    setMessage('')
    setLoading(false)
  }

  if (claimStatus === 'pending') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Claim pending review</span>
        {confirmingRetract ? (
          <>
            <span className="text-sm text-muted-foreground">Are you sure?</span>
            <Button size="sm" variant="destructive" onClick={handleRetract} disabled={loading}>
              {loading ? 'Retracting…' : 'Retract'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmingRetract(false)} disabled={loading}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirmingRetract(true)}>
            Retract
          </Button>
        )}
      </div>
    )
  }

  if (claimStatus === 'approved') {
    return null
  }

  if (!isLoggedIn) {
    return (
      <Link href={`/login?next=/scripts/${scriptId}`}>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Flag className="h-4 w-4" />
          Claim this script
        </Button>
      </Link>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Flag className="h-4 w-4" />
          Claim this script
        </Button>
        {claimStatus === 'rejected' && (
          <span className="text-xs text-muted-foreground">Previous claim rejected</span>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim this script</DialogTitle>
            <DialogDescription>
              Request ownership of this script. This will allow you to edit or delete this script.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="claim-message">Why are you claiming this script? (optional)</Label>
              <Textarea
                id="claim-message"
                placeholder="e.g. I created this script and it was uploaded without my knowledge."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">An admin will review your claim before it&apos;s approved.</p>
              <p className="text-xs text-muted-foreground">Please include any evidence you may have to support your claim.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting…' : 'Submit claim'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
