import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BackToSearchLink } from '@/components/BackToSearchLink'
import { CustomiseView } from './CustomiseView'
import { getUserPreferences } from '@/lib/getUserPreferences'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('scripts').select('name').eq('id', id).single()
  if (!data) return { title: 'Script not found' }
  return { title: `Customise ${data.name}` }
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

  const preferences = await getUserPreferences()

  const meta = Array.isArray(script.raw_json)
    ? script.raw_json.find((el: unknown) => typeof el === 'object' && el !== null && 'id' in el && (el as { id: string }).id === '_meta') as Record<string, unknown> | undefined
    : undefined
  const accentColor = (meta?.colour as string) || undefined

  return (
    <div className="flex flex-col gap-4">
      <BackToSearchLink fallbackHref={`/scripts/${id}`} label="Back to script" />

      <CustomiseView
        rawJson={script.raw_json}
        scriptName={script.name}
        defaultColor={accentColor}
        scriptId={script.id}
        initialPreferences={preferences}
      />
    </div>
  )
}
