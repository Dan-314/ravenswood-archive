import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Browse curated collections of Blood on the Clocktower scripts',
}

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const supabase = await createClient()

  const { data: collectionsRaw } = await supabase
    .from('collections')
    .select('*, script_count:script_collections(count)')
    .order('name')

  const collections = (collectionsRaw ?? []).map((c) => ({
    ...c,
    scriptCount: Array.isArray(c.script_count)
      ? (c.script_count[0] as { count: number } | undefined)?.count ?? 0
      : 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Curated sets of scripts
        </p>
      </div>

      {collections.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No collections yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="group flex flex-col gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold group-hover:underline">{collection.name}</h2>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {collection.scriptCount} script{collection.scriptCount !== 1 ? 's' : ''}
                </Badge>
              </div>
              {collection.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{collection.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
