import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BackToSearchLink } from '@/components/BackToSearchLink'
import { CustomiseView } from './CustomiseView'
import { getUserPreferences } from '@/lib/getUserPreferences'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ lang?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('scripts').select('name').eq('id', id).single()
  if (!data) return { title: 'Script not found' }
  return { title: `Customise ${data.name}` }
}

export default async function CustomisePage({ params, searchParams }: Props) {
  const { id } = await params
  const { lang } = await searchParams
  // Accept the locale codes our translations use, including region/script/
  // numeric/variant suffixes (e.g. "de", "zh_Hans", "pt_PT", "es_419",
  // "en@pirate"). Restricted to letters/digits and _ - @ so it stays path-safe
  // when used as a translations filename in loadTranslations().
  const initialLanguage = lang && /^[a-z]{2,3}([-_][A-Za-z0-9]{2,4})?(@[a-z]+)?$/.test(lang) ? lang : undefined
  const supabase = await createClient()

  const { data: script } = await supabase
    .from('scripts')
    .select('id, name, raw_json, script_type')
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
        scriptType={script.script_type}
        initialPreferences={preferences}
        initialLanguage={initialLanguage}
      />
    </div>
  )
}
