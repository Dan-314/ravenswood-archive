import type { Metadata } from 'next'
import { createAnonClient } from '@/lib/supabase/anon'
import { CompetitionList } from './CompetitionList'

export const metadata: Metadata = {
  title: 'Script Competitions',
  description: 'Blood on the Clocktower script competitions and brackets. Vote on your favourite BotC scripts.',
}

export const revalidate = 3600

export default async function CompetitionsPage() {
  const supabase = createAnonClient()

  const { data: competitions } = await supabase
    .from('competitions')
    .select('*, entries:competition_entries(count)')
    .order('created_at', { ascending: false })

  const parsed = (competitions ?? []).map((c) => {
    const raw = c as Record<string, unknown>
    const entries = raw.entries as { count: number }[] | null
    return {
      ...c,
      entry_count: entries?.[0]?.count ?? 0,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Competitions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Script tournaments created by the community
          </p>
        </div>
      </div>
      <CompetitionList competitions={parsed} />
    </div>
  )
}
