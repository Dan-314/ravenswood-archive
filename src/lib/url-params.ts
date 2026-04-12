import type { SearchParams, SortBy } from './search'

interface FiltersWithQuery extends SearchParams {
  query?: string
}

/**
 * Serialize search filters to URL search params.
 * Only includes non-default values to keep URLs clean.
 */
export function filtersToURLParams(params: FiltersWithQuery): URLSearchParams {
  const urlParams = new URLSearchParams()

  if (params.query?.trim()) {
    urlParams.set('q', params.query.trim())
  }
  if (params.scriptType && params.scriptType !== 'all') {
    urlParams.set('type', params.scriptType)
  }
  if (params.hasCarousel === false) {
    urlParams.set('base3', '0')
  }
  if (params.hasHomebrew === false) {
    urlParams.set('hb', 'exclude')
  } else if (params.hasHomebrew === true) {
    urlParams.set('hb', 'only')
  }
  if (params.includeCharacters && params.includeCharacters.length > 0) {
    urlParams.set('include', params.includeCharacters.join(','))
  }
  if (params.excludeCharacters && params.excludeCharacters.length > 0) {
    urlParams.set('exclude', params.excludeCharacters.join(','))
  }
  if (params.collectionIds && params.collectionIds.length > 0) {
    urlParams.set('collections', params.collectionIds.join(','))
  }
  if (params.sortBy && params.sortBy !== 'newest') {
    urlParams.set('sort', params.sortBy)
  }
  if (params.sortAscending) {
    urlParams.set('asc', '1')
  }

  return urlParams
}

/**
 * Deserialize URL search params back into query + SearchParams.
 * If a lockedCollectionId is provided, it is always included in collectionIds.
 */
export function urlParamsToFilters(
  params: URLSearchParams,
  lockedCollectionId?: string
): { query: string; filters: SearchParams } {
  const query = params.get('q') ?? ''

  const scriptType = (params.get('type') as SearchParams['scriptType']) || 'all'
  const hasCarousel = params.get('base3') === '0' ? false : undefined
  const hb = params.get('hb')
  const hasHomebrew = hb === 'exclude' ? false : hb === 'only' ? true : undefined
  const includeCharacters = params.get('include')?.split(',').filter(Boolean) ?? []
  const excludeCharacters = params.get('exclude')?.split(',').filter(Boolean) ?? []

  let collectionIds = params.get('collections')?.split(',').filter(Boolean) ?? []
  if (lockedCollectionId && !collectionIds.includes(lockedCollectionId)) {
    collectionIds = [lockedCollectionId, ...collectionIds]
  }

  const sortBy = (params.get('sort') as SortBy) || 'newest'
  const sortAscending = params.get('asc') === '1'

  return {
    query,
    filters: {
      scriptType,
      hasCarousel,
      hasHomebrew,
      includeCharacters,
      excludeCharacters,
      collectionIds,
      sortBy,
      sortAscending,
    },
  }
}
