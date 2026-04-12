'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { DeleteButton } from './DeleteButton'
import { ClaimButton } from './ClaimButton'
import { FavouriteButton } from './FavouriteButton'
import type { ClaimStatus } from '@/lib/supabase/types'

interface Props {
  scriptId: string
}

export function UserScriptActions({ scriptId }: Props) {
  const supabase = React.useMemo(() => createClient(), [])
  const [state, setState] = React.useState<{
    loaded: boolean
    isLoggedIn: boolean
    canEdit: boolean
    showClaim: boolean
    displayName: string | null
    existingClaim: { status: ClaimStatus } | null
    isFavourited: boolean
  }>({
    loaded: false,
    isLoggedIn: false,
    canEdit: false,
    showClaim: false,
    displayName: null,
    existingClaim: null,
    isFavourited: false,
  })

  React.useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState(prev => ({ ...prev, loaded: true, showClaim: true }))
        return
      }

      const [{ data: script }, { data: claim }, { data: fav }] = await Promise.all([
        supabase.from('scripts').select('submitted_by').eq('id', scriptId).single(),
        supabase.from('script_claims').select('status').eq('script_id', scriptId).eq('claimant_id', user.id).maybeSingle(),
        supabase.from('script_favourites').select('user_id').eq('script_id', scriptId).eq('user_id', user.id).maybeSingle(),
      ])

      const isAdmin = user.app_metadata?.role === 'admin'
      const isOwner = user.id === script?.submitted_by
      const displayName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? null

      setState({
        loaded: true,
        isLoggedIn: true,
        canEdit: isAdmin || isOwner,
        showClaim: !isOwner && !isAdmin,
        displayName,
        existingClaim: claim as { status: ClaimStatus } | null,
        isFavourited: !!fav,
      })
    }
    load()
  }, [supabase, scriptId])

  if (!state.loaded) return null

  return (
    <>
      <FavouriteButton scriptId={scriptId} isLoggedIn={state.isLoggedIn} initialIsFavourited={state.isFavourited} />
      {state.canEdit && (
        <>
          <Link href={`/scripts/${scriptId}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteButton scriptId={scriptId} />
        </>
      )}
      {state.showClaim && (
        <ClaimButton
          scriptId={scriptId}
          isLoggedIn={state.isLoggedIn}
          displayName={state.displayName}
          existingClaim={state.existingClaim}
        />
      )}
    </>
  )
}
