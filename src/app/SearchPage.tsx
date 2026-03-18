'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FilterPanel } from '@/components/FilterPanel'
import { ScriptRow } from '@/components/ScriptCard'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { searchScripts, type SearchParams } from '@/lib/search'
import type { Character, Group, ScriptWithGroups } from '@/lib/supabase/types'

interface SearchPageProps {
  characters: Character[]
  groups: Group[]
}

export function SearchPage({ characters, groups }: SearchPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = React.useState(searchParams.get('q') ?? '')
  const [filters, setFilters] = React.useState<SearchParams>({
    scriptType: 'all',
    includeCharacters: [],
    excludeCharacters: [],
    groupIds: [],
  })
  const [scripts, setScripts] = React.useState<ScriptWithGroups[]>([])
  const [count, setCount] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  const supabase = React.useMemo(() => createClient(), [])

  const runSearch = React.useCallback(
    async (params: SearchParams & { query?: string }, pageNum = 1) => {
      setLoading(true)
      const { data, count, error } = await searchScripts(supabase, {
        ...params,
        page: pageNum,
        pageSize: 24,
      })
      if (!error) {
        if (pageNum === 1) {
          setScripts(data)
        } else {
          setScripts((prev) => [...prev, ...data])
        }
        setCount(count)
        setPage(pageNum)
      }
      setLoading(false)
    },
    [supabase]
  )

  // Initial load
  React.useEffect(() => {
    runSearch({ ...filters, query })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    runSearch({ ...filters, query })
  }

  function handleFilterChange(newFilters: Partial<SearchParams>) {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    runSearch({ ...updated, query })
  }

  const EMPTY_FILTERS: SearchParams = {
    scriptType: 'all',
    includeCharacters: [],
    excludeCharacters: [],
    groupIds: [],
  }

  function handleReset() {
    setQuery('')
    setFilters(EMPTY_FILTERS)
    runSearch({ ...EMPTY_FILTERS, query: '' })
  }

  const hasActiveFilters =
    query.trim() !== '' ||
    filters.scriptType !== 'all' ||
    filters.hasCarousel !== undefined ||
    (filters.includeCharacters?.length ?? 0) > 0 ||
    (filters.excludeCharacters?.length ?? 0) > 0 ||
    (filters.groupIds?.length ?? 0) > 0

  const hasMore = scripts.length < count

  return (
    <div className="flex flex-col gap-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or author..."
            value={query}
            onChange={handleQueryChange}
          />
        </div>
        <Button type="submit">Search</Button>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" onClick={handleReset}>
            Reset
          </Button>
        )}
      </form>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <div className="w-56 shrink-0">
          <FilterPanel
            characters={characters}
            groups={groups}
            filters={filters}
            onChange={handleFilterChange}
          />
        </div>

        {/* Results */}
        <div className="flex-1 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Searching…' : `${count} script${count !== 1 ? 's' : ''} found`}
          </p>

          {scripts.length === 0 && !loading ? (
            <p className="text-muted-foreground py-12 text-center">No scripts match your filters.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Author</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 font-medium">Tags</th>
                </tr>
              </thead>
              <tbody>
                {scripts.map((script) => (
                  <ScriptRow key={script.id} script={script} />
                ))}
              </tbody>
            </table>
          )}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => runSearch({ ...filters, query }, page + 1)}
                disabled={loading}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
