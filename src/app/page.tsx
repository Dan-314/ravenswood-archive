import { Suspense } from 'react'
import { createAnonClient } from '@/lib/supabase/anon'
import { searchScripts } from '@/lib/search'
import { SearchPage } from './SearchPage'

export const revalidate = 60

export default async function Home() {
  const supabase = createAnonClient()

  const [{ data: characters }, { data: collections }, initial] = await Promise.all([
    supabase.from('characters').select('*').order('name'),
    supabase.from('collections').select('*').order('name'),
    searchScripts(supabase, { page: 1, pageSize: 24 }),
  ])

  return (
    <Suspense>
      <SearchPage
        characters={characters ?? []}
        collections={collections ?? []}
        initialScripts={initial.data}
        initialCount={initial.count}
      />
    </Suspense>
  )
}
