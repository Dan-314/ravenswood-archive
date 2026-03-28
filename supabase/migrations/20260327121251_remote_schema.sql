drop extension if exists "pg_net";


  create policy "users can read own pending scripts"
  on "public"."scripts"
  as permissive
  for select
  to public
using ((auth.uid() = submitted_by));



