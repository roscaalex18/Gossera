-- ============================================================================
-- Migration 006 — cache del email del voluntario en cada paseo.
--
-- Motivación:
--   La tabla `walks` referencia `auth.users(id)` mediante `paseado_por`.
--   Desde el cliente NO se puede leer `auth.users` (RLS), por lo que la
--   pantalla de paseos mostraba el UUID en vez del email.
--   Guardamos ahora una copia del email en cada fila para poder pintarlo
--   sin joins.
--
-- Idempotente. Safe re-run.
-- ============================================================================

-- ---- 1. nueva columna ----------------------------------------------------
alter table public.walks
  add column if not exists paseado_por_email text;


-- ---- 2. backfill: rellenamos las filas antiguas ---------------------------
-- El editor SQL de Supabase corre como owner/postgres, por lo que puede
-- leer `auth.users` para hacer el join de forma segura.
update public.walks w
   set paseado_por_email = u.email
  from auth.users u
 where w.paseado_por = u.id
   and w.paseado_por_email is null;
