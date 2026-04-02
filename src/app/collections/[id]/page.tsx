import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SearchPage } from '@/app/SearchPage'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('collections').select('name').eq('id', id).single()
  if (!data) return { title: 'Collection not found' }
  return { title: `${data.name} — BotC Script Finder` }
}

export default async function CollectionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: collection }, { data: characters }] = await Promise.all([
    supabase.from('collections').select('*').eq('id', id).single(),
    supabase.from('characters').select('*').order('name'),
  ])

  if (!collection) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/collections"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Collections
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
        {collection.description && (
          <p className="text-muted-foreground text-sm">{collection.description}</p>
        )}
      </div>

      <SearchPage
        characters={characters ?? []}
        collections={[]}
        lockedCollectionId={id}
      />
    </div>
  )
}
