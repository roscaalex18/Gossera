-- ============================================================================
-- Migration 008 — flag `destacado` para fijar perros al principio de la lista.
--
-- Sirve para marcar manualmente un perro con máxima prioridad (por ejemplo,
-- porque lleva muchos días sin salir, tiene problemas de salud o requiere
-- atención inmediata). Los perros destacados aparecen siempre en la parte
-- superior del listado, por encima de la prioridad de paseo habitual.
--
-- Es ortogonal a `prioridad_paseo`: un perro destacado sigue teniendo su
-- prioridad alta/media/baja, pero siempre se ordena antes que los no
-- destacados.
--
-- Idempotente. Safe re-run.
-- ============================================================================

alter table public.dogs
  add column if not exists destacado boolean not null default false;
