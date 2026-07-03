-- ============================================================================
-- Gossera — seed data (dogs)
--
-- Run this AFTER schema.sql in the Supabase SQL editor.
-- Safe to re-run: uses ON CONFLICT (id) DO NOTHING, so existing rows are kept.
-- ============================================================================

insert into public.dogs
  (id, nombre, edad, raza, energia, prioridad_paseo, ultimo_paseo,
   necesita_paseo_hoy, fotos, sexo, color)
values
  ('R-001', 'Nina',   0, 'Pitbull',                 'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_198a518e78e8479cb7fb8144c1548f65~mv2.jpg'], 'female', 'Negro con el pecho blanco'),
  ('R-004', 'Max',    0, 'American Staffordshire',  'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_6b7bb112aa3146c1a84a2e80f2f07c97~mv2.jpg'], 'male',   'Beige y blanco'),
  ('R-026', 'Thor',   0, 'Malinois',                'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_fb447884dbb34c8bafdc1f0ebb980ab7~mv2.jpg'], 'male',   'Marrón y negro'),
  ('R-034', 'Taison', 0, 'American Staffordshire',  'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_efcde19f162744da94f73d009f93ed1b~mv2.jpg'], 'male',   'Negro atigrado'),
  ('R-049', 'Bruno',  0, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_85c69b964afd4cbeadd5a14b9a2a7fcd~mv2.jpg'], 'male',   'Canela y marrón'),
  ('R-065', 'Bolt',   0, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_eee96a640c1848e1a8cabe0d58ffc6da~mv2.jpg'], 'male',   'Marrón y negro'),
  ('R-082', 'Bonito', 0, 'Doberman',                'alta',  'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_ad85c4c5a71d45a8962c1bc53898ab3c~mv2.jpg'], 'male',   'Marrón y negro'),
  ('R-093', 'Tina',   0, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_a419348cb78044f9bf864cf0cbde74a2~mv2.jpg'], 'female', 'Marrón y negro'),
  ('R-110', 'Zeus',   0, 'Pitbull',                 'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_d3a334fbb6434cfca9261b36fd3ad95c~mv2.jpg'], 'male',   'Atigrado blanco y marrón'),
  ('R-117', 'Lupito', 0, 'Pitbull',                 'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_23562f3945be4c3096e3b03a629c00d3~mv2.jpg'], 'male',   'Marrón, blanco y negro'),
  ('R-118', 'Kaira',  0, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_e27d58cb11454ddbbfd38ce535ae8067~mv2.jpg'], 'female', 'Tricolor'),
  ('R-119', 'Canela', 0, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_5da1516d9fad4f8fb4ec473d50724ff4~mv2.jpg'], 'female', 'Marrón y negro'),
  ('R-120', 'Perla',  0, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_af543e83def44171bc077f8c3cf7a445~mv2.jpg'], 'female', 'Marrón y negro'),
  ('R-127', 'Kiro',   0, 'Pitbull',                 'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_375dfda1fe484fec96b7e5e5058a57ff~mv2.jpg'], 'male',   'Atigrado pecho blanco'),
  ('R-133', 'Eddye',  2, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_99358e8730f647dab57cb08e2445fc17~mv2.jpg'], 'male',   'Marrón'),
  ('R-134', 'Bobi',   1, 'Mestizo',                 'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_e8f58431a00a4c0e90a7bbde50569d69~mv2.jpg'], 'male',   'Negro y blanco'),
  ('R-143', 'Lucas',  0, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_0304d00cf25a493bb5e2d2dfd6b4bea9~mv2.jpg'], 'male',   'Blanco'),
  ('R-144', 'Mila',   0, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_8a909cd4d9e846f78539d9757bddcb7e~mv2.jpg'], 'female', 'Crema'),
  ('R-147', 'Maika',  5, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_8cdf5ef3313d41299f61231262309450~mv2.jpg'], 'female', 'Marrón y blanco'),
  ('R-148', 'R-148', 10, 'Mestizo',                 'baja',  'baja',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_6b73e873c13a4b26adf72ee9ed4bb782~mv2.jpg'], 'male',   'Marrón'),
  ('R-149', 'Neus',  10, 'Pastor alemán',           'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_fafe2060461b47888883a80e6fdfaf2c~mv2.jpg'], 'female', 'Marrón y negro'),
  ('R-151', 'Trina',  0, 'Mestizo',                 'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_c3eeb21de327432f97113efc222f6102~mv2.jpg'], 'female', 'Blanco y negro'),
  ('R-152', 'Puchi',  0, 'Mestizo',                 'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_62d194efec584b3499d4c009b65d7a62~mv2.jpg'], 'male',   'Negro pecho blanco'),
  ('R-153', 'Ares',   3, 'Mestizo',                 'media', 'media', '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_c297f466fd854f2da08b2623352c93ed~mv2.jpg'], 'male',   'Marrón y negro'),
  ('R-155', 'Yara',   3, 'Border collie',           'alta',  'alta',  '2026-06-12T10:00:00Z', true, array['https://static.wixstatic.com/media/c39690_981f9d02d47c41d2bda84a6ed8eeac61~mv2.jpg'], 'female', 'Negro y blanco')
on conflict (id) do nothing;
