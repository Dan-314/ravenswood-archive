import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import { VersionManager } from './VersionManager'
import { MarkdownDescription } from '@/components/MarkdownDescription'
import { TranslatedJsonButtons } from './TranslatedJsonButtons'
import { DownloadCount } from './DownloadCount'
import { FavouriteCount } from './FavouriteCount'

interface Version {
  id: string
  version_number: number
  version_label: string
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
  collections: { id: string; name: string }[]
  rawJson: unknown
  canEdit: boolean
  downloadCount: number
  favouriteCount: number
  userActions?: React.ReactNode
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
  collections,
  rawJson,
  canEdit,
  downloadCount,
  favouriteCount,
  userActions,
  versions,
  currentVersionNumber,
  versionLabel,
}: ScriptSidebarProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        {versionLabel && (
          <p className="text-sm text-muted-foreground">{versionLabel}</p>
        )}
        {author && (
          <p className="text-muted-foreground text-sm">by <Link href={`/?q=${encodeURIComponent(author)}`} className="hover:underline">{author}</Link></p>
        )}
        <div className="flex items-center gap-3">
          <DownloadCount scriptId={scriptId} initialCount={downloadCount} />
          <FavouriteCount scriptId={scriptId} initialCount={favouriteCount} />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <Badge variant={scriptType === 'teensy' ? 'secondary' : 'outline'}>
            {scriptType === 'teensy' ? 'Teensy' : 'Full'}
          </Badge>
          {hasCarousel && <Badge variant="outline">Carousel</Badge>}
          {collections.map((c) => (
            <Badge key={c.id} variant="secondary">{c.name}</Badge>
          ))}
        </div>
        {description && (
          <MarkdownDescription content={description} />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <TranslatedJsonButtons rawJson={rawJson} scriptId={scriptId} name={name} versionLabel={versionLabel} />
        {userActions}
        <Link href={`/scripts/${scriptId}/customise`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            Customise &amp; Download PDF
          </Button>
        </Link>
      </div>

      {versions && versions.length > 1 && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Version history</h2>
              {canEdit && <VersionManager scriptId={scriptId} versions={versions} />}
            </div>
            <div className="flex flex-col divide-y text-sm">
              {versions.map((v) => {
                const isCurrent = v.version_number === versions[0].version_number
                const isViewing = currentVersionNumber !== undefined && v.version_number === currentVersionNumber
                const className = `flex items-center gap-4 py-1.5`
                const content = (
                  <>
                    <span className="text-muted-foreground shrink-0 text-xs w-12">{v.version_label === '0' ? `#${v.version_number}` : v.version_label}</span>
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
