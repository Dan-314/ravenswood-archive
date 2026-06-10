'use client'

import { createContext, useContext } from 'react'
import { LanguageSelect } from '@/components/LanguageSelect'

interface LanguageSelectState {
  language: string
  onChange: (language: string) => void
}

/** Provided by ScriptDetailClient; absent on pages without language switching
 * (e.g. old-version views), where the selector simply doesn't render. */
export const LanguageSelectContext = createContext<LanguageSelectState | null>(null)

export function SidebarLanguageSelect() {
  const ctx = useContext(LanguageSelectContext)
  if (!ctx) return null

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground shrink-0">Language:</label>
      <div className="flex-1">
        <LanguageSelect value={ctx.language} onChange={ctx.onChange} />
      </div>
    </div>
  )
}
