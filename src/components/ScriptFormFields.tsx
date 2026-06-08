import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface ScriptFormFieldsProps {
  name: string
  onNameChange: (v: string) => void
  author: string
  onAuthorChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  scriptType: 'full' | 'teensy'
  onScriptTypeChange: (v: 'full' | 'teensy') => void
  hasHomebrew: boolean
  onHomebrewChange: (v: boolean) => void
  showMetaNotice: boolean
  namePlaceholder?: string
  authorPlaceholder?: string
  afterScriptType?: React.ReactNode
  children?: React.ReactNode
}

export function ScriptFormFields({
  name, onNameChange,
  author, onAuthorChange,
  description, onDescriptionChange,
  scriptType, onScriptTypeChange,
  hasHomebrew, onHomebrewChange,
  showMetaNotice,
  namePlaceholder,
  authorPlaceholder,
  afterScriptType,
  children,
}: ScriptFormFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Script name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={namePlaceholder}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="author">Author</Label>
        <Input
          id="author"
          value={author}
          onChange={(e) => onAuthorChange(e.target.value)}
          placeholder={authorPlaceholder}
          required
        />
      </div>

      {showMetaNotice && (
        <p className="rounded-md border border-amber-600/40 bg-amber-600/10 px-3 py-2 text-sm">
          The name and author you enter here will be written into your script&apos;s <code className="text-xs bg-muted px-1 py-0.5 rounded">_meta</code> block. If you&apos;d prefer to manage the metadata yourself, include it in your JSON before saving.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <MarkdownEditor
          id="description"
          value={description}
          onChange={onDescriptionChange}
          placeholder="Describe the themes or mechanics of your script (optional)"
        />
      </div>

      {children}

      <div className="flex flex-col gap-2">
        <Label>Script type</Label>
        <Select value={scriptType} onValueChange={(v) => onScriptTypeChange(v as 'full' | 'teensy')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="teensy">Teensy</SelectItem>
          </SelectContent>
        </Select>
        {afterScriptType}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="hasHomebrew"
          checked={hasHomebrew}
          onCheckedChange={(checked) => onHomebrewChange(checked === true)}
        />
        <Label htmlFor="hasHomebrew" className="cursor-pointer">Contains homebrew characters</Label>
      </div>
    </>
  )
}
