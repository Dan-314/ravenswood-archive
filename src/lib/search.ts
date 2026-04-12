import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ScriptType, ScriptWithCollections } from './supabase/types'
import localRoles from '../../roles.json'

// All official character IDs from roles.json
const OFFICIAL_CHARACTER_IDS = new Set(
  (localRoles as { id: string }[]).map((r) => r.id)
)

export type SortBy = 'newest' | 'downloads' | 'favourites'

export interface SearchParams {
  query?: string           // name or author search
  scriptType?: ScriptType | 'all'
  hasCarousel?: boolean
  hasHomebrew?: boolean
  includeCharacters?: string[]  // must have ALL of these
  excludeCharacters?: string[]  // must have NONE of these
  collectionIds?: string[]
  sortBy?: SortBy
  sortAscending?: boolean
  favouritedBy?: string
  page?: number
  pageSize?: number
}

export async function searchScripts(
  supabase: SupabaseClient<Database>,
  params: SearchParams
): Promise<{ data: ScriptWithCollections[]; count: number; error: string | null }> {
  const {
    query,
    scriptType,
    hasCarousel,
    hasHomebrew,
    includeCharacters = [],
    excludeCharacters = [],
    collectionIds = [],
    sortBy = 'newest',
    sortAscending = false,
    favouritedBy,
    page = 1,
    pageSize = 24,
  } = params

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const orderColumn =
    sortBy === 'downloads' ? 'download_count' :
    sortBy === 'favourites' ? 'favourite_count' :
    'created_at'

  let q = supabase
    .from('scripts')
    .select(`
      *,
      collections:script_collections(collection:collections(*))
    `, { count: 'exact' })
    .eq('status', 'approved')
    .order(orderColumn, { ascending: sortBy === 'newest' ? false : sortAscending })
    .order('id', { ascending: true })
    .range(from, to)

  // Name or author fuzzy search
  if (query?.trim()) {
    // Escape PostgREST filter special characters to prevent filter injection
    const sanitized = query.replace(/[,.()"\\]/g, (c) => `\\${c}`)
    q = q.or(`name.ilike.%${sanitized}%,author.ilike.%${sanitized}%`)
  }

  // Script type filter
  if (scriptType && scriptType !== 'all') {
    q = q.eq('script_type', scriptType)
  }

  // Carousel filter
  if (hasCarousel !== undefined) {
    q = q.eq('has_carousel', hasCarousel)
  }

  // Homebrew filter
  if (hasHomebrew !== undefined) {
    q = q.eq('has_homebrew', hasHomebrew)
  }

  // Include characters: script must contain ALL of them
  if (includeCharacters.length > 0) {
    q = q.contains('character_ids', includeCharacters)
  }

  // Exclude characters: script must contain NONE of them
  if (excludeCharacters.length > 0) {
    q = q.not('character_ids', 'ov', `{${excludeCharacters.join(',')}}`)
  }

  // Favourites filter: only scripts favourited by a specific user
  if (favouritedBy) {
    const { data: favData } = await supabase
      .from('script_favourites')
      .select('script_id')
      .eq('user_id', favouritedBy)

    const ids = (favData ?? []).map((r) => r.script_id)
    if (ids.length === 0) {
      return { data: [], count: 0, error: null }
    }
    q = q.in('id', ids)
  }

  // Collection filter: script must be in at least one of the selected collections
  if (collectionIds.length > 0) {
    const { data: scriptIdsInCollections } = await supabase
      .from('script_collections')
      .select('script_id')
      .in('collection_id', collectionIds)

    const ids = (scriptIdsInCollections ?? []).map((r) => r.script_id)
    if (ids.length === 0) {
      return { data: [], count: 0, error: null }
    }
    q = q.in('id', ids)
  }

  const { data, count, error } = await q

  if (error) {
    return { data: [], count: 0, error: 'Search failed' }
  }

  // Flatten the nested collections join into a clean shape
  const scripts: ScriptWithCollections[] = (data ?? []).map((row: Record<string, unknown>) => {
    const { collections: rawCollections, ...rest } = row
    const collections = ((rawCollections as { collection: Record<string, unknown> }[]) ?? [])
      .map((c) => c.collection)
      .filter(Boolean)
    return { ...rest, collections } as ScriptWithCollections
  })

  return { data: scripts, count: count ?? 0, error: null }
}

export function parseScriptJson(json: unknown): {
  name: string
  author: string | null
  characterIds: string[]
  hasCarousel: boolean
  hasHomebrew: boolean
  scriptType: ScriptType
} {
  if (!Array.isArray(json)) {
    throw new Error('Script JSON must be an array')
  }

  // BotC script JSON format: first element is metadata object with id "_meta"
  const meta = json.find((el: unknown) => {
    return typeof el === 'object' && el !== null && (el as Record<string, unknown>).id === '_meta'
  }) as Record<string, unknown> | undefined

  const name = typeof meta?.name === 'string' ? meta.name : 'Untitled'
  const author = typeof meta?.author === 'string' ? meta.author : null

  // All other elements are characters — can be strings ("washerwoman") or objects ({ "id": "washerwoman" })
  const characterIds = json
    .filter((el: unknown) => {
      if (typeof el === 'string') return true
      if (typeof el === 'object' && el !== null) {
        return (el as Record<string, unknown>).id !== '_meta'
      }
      return false
    })
    .map((el: unknown) => {
      if (typeof el === 'string') return el
      return typeof (el as Record<string, unknown>).id === 'string'
        ? (el as Record<string, unknown>).id as string
        : null
    })
    .filter((id): id is string => id !== null)

  // Teensy scripts typically have 10 or fewer characters
  const scriptType: ScriptType = characterIds.length <= 10 ? 'teensy' : 'full'

  // Carousel characters — checked against the known list from roles.json (edition: "carousel")
  const CAROUSEL_IDS = new Set(["steward","knight","noble","shugenja","pixie","bountyhunter","highpriestess","balloonist","general","preacher","villageidiot","king","cultleader","acrobat","lycanthrope","alsaahir","engineer","nightwatchman","huntsman","fisherman","princess","alchemist","cannibal","amnesiac","farmer","choirboy","banshee","magician","poppygrower","atheist","hermit","ogre","golem","plaguedoctor","hatter","politician","zealot","damsel","snitch","heretic","puzzlemaster","mezepheles","harpy","fearmonger","psychopath","wizard","widow","xaan","marionette","wraith","summoner","goblin","boomdandy","vizier","organgrinder","boffin","yaggababble","lilmonsta","ojo","kazali","legion","lordoftyphon","lleech","alhadikhia","riot","leviathan","gangster","gnome"])
  const hasCarousel = characterIds.some((id) => CAROUSEL_IDS.has(id.toLowerCase().replace(/_/g, '')))

  // Homebrew detection: character ID not in official list, or object with explicit custom definition
  const hasCustomDefinition = json.some((el: unknown) => {
    if (typeof el !== 'object' || el === null) return false
    const obj = el as Record<string, unknown>
    return obj.id !== '_meta' && 'team' in obj && 'ability' in obj
  })
  const hasHomebrew = hasCustomDefinition || characterIds.some((id) => !OFFICIAL_CHARACTER_IDS.has(id.toLowerCase().replace(/_/g, '')))

  return { name, author, characterIds, hasCarousel, hasHomebrew, scriptType }
}
