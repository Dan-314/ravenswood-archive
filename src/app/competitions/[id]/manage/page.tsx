import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ManageCompetition } from './ManageCompetition'
import type { Competition, CompetitionEntry, Script, BracketMatchup } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function ManageCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: competition } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .single()

  if (!competition) notFound()
  if (competition.created_by !== user.id) redirect(`/competitions/${id}`)

  const { data: entriesRaw } = await supabase
    .from('competition_entries')
    .select('*, script:scripts(*)')
    .eq('competition_id', id)
    .order('seed', { ascending: true, nullsFirst: false })

  const entries = (entriesRaw ?? []) as (CompetitionEntry & { script: Script })[]

  const { data: matchups } = await supabase
    .from('bracket_matchups')
    .select('*, entry_a:competition_entries!bracket_matchups_entry_a_id_fkey(*, script:scripts(*)), entry_b:competition_entries!bracket_matchups_entry_b_id_fkey(*, script:scripts(*))')
    .eq('competition_id', id)
    .order('round')
    .order('position')

  // Fetch vote counts for matchups
  const matchupIds = (matchups ?? []).map((m) => (m as { id: string }).id)
  const voteCounts: Record<string, Record<string, number>> = {}
  if (matchupIds.length > 0) {
    const { data: votes } = await supabase
      .from('matchup_votes')
      .select('matchup_id, entry_id')
      .in('matchup_id', matchupIds)
    for (const v of votes ?? []) {
      if (!voteCounts[v.matchup_id]) voteCounts[v.matchup_id] = {}
      voteCounts[v.matchup_id][v.entry_id] = (voteCounts[v.matchup_id][v.entry_id] ?? 0) + 1
    }
  }

  return (
    <ManageCompetition
      competition={competition as Competition}
      entries={entries}
      matchups={(matchups ?? []) as unknown[]}
      voteCounts={voteCounts}
    />
  )
}
