export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type ScriptType = 'full' | 'teensy'
export type ScriptStatus = 'pending' | 'approved' | 'rejected'
export type CharacterTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller' | 'fabled' | 'loric'

export interface Database {
  public: {
    Views: Record<never, never>
    Functions: Record<never, never>
    Tables: {
      scripts: {
        Row: {
          id: string
          name: string
          author: string | null
          script_type: ScriptType
          has_carousel: boolean
          status: ScriptStatus
          submitted_by: string | null
          character_ids: string[]
          raw_json: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          author?: string | null
          script_type: ScriptType
          has_carousel?: boolean
          status?: ScriptStatus
          submitted_by?: string | null
          character_ids?: string[]
          raw_json: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          author?: string | null
          script_type?: ScriptType
          has_carousel?: boolean
          status?: ScriptStatus
          submitted_by?: string | null
          character_ids?: string[]
          raw_json?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          id: string
          name: string
          team: CharacterTeam
        }
        Insert: {
          id: string
          name: string
          team: CharacterTeam
        }
        Update: {
          id?: string
          name?: string
          team?: CharacterTeam
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      script_versions: {
        Row: {
          id: string
          script_id: string
          version_number: number
          name: string
          author: string | null
          script_type: ScriptType
          has_carousel: boolean
          character_ids: string[]
          raw_json: Json
          edited_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          script_id: string
          version_number: number
          name: string
          author?: string | null
          script_type: ScriptType
          has_carousel?: boolean
          character_ids?: string[]
          raw_json: Json
          edited_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          author?: string | null
          script_type?: ScriptType
          has_carousel?: boolean
          character_ids?: string[]
          raw_json?: Json
        }
        Relationships: []
      }
      script_groups: {
        Row: {
          script_id: string
          group_id: string
        }
        Insert: {
          script_id: string
          group_id: string
        }
        Update: {
          script_id?: string
          group_id?: string
        }
        Relationships: []
      }
    }
  }
}

// Convenience types for use in components
export type Script = Database['public']['Tables']['scripts']['Row']
export type Character = Database['public']['Tables']['characters']['Row']
export type Group = Database['public']['Tables']['groups']['Row']

// Script with joined groups
export type ScriptWithGroups = Script & {
  groups: Group[]
}

export type ScriptVersion = Database['public']['Tables']['script_versions']['Row']
