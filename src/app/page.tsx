import { Suspense } from 'react'
import { createAnonClient } from '@/lib/supabase/anon'
import { SearchPage } from './SearchPage'

export const revalidate = 3600

export default async function Home() {
  const supabase = createAnonClient()

  const [{ data: characters }, { data: collections }] = await Promise.all([
    supabase.from('characters').select('*').order('name'),
    supabase.from('collections').select('*').order('name'),
  ])

  return (
    <Suspense>
      <SearchPage
        characters={characters ?? []}
        collections={collections ?? []}
      />
    </Suspense>
  )
}
