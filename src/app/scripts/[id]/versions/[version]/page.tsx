import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CopyJsonButton } from '../../CopyJsonButton'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

interface Props {
  params: Promise<{ id: string; version: string }>
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

export default async function ScriptVersionPage({ params }: Props) {
  const { id, version } = await params
  const versionNum = parseInt(version, 10)
  if (isNaN(versionNum)) notFound()

  const supabase = await createClient()

  const { data: v } = await supabase
    .from('script_versions')
    .select('*')
    .eq('script_id', id)
    .eq('version_number', versionNum)
    .single()

  if (!v) notFound()

  const { data: characters } = await supabase
    .from('characters')
    .select('*')
    .in('id', v.character_ids)

  const charMap = Object.fromEntries((characters ?? []).map((c) => [c.id, c]))

  const grouped = TEAM_ORDER.reduce<Record<string, typeof characters>>((acc, team) => {
    const chars = (characters ?? []).filter((c) => c.team === team && v.character_ids.includes(c.id))
    if (chars.length > 0) acc[team] = chars
    return acc
  }, {})

  const jsonString = JSON.stringify(v.raw_json, null, 2)
  const blob = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link href={`/scripts/${id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to current version
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{v.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Version {v.version_number} · {new Date(v.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          </div>
          <Badge variant={v.script_type === 'teensy' ? 'secondary' : 'outline'} className="shrink-0">
            {v.script_type === 'teensy' ? 'Teensy' : 'Full'}
          </Badge>
        </div>
        {v.author && <p className="text-muted-foreground">by {v.author}</p>}
        {v.has_carousel && <div><Badge variant="outline">Carousel</Badge></div>}
      </div>

      <div className="flex gap-2">
        <a href={blob} download={`${v.name} v${v.version_number}.json`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Download JSON
          </Button>
        </a>
        <CopyJsonButton json={jsonString} />
      </div>

      <Separator />

      <div className="flex flex-col gap-6">
        <h2 className="font-semibold text-lg">Characters ({v.character_ids.length})</h2>
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
        {v.character_ids.filter((cid) => !charMap[cid]).length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Unknown</h3>
            <div className="flex flex-wrap gap-1.5">
              {v.character_ids.filter((cid) => !charMap[cid]).map((cid) => (
                <Badge key={cid} variant="outline">{cid}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
