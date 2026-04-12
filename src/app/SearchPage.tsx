'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, ArrowDown, ArrowUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FilterPanel } from '@/components/FilterPanel'
import { ScriptRow } from '@/components/ScriptCard'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { searchScripts, type SearchParams, type SortBy } from '@/lib/search'
import { filtersToURLParams, urlParamsToFilters } from '@/lib/url-params'
import type { Character, Collection, ScriptWithCollections } from '@/lib/supabase/types'

interface SearchPageProps {
  characters: Character[]
  collections: Collection[]
  favouritedBy?: string
  lockedCollectionId?: string
}

export function SearchPage({ characters, collections, favouritedBy, lockedCollectionId }: SearchPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { query: initialQuery, filters: initialFilters } = React.useMemo(
    () => urlParamsToFilters(searchParams, lockedCollectionId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // read URL only on mount
  )

  const [query, setQuery] = React.useState(initialQuery)
  const [filters, setFilters] = React.useState<SearchParams>(initialFilters)

  const syncURL = React.useCallback(
    (params: SearchParams & { query?: string }) => {
      // Strip locked collection from URL — it's implicit in the route
      const toSerialize = { ...params }
      if (lockedCollectionId && toSerialize.collectionIds) {
        toSerialize.collectionIds = toSerialize.collectionIds.filter((id) => id !== lockedCollectionId)
      }
      const search = filtersToURLParams(toSerialize).toString()
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })
    },
    [router, pathname, lockedCollectionId]
  )
  const [scripts, setScripts] = React.useState<ScriptWithCollections[]>([])
  const [count, setCount] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  const supabase = React.useMemo(() => createClient(), [])

  const runSearch = React.useCallback(
    async (params: SearchParams & { query?: string }, pageNum = 1) => {
      setLoading(true)
      const { data, count, error } = await searchScripts(supabase, {
        ...params,
        favouritedBy,
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
    [supabase, favouritedBy]
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
    syncURL({ ...filters, query })
  }

  function handleFilterChange(newFilters: Partial<SearchParams>) {
    // If a locked collection is set, ensure it is never removed from collectionIds
    if (lockedCollectionId && newFilters.collectionIds !== undefined) {
      if (!newFilters.collectionIds.includes(lockedCollectionId)) {
        newFilters = { ...newFilters, collectionIds: [lockedCollectionId, ...newFilters.collectionIds] }
      }
    }
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    runSearch({ ...updated, query })
    syncURL({ ...updated, query })
  }

  function handleSort(col: SortBy) {
    let updated: SearchParams
    if (filters.sortBy !== col) {
      // First click: sort desc
      updated = { ...filters, sortBy: col, sortAscending: false }
    } else if (!filters.sortAscending) {
      // Second click: sort asc
      updated = { ...filters, sortAscending: true }
    } else {
      // Third click: reset to newest
      updated = { ...filters, sortBy: 'newest', sortAscending: false }
    }
    setFilters(updated)
    runSearch({ ...updated, query })
    syncURL({ ...updated, query })
  }

  const EMPTY_FILTERS: SearchParams = {
    scriptType: 'all',
    includeCharacters: [],
    excludeCharacters: [],
    collectionIds: lockedCollectionId ? [lockedCollectionId] : [],
    sortBy: 'newest',
    sortAscending: false,
  }

  function handleReset() {
    setQuery('')
    setFilters(EMPTY_FILTERS)
    runSearch({ ...EMPTY_FILTERS, query: '' })
    syncURL({ ...EMPTY_FILTERS, query: '' })
  }

  // Count of user-applied filters (locked collection is not counted)
  const freeCollectionCount = (filters.collectionIds?.length ?? 0) - (lockedCollectionId ? 1 : 0)

  const hasActiveFilters =
    query.trim() !== '' ||
    filters.scriptType !== 'all' ||
    filters.hasCarousel !== undefined ||
    (filters.includeCharacters?.length ?? 0) > 0 ||
    (filters.excludeCharacters?.length ?? 0) > 0 ||
    freeCollectionCount > 0

  const hasMore = scripts.length < count

  const activeFilterCount =
    (filters.scriptType !== 'all' ? 1 : 0) +
    (filters.hasCarousel !== undefined ? 1 : 0) +
    (filters.includeCharacters?.length ?? 0) +
    (filters.excludeCharacters?.length ?? 0) +
    freeCollectionCount

  const filterPanel = (
    <FilterPanel
      characters={characters}
      collections={lockedCollectionId ? [] : collections}
      hideCollections={!!lockedCollectionId}
      filters={filters}
      onChange={handleFilterChange}
    />
  )

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

        {/* Mobile filter button */}
        <Sheet>
          <SheetTrigger
            render={<Button type="button" variant="outline" className="md:hidden" />}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">
              {filterPanel}
            </div>
          </SheetContent>
        </Sheet>

        {hasActiveFilters && (
          <Button type="button" variant="ghost" onClick={handleReset}>
            Reset
          </Button>
        )}
      </form>

      <div className="flex gap-8">
        {/* Filters sidebar — desktop only */}
        <div className="hidden md:block w-56 shrink-0">
          {filterPanel}
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Searching…' : `${count} script${count !== 1 ? 's' : ''} found`}
          </p>

          {scripts.length === 0 && !loading ? (
            <p className="text-muted-foreground py-12 text-center">No scripts match your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Author</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium hidden md:table-cell">
                      <button onClick={() => handleSort('downloads')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Downloads
                        {filters.sortBy === 'downloads' && (filters.sortAscending ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </button>
                    </th>
                    <th className="pb-2 font-medium hidden md:table-cell">
                      <button onClick={() => handleSort('favourites')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Favourites
                        {filters.sortBy === 'favourites' && (filters.sortAscending ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scripts.map((script) => (
                    <ScriptRow key={script.id} script={script} />
                  ))}
                </tbody>
              </table>
            </div>
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
