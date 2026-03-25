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
    />
  )
}
