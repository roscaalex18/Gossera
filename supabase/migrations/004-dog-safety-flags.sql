-- ============================================================================
-- Migration 004 — flags de seguridad en la ficha del perro:
--   * es_ppp             — Perro Potencialmente Peligroso (RD 287/2002).
--   * bozal_obligatorio  — obligatorio pasear con bozal.
--   * cuidado_machos     — no compatible / precaución con otros machos.
--   * cuidado_hembras    — no compatible / precaución con otras hembras.
--
-- Idempotente. Safe re-run.
-- ============================================================================

alter table public.dogs
  add column if not exists es_ppp             boolean not null default false;

alter table public.dogs
  add column if not exists bozal_obligatorio  boolean not null default false;

alter table public.dogs
  add column if not exists cuidado_machos     boolean not null default false;

alter table public.dogs
  add column if not exists cuidado_hembras    boolean not null default false;


-- ------------------------------------------------------------------
-- Backfill: marcar como PPP los perros con razas listadas en el RD
-- 287/2002 y ampliaciones autonómicas más habituales.
-- Solo actualiza los perros que aún no estén marcados manualmente.
-- ------------------------------------------------------------------
update public.dogs
   set es_ppp = true
 where es_ppp = false
   and (
        lower(raza) like '%pitbull%'
     or lower(raza) like '%pit bull%'
     or lower(raza) like '%staffordshire%'
     or lower(raza) like '%rottweiler%'
     or lower(raza) like '%doberman%'
     or lower(raza) like '%dòberman%'
     or lower(raza) like '%dogo argent%'
     or lower(raza) like '%tosa inu%'
     or lower(raza) like '%akita inu%'
     or lower(raza) like '%presa canario%'
     or lower(raza) like '%dogo de burdeos%'
     or lower(raza) like '%bullmastiff%'
     or lower(raza) like '%fila brasile%'
     or lower(raza) like '%mastín napolitano%'
     or lower(raza) like '%mastin napolitano%'
   );
