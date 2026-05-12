-- Per-function statement_timeout for public.geo_tile().
--
-- After the simplification fix in 20260512000700, most heavy tiles render
-- in 3-7 s. The remaining failures (areas_protegidas at z=4-5, country-wide
-- scope) are hitting Supabase's default 8 s statement_timeout for the anon
-- role — not the geometry work itself.
--
-- We set the timeout on the function only (via SET ... FROM CURRENT) so
-- normal queries on this DB stay at the safer 8 s default; only the tile
-- generator gets the 30 s headroom it needs at country zooms. This is well
-- within the Edge Function's hard cap.

alter function public.geo_tile(text, int, int, int)
  set statement_timeout = '30s';
