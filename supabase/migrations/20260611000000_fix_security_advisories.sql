-- Trigger functions: not meant to be called via RPC; triggers still fire after revoke
revoke execute on function public.check_comment_rate_limit() from public, anon, authenticated;
revoke execute on function public.check_display_name_cooldown() from public, anon, authenticated;
revoke execute on function public.check_script_comment() from public, anon, authenticated;
revoke execute on function public.increment_download_count() from public, anon, authenticated;
revoke execute on function public.update_favourite_count() from public, anon, authenticated;

-- Only invoked server-side with the service role
revoke execute on function public.track_download(uuid, text) from public, anon, authenticated;

-- Must remain callable by signed-in users (auth.uid() ownership check inside)
revoke execute on function public.generate_bracket(uuid, uuid[]) from public, anon;
revoke execute on function public.advance_winner(uuid, uuid) from public, anon;

-- Public bucket serves objects via URL without a select policy; this only enabled listing
drop policy "select script-images" on storage.objects;
