import { createAnonClient } from '@/lib/supabase/anon'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ScriptPreviewLayout } from '../../ScriptPreviewLayout'
import { ScriptSidebar } from '../../ScriptSidebar'
import { UserScriptActions } from '../../UserScriptActions'
import type { Metadata } from 'next'

export const revalidate = 3600

interface Props {
  params: Promise<{ id: string; version: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, version } = await params
  const versionNum = parseInt(version, 10)
  if (isNaN(versionNum)) return { title: 'Version not found' }
  const supabase = createAnonClient()
  const { data } = await supabase
    .from('script_versions')
    .select('name, author, version_number, version_label')
    .eq('script_id', id)
    .eq('version_number', versionNum)
    .single()
  if (!data) return { title: 'Version not found' }
  const vLabel = data.version_label === '0' ? `#${data.version_number}` : data.version_label
  const title = `${data.name}${data.author ? ` by ${data.author}` : ''} (${vLabel})`
  return { title, openGraph: { title } }
}

export default async function ScriptVersionPage({ params }: Props) {
  const { id, version } = await params
  const versionNum = parseInt(version, 10)
  if (isNaN(versionNum)) notFound()

  const supabase = createAnonClient()

  const [{ data: v }, { data: script }, { data: versions }] = await Promise.all([
    supabase
      .from('script_versions')
      .select('*')
      .eq('script_id', id)
      .eq('version_number', versionNum)
      .single(),
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

  if (!v || !script) notFound()

  const collections = (((script as unknown as Record<string, unknown>).collections as { collection: { id: string; name: string } }[]) ?? [])
    .map((c) => c.collection)
    .filter(Boolean)

  const meta = Array.isArray(v.raw_json)
    ? v.raw_json.find((el: unknown) => typeof el === 'object' && el !== null && 'id' in el && (el as { id: string }).id === '_meta') as Record<string, unknown> | undefined
    : undefined
  const accentColor = (meta?.colour as string) || undefined

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/scripts/${id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to current version
      </Link>

      <ScriptPreviewLayout
        rawJson={v.raw_json}
        defaultColor={accentColor}
        sidebarPosition="left"
        sidebar={
          <ScriptSidebar
            scriptId={id}
            name={v.name}
            author={v.author}
            description={v.description ?? null}
            scriptType={v.script_type}
            hasCarousel={v.has_carousel}
            collections={collections}
            rawJson={v.raw_json}
            canEdit={false}
            downloadCount={script.download_count}
            favouriteCount={script.favourite_count}
            userActions={<UserScriptActions scriptId={id} />}
            versions={versions ?? undefined}
            currentVersionNumber={versionNum}
            versionLabel={`${v.version_label === '0' ? `#${v.version_number}` : v.version_label} · ${new Date(v.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}`}
          />
        }
      />
    </div>
  )
}
