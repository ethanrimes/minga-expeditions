-- ============================================================================
-- Expeditions · terrain tags (biome filter)
-- ----------------------------------------------------------------------------
-- Adds a `terrain_tags` column to expeditions so the calendar / feed filter
-- can offer a "biome" facet (mountain, forest, coast, …). Reuses the same
-- `terrain_tag` enum that already exists for activities.
-- ============================================================================

alter table public.expeditions
  add column if not exists terrain_tags public.terrain_tag[] not null default '{}';

create index if not exists expeditions_terrain_tags_idx
  on public.expeditions using gin (terrain_tags);
