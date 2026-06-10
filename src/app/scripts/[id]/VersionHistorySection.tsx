import Link from 'next/link'
import { VersionManager } from './VersionManager'

export interface Version {
  id: string
  version_number: number
  version_label: string
  name: string
  created_at: string
  edited_by: string | null
}

interface VersionHistorySectionProps {
  scriptId: string
  versions: Version[]
  canEdit: boolean
  currentVersionNumber?: number
}

export function VersionHistorySection({
  scriptId,
  versions,
  canEdit,
  currentVersionNumber,
}: VersionHistorySectionProps) {
  if (versions.length < 2) return null

  return (
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
  )
}
