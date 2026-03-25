'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Competition, CompetitionEntry, Script, CompetitionEntryWithScript } from '@/lib/supabase/types'

interface MatchupData {
  id: string
  competition_id: string
  round: number
  position: number
  entry_a_id: string | null
  entry_b_id: string | null
  winner_entry_id: string | null
  voting_open: boolean
  entry_a: (CompetitionEntry & { script: Script }) | null
  entry_b: (CompetitionEntry & { script: Script }) | null
}

interface Props {
  competition: Competition
  entries: CompetitionEntryWithScript[]
  matchups: unknown[]
}

export function ManageCompetition({ competition, entries, matchups: rawMatchups }: Props) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [seedOrder, setSeedOrder] = React.useState<CompetitionEntryWithScript[]>(entries)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const matchups = rawMatchups as MatchupData[]
  const hasBrackets = matchups.length > 0

  function moveEntry(index: number, direction: -1 | 1) {
    const newOrder = [...seedOrder]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newOrder.length) return
    ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
    setSeedOrder(newOrder)
  }

  async function handleGenerateBracket() {
    setLoading(true)
    setError('')

    const { error: rpcError } = await supabase.rpc('generate_bracket', {
      p_competition_id: competition.id,
      p_seed_order: seedOrder.map((e) => e.id),
    })

    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  async function handleAdvanceWinner(matchupId: string, winnerEntryId: string) {
    setLoading(true)
    setError('')

    const { error: rpcError } = await supabase.rpc('advance_winner', {
      p_matchup_id: matchupId,
      p_winner_entry_id: winnerEntryId,
    })

    if (rpcError) {
      setError(rpcError.message)
    }
    setLoading(false)
    router.refresh()
  }

  async function handleToggleVoting(matchupId: string, open: boolean) {
    const { error: updateError } = await supabase
      .from('bracket_matchups')
      .update({ voting_open: open })
      .eq('id', matchupId)

    if (updateError) {
      setError(updateError.message)
    } else {
      router.refresh()
    }
  }

  // Group matchups by round
  const rounds = new Map<number, MatchupData[]>()
  for (const m of matchups) {
    const list = rounds.get(m.round) ?? []
    list.push(m)
    rounds.set(m.round, list)
  }
  const totalRounds = rounds.size

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage: {competition.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Status: {competition.status}
          </p>
        </div>
        <Link href={`/competitions/${competition.id}`}>
          <Button variant="outline" size="sm">Back to competition</Button>
        </Link>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Seed ordering (only when closed, no brackets yet) */}
      {competition.status === 'closed' && !hasBrackets && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Set seed order</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length < 2 ? (
              <p className="text-muted-foreground text-sm">Need at least 2 entries to generate a bracket.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Reorder entries by seed. Seed 1 (top) gets a bye if the count isn't a power of 2.
                </p>
                {seedOrder.map((entry, i) => (
                  <div key={entry.id} className="flex items-center gap-3 py-1.5 px-2 rounded border">
                    <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                    <span className="flex-1 text-sm font-medium">{entry.script.name}</span>
                    <span className="text-xs text-muted-foreground">{entry.script.author ?? ''}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        disabled={i === 0}
                        onClick={() => moveEntry(i, -1)}
                      >
                        &uarr;
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        disabled={i === seedOrder.length - 1}
                        onClick={() => moveEntry(i, 1)}
                      >
                        &darr;
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  className="mt-3"
                  disabled={loading}
                  onClick={handleGenerateBracket}
                >
                  {loading ? 'Generating...' : 'Generate bracket'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bracket management (when brackets exist) */}
      {hasBrackets && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Bracket management</h2>
          {Array.from(rounds.entries())
            .sort(([a], [b]) => a - b)
            .map(([round, roundMatchups]) => (
              <div key={round}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {round === totalRounds ? 'Final' : round === totalRounds - 1 ? 'Semifinal' : `Round ${round}`}
                </h3>
                <div className="grid gap-2">
                  {roundMatchups.map((m) => (
                    <Card key={m.id} size="sm">
                      <CardContent className="py-2">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 flex flex-col gap-1">
                            <MatchupEntryLine
                              entry={m.entry_a}
                              isWinner={m.winner_entry_id === m.entry_a_id}
                              isBye={m.entry_a_id === null}
                            />
                            <div className="text-xs text-muted-foreground text-center">vs</div>
                            <MatchupEntryLine
                              entry={m.entry_b}
                              isWinner={m.winner_entry_id === m.entry_b_id}
                              isBye={m.entry_b_id === null}
                            />
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            {m.winner_entry_id ? (
                              <Badge variant="outline" className="text-xs">Decided</Badge>
                            ) : m.entry_a_id && m.entry_b_id ? (
                              <>
                                <Button
                                  variant={m.voting_open ? 'secondary' : 'outline'}
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleToggleVoting(m.id, !m.voting_open)}
                                >
                                  {m.voting_open ? 'Close voting' : 'Open voting'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  disabled={loading}
                                  onClick={() => handleAdvanceWinner(m.id, m.entry_a_id!)}
                                >
                                  Advance {m.entry_a?.script.name ?? 'A'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  disabled={loading}
                                  onClick={() => handleAdvanceWinner(m.id, m.entry_b_id!)}
                                >
                                  Advance {m.entry_b?.script.name ?? 'B'}
                                </Button>
                              </>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Waiting</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function MatchupEntryLine({
  entry,
  isWinner,
  isBye,
}: {
  entry: CompetitionEntryWithScript | null
  isWinner: boolean
  isBye: boolean
}) {
  if (isBye) {
    return <span className="text-xs text-muted-foreground italic">BYE</span>
  }
  if (!entry) {
    return <span className="text-xs text-muted-foreground italic">TBD</span>
  }
  return (
    <span className={`text-sm ${isWinner ? 'font-bold' : ''}`}>
      {entry.seed != null && (
        <span className="text-xs text-muted-foreground mr-1">#{entry.seed}</span>
      )}
      {entry.script.name}
    </span>
  )
}
