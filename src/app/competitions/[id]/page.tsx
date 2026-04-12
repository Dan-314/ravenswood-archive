import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CompetitionDetail } from './CompetitionDetail'
import type { Script, Competition, CompetitionEntry } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: competition } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .single()

  if (!competition) notFound()

  const { data: entriesRaw } = await supabase
    .from('competition_entries')
    .select('*, script:scripts(*)')
    .eq('competition_id', id)
    .order('created_at', { ascending: false })

  const entries = (entriesRaw ?? []) as (CompetitionEntry & { script: Script })[]

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's approved scripts for the "submit existing" flow
  let userScripts: Script[] = []
  if (user) {
    const { data } = await supabase
      .from('scripts')
      .select('*')
      .eq('submitted_by', user.id)
      .eq('status', 'approved')
      .order('name')
    userScripts = data ?? []
  }

  // Fetch bracket matchups if they exist
  const { data: matchups } = await supabase
    .from('bracket_matchups')
    .select('*, entry_a:competition_entries!bracket_matchups_entry_a_id_fkey(*, script:scripts(*)), entry_b:competition_entries!bracket_matchups_entry_b_id_fkey(*, script:scripts(*))')
    .eq('competition_id', id)
    .order('round')
    .order('position')

  // Fetch all votes for this competition's matchups to compute counts
  const matchupIds = (matchups ?? []).map((m) => (m as { id: string }).id)
  let votes: { matchup_id: string; entry_id: string; user_id: string }[] = []
  if (matchupIds.length > 0) {
    const { data: votesData } = await supabase
      .from('matchup_votes')
      .select('matchup_id, entry_id, user_id')
      .in('matchup_id', matchupIds)
    votes = (votesData ?? []) as typeof votes
  }

  // Build vote counts and user's votes per matchup
  const voteCounts: Record<string, Record<string, number>> = {}
  const userVotes: Record<string, string> = {}
  for (const v of votes) {
    if (!voteCounts[v.matchup_id]) voteCounts[v.matchup_id] = {}
    voteCounts[v.matchup_id][v.entry_id] = (voteCounts[v.matchup_id][v.entry_id] ?? 0) + 1
    if (user && v.user_id === user.id) {
      userVotes[v.matchup_id] = v.entry_id
    }
  }

  const isCreator = user?.id === competition.created_by
  const isOpen = competition.status === 'open' && new Date(competition.submission_deadline) > new Date()

  return (
    <CompetitionDetail
      competition={competition as Competition}
      entries={entries}
      userScripts={userScripts}
      userId={user?.id ?? null}
      isCreator={isCreator}
      isOpen={isOpen}
      matchups={(matchups ?? []) as unknown[]}
      voteCounts={voteCounts}
      userVotes={userVotes}
    />
  )
}
