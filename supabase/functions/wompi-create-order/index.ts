// Creates a pending `orders` row + a `guest_contacts` row (or links to an
// existing profile if signed in) and returns the signed Wompi widget config
// the browser needs to open the checkout.
//
// Inputs (JSON body):
//   {
//     expedition_id: uuid,
//     guest: {
//       email?: string,
//       phone?: string,
//       display_name?: string,
//     },
//     // If the caller is signed in, the function picks the profile id from
//     // the JWT instead of using `guest`.
//   }
//
// Output:
//   {
//     orderId: uuid,
//     reference: string,
//     amountInCents: number,
//     currency: string,
//     publicKey: string,
//     signature: string,         // sha256(reference + amount + currency + integrityKey)
//     redirectUrl: string,
//   }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

interface GuestInput {
  email?: string | null;
  phone?: string | null;
  display_name?: string | null;
}

interface RequestBody {
  expedition_id: string;
  // Optional FK to a specific scheduled departure. Required for any expedition
  // with salidas defined; when set, the salida's price_cents/currency override
  // the template values.
  salida_id?: string | null;
  guest?: GuestInput;
  return_path?: string; // e.g. "/orders/<id>/success"
  // Optional override of the redirect origin. Mobile + mobile-web pass their
  // own deployed origin so Wompi lands the user back on the same app they
  // started in (instead of the server-side PUBLIC_SITE_URL default which
  // assumes apps/web). Validated against an allowlist below to avoid open
  // redirects on the Wompi return.
  return_origin?: string;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WOMPI_PUBLIC_KEY = Deno.env.get('WOMPI_PUBLIC_KEY')!;
const WOMPI_INTEGRITY_KEY = Deno.env.get('WOMPI_INTEGRITY_KEY')!;
// Where Wompi sends the user back after the widget closes. Configure per
// environment; this is the public origin of the consumer-facing site. The
// client may override via `return_origin` (apps/mobile and apps/mobile-web do
// this so they land back in the same app); we validate against an allowlist
// driven by env so it can't be used as an open redirect.
const PUBLIC_SITE_URL =
  Deno.env.get('PUBLIC_SITE_URL') ?? 'https://minga-expeditions-web.vercel.app';
// Comma-separated extra origins the client is allowed to request as the
// post-payment redirect target. PUBLIC_SITE_URL is always allowed.
const ALLOWED_RETURN_ORIGINS = (Deno.env.get('ALLOWED_RETURN_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function resolveReturnOrigin(requested?: string): string {
  if (!requested) return PUBLIC_SITE_URL;
  let normalized: string;
  try {
    normalized = new URL(requested).origin;
  } catch {
    return PUBLIC_SITE_URL;
  }
  const defaultOrigin = (() => {
    try {
      return new URL(PUBLIC_SITE_URL).origin;
    } catch {
      return null;
    }
  })();
  if (normalized === defaultOrigin) return PUBLIC_SITE_URL;
  if (ALLOWED_RETURN_ORIGINS.includes(normalized)) return normalized;
  return PUBLIC_SITE_URL;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function bad(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return bad(405, 'POST only');

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return bad(400, 'Invalid JSON');
  }
  if (!body.expedition_id) return bad(400, 'expedition_id is required');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ---- 1. Resolve buyer (signed-in vs guest) -----------------------------
  const authHeader = req.headers.get('Authorization');
  let profileId: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: u } = await supabase.auth.getUser(token);
    if (u.user) profileId = u.user.id;
  }

  let guestContactId: string | null = null;
  if (!profileId) {
    const guest = body.guest ?? {};
    const email = guest.email?.trim() || null;
    const phone = guest.phone?.trim() || null;
    const displayName = guest.display_name?.trim() || null;
    if (!email && !phone) return bad(400, 'Provide an email or WhatsApp phone for the guest.');

    // Re-use an existing guest_contacts row if email or phone matches; this
    // keeps a guest's history together if they buy twice before signing up.
    const { data: existing } = await supabase
      .from('guest_contacts')
      .select('id')
      .or(
        [
          email ? `email.ilike.${email}` : null,
          phone ? `phone.eq.${phone}` : null,
        ]
          .filter(Boolean)
          .join(','),
      )
      .limit(1)
      .maybeSingle();

    if (existing) {
      guestContactId = (existing as { id: string }).id;
    } else {
      const { data: created, error } = await supabase
        .from('guest_contacts')
        .insert({ email, phone, display_name: displayName })
        .select('id')
        .single();
      if (error) return bad(500, `guest_contacts insert failed: ${error.message}`);
      guestContactId = (created as { id: string }).id;
    }
  }

  // ---- 2. Look up the expedition for amount + currency -------------------
  const { data: expedition, error: expErr } = await supabase
    .from('expeditions')
    .select('id, title, price_cents, currency, is_published')
    .eq('id', body.expedition_id)
    .maybeSingle();
  if (expErr || !expedition) return bad(404, 'Expedition not found');
  if (!expedition.is_published) return bad(400, 'Expedition is not on sale');

  // ---- 2b. Optional salida: validates membership + applies overrides -----
  let salidaId: string | null = null;
  let amountCents = expedition.price_cents;
  let currency = expedition.currency;
  let salidaStartsAt: string | null = null;
  if (body.salida_id) {
    const { data: salida, error: salErr } = await supabase
      .from('expedition_salidas')
      .select('id, expedition_id, starts_at, price_cents, currency, is_published, capacity, seats_taken')
      .eq('id', body.salida_id)
      .maybeSingle();
    if (salErr || !salida) return bad(404, 'Salida not found');
    if (salida.expedition_id !== expedition.id) return bad(400, 'Salida does not belong to this expedition');
    if (!salida.is_published) return bad(400, 'Salida is not on sale');
    if (salida.capacity != null && salida.seats_taken >= salida.capacity) {
      return bad(400, 'Salida is sold out');
    }
    if (salida.price_cents != null) amountCents = salida.price_cents;
    if (salida.currency) currency = salida.currency;
    salidaId = salida.id;
    salidaStartsAt = salida.starts_at;
  }
  if (amountCents <= 0) return bad(400, 'Expedition is free — no payment needed');

  // ---- 3. Insert the pending order with a fresh Wompi reference ----------
  const reference = crypto.randomUUID();
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      expedition_id: expedition.id,
      salida_id: salidaId,
      buyer_profile_id: profileId,
      buyer_guest_contact_id: guestContactId,
      amount_cents: amountCents,
      currency: currency,
      status: 'pending',
      wompi_reference: reference,
      metadata: {
        expedition_title: expedition.title,
        salida_starts_at: salidaStartsAt,
      },
    })
    .select('id')
    .single();
  if (orderErr || !order) return bad(500, `order insert failed: ${orderErr?.message ?? '?'}`);

  // ---- 4. Sign + return the widget config --------------------------------
  const signature = await sha256Hex(
    `${reference}${amountCents}${currency}${WOMPI_INTEGRITY_KEY}`,
  );
  const returnPath = body.return_path ?? `/orders/${order.id}/success`;
  const redirectUrl = new URL(returnPath, resolveReturnOrigin(body.return_origin)).toString();

  return new Response(
    JSON.stringify({
      orderId: order.id,
      reference,
      amountInCents: amountCents,
      currency: currency,
      publicKey: WOMPI_PUBLIC_KEY,
      signature,
      redirectUrl,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
