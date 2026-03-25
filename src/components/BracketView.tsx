'use client'

import { Badge } from '@/components/ui/badge'
import type { CompetitionEntryWithScript } from '@/lib/supabase/types'

interface MatchupData {
  id: string
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
}

export function BracketView({ matchups }: BracketViewProps) {
  if (matchups.length === 0) return null

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
      <div className="flex gap-6 min-w-max py-2">
        {sortedRounds.map(([round, roundMatchups]) => (
          <div key={round} className="flex flex-col gap-2" style={{ minWidth: 200 }}>
            <div className="text-xs font-medium text-muted-foreground text-center mb-1">
              {getRoundLabel(round)}
            </div>
            <div
              className="flex flex-col justify-around flex-1"
              style={{ gap: `${Math.pow(2, round - 1) * 8}px` }}
            >
              {roundMatchups
                .sort((a, b) => a.position - b.position)
                .map((m) => (
                  <MatchupCard key={m.id} matchup={m} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchupCard({ matchup }: { matchup: MatchupData }) {
  const { entry_a, entry_b, winner_entry_id, entry_a_id, entry_b_id, voting_open } = matchup

  return (
    <div className="rounded border bg-card text-card-foreground">
      <EntrySlot
        entry={entry_a}
        isBye={entry_a_id === null && entry_b_id !== null}
        isWinner={winner_entry_id != null && winner_entry_id === entry_a_id}
        isLoser={winner_entry_id != null && winner_entry_id !== entry_a_id}
        className="border-b"
      />
      <EntrySlot
        entry={entry_b}
        isBye={entry_b_id === null && entry_a_id !== null}
        isWinner={winner_entry_id != null && winner_entry_id === entry_b_id}
        isLoser={winner_entry_id != null && winner_entry_id !== entry_b_id}
      />
      {voting_open && (
        <div className="px-2 py-0.5 border-t bg-muted/50 text-center">
          <Badge variant="default" className="text-[10px]">Voting open</Badge>
        </div>
      )}
    </div>
  )
}

function EntrySlot({
  entry,
  isBye,
  isWinner,
  isLoser,
  className = '',
}: {
  entry: CompetitionEntryWithScript | null
  isBye: boolean
  isWinner: boolean
  isLoser: boolean
  className?: string
}) {
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
      <span className="truncate">{label}</span>
    </div>
  )
}
