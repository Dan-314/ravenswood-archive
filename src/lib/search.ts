import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ScriptType, ScriptWithGroups } from './supabase/types'

export interface SearchParams {
  query?: string           // name or author search
  scriptType?: ScriptType | 'all'
  hasCarousel?: boolean
  includeCharacters?: string[]  // must have ALL of these
  excludeCharacters?: string[]  // must have NONE of these
  groupIds?: string[]
  page?: number
  pageSize?: number
}

export async function searchScripts(
  supabase: SupabaseClient<Database>,
  params: SearchParams
): Promise<{ data: ScriptWithGroups[]; count: number; error: string | null }> {
  const {
    query,
    scriptType,
    hasCarousel,
    includeCharacters = [],
    excludeCharacters = [],
    groupIds = [],
    page = 1,
    pageSize = 24,
  } = params

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let q = supabase
    .from('scripts')
    .select(`
      *,
      groups:script_groups(group:groups(*))
    `, { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, to)

  // Name or author fuzzy search
  if (query?.trim()) {
    q = q.or(`name.ilike.%${query}%,author.ilike.%${query}%`)
  }

  // Script type filter
  if (scriptType && scriptType !== 'all') {
    q = q.eq('script_type', scriptType)
  }

  // Carousel filter
  if (hasCarousel !== undefined) {
    q = q.eq('has_carousel', hasCarousel)
  }

  // Include characters: script must contain ALL of them
  if (includeCharacters.length > 0) {
    q = q.contains('character_ids', includeCharacters)
  }

  // Exclude characters: script must contain NONE of them
  if (excludeCharacters.length > 0) {
    q = q.not('character_ids', 'ov', `{${excludeCharacters.join(',')}}`)
  }

  // Group filter: script must be in at least one of the selected groups
  if (groupIds.length > 0) {
    const { data: scriptIdsInGroups } = await supabase
      .from('script_groups')
      .select('script_id')
      .in('group_id', groupIds)

    const ids = (scriptIdsInGroups ?? []).map((r) => r.script_id)
    if (ids.length === 0) {
      return { data: [], count: 0, error: null }
    }
    q = q.in('id', ids)
  }

  const { data, count, error } = await q

  if (error) {
    return { data: [], count: 0, error: error.message }
  }

  // Flatten the nested groups join into a clean shape
  const scripts: ScriptWithGroups[] = (data ?? []).map((row: Record<string, unknown>) => {
    const { groups: rawGroups, ...rest } = row
    const groups = ((rawGroups as { group: Record<string, unknown> }[]) ?? [])
      .map((g) => g.group)
      .filter(Boolean)
    return { ...rest, groups } as ScriptWithGroups
  })

  return { data: scripts, count: count ?? 0, error: null }
}

export function parseScriptJson(json: unknown): {
  name: string
  author: string | null
  characterIds: string[]
  hasCarousel: boolean
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

  const characterEntries = json.filter((el: unknown) => {
    return typeof el === 'object' && el !== null && (el as Record<string, unknown>).id !== '_meta'
  }) as Record<string, unknown>[]

  // Teensy scripts typically have 10 or fewer characters
  const scriptType: ScriptType = characterIds.length <= 10 ? 'teensy' : 'full'

  // Carousel characters — checked against the known list from roles.json (edition: "carousel")
  const CAROUSEL_IDS = new Set(["steward","knight","noble","shugenja","pixie","bountyhunter","highpriestess","balloonist","general","preacher","villageidiot","king","cultleader","acrobat","lycanthrope","alsaahir","engineer","nightwatchman","huntsman","fisherman","princess","alchemist","cannibal","amnesiac","farmer","choirboy","banshee","magician","poppygrower","atheist","hermit","ogre","golem","plaguedoctor","hatter","politician","zealot","damsel","snitch","heretic","puzzlemaster","mezepheles","harpy","fearmonger","psychopath","wizard","widow","xaan","marionette","wraith","summoner","goblin","boomdandy","vizier","organgrinder","boffin","yaggababble","lilmonsta","ojo","kazali","legion","lordoftyphon","lleech","alhadikhia","riot","leviathan","gangster","gnome"])
  const hasCarousel = characterIds.some((id) => CAROUSEL_IDS.has(id))

  return { name, author, characterIds, hasCarousel, scriptType }
}
