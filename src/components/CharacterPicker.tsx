'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import type { Character } from '@/lib/supabase/types'

const TEAM_ORDER = ['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled', 'loric']
const TEAM_LABELS: Record<string, string> = {
  townsfolk: 'Townsfolk',
  outsider: 'Outsiders',
  minion: 'Minions',
  demon: 'Demons',
  traveller: 'Travellers',
  fabled: 'Fabled',
  loric: 'Loric',
}

interface CharacterPickerProps {
  characters: Character[]
  selected: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  variant?: 'include' | 'exclude'
}

export function CharacterPicker({
  characters,
  selected,
  onChange,
  placeholder = 'Select characters...',
  variant = 'include',
}: CharacterPickerProps) {
  const [open, setOpen] = React.useState(false)

  const grouped = TEAM_ORDER.reduce<Record<string, Character[]>>((acc, team) => {
    const chars = characters.filter((c) => c.team === team)
    if (chars.length > 0) acc[team] = chars
    return acc
  }, {})

  const selectedChars = characters.filter((c) => selected.includes(c.id))

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  const badgeVariant = variant === 'exclude' ? 'destructive' : 'secondary'

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          role="combobox"
          aria-expanded={open}
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <span>{selected.length} selected</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search characters..." />
            <CommandList>
              <CommandEmpty>No characters found.</CommandEmpty>
              {Object.entries(grouped).map(([team, chars]) => (
                <CommandGroup key={team} heading={TEAM_LABELS[team]}>
                  {chars.map((char) => (
                    <CommandItem
                      key={char.id}
                      value={`${char.name} ${char.id}`}
                      onSelect={() => toggle(char.id)}
                    >
                      <Check
                        className={cn('mr-2 h-4 w-4', selected.includes(char.id) ? 'opacity-100' : 'opacity-0')}
                      />
                      {char.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedChars.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedChars.map((char) => (
            <Badge key={char.id} variant={badgeVariant} className="gap-1 pr-1">
              {char.name}
              <button
                onClick={() => toggle(char.id)}
                className="ml-1 rounded-full hover:bg-black/20"
                aria-label={`Remove ${char.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
