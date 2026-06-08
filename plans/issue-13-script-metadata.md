# Issue #13: Scripts uploaded without metadata become orphan entries

## Context

Scripts can be uploaded with missing or empty `_meta` blocks (no name, no author), creating orphan entries that are hard to find, unattributable, and broken when exported/downloaded.

The TPI official schema (`https://release.botc.app/script-schema.json`) requires `_meta.name` but not `_meta.author`. Many scripts in the wild lack author in their JSON. Rather than rejecting these scripts (which punishes users for something the official tool doesn't enforce), we will:

1. Make the form's author field required
2. Inject the form's name and author values into `raw_json`'s `_meta` block before storing, but only when they are missing - never overwrite existing values
3. Show a notice so users know we'll be writing metadata into their JSON (only when `_meta.author` is missing)

This ensures every script in the archive has complete metadata in both DB columns and `raw_json`, without requiring users to hand-edit JSON.

## Changes

### File: `src/app/submit/SubmitForm.tsx`

**1. Make author field required**
- Add `required` to the author `<Input>` (line 188-193)

**2. Patch `_meta` in `handleSubmit` before insert -- only fill missing fields**
- After `JSON.parse(jsonText)`, find or create the `_meta` entry in the array
- Only inject `name`/`author` if they are **missing** from `_meta` -- do NOT overwrite existing values
- Preserve all existing `_meta` fields
- Use the patched array as `raw_json` in the insert

```ts
// In handleSubmit, before the insert:
const scriptJson = JSON.parse(jsonText) as unknown[]
const metaIndex = scriptJson.findIndex(
  (el) => typeof el === 'object' && el !== null && (el as Record<string, unknown>).id === '_meta'
)
const finalName = manualName || parsed.name
const finalAuthor = manualAuthor
if (metaIndex >= 0) {
  const meta = scriptJson[metaIndex] as Record<string, unknown>
  if (!meta.name) meta.name = finalName
  if (!meta.author) meta.author = finalAuthor
} else {
  scriptJson.unshift({ id: '_meta', name: finalName, author: finalAuthor })
}
```

Then use `scriptJson` instead of `JSON.parse(jsonText)` for `raw_json`.

**3. Add info notice above the name/author fields (conditional)**
- Only show when JSON is parsed AND `_meta.author` is missing from the parsed JSON
- Wording: "The name and author you enter here will be written into your script's _meta block. If you'd prefer to manage the metadata yourself, include it in your JSON before pasting."
- Use the existing amber/info banner style pattern already in the component (see teensy warning on line 237-239)
- Derive from existing state: `parsed.author === null` means `_meta.author` was missing from the JSON (see `src/lib/search.ts:161`)

### Phase 2: Name+author duplicate check (app-level block)

**File: `src/app/submit/SubmitForm.tsx`**

Before inserting, query for an existing script with the same `name` and `author`:

```ts
const { data: existing } = await supabase
  .from('scripts')
  .select('id')
  .eq('name', finalName)
  .eq('author', finalAuthor)
  .limit(1)
  .maybeSingle()

if (existing) {
  setErrorMsg('A script with this name and author already exists.')
  setStatus('error')
  return
}
```

- Uses the form values (`manualName`/`manualAuthor`) for the check, same as what gets inserted
- Does not require a DB migration or cleanup of existing duplicates
- Runs after auth check, before the insert

### Phase 3: Email users with scripts missing author

**Prod data:** 24 scripts have no author. 0 scripts have missing/Untitled names.

**Setup:**
- Add Resend (`npm install resend`)
- Add `RESEND_API_KEY` env var
- Create a one-off API route or script to:
  1. Query scripts where `author IS NULL`
  2. Look up submitter email via `supabase.auth.admin.getUserById(submitted_by)`
  3. Send a notification email per user (batch scripts per user, not one email per script)

**Email content:**
- Inform them that scripts without author metadata will be removed on June 22, 2026
- List their affected scripts with links to edit them
- Link to issue #13 for context

**File structure:**
- `src/app/api/admin/notify-orphan-scripts/route.ts` - one-off API route (protected, admin-only)
- Email body can be inline (no template system needed for a one-off)

### Phase 4: Manual cleanup of stacks repo -- after June 22 cleanup

The stacks sync workflow is append-only and does not remove deleted scripts. After removing author-less scripts from the main archive:
1. Identify the corresponding `scripts/{hash}.json` files in `ravenswood-archive-stacks`
2. Remove them via a manual commit
3. Update `sources/ravenswoodarchive.json` to remove the matching manifest entries
4. Rebuild the index

### Phase 5: DB constraint on (name, author) -- after June 22 cleanup

Once the metadata deadline has passed and author-less scripts are removed:
1. Review remaining name+author duplicates (currently 14 pairs, may shrink after cleanup)
2. Resolve any remaining dupes (keep oldest, delete newer - same pattern as the `json_hash` migration)
3. Add a migration with `CREATE UNIQUE INDEX scripts_name_author_unique ON scripts (name, author)`
4. Update the SubmitForm error handling to catch this constraint (`scripts_name_author_unique`) alongside the existing `json_hash` check

This replaces the Phase 2 app-level block with a stronger DB guarantee. The app-level check from Phase 2 can stay as a UX improvement (shows a friendlier error before hitting the DB).

## Verification

1. Run dev server (`npm run dev`)
2. Test uploading a script with `_meta` that has name but no author -- form should auto-fill name, require author, and stored `raw_json` should contain both
3. Test uploading a script with no `_meta` at all -- form requires name and author, stored `raw_json` should have `_meta` prepended
4. Test uploading a script with complete `_meta` -- form auto-fills both, stored `raw_json` should reflect existing values unchanged
5. Test that existing `_meta` fields (logo, bootlegger, etc.) are preserved after patching
6. Verify the duplicate hash check still works (upload same script twice)
7. Test name+author duplicate block: try uploading a script with a name+author that already exists
8. Test the email notification route: call it against prod (or local with prod credentials) and verify emails are sent to the right users with the right script lists
