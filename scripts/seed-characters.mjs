import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const roles = JSON.parse(readFileSync(join(__dirname, '..', 'roles.json'), 'utf8'))

const characters = roles.map(({ id, name, team }) => ({ id, name, team }))

console.log(`Seeding ${characters.length} characters...`)

const { error } = await supabase
  .from('characters')
  .upsert(characters, { onConflict: 'id' })

if (error) {
  console.error('Error:', error.message)
  process.exit(1)
}

console.log('Done!')
