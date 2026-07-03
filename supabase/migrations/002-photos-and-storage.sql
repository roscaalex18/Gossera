-- ============================================================================
-- Migration 002 — multiple photos per dog + Supabase Storage bucket.
--
-- Safe to run against a database that already has schema.sql + seed.sql
-- applied. Idempotent.
--
-- Run this in the SQL editor:
--   Dashboard → SQL editor → New query → paste → Run.
-- ============================================================================

-- ------------------------------------------------------------------
-- 1. Table `dogs`: replace `foto_url text` with `fotos text[]`.
-- ------------------------------------------------------------------
alter table public.dogs
  add column if not exists fotos text[] not null default '{}';

-- Backfill: turn the single foto_url into a one-element array
-- (only for rows where the array is still empty and there is an URL).
update public.dogs
   set fotos = array[foto_url]
 where fotos = '{}'
   and foto_url is not null
   and foto_url <> '';

-- Drop the old column now that data is migrated.
alter table public.dogs drop column if exists foto_url;


-- ------------------------------------------------------------------
-- 2. Storage bucket `dog-photos`
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

-- Anyone can read (the bucket is public).
drop policy if exists "dog_photos_read" on storage.objects;
create policy "dog_photos_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'dog-photos');

-- Only logged-in users can upload.
drop policy if exists "dog_photos_insert" on storage.objects;
create policy "dog_photos_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'dog-photos');

-- Only logged-in users can delete.
drop policy if exists "dog_photos_delete" on storage.objects;
create policy "dog_photos_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'dog-photos');

-- Only logged-in users can update (needed for upsert-style replacements).
drop policy if exists "dog_photos_update" on storage.objects;
create policy "dog_photos_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'dog-photos')
  with check (bucket_id = 'dog-photos');
