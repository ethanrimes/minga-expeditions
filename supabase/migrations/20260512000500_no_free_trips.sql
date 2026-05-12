-- ============================================================================
-- No free trips · enforce > 0 prices end-to-end
-- ----------------------------------------------------------------------------
-- Every expedition and salida override must carry a real price. Free trips
-- are eliminated because they bypassed Wompi entirely and we want the
-- reservation flow to always create an order, capture contact info, and
-- (when signed in) record a participation.
-- ============================================================================

-- expeditions: tighten the existing `price_cents >= 0` constraint to `> 0`.
-- Backfill any zero rows so the new constraint validates. 9_900_000 COP
-- (~$2,500 USD) is a reasonable placeholder; real values should be set by
-- the admin afterwards.
update public.expeditions
   set price_cents = 9900000
 where price_cents <= 0;

do $$ begin
  if exists (
    select 1 from pg_constraint
    where conname = 'expeditions_price_cents_check'
      and conrelid = 'public.expeditions'::regclass
  ) then
    alter table public.expeditions drop constraint expeditions_price_cents_check;
  end if;
end $$;

alter table public.expeditions
  add constraint expeditions_price_cents_check check (price_cents > 0);

-- expedition_salidas: an override of 0 was previously allowed. Now: if a
-- salida supplies its own price, it must be > 0. NULL still means "use
-- parent template price" which is itself enforced > 0 above.
update public.expedition_salidas
   set price_cents = null
 where price_cents = 0;

do $$ begin
  if exists (
    select 1 from pg_constraint
    where conname = 'expedition_salidas_price_cents_check'
      and conrelid = 'public.expedition_salidas'::regclass
  ) then
    alter table public.expedition_salidas drop constraint expedition_salidas_price_cents_check;
  end if;
end $$;

alter table public.expedition_salidas
  add constraint expedition_salidas_price_cents_check
  check (price_cents is null or price_cents > 0);
