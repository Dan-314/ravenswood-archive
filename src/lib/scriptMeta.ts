export function patchMeta(scriptJson: unknown[], name: string, author: string): void {
  const metaIndex = scriptJson.findIndex(
    (el) => typeof el === 'object' && el !== null && (el as Record<string, unknown>).id === '_meta'
  )
  if (metaIndex >= 0) {
    const meta = scriptJson[metaIndex] as Record<string, unknown>
    if (!meta.name) meta.name = name
    if (!meta.author) meta.author = author
  } else {
    scriptJson.unshift({ id: '_meta', name, author })
  }
}

export function formatDbError(err: { code?: string; message: string }): string {
  if (err.code === '23505' && err.message.includes('scripts_name_author_unique')) {
    return 'A script with this name and author already exists.'
  }
  if (err.code === '23505' && err.message.includes('scripts_json_hash_unique')) {
    return 'This script JSON already exists in the archive.'
  }
  if (err.code === '42501' || err.message.includes('row-level security')) {
    return 'You do not have permission to perform this action.'
  }
  return 'Something went wrong. Please try again.'
}
