import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Pencil, Settings2 } from 'lucide-react'
import { DeleteButton } from './DeleteButton'
import { CopyJsonButton } from './CopyJsonButton'
import { ClaimButton } from './ClaimButton'
import { DownloadJsonButton } from './DownloadJsonButton'
import { DownloadCount } from './DownloadCount'
import type { ClaimStatus } from '@/lib/supabase/types'

interface Version {
  id: string
  version_number: number
  name: string
  created_at: string
  edited_by: string | null
}

interface ScriptSidebarProps {
  scriptId: string
  name: string
  author: string | null
  description: string | null
  scriptType: string
  hasCarousel: boolean
  groups: { id: string; name: string }[]
  rawJson: unknown
  canEdit: boolean
  showClaim: boolean
  isLoggedIn: boolean
  displayName: string | null
  existingClaim: { status: ClaimStatus } | null
  downloadCount: number
  versions?: Version[]
  currentVersionNumber?: number
  versionLabel?: string
}

export function ScriptSidebar({
  scriptId,
  name,
  author,
  description,
  scriptType,
  hasCarousel,
  groups,
  rawJson,
  canEdit,
  showClaim,
  isLoggedIn,
  displayName,
  existingClaim,
  downloadCount,
  versions,
  currentVersionNumber,
  versionLabel,
}: ScriptSidebarProps) {
  const jsonString = JSON.stringify(rawJson, null, 2)
  const blob = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`
  const downloadName = versionLabel ? `${name} ${versionLabel}.json` : `${name}.json`

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <Badge variant={scriptType === 'teensy' ? 'secondary' : 'outline'} className="shrink-0">
            {scriptType === 'teensy' ? 'Teensy' : 'Full'}
          </Badge>
        </div>
        {versionLabel && (
          <p className="text-sm text-muted-foreground">{versionLabel}</p>
        )}
        {author && (
          <p className="text-muted-foreground text-sm">by <Link href={`/?q=${encodeURIComponent(author)}`} className="hover:underline">{author}</Link></p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {hasCarousel && <Badge variant="outline">Carousel</Badge>}
          {groups.map((g) => (
            <Badge key={g.id} variant="secondary">{g.name}</Badge>
          ))}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        <DownloadCount scriptId={scriptId} initialCount={downloadCount} />
      </div>

      <div className="flex flex-wrap gap-2">
        <DownloadJsonButton scriptId={scriptId} blob={blob} downloadName={downloadName} />
        <CopyJsonButton json={jsonString} scriptId={scriptId} />
        <Link href={`/scripts/${scriptId}/customise`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            Customise &amp; Download PDF
          </Button>
        </Link>
        {canEdit && (
          <>
            <Link href={`/scripts/${scriptId}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <DeleteButton scriptId={scriptId} />
          </>
        )}
        {showClaim && (
          <ClaimButton
            scriptId={scriptId}
            isLoggedIn={isLoggedIn}
            displayName={displayName}
            existingClaim={existingClaim}
          />
        )}
      </div>

      {versions && versions.length > 1 && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <h2 className="font-semibold text-sm">Version history</h2>
            <div className="flex flex-col divide-y text-sm">
              {versions.map((v) => {
                const isCurrent = v.version_number === versions[0].version_number
                const isViewing = currentVersionNumber !== undefined && v.version_number === currentVersionNumber
                const className = `flex items-center gap-4 py-1.5`
                const content = (
                  <>
                    <span className="w-10 text-muted-foreground shrink-0 text-xs">v{v.version_number}</span>
                    <span className="text-muted-foreground flex-1 text-xs">
                      {new Date(v.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                    {isViewing ? (
                      <span className="text-xs text-muted-foreground">viewing</span>
                    ) : isCurrent ? (
                      <span className="text-xs text-muted-foreground">current</span>
                    ) : (
                      <span className="text-xs">View</span>
                    )}
                  </>
                )
                const href = isCurrent ? `/scripts/${scriptId}` : `/scripts/${scriptId}/versions/${v.version_number}`
                return isViewing ? (
                  <div key={v.id} className={className}>{content}</div>
                ) : (
                  <Link key={v.id} href={href} className={`${className} hover:bg-muted/50 rounded -mx-2 px-2`}>{content}</Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
