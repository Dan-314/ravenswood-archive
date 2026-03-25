'use client'

import * as React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { Competition, CompetitionStatus } from '@/lib/supabase/types'

type CompetitionWithCount = Competition & { entry_count: number }

const STATUS_TABS: { label: string; filter: (c: CompetitionWithCount) => boolean }[] = [
  { label: 'Active', filter: (c) => c.status === 'open' || c.status === 'closed' || c.status === 'brackets' },
  { label: 'Completed', filter: (c) => c.status === 'complete' },
  { label: 'Cancelled', filter: (c) => c.status === 'cancelled' },
]

const STATUS_VARIANT: Record<CompetitionStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  open: 'default',
  closed: 'secondary',
  brackets: 'secondary',
  complete: 'outline',
  cancelled: 'destructive',
}

const STATUS_LABEL: Record<CompetitionStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  brackets: 'Brackets',
  complete: 'Complete',
  cancelled: 'Cancelled',
}

export function CompetitionList({ competitions }: { competitions: CompetitionWithCount[] }) {
  const [tab, setTab] = React.useState(0)

  const filtered = competitions.filter(STATUS_TABS[tab].filter)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {STATUS_TABS.map((t, i) => (
            <Button
              key={t.label}
              variant={tab === i ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTab(i)}
            >
              {t.label}
            </Button>
          ))}
        </div>
        <Link href="/competitions/create">
          <Button size="sm">Create competition</Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No competitions found.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((comp) => (
            <Link key={comp.id} href={`/competitions/${comp.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{comp.name}</CardTitle>
                    <Badge variant={STATUS_VARIANT[comp.status]}>
                      {STATUS_LABEL[comp.status]}
                    </Badge>
                  </div>
                  {comp.description && (
                    <CardDescription className="line-clamp-2">{comp.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{comp.entry_count} {comp.entry_count === 1 ? 'entry' : 'entries'}</span>
                    <span>Deadline: {new Date(comp.submission_deadline).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
