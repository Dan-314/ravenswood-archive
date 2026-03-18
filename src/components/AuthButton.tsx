'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function AuthButton() {
  const supabase = React.useMemo(() => createClient(), [])
  const [user, setUser] = React.useState<{ email?: string; user_metadata?: Record<string, unknown> } | null>(null)
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

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin,
      },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loading) return null

  if (user) {
    const username = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email
    return (
      <div className="flex items-center gap-2">
        <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">{username as string}</Link>
        <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={signIn}>
      Sign in with Discord
    </Button>
  )
}
