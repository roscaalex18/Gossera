-- ============================================================================
-- Migration 003 — dog status (adoptions/deaths/transfers), notes & walk log.
--
-- Safe to run after migration 002.  Idempotent.
-- ============================================================================

-- ------------------------------------------------------------------
-- 1. dogs: new columns `estado`, `notas`, `adoptado_en`
-- ------------------------------------------------------------------
alter table public.dogs
  add column if not exists estado text not null default 'activo';

-- Add the check constraint separately so this migration is safe to re-run.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'dogs_estado_check' and conrelid = 'public.dogs'::regclass
  ) then
    alter table public.dogs
      add constraint dogs_estado_check
      check (estado in ('activo', 'adoptado', 'fallecido', 'trasladado'));
  end if;
end $$;

alter table public.dogs
  add column if not exists notas text;

alter table public.dogs
  add column if not exists adoptado_en timestamptz;


-- ------------------------------------------------------------------
-- 2. walks: one row per walk performed
-- ------------------------------------------------------------------
create table if not exists public.walks (
  id           uuid primary key default gen_random_uuid(),
  dog_id       text not null references public.dogs(id) on delete cascade,
  fecha        timestamptz not null default now(),
  paseado_por  uuid references auth.users(id) on delete set null,
  notas        text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_walks_dog_id on public.walks (dog_id);
create index if not exists idx_walks_fecha  on public.walks (fecha desc);

alter table public.walks enable row level security;

-- Open policy (matches the current dogs / assignments policy).
-- If you have already run policies-authenticated.sql, run its updated
-- version to tighten this too.
drop policy if exists "walks_all_anon" on public.walks;
create policy "walks_all_anon"
  on public.walks
  for all
  to anon, authenticated
  using (true)
  with check (true);


-- ------------------------------------------------------------------
-- 3. Realtime broadcast for walks
-- ------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'walks'
  ) then
    execute 'alter publication supabase_realtime add table public.walks';
  end if;
end $$;
