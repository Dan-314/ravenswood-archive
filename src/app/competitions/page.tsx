import { createClient } from '@/lib/supabase/server'
import { CompetitionList } from './CompetitionList'

export const dynamic = 'force-dynamic'

export default async function CompetitionsPage() {
  const supabase = await createClient()

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
