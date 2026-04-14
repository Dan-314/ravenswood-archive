-- Storage bucket for homebrew script character images uploaded via /api/uploads/script-image.
-- Writes must go through the server route (service role) so sharp transcoding + ownership
-- checks run before anything lands in the bucket. No direct client writes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'script-images',
  'script-images',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public read. Puppeteer and browsers fetch without auth during PDF render + thumbnails.
create policy "select script-images"
  on storage.objects for select
  using (bucket_id = 'script-images');

-- No insert/update/delete policies: anon and authenticated roles cannot write.
-- Service role bypasses RLS; the API route is the only write path.
