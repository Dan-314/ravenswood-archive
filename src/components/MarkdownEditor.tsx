'use client'

import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { MarkdownDescription } from '@/components/MarkdownDescription'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

type WrapAction = { type: 'wrap'; before: string; after: string; placeholder: string }
type PrefixAction = { type: 'prefix'; prefix: string }
type LinkAction = { type: 'link' }

type Action = WrapAction | PrefixAction | LinkAction

const SHORTCUTS: Record<string, Action> = {
  b: { type: 'wrap', before: '**', after: '**', placeholder: 'bold text' },
  i: { type: 'wrap', before: '*', after: '*', placeholder: 'italic text' },
  k: { type: 'link' },
}

function applyAction(
  textarea: HTMLTextAreaElement,
  action: Action,
  setValue: (v: string) => void
) {
  const { selectionStart: start, selectionEnd: end, value } = textarea
  const selected = value.slice(start, end)

  let newValue: string
  let cursorStart: number
  let cursorEnd: number

  if (action.type === 'wrap') {
    const text = selected || action.placeholder
    newValue = value.slice(0, start) + action.before + text + action.after + value.slice(end)
    if (selected) {
      cursorStart = start + action.before.length
      cursorEnd = cursorStart + selected.length
    } else {
      cursorStart = start + action.before.length
      cursorEnd = cursorStart + action.placeholder.length
    }
  } else if (action.type === 'link') {
    const text = selected || 'link text'
    newValue = value.slice(0, start) + `[${text}](url)` + value.slice(end)
    if (selected) {
      // Select "url"
      cursorStart = start + selected.length + 3
      cursorEnd = cursorStart + 3
    } else {
      // Select "link text"
      cursorStart = start + 1
      cursorEnd = cursorStart + text.length
    }
  } else {
    // prefix: apply to each line in selection
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const lines = value.slice(lineStart, end).split('\n')
    const prefixed = lines.map(l => action.prefix + l).join('\n')
    newValue = value.slice(0, lineStart) + prefixed + value.slice(end)
    cursorStart = start + action.prefix.length
    cursorEnd = end + action.prefix.length * lines.length
  }

  setValue(newValue)
  requestAnimationFrame(() => {
    textarea.setSelectionRange(cursorStart, cursorEnd)
    textarea.focus()
  })
}

export function MarkdownEditor({ id, value, onChange, placeholder, rows = 5 }: MarkdownEditorProps) {
  const [previewing, setPreviewing] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey)) return
    const action = SHORTCUTS[e.key]
    if (!action) return
    e.preventDefault()
    if (textareaRef.current) {
      applyAction(textareaRef.current, action, onChange)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setPreviewing(false)}
          className={cn(
            'pb-0.5 transition-colors',
            !previewing ? 'text-foreground border-b border-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setPreviewing(true)}
          className={cn(
            'pb-0.5 transition-colors',
            previewing ? 'text-foreground border-b border-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Preview
        </button>
      </div>
      {previewing ? (
        <div className="min-h-[theme(spacing.32)] rounded-lg border border-input px-2.5 py-2">
          {value.trim() ? (
            <MarkdownDescription content={value} />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview</p>
          )}
        </div>
      ) : (
        <>
          <Textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={rows}
          />
          <p className="text-xs text-muted-foreground">
            Markdown supported. <span className="text-muted-foreground/70">Ctrl+B bold, Ctrl+I italic, Ctrl+K link</span>
          </p>
        </>
      )}
    </div>
  )
}
