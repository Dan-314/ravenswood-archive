import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScriptRow } from '@/components/ScriptCard'
import type { ScriptWithGroups, Group } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: scriptsRaw } = await supabase
    .from('scripts')
    .select('*, groups:script_groups(group:groups(*))')
    .eq('submitted_by', user.id)
    .order('created_at', { ascending: false })

  const scripts: ScriptWithGroups[] = ((scriptsRaw ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>
    const rawGroups = (r.groups as { group: Group }[] | null) ?? []
    return { ...r, groups: rawGroups.map((g) => g.group).filter(Boolean) } as ScriptWithGroups
  })

  const username = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{username as string}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {scripts.length} script{scripts.length !== 1 ? 's' : ''} submitted
        </p>
      </div>

      {scripts.length === 0 ? (
        <p className="text-muted-foreground">You haven't submitted any scripts yet.</p>
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
    </div>
  )
}
