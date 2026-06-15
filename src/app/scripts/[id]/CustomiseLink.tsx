'use client'

import { useContext } from 'react'
import Link, { useLinkStatus } from 'next/link'
import { Loader2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSelectContext } from './SidebarLanguageSelect'

// Rendered inside <Link> so useLinkStatus can report the navigation's pending
// state and show a spinner while the customise page loads.
function CustomiseButton() {
  const { pending } = useLinkStatus()

  return (
    <Button variant="outline" size="sm" className="gap-1.5" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Settings2 className="h-4 w-4" />
      )}
      Customise &amp; Download PDF
    </Button>
  )
}

export function CustomiseLink({ scriptId }: { scriptId: string }) {
  const ctx = useContext(LanguageSelectContext)
  // Mirror the sidebar selection exactly (including English) so the customise
  // page matches what the user sees rather than falling back to preferences
  const href = ctx
    ? `/scripts/${scriptId}/customise?lang=${encodeURIComponent(ctx.language)}`
    : `/scripts/${scriptId}/customise`

  return (
    <Link href={href}>
      <CustomiseButton />
    </Link>
  )
}
