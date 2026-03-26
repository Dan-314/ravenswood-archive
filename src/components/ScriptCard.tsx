'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { ScriptWithGroups } from '@/lib/supabase/types'

interface ScriptRowProps {
  script: ScriptWithGroups
}

export function ScriptRow({ script }: ScriptRowProps) {
  const router = useRouter()

  return (
    <tr
      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={() => router.push(`/scripts/${script.id}`)}
    >
      <td className="py-3 pr-4 font-medium">
        {script.name}
      </td>
      <td className="py-3 pr-4 text-sm text-muted-foreground hidden sm:table-cell">
        {script.author ?? '—'}
      </td>
      <td className="py-3 pr-4">
        <Badge variant={script.script_type === 'teensy' ? 'secondary' : 'outline'} className="text-xs">
          {script.script_type === 'teensy' ? 'Teensy' : 'Full'}
        </Badge>
      </td>
      <td className="py-3 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {script.has_carousel && (
            <Badge variant="outline" className="text-xs">Carousel</Badge>
          )}
          {script.groups.map((group) => (
            <Badge key={group.id} variant="secondary" className="text-xs">
              {group.name}
            </Badge>
          ))}
        </div>
      </td>
    </tr>
  )
}
