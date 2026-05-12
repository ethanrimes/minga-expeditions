-- ============================================================================
-- Backfill terrain_tags on the seeded expeditions
-- ----------------------------------------------------------------------------
-- Only touches the demo rows from supabase/seed.sql and only when the column
-- is still at its default (empty array) — so admin-edited expeditions are
-- left alone, and re-running this migration is a no-op.
-- ============================================================================

update public.expeditions
   set terrain_tags = case id
     when '22222222-0000-0000-0000-000000000001'::uuid then ARRAY['mountain','jungle','river']::public.terrain_tag[]
     when '22222222-0000-0000-0000-000000000002'::uuid then ARRAY['mountain','forest']::public.terrain_tag[]
     when '22222222-0000-0000-0000-000000000003'::uuid then ARRAY['coast','jungle']::public.terrain_tag[]
     when '22222222-0000-0000-0000-000000000004'::uuid then ARRAY['mountain']::public.terrain_tag[]
     when '22222222-0000-0000-0000-000000000005'::uuid then ARRAY['mountain','snow']::public.terrain_tag[]
     when '22222222-0000-0000-0000-000000000006'::uuid then ARRAY['river','jungle']::public.terrain_tag[]
     when '22222222-0000-0000-0000-000000000007'::uuid then ARRAY['mountain','river']::public.terrain_tag[]
     when '22222222-0000-0000-0000-000000000008'::uuid then ARRAY['forest','mountain']::public.terrain_tag[]
     when '22222222-0000-0000-0000-000000000009'::uuid then ARRAY['mountain']::public.terrain_tag[]
     when '22222222-0000-0000-0000-000000000010'::uuid then ARRAY['urban','coast']::public.terrain_tag[]
   end
 where id in (
   '22222222-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000002',
   '22222222-0000-0000-0000-000000000003',
   '22222222-0000-0000-0000-000000000004',
   '22222222-0000-0000-0000-000000000005',
   '22222222-0000-0000-0000-000000000006',
   '22222222-0000-0000-0000-000000000007',
   '22222222-0000-0000-0000-000000000008',
   '22222222-0000-0000-0000-000000000009',
   '22222222-0000-0000-0000-000000000010'
 )
   and (terrain_tags is null or array_length(terrain_tags, 1) is null);
