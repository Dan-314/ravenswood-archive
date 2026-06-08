'use client'

import * as React from 'react'
import { X } from 'lucide-react'

const DISMISS_KEY = 'dismiss-metadata-notice-2026-06-22'

export function SiteNoticeBanner() {
  const [dismissed, setDismissed] = React.useState(true)

  React.useEffect(() => {
    if (!localStorage.getItem(DISMISS_KEY)) setDismissed(false)
  }, [])

  if (dismissed) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4">
      <div className="relative rounded-md border border-amber-600/40 bg-amber-600/10 px-4 py-3 pr-10 text-sm">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notice"
          className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <p>
          <strong>Notice:</strong> Starting June 22, scripts without a name and author in their{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">_meta</code> block will be removed from the archive.
        </p>
        <p className="mt-1">
          If you have uploaded a script without metadata, please update it before then.
        </p>
        <p className="mt-1">
          <a
            href="https://github.com/Dan-314/ravenswood-archive/issues/13"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium hover:text-foreground"
          >
            More details
          </a>
        </p>
      </div>
    </div>
  )
}
