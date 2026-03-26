'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  const [search, setSearch] = React.useState('')
  const [searchOpen, setSearchOpen] = React.useState(false)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const query = search.toLowerCase().trim()
  const filtered = competitions
    .filter(STATUS_TABS[tab].filter)
    .filter((c) =>
      !query ||
      c.name.toLowerCase().includes(query) ||
      (c.description ?? '').toLowerCase().includes(query)
    )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
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
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setSearchOpen(!searchOpen)
              if (searchOpen) setSearch('')
            }}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
          <Link href="/competitions/create">
            <Button size="sm" className="shrink-0">Create</Button>
          </Link>
        </div>
      </div>

      {searchOpen && (
        <Input
          ref={searchRef}
          autoFocus
          placeholder="Search competitions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8"
        />
      )}

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
