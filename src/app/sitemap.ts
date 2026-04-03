import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ravenswoodarchive.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [{ data: scripts }, { data: collections }] = await Promise.all([
    supabase
      .from('scripts')
      .select('id, updated_at')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false }),
    supabase
      .from('collections')
      .select('id, created_at')
      .order('created_at', { ascending: false }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/collections`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/competitions`, changeFrequency: 'weekly', priority: 0.6 },
  ]

  const scriptPages: MetadataRoute.Sitemap = (scripts ?? []).map((s) => ({
    url: `${siteUrl}/scripts/${s.id}`,
    lastModified: s.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const collectionPages: MetadataRoute.Sitemap = (collections ?? []).map((c) => ({
    url: `${siteUrl}/collections/${c.id}`,
    lastModified: c.created_at,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...scriptPages, ...collectionPages]
}
