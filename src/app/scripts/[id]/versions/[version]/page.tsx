import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ScriptPreviewLayout } from '../../ScriptPreviewLayout'
import { ScriptSidebar } from '../../ScriptSidebar'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string; version: string }>
}

export default async function ScriptVersionPage({ params }: Props) {
  const { id, version } = await params
  const versionNum = parseInt(version, 10)
  if (isNaN(versionNum)) notFound()

  const supabase = await createClient()

  const [{ data: v }, { data: script }, { data: { user } }, { data: versions }] = await Promise.all([
    supabase
      .from('script_versions')
      .select('*')
      .eq('script_id', id)
      .eq('version_number', versionNum)
      .single(),
    supabase
      .from('scripts')
      .select('*, groups:script_groups(group:groups(*))')
      .eq('id', id)
      .single(),
    supabase.auth.getUser(),
    supabase
      .from('script_versions')
      .select('id, version_number, name, created_at, edited_by')
      .eq('script_id', id)
      .order('version_number', { ascending: false }),
  ])

  if (!v || !script) notFound()

  const { data: favourite } = user
    ? await supabase.from('script_favourites').select('user_id').eq('script_id', id).eq('user_id', user.id).maybeSingle()
    : { data: null }

  const isAdmin = user?.app_metadata?.role === 'admin'
  const isOwner = user?.id === script.submitted_by
  const canEdit = isAdmin || isOwner

  const groups = (((script as unknown as Record<string, unknown>).groups as { group: { id: string; name: string } }[]) ?? [])
    .map((g) => g.group)
    .filter(Boolean)

  // Extract accent color from version's raw_json metadata
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
        sidebarPosition="right"
        sidebar={
          <ScriptSidebar
            scriptId={id}
            name={v.name}
            author={v.author}
            description={script.description ?? null}
            scriptType={v.script_type}
            hasCarousel={v.has_carousel}
            groups={groups}
            rawJson={v.raw_json}
            canEdit={canEdit}
            showClaim={false}
            isLoggedIn={!!user}
            displayName={null}
            existingClaim={null}
            downloadCount={script.download_count}
            favouriteCount={script.favourite_count}
            isFavourited={!!favourite}
            versions={versions ?? undefined}
            currentVersionNumber={versionNum}
            versionLabel={`Version ${v.version_number} · ${new Date(v.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}`}
          />
        }
      />
    </div>
  )
}
