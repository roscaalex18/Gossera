-- ============================================================================
-- Gossera — Supabase schema
--
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL → New query).
-- After running it, also enable Realtime for both tables:
--   Dashboard → Database → Replication → enable `dogs` and `shelter_assignments`.
-- ============================================================================

-- ------------------------------------------------------------------
-- Table: dogs
-- ------------------------------------------------------------------
create table if not exists public.dogs (
  id                   text primary key,
  nombre               text not null,
  edad                 integer not null default 0,
  raza                 text not null,
  energia              text not null check (energia in ('alta', 'media', 'baja')),
  prioridad_paseo      text not null check (prioridad_paseo in ('alta', 'media', 'baja')),
  ultimo_paseo         timestamptz not null default now(),
  necesita_paseo_hoy   boolean not null default true,
  fotos                text[] not null default '{}',
  estado               text not null default 'activo'
                         check (estado in ('activo', 'adoptado', 'fallecido', 'trasladado')),
  notas                text,
  adoptado_en          timestamptz,
  sexo                 text check (sexo in ('male', 'female')),
  color                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Keep updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_dogs_updated_at on public.dogs;
create trigger trg_dogs_updated_at
before update on public.dogs
for each row execute function public.set_updated_at();


-- ------------------------------------------------------------------
-- Table: shelter_assignments
-- One row = one dog placed in one region. A dog can only be in one
-- region at a time (enforced by UNIQUE on dog_id).
-- ------------------------------------------------------------------
create table if not exists public.shelter_assignments (
  region_id  text not null,
  dog_id     text not null references public.dogs(id) on delete cascade,
  position   bigint not null default extract(epoch from now())::bigint,
  created_at timestamptz not null default now(),
  primary key (region_id, dog_id),
  unique (dog_id)
);

create index if not exists idx_shelter_assignments_region
  on public.shelter_assignments (region_id);


-- ------------------------------------------------------------------
-- Row Level Security
--
-- Simple starter policy: anyone with the anon key can read AND write.
-- Fine for a private prototype. Tighten later by requiring authenticated
-- users (see the commented block at the bottom).
-- ------------------------------------------------------------------
alter table public.dogs                enable row level security;
alter table public.shelter_assignments enable row level security;

drop policy if exists "dogs_all_anon" on public.dogs;
create policy "dogs_all_anon"
  on public.dogs
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "assignments_all_anon" on public.shelter_assignments;
create policy "assignments_all_anon"
  on public.shelter_assignments
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- ------------------------------------------------------------------
-- Realtime: enable postgres_changes broadcasts for these tables.
-- Supabase already creates the `supabase_realtime` publication; we
-- just add our tables to it. Safe to re-run.
-- ------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dogs'
  ) then
    execute 'alter publication supabase_realtime add table public.dogs';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shelter_assignments'
  ) then
    execute 'alter publication supabase_realtime add table public.shelter_assignments';
  end if;
end $$;


-- ------------------------------------------------------------------
-- (Optional, for later) Tighten RLS to authenticated users only:
--
-- drop policy if exists "dogs_all_anon" on public.dogs;
-- create policy "dogs_read_auth"  on public.dogs
--   for select to authenticated using (true);
-- create policy "dogs_write_auth" on public.dogs
--   for all    to authenticated using (true) with check (true);
--
-- drop policy if exists "assignments_all_anon" on public.shelter_assignments;
-- create policy "assignments_all_auth" on public.shelter_assignments
--   for all to authenticated using (true) with check (true);
-- ------------------------------------------------------------------
