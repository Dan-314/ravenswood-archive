import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CollectionsManager } from './CollectionsManager'

export const dynamic = 'force-dynamic'

export default async function AdminCollectionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (user?.app_metadata?.role !== 'admin') redirect('/')

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
        <h1 className="text-2xl font-bold">Collections</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create and manage curated script collections
        </p>
      </div>
      <CollectionsManager initial={collections} />
    </div>
  )
}
