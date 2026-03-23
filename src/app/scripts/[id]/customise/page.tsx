import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CustomiseView } from './CustomiseView'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('scripts').select('name').eq('id', id).single()
  if (!data) return { title: 'Script not found' }
  return { title: `Customise ${data.name} — BotC Script Finder` }
}

export default async function CustomisePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: script } = await supabase
    .from('scripts')
    .select('id, name, raw_json')
    .eq('id', id)
    .single()

  if (!script) notFound()

  const meta = Array.isArray(script.raw_json)
    ? script.raw_json.find((el: unknown) => typeof el === 'object' && el !== null && 'id' in el && (el as { id: string }).id === '_meta') as Record<string, unknown> | undefined
    : undefined
  const accentColor = (meta?.colour as string) || undefined

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/scripts/${id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to script
      </Link>

      <CustomiseView
        rawJson={script.raw_json}
        scriptName={script.name}
        defaultColor={accentColor}
      />
    </div>
  )
}
