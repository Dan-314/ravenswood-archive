import { createClient } from '@/lib/supabase/server'
import { SearchPage } from './SearchPage'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()

  const [{ data: characters }, { data: collections }] = await Promise.all([
    supabase.from('characters').select('*').order('name'),
    supabase.from('collections').select('*').order('name'),
  ])

  return (
    <SearchPage
      characters={characters ?? []}
      collections={collections ?? []}
    />
  )
}
