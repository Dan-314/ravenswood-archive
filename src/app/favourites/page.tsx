import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SearchPage } from '@/app/SearchPage'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Favourites', robots: { index: false, follow: false } }

export default async function FavouritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: characters }, { data: collections }] = await Promise.all([
    supabase.from('characters').select('*').order('name'),
    supabase.from('collections').select('*').order('name'),
  ])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Favourites</h1>
      <SearchPage
        characters={characters ?? []}
        collections={collections ?? []}
        favouritedBy={user.id}
      />
    </div>
  )
}
