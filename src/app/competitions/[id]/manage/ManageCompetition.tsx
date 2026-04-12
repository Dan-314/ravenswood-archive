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
  voteCounts: Record<string, Record<string, number>>
}

export function ManageCompetition({ competition, entries, matchups: rawMatchups, voteCounts }: Props) {
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

    // If regenerating, reset status to closed first (RPC requires closed status)
    if (competition.status === 'brackets') {
      const { error: statusError } = await supabase
        .from('competitions')
        .update({ status: 'closed' })
        .eq('id', competition.id)
      if (statusError) {
        setError(statusError.message)
        setLoading(false)
        return
      }
    }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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

      {/* Seed ordering (when closed, or brackets not yet published to allow regeneration) */}
      {(competition.status === 'closed' || (competition.status === 'brackets' && !competition.bracket_published)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {hasBrackets ? 'Regenerate bracket' : 'Set seed order'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length < 2 ? (
              <p className="text-muted-foreground text-sm">Need at least 2 entries to generate a bracket.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Reorder entries by seed. Seed 1 (top) gets a bye if the count isn&apos;t a power of 2.
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
                  {loading ? 'Generating...' : hasBrackets ? 'Regenerate bracket' : 'Generate bracket'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Publish bracket */}
      {hasBrackets && !competition.bracket_published && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Bracket is in draft</p>
                <p className="text-xs text-muted-foreground">Only you can see it. Publish to make it visible to everyone.</p>
              </div>
              <Button
                size="sm"
                disabled={loading}
                onClick={async () => {
                  setLoading(true)
                  setError('')
                  const { error: e } = await supabase
                    .from('competitions')
                    .update({ bracket_published: true })
                    .eq('id', competition.id)
                  if (e) setError(e.message)
                  setLoading(false)
                  router.refresh()
                }}
              >
                Publish bracket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasBrackets && competition.bracket_published && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Badge variant="default">Published</Badge>
              <p className="text-sm text-muted-foreground">Bracket is live and visible to everyone.</p>
            </div>
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
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <MatchupEntryLine
                              entry={m.entry_a}
                              isWinner={m.winner_entry_id === m.entry_a_id}
                              isBye={m.round === 1 && m.entry_a_id === null}
                              votes={voteCounts[m.id]?.[m.entry_a_id ?? ''] ?? 0}
                            />
                            <span className="text-xs text-muted-foreground">vs</span>
                            <MatchupEntryLine
                              entry={m.entry_b}
                              isWinner={m.winner_entry_id === m.entry_b_id}
                              isBye={m.round === 1 && m.entry_b_id === null}
                              votes={voteCounts[m.id]?.[m.entry_b_id ?? ''] ?? 0}
                            />
                          </div>
                          <div className="flex gap-1">
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
                                  Advance A
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  disabled={loading}
                                  onClick={() => handleAdvanceWinner(m.id, m.entry_b_id!)}
                                >
                                  Advance B
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
  votes,
}: {
  entry: CompetitionEntryWithScript | null
  isWinner: boolean
  isBye: boolean
  votes: number
}) {
  if (isBye) {
    return <span className="text-xs text-muted-foreground italic">BYE</span>
  }
  if (!entry) {
    return <span className="text-xs text-muted-foreground italic">TBD</span>
  }
  return (
    <span className={`text-sm flex items-center gap-2 ${isWinner ? 'font-bold' : ''}`}>
      <span>
        {entry.seed != null && (
          <span className="text-xs text-muted-foreground mr-1">#{entry.seed}</span>
        )}
        {entry.script.name}
      </span>
      {votes > 0 && (
        <span className="text-xs text-muted-foreground font-normal">({votes} {votes === 1 ? 'vote' : 'votes'})</span>
      )}
    </span>
  )
}
