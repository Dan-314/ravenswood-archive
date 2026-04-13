'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function AuthButton({ mobile = false }: { mobile?: boolean } = {}) {
  const supabase = React.useMemo(() => createClient(), [])
  const [user, setUser] = React.useState<{ email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loading) return null

  if (user) {
    const username = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email
    const isAdmin = user.app_metadata?.role === 'admin'
    const linkVisibility = mobile ? '' : 'hidden sm:block'
    return (
      <div className={mobile ? 'flex flex-col gap-2 items-start' : 'flex items-center gap-2'}>
        {isAdmin && (
          <Link href="/admin" className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${linkVisibility}`}>Admin</Link>
        )}
        <Link href="/profile" className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${linkVisibility}`}>{username as string}</Link>
        <Button variant="ghost" size="sm" onClick={signOut} className={mobile ? 'px-0 h-auto py-0 font-normal text-sm text-muted-foreground hover:text-foreground hover:bg-transparent' : ''}>Sign out</Button>
      </div>
    )
  }

  return (
    <Link href="/login">
      <Button variant="outline" size="sm">
        Sign in
      </Button>
    </Link>
  )
}
