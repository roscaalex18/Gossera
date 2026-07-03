-- ============================================================================
-- Migration 007 — separar el `id` técnico del `codigo` del ayuntamiento.
--
-- Motivación:
--   Hasta ahora `dogs.id` (PK) era el código que la perrera usaba para
--   cruzar con el ayuntamiento. Como muchos perros llegan sin ese código,
--   no puede ser obligatorio.
--   Introducimos `codigo` nullable + único como referencia externa,
--   dejando `id` como PK interna auto-generada.
--
-- Idempotente. Safe re-run.
-- ============================================================================

-- ---- 1. nueva columna ----------------------------------------------------
alter table public.dogs
  add column if not exists codigo text;


-- ---- 2. backfill --------------------------------------------------------
-- Los perros que ya existían tenían el código guardado en `id`, así que
-- lo copiamos a `codigo` para no perder esa referencia. Solo copiamos si
-- todavía no hay valor.
update public.dogs
   set codigo = id
 where codigo is null;


-- ---- 3. unicidad en códigos no nulos -------------------------------------
-- Postgres trata los NULL como distintos, así que un UNIQUE normal
-- permite múltiples perros con `codigo = null`.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'dogs_codigo_unique'
      and conrelid = 'public.dogs'::regclass
  ) then
    alter table public.dogs
      add constraint dogs_codigo_unique unique (codigo);
  end if;
end $$;
