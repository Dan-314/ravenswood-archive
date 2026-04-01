'use client'

import * as React from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  scriptId: string
  isLoggedIn: boolean
  initialIsFavourited: boolean
}

export function FavouriteButton({ scriptId, isLoggedIn, initialIsFavourited }: Props) {
  const [isFavourited, setIsFavourited] = React.useState(initialIsFavourited)
  const [loading, setLoading] = React.useState(false)
  const supabase = React.useMemo(() => createClient(), [])

  if (!isLoggedIn) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Heart className="h-4 w-4" />
          Favourite
        </Button>
      </Link>
    )
  }

  async function handleToggle() {
    if (loading) return
    const next = !isFavourited
    setIsFavourited(next) // optimistic
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsFavourited(!next); setLoading(false); return }

    let error: unknown
    if (next) {
      const result = await supabase
        .from('script_favourites')
        .insert({ script_id: scriptId, user_id: user.id })
      error = result.error
    } else {
      const result = await supabase
        .from('script_favourites')
        .delete()
        .eq('script_id', scriptId)
        .eq('user_id', user.id)
      error = result.error
    }

    if (error) setIsFavourited(!next) // revert on failure
    setLoading(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={handleToggle}
      disabled={loading}
    >
      <Heart className={`h-4 w-4 transition-colors${isFavourited ? ' fill-current text-red-500' : ''}`} />
      {isFavourited ? 'Unfavourite' : 'Favourite'}
    </Button>
  )
}
