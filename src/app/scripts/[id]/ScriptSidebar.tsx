import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { CollapsibleDescription } from './CollapsibleDescription'
import { CustomiseLink } from './CustomiseLink'
import { VersionHistorySection, type Version } from './VersionHistorySection'
import { TranslatedJsonButtons } from './TranslatedJsonButtons'
import { OpenInScriptToolButton } from './OpenInScriptToolButton'
import { DownloadCount } from './DownloadCount'
import { FavouriteCount } from './FavouriteCount'
import { SidebarLanguageSelect } from './SidebarLanguageSelect'

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
      </div>

      <div className="flex flex-wrap gap-2">
        <TranslatedJsonButtons rawJson={rawJson} scriptId={scriptId} name={name} versionLabel={versionLabel} />
        <OpenInScriptToolButton rawJson={rawJson} />
        {userActions}
        <CustomiseLink scriptId={scriptId} />
      </div>

      <SidebarLanguageSelect />

      {description && (
        <CollapsibleDescription content={description} />
      )}

      {versions && versions.length > 1 && (
        <>
          <Separator />
          <VersionHistorySection
            scriptId={scriptId}
            versions={versions}
            canEdit={canEdit}
            currentVersionNumber={currentVersionNumber}
          />
        </>
      )}
    </div>
  )
}
