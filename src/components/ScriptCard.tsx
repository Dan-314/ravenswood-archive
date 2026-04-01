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
        {script.author ?? 0}
      </td>
      <td className="py-3 pr-4">
        <Badge variant={script.script_type === 'teensy' ? 'secondary' : 'outline'} className="text-xs">
          {script.script_type === 'teensy' ? 'Teensy' : 'Full'}
        </Badge>
      </td>
      <td className="py-3 pr-4 text-sm text-muted-foreground hidden md:table-cell">
        {script.download_count > 0 ? script.download_count.toLocaleString() : 0}
      </td>
      <td className="py-3 text-sm text-muted-foreground hidden md:table-cell">
        {script.favourite_count > 0 ? script.favourite_count.toLocaleString() : 0}
      </td>
    </tr>
  )
}
