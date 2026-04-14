import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { ScriptWithCollections } from '@/lib/supabase/types'

interface ScriptRowProps {
  script: ScriptWithCollections
}

export function ScriptRow({ script }: ScriptRowProps) {
  return (
    <tr className="relative border-b transition-colors hover:bg-muted/50 focus-within:bg-muted/50">
      <td className="py-3 pr-4 font-medium">
        <Link
          href={`/scripts/${script.id}`}
          className="before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {script.name}
          {script.version_label && script.version_label !== '0' && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">{script.version_label}</span>
          )}
        </Link>
      </td>
      <td className="py-3 pr-4 text-sm text-muted-foreground hidden sm:table-cell">
        {script.author ?? '—'}
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
