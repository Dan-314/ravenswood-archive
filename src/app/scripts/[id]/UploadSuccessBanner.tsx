'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

export function UploadSuccessBanner({ id }: { id: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const uploaded = searchParams.get('uploaded') === '1'

  const [dismissed, setDismissed] = React.useState(false)

  if (!uploaded || dismissed) return null

  function dismiss() {
    setDismissed(true)
    router.replace(`/scripts/${id}`, { scroll: false })
  }

  return (
    <div className="rounded-md border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm flex items-center justify-between gap-3">
      <span>
        Script uploaded!{' '}
        <Link href="/submit" className="underline font-medium hover:text-foreground">
          Upload another
        </Link>
      </span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
