'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { ScriptClaimWithScript } from '@/lib/supabase/types'

interface AdminClaimsQueueProps {
  claims: ScriptClaimWithScript[]
  adminId: string
}

export function AdminClaimsQueue({ claims: initial, adminId }: AdminClaimsQueueProps) {
  const supabase = React.useMemo(() => createClient(), [])
  const [claims, setClaims] = React.useState(initial)
  const [loading, setLoading] = React.useState<string | null>(null)

  async function handleDecision(claim: ScriptClaimWithScript, action: 'approved' | 'rejected') {
    setLoading(claim.id)
    const now = new Date().toISOString()

    if (action === 'approved') {
      // Transfer ownership
      const { error: scriptError } = await supabase
        .from('scripts')
        .update({ submitted_by: claim.claimant_id })
        .eq('id', claim.script_id)

      if (scriptError) {
        setLoading(null)
        return
      }

      // Reject all other pending claims for this script
      await supabase
        .from('script_claims')
        .update({ status: 'rejected', reviewed_by: adminId, reviewed_at: now })
        .eq('script_id', claim.script_id)
        .eq('status', 'pending')
        .neq('id', claim.id)
    }

    const { error } = await supabase
      .from('script_claims')
      .update({ status: action, reviewed_by: adminId, reviewed_at: now })
      .eq('id', claim.id)

    if (!error) {
      setClaims((prev) => prev.filter((c) => c.id !== claim.id))
    }

    setLoading(null)
  }

  if (claims.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">No pending claims.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {claims.map((claim) => (
        <Card key={claim.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-base">
                <a
                  href={`/scripts/${claim.script_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {claim.scripts.name}
                </a>
              </CardTitle>
              <Badge variant="outline">Claim</Badge>
            </div>
            {claim.scripts.author && (
              <p className="text-sm text-muted-foreground">by {claim.scripts.author}</p>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Claimed by: </span>
              {claim.claimant_display_name}
            </p>
            {claim.message && (
              <p className="text-sm border-l-2 pl-3 italic text-muted-foreground">
                {claim.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Submitted {new Date(claim.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleDecision(claim, 'approved')}
                disabled={loading === claim.id}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDecision(claim, 'rejected')}
                disabled={loading === claim.id}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(`/scripts/${claim.script_id}`, '_blank')}
              >
                View script
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
