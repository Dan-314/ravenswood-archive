import { createClient } from '@/lib/supabase/server'
import { AdminQueue } from './AdminQueue'
import type { ScriptWithGroups, Group } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: scriptsRaw } = await supabase
    .from('scripts')
    .select('*, groups:script_groups(group:groups(*))')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const { data: groupsRaw } = await supabase.from('groups').select('*').order('name')

  // Flatten nested join shape: { groups: [{ group: {...} }] } -> { groups: [...] }
  const scripts: ScriptWithGroups[] = ((scriptsRaw ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>
    const rawGroups = (r.groups as { group: Group }[] | null) ?? []
    return { ...r, groups: rawGroups.map((g) => g.group).filter(Boolean) } as ScriptWithGroups
  })
  const groups = (groupsRaw ?? []) as Group[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Moderation queue</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {scripts?.length ?? 0} script{(scripts?.length ?? 0) !== 1 ? 's' : ''} pending review
        </p>
      </div>
      <AdminQueue scripts={scripts ?? []} groups={groups ?? []} />
    </div>
  )
}
