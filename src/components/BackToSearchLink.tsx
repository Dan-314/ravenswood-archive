'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackToSearchLink({ fallbackHref = '/', label = 'Back to search' }: { fallbackHref?: string; label?: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) {
          router.back()
        } else {
          router.push(fallbackHref)
        }
      }}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  )
}
