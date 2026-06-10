'use client'

import { useContext } from 'react'
import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSelectContext } from './SidebarLanguageSelect'

export function CustomiseLink({ scriptId }: { scriptId: string }) {
  const ctx = useContext(LanguageSelectContext)
  // Mirror the sidebar selection exactly (including English) so the customise
  // page matches what the user sees rather than falling back to preferences
  const href = ctx
    ? `/scripts/${scriptId}/customise?lang=${encodeURIComponent(ctx.language)}`
    : `/scripts/${scriptId}/customise`

  return (
    <Link href={href}>
      <Button variant="outline" size="sm" className="gap-1.5">
        <Settings2 className="h-4 w-4" />
        Customise &amp; Download PDF
      </Button>
    </Link>
  )
}
