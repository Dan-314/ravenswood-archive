'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Group, ScriptWithGroups } from '@/lib/supabase/types'

interface AdminQueueProps {
  scripts: ScriptWithGroups[]
  groups: Group[]
}

export function AdminQueue({ scripts: initial, groups }: AdminQueueProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [scripts, setScripts] = React.useState(initial)
  const [groupAssignments, setGroupAssignments] = React.useState<Record<string, string[]>>({})
  const [loading, setLoading] = React.useState<string | null>(null)

  async function handleDecision(scriptId: string, status: 'approved' | 'rejected') {
    setLoading(scriptId)

    const { error } = await supabase
      .from('scripts')
      .update({ status })
      .eq('id', scriptId)

    if (!error && status === 'approved') {
      const groupIds = groupAssignments[scriptId] ?? []
      if (groupIds.length > 0) {
        await supabase.from('script_groups').insert(
          groupIds.map((group_id) => ({ script_id: scriptId, group_id }))
        )
      }
    }

    if (!error) {
      setScripts((prev) => prev.filter((s) => s.id !== scriptId))
    }

    setLoading(null)
  }

  function toggleGroup(scriptId: string, groupId: string) {
    setGroupAssignments((prev) => {
      const current = prev[scriptId] ?? []
      return {
        ...prev,
        [scriptId]: current.includes(groupId)
          ? current.filter((id) => id !== groupId)
          : [...current, groupId],
      }
    })
  }

  if (scripts.length === 0) {
    return <p className="text-muted-foreground py-12 text-center">Queue is empty.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {scripts.map((script) => (
        <Card key={script.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-base">{script.name}</CardTitle>
              <Badge variant={script.script_type === 'teensy' ? 'secondary' : 'outline'}>
                {script.script_type === 'teensy' ? 'Teensy' : 'Full'}
              </Badge>
            </div>
            {script.author && (
              <p className="text-sm text-muted-foreground">by {script.author}</p>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">
              {script.character_ids.length} characters
              {script.has_carousel ? ' · Carousel' : ''}
            </div>

            {groups.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Assign to groups</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`${script.id}-${group.id}`}
                        checked={(groupAssignments[script.id] ?? []).includes(group.id)}
                        onCheckedChange={() => toggleGroup(script.id, group.id)}
                      />
                      <Label htmlFor={`${script.id}-${group.id}`} className="font-normal cursor-pointer text-sm">
                        {group.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleDecision(script.id, 'approved')}
                disabled={loading === script.id}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDecision(script.id, 'rejected')}
                disabled={loading === script.id}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(`/scripts/${script.id}`, '_blank')}
              >
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
