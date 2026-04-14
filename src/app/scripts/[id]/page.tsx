import { createAnonClient } from '@/lib/supabase/anon'
import { notFound } from 'next/navigation'
import { BackToSearchLink } from '@/components/BackToSearchLink'
import { ScriptDetailClient } from './ScriptDetailClient'
import { ScriptSidebar } from './ScriptSidebar'
import { UserScriptActions } from './UserScriptActions'
import type { Metadata } from 'next'

export const revalidate = 3600

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const supabase = createAnonClient()
  const { data } = await supabase.from('scripts').select('id').eq('status', 'approved')
  return (data ?? []).map((s) => ({ id: s.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createAnonClient()
  const { data } = await supabase.from('scripts').select('name, author, description').eq('id', id).single()
  if (!data) return { title: 'Script not found' }
  const title = `${data.name}${data.author ? ` by ${data.author}` : ''}`
  const description = data.description || `${data.name} — a Blood on the Clocktower script${data.author ? ` by ${data.author}` : ''}`
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/scripts/${id}` },
  }
}

export default async function ScriptDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createAnonClient()

  const [{ data: script }, { data: versions }] = await Promise.all([
    supabase
      .from('scripts')
      .select('*, collections:script_collections(collection:collections(*))')
      .eq('id', id)
      .single(),
    supabase
      .from('script_versions')
      .select('id, version_number, version_label, name, created_at, edited_by')
      .eq('script_id', id)
      .order('version_number', { ascending: false }),
  ])

  if (!script) notFound()

  const collections = (((script as unknown as Record<string, unknown>).collections as { collection: { id: string; name: string } }[]) ?? [])
    .map((c) => c.collection)
    .filter(Boolean)

  // Extract accent color from script metadata
  const meta = Array.isArray(script.raw_json)
    ? script.raw_json.find((el: unknown) => typeof el === 'object' && el !== null && 'id' in el && (el as { id: string }).id === '_meta') as Record<string, unknown> | undefined
    : undefined
  const accentColor = (meta?.colour as string) || undefined

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ravenswoodarchive.com'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: script.name,
    ...(script.author && { author: { '@type': 'Person', name: script.author } }),
    ...(script.description && { description: script.description }),
    url: `${siteUrl}/scripts/${id}`,
    dateCreated: script.created_at,
    dateModified: script.updated_at,
  }

  return (
    <div className="flex flex-col gap-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackToSearchLink />

      <ScriptDetailClient
        rawJson={script.raw_json}
        defaultColor={accentColor}
        sidebar={
          <ScriptSidebar
            scriptId={id}
            name={script.name}
            author={script.author}
            description={script.description ?? null}
            scriptType={script.script_type}
            hasCarousel={script.has_carousel}
            collections={collections}
            rawJson={script.raw_json}
            canEdit={false}
            downloadCount={script.download_count}
            favouriteCount={script.favourite_count}
            userActions={<UserScriptActions scriptId={id} />}
            versions={versions ?? undefined}
            versionLabel={script.version_label === '0' ? undefined : script.version_label}
          />
        }
      />
    </div>
  )
}
