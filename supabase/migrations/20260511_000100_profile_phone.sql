-- ============================================================================
-- Profile phone fields.
--
-- Each user's WhatsApp number lives on their profile so the booking drawer
-- can pre-fill it on repeat purchases and the admin can support a customer
-- by looking up their account. Stored split (country code + national number)
-- because Wompi's WidgetCheckout requires the same shape and so the UI's
-- country-code dropdown is a one-to-one mapping with the column.
-- E.164 reconstitution is trivial: `concat(phone_country_code, phone_number)`.
--
-- Existing RLS on profiles already covers these:
--   - readable by all (display name etc. are public)
--   - update gated to auth.uid() = id
-- ============================================================================

alter table public.profiles
  add column if not exists phone_country_code text,
  add column if not exists phone_number text;

-- Sanity index for admin lookup by phone.
create index if not exists profiles_phone_idx
  on public.profiles (phone_country_code, phone_number)
  where phone_number is not null;
