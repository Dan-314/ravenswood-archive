'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthButton } from '@/components/AuthButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createClient } from '@/lib/supabase/client'

export function NavBar() {
  const [open, setOpen] = React.useState(false)
  const [signedIn, setSignedIn] = React.useState(false)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            Ravenswood Archive
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/submit" className="text-muted-foreground hover:text-foreground transition-colors">
              Upload
            </Link>
            <Link href="/collections" className="text-muted-foreground hover:text-foreground transition-colors">
              Collections
            </Link>
            <Link href="/competitions" className="text-muted-foreground hover:text-foreground transition-colors">
              Competitions
            </Link>
            <Link href="/favourites" className="text-muted-foreground hover:text-foreground transition-colors">
              Favourites
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <AuthButton />
          </div>
          {signedIn && (
            <Link href="/preferences" className="text-muted-foreground hover:text-foreground transition-colors" title="Preferences">
              <Settings className="h-4 w-4" />
            </Link>
          )}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t sm:hidden px-4 py-3 flex flex-col gap-3">
          <nav className="flex flex-col gap-2 text-sm">
            <Link
              href="/submit"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              Upload
            </Link>
            <Link
              href="/collections"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              Collections
            </Link>
            <Link
              href="/competitions"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              Competitions
            </Link>
            <Link
              href="/favourites"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              Favourites
            </Link>
          </nav>
          <AuthButton mobile />
        </div>
      )}
    </header>
  )
}
