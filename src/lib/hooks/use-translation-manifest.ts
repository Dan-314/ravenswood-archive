'use client'

import { useState, useEffect } from 'react'

export interface LanguageEntry {
  code: string
  name: string
  nativeName: string
  completion: number
}

let cache: LanguageEntry[] | null = null

export function useTranslationManifest(): LanguageEntry[] {
  const [languages, setLanguages] = useState<LanguageEntry[]>(cache ?? [])

  useEffect(() => {
    if (cache) return

    fetch('/translations/manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load manifest')
        return res.json()
      })
      .then((data: LanguageEntry[]) => {
        cache = data
        setLanguages(data)
      })
      .catch(() => {
        // No translations available
      })
  }, [])

  return languages
}
