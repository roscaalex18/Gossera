-- ============================================================================
-- Migration 005 — cleanup: drop `llugar_recollida` and translate `sexo` values
--   * Drops the unused `llugar_recollida` column.
--   * Migrates existing `sexo` values from Catalan (mascle/femella) to
--     English (male/female) and replaces the CHECK constraint accordingly.
--
-- Idempotent. Safe re-run.
-- ============================================================================

-- ---- 1. drop llugar_recollida --------------------------------------------
alter table public.dogs drop column if exists llugar_recollida;


-- ---- 2. remove any existing CHECK constraint on `sexo` -------------------
do $$
declare
  cname text;
begin
  for cname in
    select c.conname
      from pg_constraint c
      join pg_class cl on cl.oid = c.conrelid
     where cl.relname = 'dogs'
       and cl.relnamespace = 'public'::regnamespace
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ilike '%sexo%'
  loop
    execute format('alter table public.dogs drop constraint %I', cname);
  end loop;
end $$;


-- ---- 3. migrate values Catalan → English ---------------------------------
update public.dogs set sexo = 'male'   where sexo = 'mascle';
update public.dogs set sexo = 'female' where sexo = 'femella';


-- ---- 4. re-add the CHECK constraint (English values) ---------------------
alter table public.dogs
  add constraint dogs_sexo_check
  check (sexo is null or sexo in ('male', 'female'));
