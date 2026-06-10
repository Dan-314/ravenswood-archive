'use client'

import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownDescription } from '@/components/MarkdownDescription'

/** Descriptions taller than this are clamped until clicked open */
const COLLAPSED_HEIGHT = 240

export function CollapsibleDescription({ content }: { content: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = React.useState(false)
  const [overflowing, setOverflowing] = React.useState(false)

  React.useLayoutEffect(() => {
    const el = ref.current
    if (el) setOverflowing(el.scrollHeight > COLLAPSED_HEIGHT)
  }, [content])

  const collapsed = overflowing && !expanded

  return (
    <div className="flex flex-col">
      <div
        ref={ref}
        className={collapsed ? 'relative cursor-pointer overflow-hidden' : undefined}
        style={expanded ? undefined : { maxHeight: COLLAPSED_HEIGHT }}
        onClick={collapsed ? () => setExpanded(true) : undefined}
      >
        <MarkdownDescription content={content} />
        {collapsed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      {overflowing && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 self-start gap-1 px-2 -ml-2 text-xs text-muted-foreground"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? 'Show less' : 'Read more'}
        </Button>
      )}
    </div>
  )
}
