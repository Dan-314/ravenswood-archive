import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, Download, Pencil, Settings2 } from 'lucide-react'
import { DeleteButton } from './DeleteButton'
import { CopyJsonButton } from './CopyJsonButton'
import { ScriptPreviewLayout } from './ScriptPreviewLayout'
import type { Metadata } from 'next'

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

  const isAdmin = user?.user_metadata?.role === 'admin'
  const isOwner = user?.id === script.submitted_by
  const canEdit = isAdmin || isOwner

  const groups = (((script as unknown as Record<string, unknown>).groups as { group: { id: string; name: string } }[]) ?? [])
    .map((g) => g.group)
    .filter(Boolean)

  const jsonString = JSON.stringify(script.raw_json, null, 2)
  const blob = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`

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
        sidebarPosition="right"
        sidebar={
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">{script.name}</h1>
                <Badge variant={script.script_type === 'teensy' ? 'secondary' : 'outline'} className="shrink-0">
                  {script.script_type === 'teensy' ? 'Teensy' : 'Full'}
                </Badge>
              </div>
              {script.author && (
                <p className="text-muted-foreground text-sm">by {script.author}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {script.has_carousel && <Badge variant="outline">Carousel</Badge>}
                {groups.map((g) => (
                  <Badge key={g.id} variant="secondary">{g.name}</Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <a href={blob} download={`${script.name}.json`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" />
                  Download JSON
                </Button>
              </a>
              <CopyJsonButton json={jsonString} />
              <Link href={`/scripts/${id}/customise`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Settings2 className="h-4 w-4" />
                  Customise &amp; Download PDF
                </Button>
              </Link>
              {canEdit && (
                <>
                  <Link href={`/scripts/${id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <DeleteButton scriptId={id} />
                </>
              )}
            </div>

            {versions && versions.length > 1 && (
              <>
                <Separator />
                <div className="flex flex-col gap-3">
                  <h2 className="font-semibold text-sm">Version history</h2>
                  <div className="flex flex-col divide-y text-sm">
                    {versions.map((v) => {
                      const className = `flex items-center gap-4 py-1.5`
                      const content = (
                        <>
                          <span className="w-10 text-muted-foreground shrink-0 text-xs">v{v.version_number}</span>
                          <span className="text-muted-foreground flex-1 text-xs">
                            {new Date(v.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                          {v.version_number === versions[0].version_number ? (
                            <span className="text-xs text-muted-foreground">current</span>
                          ) : (
                            <span className="text-xs">View</span>
                          )}
                        </>
                      )
                      return v.version_number === versions[0].version_number ? (
                        <div key={v.id} className={className}>{content}</div>
                      ) : (
                        <Link key={v.id} href={`/scripts/${id}/versions/${v.version_number}`} className={`${className} hover:bg-muted/50 rounded -mx-2 px-2`}>{content}</Link>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        }
      />
    </div>
  )
}
