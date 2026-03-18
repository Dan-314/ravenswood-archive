import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, Download, Pencil } from 'lucide-react'
import { DeleteButton } from './DeleteButton'
import { CopyJsonButton } from './CopyJsonButton'
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

const TEAM_ORDER = ['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled', 'loric']
const TEAM_LABELS: Record<string, string> = {
  townsfolk: 'Townsfolk',
  outsider: 'Outsiders',
  minion: 'Minions',
  demon: 'Demons',
  traveller: 'Travelers',
  fabled: 'Fabled',
  loric: 'Loric',
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

  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .in('id', script.character_ids)

  const charMap = Object.fromEntries((characters ?? []).map((c) => [c.id, c]))

  const grouped = TEAM_ORDER.reduce<Record<string, typeof characters>>((acc, team) => {
    const chars = (characters ?? []).filter((c) => c.team === team && script.character_ids.includes(c.id))
    if (chars.length > 0) acc[team] = chars
    return acc
  }, {})

  const groups = (((script as unknown as Record<string, unknown>).groups as { group: { id: string; name: string } }[]) ?? [])
    .map((g) => g.group)
    .filter(Boolean)

  const jsonString = JSON.stringify(script.raw_json, null, 2)
  const blob = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{script.name}</h1>
          <Badge variant={script.script_type === 'teensy' ? 'secondary' : 'outline'} className="shrink-0">
            {script.script_type === 'teensy' ? 'Teensy' : 'Full'}
          </Badge>
        </div>
        {script.author && (
          <p className="text-muted-foreground">by {script.author}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {script.has_carousel && <Badge variant="outline">Carousel</Badge>}
          {groups.map((g) => (
            <Badge key={g.id} variant="secondary">{g.name}</Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <a href={blob} download={`${script.name}.json`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Download JSON
          </Button>
        </a>
        <CopyJsonButton json={jsonString} />
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

      <Separator />

      {versions && versions.length > 1 && (
        <>
          <div className="flex flex-col gap-3">
            <h2 className="font-semibold text-lg">Version history</h2>
            <div className="flex flex-col divide-y text-sm">
              {versions.map((v, i) => {
                const className = `flex items-center gap-4 py-2`
                const content = (
                  <>
                    <span className="w-12 text-muted-foreground shrink-0">v{v.version_number}</span>
                    <span className="text-muted-foreground flex-1">
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

      <div className="flex flex-col gap-6">
        <h2 className="font-semibold text-lg">Characters ({script.character_ids.length})</h2>
        {Object.entries(grouped).map(([team, chars]) => (
          <div key={team} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {TEAM_LABELS[team]}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(chars ?? []).map((char) => (
                <Badge key={char.id} variant="outline">{char.name}</Badge>
              ))}
            </div>
          </div>
        ))}
        {script.character_ids.filter((id) => !charMap[id]).length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Unknown</h3>
            <div className="flex flex-wrap gap-1.5">
              {script.character_ids
                .filter((id) => !charMap[id])
                .map((id) => (
                  <Badge key={id} variant="outline">{id}</Badge>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
