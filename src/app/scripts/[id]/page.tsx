import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ScriptPreviewLayout } from './ScriptPreviewLayout'
import { ScriptSidebar } from './ScriptSidebar'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('scripts').select('name, author').eq('id', id).single()
  if (!data) return { title: 'Script not found' }
  return { title: `${data.name}${data.author ? ` by ${data.author}` : ''} — BotC Script Finder` }
}

export default async function ScriptDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: script }, { data: { user } }, { data: versions }] = await Promise.all([
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

  if (!script) notFound()

  const isAdmin = user?.app_metadata?.role === 'admin'
  const isOwner = user?.id === script.submitted_by
  const canEdit = isAdmin || isOwner
  const showClaim = !isOwner && !isAdmin

  // Fetch the current user's claim for this script (if logged in)
  const { data: existingClaim } = user
    ? await supabase
        .from('script_claims')
        .select('status')
        .eq('script_id', id)
        .eq('claimant_id', user.id)
        .maybeSingle()
    : { data: null }

  const displayName = user
    ? (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? null)
    : null

  const groups = (((script as unknown as Record<string, unknown>).groups as { group: { id: string; name: string } }[]) ?? [])
    .map((g) => g.group)
    .filter(Boolean)

  // Extract accent color from script metadata
  const meta = Array.isArray(script.raw_json)
    ? script.raw_json.find((el: unknown) => typeof el === 'object' && el !== null && 'id' in el && (el as { id: string }).id === '_meta') as Record<string, unknown> | undefined
    : undefined
  const accentColor = (meta?.colour as string) || undefined

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      <ScriptPreviewLayout
        rawJson={script.raw_json}
        defaultColor={accentColor}
        sidebarPosition="left"
        sidebar={
          <ScriptSidebar
            scriptId={id}
            name={script.name}
            author={script.author}
            description={script.description ?? null}
            scriptType={script.script_type}
            hasCarousel={script.has_carousel}
            groups={groups}
            rawJson={script.raw_json}
            canEdit={canEdit}
            showClaim={showClaim}
            isLoggedIn={!!user}
            displayName={displayName}
            existingClaim={existingClaim ?? null}
            downloadCount={script.download_count}
            versions={versions ?? undefined}
          />
        }
      />
    </div>
  )
}
