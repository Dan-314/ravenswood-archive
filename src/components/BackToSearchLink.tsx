'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

export function BackToSearchLink({ fallbackHref, label = 'Back to search' }: { fallbackHref?: string; label?: string }) {
  const [href, setHref] = useState(fallbackHref || '/')

  useEffect(() => {
    if (!fallbackHref) {
      setHref(sessionStorage.getItem('lastSearchUrl') || '/')
    }
  }, [fallbackHref])

  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  )
}
