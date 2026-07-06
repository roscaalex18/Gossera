-- ============================================================================
-- Migration 009 — activity_log: registro inmutable de acciones por usuario.
--
-- Sirve para ver "quién usa la app y qué hace": crear/editar/borrar perros,
-- registrar/borrar paseos, marcar prioridad máxima, etc. Cada mutación
-- relevante inserta una fila desde el cliente (fire-and-forget), con el
-- email del usuario autenticado copiado para poder pintarlo sin leer
-- `auth.users`.
--
-- Filas inmutables: sólo se permiten SELECT (admin) e INSERT (cualquier
-- autenticado). No hay policies de UPDATE ni DELETE (ni siquiera el propio
-- autor puede modificarlas), para que el log sea fiable.
--
-- ⚠️ Sólo los usuarios con `raw_app_meta_data.role = 'admin'` pueden LEER
--    el log. Para promover un usuario:
--      Dashboard → Authentication → Users → click en el usuario →
--      Raw App Meta Data → { "role": "admin" }
--    (o por SQL:
--       update auth.users
--          set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--                                  || '{"role":"admin"}'::jsonb
--        where email = 'admin@...';
--    ).
--    El usuario tiene que cerrar sesión y volver a entrar para que el nuevo
--    claim aparezca en su JWT.
--
-- Idempotente. Safe re-run.
-- ============================================================================

create table if not exists public.activity_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  user_email   text,
  action       text not null,
  entity_type  text,
  entity_id    text,
  summary      text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_activity_log_created_at
  on public.activity_log (created_at desc);

create index if not exists idx_activity_log_user_email
  on public.activity_log (user_email);

create index if not exists idx_activity_log_action
  on public.activity_log (action);


-- ------------------------------------------------------------------
-- RLS:
--   * SELECT — sólo usuarios con role 'admin' en su JWT.
--   * INSERT — cualquier autenticado (o anon, para que la app funcione
--     antes de aplicar policies-authenticated.sql).
--   * UPDATE / DELETE — sin policies => nadie puede modificar el log.
-- ------------------------------------------------------------------
alter table public.activity_log enable row level security;

-- Limpiamos policies antiguas (por si esta migración se re-ejecuta después
-- de una versión previa que permitía SELECT abierto).
drop policy if exists "activity_log_select_anon" on public.activity_log;
drop policy if exists "activity_log_select_admin" on public.activity_log;
drop policy if exists "activity_log_insert_anon" on public.activity_log;

create policy "activity_log_select_admin"
  on public.activity_log
  for select
  to anon, authenticated
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

create policy "activity_log_insert_anon"
  on public.activity_log
  for insert
  to anon, authenticated
  with check (true);


-- ------------------------------------------------------------------
-- Realtime: broadcast para que la página /actividad se actualice
-- en tiempo real conforme la gente usa la app. Nota: Realtime respeta
-- las RLS de SELECT, así que los no-admin no reciben eventos.
-- ------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity_log'
  ) then
    execute 'alter publication supabase_realtime add table public.activity_log';
  end if;
end $$;
