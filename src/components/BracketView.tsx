'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { CompetitionEntryWithScript } from '@/lib/supabase/types'

interface MatchupData {
  id: string
  competition_id: string
  round: number
  position: number
  entry_a_id: string | null
  entry_b_id: string | null
  winner_entry_id: string | null
  voting_open: boolean
  entry_a: CompetitionEntryWithScript | null
  entry_b: CompetitionEntryWithScript | null
}

interface BracketViewProps {
  matchups: MatchupData[]
  voteCounts: Record<string, Record<string, number>>
  userVotes: Record<string, string>
  userId: string | null
}

function useRealtimeVotes(
  matchupIds: string[],
  initialCounts: Record<string, Record<string, number>>,
  initialUserVotes: Record<string, string>,
  userId: string | null,
) {
  const [counts, setCounts] = React.useState(initialCounts)
  const [userVotes, setUserVotes] = React.useState(initialUserVotes)

  // Sync when server-provided props change (e.g. after router.refresh)
  React.useEffect(() => {
    setCounts(initialCounts)
    setUserVotes(initialUserVotes)
  }, [initialCounts, initialUserVotes])

  React.useEffect(() => {
    if (matchupIds.length === 0) return

    const supabase = createClient()
    const channel = supabase
      .channel('matchup-votes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matchup_votes',
        },
        (payload) => {
          const vote = payload.new as { matchup_id: string; entry_id: string; user_id: string }
          if (!matchupIds.includes(vote.matchup_id)) return

          setCounts((prev) => {
            const matchupCounts = { ...(prev[vote.matchup_id] ?? {}) }
            matchupCounts[vote.entry_id] = (matchupCounts[vote.entry_id] ?? 0) + 1
            return { ...prev, [vote.matchup_id]: matchupCounts }
          })

          if (userId && vote.user_id === userId) {
            setUserVotes((prev) => ({ ...prev, [vote.matchup_id]: vote.entry_id }))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchupIds.join(','), userId])

  return { counts, userVotes }
}

export function BracketView({ matchups, voteCounts, userVotes: initialUserVotes, userId }: BracketViewProps) {
  if (matchups.length === 0) return null

  const matchupIds = React.useMemo(() => matchups.map((m) => m.id), [matchups])
  const { counts, userVotes } = useRealtimeVotes(matchupIds, voteCounts, initialUserVotes, userId)

  // Group by round
  const rounds = new Map<number, MatchupData[]>()
  for (const m of matchups) {
    const list = rounds.get(m.round) ?? []
    list.push(m)
    rounds.set(m.round, list)
  }

  const sortedRounds = Array.from(rounds.entries()).sort(([a], [b]) => a - b)
  const totalRounds = sortedRounds.length

  function getRoundLabel(round: number) {
    if (round === totalRounds) return 'Final'
    if (round === totalRounds - 1) return 'Semis'
    if (round === totalRounds - 2) return 'Quarters'
    return `R${round}`
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop: horizontal bracket with connectors */}
      <div className="hidden sm:flex min-w-max py-2">
        {sortedRounds.map(([round, roundMatchups], roundIdx) => {
          const sorted = roundMatchups.sort((a, b) => a.position - b.position)
          const isLastRound = roundIdx === sortedRounds.length - 1
          return (
            <React.Fragment key={round}>
              <div className="flex flex-col" style={{ minWidth: 220 }}>
                <div className="text-xs font-medium text-muted-foreground text-center mb-2">
                  {getRoundLabel(round)}
                </div>
                <div
                  className="flex flex-col justify-around flex-1"
                  style={{ gap: `${Math.pow(2, round - 1) * 8}px` }}
                >
                  {sorted.map((m) => (
                    <MatchupCard
                      key={m.id}
                      matchup={m}
                      votesA={counts[m.id]?.[m.entry_a_id ?? ''] ?? 0}
                      votesB={counts[m.id]?.[m.entry_b_id ?? ''] ?? 0}
                      userVote={userVotes[m.id] ?? null}
                      userId={userId}
                    />
                  ))}
                </div>
              </div>
              {!isLastRound && (
                <div className="flex flex-col justify-around flex-1" style={{ width: 24, marginTop: 20 }}>
                  {sorted
                    .filter((_, i) => i % 2 === 0)
                    .map((_, i) => (
                      <ConnectorPair key={i} />
                    ))}
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Mobile: stacked rounds */}
      <div className="flex flex-col gap-6 sm:hidden py-2">
        {sortedRounds.map(([round, roundMatchups]) => {
          const sorted = roundMatchups.sort((a, b) => a.position - b.position)
          return (
            <div key={round}>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {getRoundLabel(round)}
              </div>
              <div className="flex flex-col gap-2">
                {sorted.map((m) => (
                  <MatchupCard
                    key={m.id}
                    matchup={m}
                    votesA={counts[m.id]?.[m.entry_a_id ?? ''] ?? 0}
                    votesB={counts[m.id]?.[m.entry_b_id ?? ''] ?? 0}
                    userVote={userVotes[m.id] ?? null}
                    userId={userId}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MatchupCard({
  matchup,
  votesA,
  votesB,
  userVote,
  userId,
}: {
  matchup: MatchupData
  votesA: number
  votesB: number
  userVote: string | null
  userId: string | null
}) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [voting, setVoting] = React.useState(false)
  const { entry_a, entry_b, winner_entry_id, entry_a_id, entry_b_id, voting_open } = matchup

  const canVote = voting_open && userId && !userVote && !winner_entry_id
  const totalVotes = votesA + votesB

  async function handleVote(entryId: string) {
    if (!userId) return
    setVoting(true)
    await supabase.from('matchup_votes').insert({
      matchup_id: matchup.id,
      user_id: userId,
      entry_id: entryId,
    })
    setVoting(false)
    // No router.refresh() needed — realtime subscription handles the update
  }

  return (
    <div className="rounded border bg-card text-card-foreground">
      <EntrySlot
        entry={entry_a}
        entryId={entry_a_id}
        otherEntryId={entry_b_id}
        round={matchup.round}
        isWinner={winner_entry_id != null && winner_entry_id === entry_a_id}
        isLoser={winner_entry_id != null && winner_entry_id !== entry_a_id}
        votes={votesA}
        totalVotes={totalVotes}
        showVotes={voting_open || winner_entry_id != null}
        isUserVote={userVote === entry_a_id}
        canVote={!!canVote}
        voting={voting}
        onVote={handleVote}
        className="border-b"
      />
      <EntrySlot
        entry={entry_b}
        entryId={entry_b_id}
        otherEntryId={entry_a_id}
        round={matchup.round}
        isWinner={winner_entry_id != null && winner_entry_id === entry_b_id}
        isLoser={winner_entry_id != null && winner_entry_id !== entry_b_id}
        votes={votesB}
        totalVotes={totalVotes}
        showVotes={voting_open || winner_entry_id != null}
        isUserVote={userVote === entry_b_id}
        canVote={!!canVote}
        voting={voting}
        onVote={handleVote}
        className=""
      />
      {voting_open && !winner_entry_id && (
        <div className="px-2 py-0.5 border-t bg-muted/50 text-center">
          <Badge variant="default" className="text-[10px]">Voting open</Badge>
        </div>
      )}
    </div>
  )
}

function ConnectorPair() {
  return (
    <div className="flex flex-col flex-1">
      {/* Top matchup's horizontal line out + vertical line down */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 border-b-2 border-r-2 border-muted-foreground/20" />
        {/* Bottom matchup's horizontal line out + vertical line up */}
        <div className="flex-1 border-t-2 border-r-2 border-muted-foreground/20" />
      </div>
    </div>
  )
}

function EntrySlot({
  entry,
  entryId,
  otherEntryId,
  round,
  isWinner,
  isLoser,
  votes,
  totalVotes,
  showVotes,
  isUserVote,
  canVote,
  voting,
  onVote,
  className = '',
}: {
  entry: CompetitionEntryWithScript | null
  entryId: string | null
  otherEntryId: string | null
  round: number
  isWinner: boolean
  isLoser: boolean
  votes: number
  totalVotes: number
  showVotes: boolean
  isUserVote: boolean
  canVote: boolean
  voting: boolean
  onVote: (entryId: string) => void
  className?: string
}) {
  const isBye = round === 1 && entryId === null && otherEntryId !== null
  let label: string
  let seedLabel: string | null = null

  if (isBye) {
    label = 'BYE'
  } else if (!entry) {
    label = 'TBD'
  } else {
    label = entry.script.name
    if (entry.seed != null) {
      seedLabel = `#${entry.seed}`
    }
  }

  return (
    <div
      className={`px-2 py-1.5 text-sm flex items-center gap-1.5 ${
        isWinner ? 'font-bold bg-muted/30' : ''
      } ${isLoser ? 'text-muted-foreground' : ''} ${
        isBye || !entry ? 'text-muted-foreground italic text-xs' : ''
      } ${className}`}
    >
      {seedLabel && (
        <span className="text-[10px] text-muted-foreground font-normal">{seedLabel}</span>
      )}
      <span className="truncate flex-1">{label}</span>
      {isUserVote && (
        <Badge variant="outline" className="text-[10px] shrink-0">Your vote</Badge>
      )}
      {showVotes && totalVotes > 0 && entry && (
        <span className="text-[10px] text-muted-foreground shrink-0 font-normal">{votes}</span>
      )}
      {canVote && entryId && (
        <Button
          variant="outline"
          size="sm"
          className="h-5 px-1.5 text-[10px] shrink-0"
          disabled={voting}
          onClick={() => onVote(entryId)}
        >
          Vote
        </Button>
      )}
    </div>
  )
}
