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

  return (
    <ManageCompetition
      competition={competition as Competition}
      entries={entries}
      matchups={(matchups ?? []) as unknown[]}
    />
  )
}
