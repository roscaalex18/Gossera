-- ============================================================================
-- Gossera — tighten RLS to authenticated users only.
--
-- Run this in the Supabase SQL editor AFTER:
--   1. Creating at least one user in Authentication → Users.
--   2. Confirming you can log in from the Angular app with that user.
--
-- After running this file, the anon key can no longer read/write these
-- tables — only requests carrying a valid JWT (i.e. a logged-in user)
-- will succeed.
-- ============================================================================

drop policy if exists "dogs_all_anon" on public.dogs;
drop policy if exists "assignments_all_anon" on public.shelter_assignments;
drop policy if exists "walks_all_anon" on public.walks;
drop policy if exists "activity_log_select_anon" on public.activity_log;
drop policy if exists "activity_log_insert_anon" on public.activity_log;

drop policy if exists "dogs_all_auth" on public.dogs;
create policy "dogs_all_auth"
  on public.dogs
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "assignments_all_auth" on public.shelter_assignments;
create policy "assignments_all_auth"
  on public.shelter_assignments
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "walks_all_auth" on public.walks;
create policy "walks_all_auth"
  on public.walks
  for all
  to authenticated
  using (true)
  with check (true);

-- activity_log:
--   * SELECT — sólo admin (usuarios con role 'admin' en su JWT).
--   * INSERT — cualquier autenticado (para que puedan loggear sus acciones).
--   * UPDATE / DELETE — sin policies => nadie puede modificar el log.
drop policy if exists "activity_log_select_auth" on public.activity_log;
drop policy if exists "activity_log_select_admin" on public.activity_log;
create policy "activity_log_select_admin"
  on public.activity_log
  for select
  to authenticated
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

drop policy if exists "activity_log_insert_auth" on public.activity_log;
create policy "activity_log_insert_auth"
  on public.activity_log
  for insert
  to authenticated
  with check (true);
